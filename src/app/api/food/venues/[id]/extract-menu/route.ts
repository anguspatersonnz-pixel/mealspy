import { NextRequest, NextResponse } from "next/server";
import { getFoodItems, getFoodVenueBySlug, getFoodVenues } from "@/lib/storage";

async function resolveVenue(id: string) {
  const venues = await getFoodVenues(true);
  return venues.find((v) => v.id === id) ?? (await getFoodVenueBySlug(id)) ?? null;
}

const SYSTEM_PROMPT = `You are a menu parser. Extract menu items from the provided text or image.
Return ONLY a JSON array (no markdown, no explanation) with objects matching this shape:
{ "name": string, "price": number, "category": string | null, "description": string | null, "isDeal": boolean, "dealNote": string | null }
Rules:
- price must be a number (e.g. 12.5 not "$12.50")
- isDeal = true only if explicitly marked as special/deal/promotion/today's special
- category = section heading the item appeared under (e.g. "Burgers", "Drinks"), or null
- description should be a brief description if one is provided, otherwise null
- Skip items with no clear price
- Skip section headers, page numbers, addresses, phone numbers
- Return [] if nothing can be parsed`;

type MenuItem = { name: string; price: number; category: string | null; description: string | null; isDeal: boolean; dealNote: string | null };

// Price at end of line: many formats
// $14  $14.50  14.50  14  $14.5  from $14  $14.00  (14.50)
const PRICE_END_RE = /(?:from\s+)?\(?\$?\s*(\d{1,3}(?:[.,]\d{1,2})?)\)?\s*$/i;
// Price at start: $14 Burger  or  14.50 Burger
const PRICE_START_RE = /^\$?\s*(\d{1,3}(?:[.,]\d{1,2})?)\s{1,4}([A-Za-z].{1,80})/;
// Dot/dash/space leaders: "Burger ......... $14" "Burger - - - $14" "Burger   $14"
const LEADER_RE = /^(.+?)[\s.·\-–—*]{2,}\$?\s*(\d{1,3}(?:[.,]\d{1,2})?)[\s]*$/;
// Tab separated: "Burger\t14.50" or "Burger\t$14.50"
const TAB_RE = /^(.+?)\t\$?\s*(\d{1,3}(?:[.,]\d{1,2})?)[\s]*$/;
// Price with slash (small/large): "$8 / $12" — take the first price
const SLASH_PRICE_RE = /\$?\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*\/\s*\$?\s*\d/;
// Deal/special keywords
const DEAL_WORDS = /\b(special|deal|offer|happy hour|lunch deal|lunch special|early bird|promo|discount|today only|limited|value|combo)\b/i;
// Headings: all-caps, ends with colon, section markers like "--- BURGERS ---", "* Drinks *"
const HEADING_RE = /^[-–—*•=\s]*([A-Z][A-Za-z &'/()\\-]{1,40}|[A-Z\s&]{3,40})[-–—*•=\s]*:?\s*$/;
// Dietary/allergen tags inline
const DIETARY_RE = /\s*[\[(]?\s*\b(v|vg|vegan|vegetarian|gf|gluten[\s-]?free|df|dairy[\s-]?free|nf|nut[\s-]?free|pb|plant[\s-]?based|spicy|hot|🌶|⭐)\b\s*[)\]]?/gi;
// Lines to skip entirely
const SKIP_RE = /^(page\s*\d+|\d+\s*of\s*\d+|tel:|phone:|email:|address:|www\.|https?:|©|all rights|menu subject|prices (include|subject)|gst|inc\.?\s*gst|\+\d{2,}|\(\d{3}\))/i;

function parsePrice(str: string): number | null {
  // Normalise: remove commas used as decimal separators
  const normalised = str.replace(/,/, ".");
  const v = parseFloat(normalised);
  return v > 0 && v <= 500 ? v : null;
}

function extractEndPrice(trimmed: string): { price: number; nameRaw: string } | null {
  // Try slash price first (e.g. "$8 / $12" — keep first)
  const slashMatch = trimmed.match(SLASH_PRICE_RE);
  if (slashMatch) {
    const price = parsePrice(slashMatch[1]);
    if (price) {
      const nameRaw = trimmed.slice(0, trimmed.search(SLASH_PRICE_RE)).trim();
      return { price, nameRaw };
    }
  }
  const m = trimmed.match(PRICE_END_RE);
  if (!m) return null;
  const price = parsePrice(m[1]);
  if (!price) return null;
  // Remove the matched price from the end to get the name
  const matchStart = trimmed.lastIndexOf(m[0]);
  const nameRaw = trimmed.slice(0, matchStart).replace(/[\s$]+$/, "").trim();
  return { price, nameRaw };
}

function cleanName(raw: string): string {
  return raw
    .replace(DIETARY_RE, "")
    .replace(/^[-–—•*#\d.)\s]+/, "")  // leading bullets/numbers
    .replace(/[.…\-–—]+$/, "")        // trailing punctuation
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isHeading(line: string): boolean {
  if (line.length > 60) return false;
  if (extractEndPrice(line)) return false;
  // All caps (3+ chars, letters present)
  if (/^[A-Z\s&''\/()-]{3,}$/.test(line) && /[A-Z]/.test(line)) return true;
  // Ends with colon
  if (line.endsWith(":")) return true;
  // Decorated heading: "--- BURGERS ---", "* Drinks *", "=== MAINS ==="
  if (HEADING_RE.test(line)) return true;
  return false;
}

function isDescriptionLine(line: string, prevWasItem: boolean): boolean {
  if (!prevWasItem) return false;
  if (line.length < 5 || line.length > 150) return false;
  if (extractEndPrice(line)) return false;
  if (isHeading(line)) return false;
  // Starts lowercase or with "with", "served", "contains" etc → likely description
  if (/^[a-z]/.test(line)) return true;
  if (/^(with|served|contains|includes|topped|made|fresh|home|slow|pan|house)\b/i.test(line)) return true;
  return false;
}

function parseWithRegex(text: string): MenuItem[] {
  const items: MenuItem[] = [];
  let currentCategory: string | null = null;
  const lines = text.split(/\r?\n/);
  let lastWasItem = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length < 2) { lastWasItem = false; continue; }
    if (SKIP_RE.test(trimmed)) { lastWasItem = false; continue; }

    // ── Tab-separated ─────────────────────────────────────────────────────
    const tabMatch = trimmed.match(TAB_RE);
    if (tabMatch) {
      const price = parsePrice(tabMatch[2]);
      const name = cleanName(tabMatch[1]);
      if (name && price) {
        const isDeal = DEAL_WORDS.test(name);
        items.push({ name, price, category: currentCategory, description: null, isDeal, dealNote: isDeal ? name : null });
        lastWasItem = true;
        continue;
      }
    }

    // ── Dot/dash leader ────────────────────────────────────────────────────
    const leaderMatch = trimmed.match(LEADER_RE);
    if (leaderMatch) {
      const price = parsePrice(leaderMatch[2]);
      const name = cleanName(leaderMatch[1]);
      if (name && price && name.length >= 2) {
        const isDeal = DEAL_WORDS.test(name);
        const nextLine = lines[i + 1]?.trim();
        const desc = nextLine && isDescriptionLine(nextLine, true) ? nextLine : null;
        if (desc) i++;
        items.push({ name, price, category: currentCategory, description: desc, isDeal, dealNote: isDeal ? name : null });
        lastWasItem = true;
        continue;
      }
    }

    // ── Price on next line (name\n$price) ──────────────────────────────────
    const nextTrimmed = lines[i + 1]?.trim();
    if (nextTrimmed && !extractEndPrice(trimmed) && !isHeading(trimmed) && trimmed.length >= 2 && trimmed.length < 80) {
      const nextPriceMatch = nextTrimmed.match(/^\$?\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*$/);
      if (nextPriceMatch) {
        const price = parsePrice(nextPriceMatch[1]);
        const name = cleanName(trimmed);
        if (price && name) {
          const isDeal = DEAL_WORDS.test(name);
          items.push({ name, price, category: currentCategory, description: null, isDeal, dealNote: isDeal ? name : null });
          i++;
          lastWasItem = true;
          continue;
        }
      }
    }

    // ── Price at start of line ─────────────────────────────────────────────
    const startMatch = trimmed.match(PRICE_START_RE);
    if (startMatch) {
      const price = parsePrice(startMatch[1]);
      const name = cleanName(startMatch[2]);
      if (name && price) {
        const isDeal = DEAL_WORDS.test(name);
        items.push({ name, price, category: currentCategory, description: null, isDeal, dealNote: isDeal ? name : null });
        lastWasItem = true;
        continue;
      }
    }

    // ── Price at end of line ───────────────────────────────────────────────
    const endResult = extractEndPrice(trimmed);
    if (endResult && endResult.nameRaw.length >= 2) {
      const name = cleanName(endResult.nameRaw);
      if (name.length >= 2) {
        const isDeal = DEAL_WORDS.test(name);
        const nextLine = lines[i + 1]?.trim();
        const desc = nextLine && isDescriptionLine(nextLine, true) ? nextLine : null;
        if (desc) i++;
        items.push({ name, price: endResult.price, category: currentCategory, description: desc, isDeal, dealNote: isDeal ? name : null });
        lastWasItem = true;
        continue;
      }
    }

    // ── Heading or description ─────────────────────────────────────────────
    if (isHeading(trimmed)) {
      currentCategory = trimmed.replace(/^[-–—*•=\s]+|[-–—*•=\s:]+$/g, "").trim();
      lastWasItem = false;
    } else {
      lastWasItem = isDescriptionLine(trimmed, lastWasItem);
    }
  }

  // Deduplicate by normalised name (keep first)
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.name.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── CSV parser ────────────────────────────────────────────────────────────────
// Expected columns: name, price, description, category, is_deal, deal_note
// Handles quoted fields, various delimiters
function parseCsv(text: string): MenuItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  function parseRow(line: string): string[] {
    const fields: string[] = [];
    let field = "";
    let inQuote = false;
    for (let ci = 0; ci < line.length; ci++) {
      const ch = line[ci];
      if (ch === '"') {
        if (inQuote && line[ci + 1] === '"') { field += '"'; ci++; }
        else inQuote = !inQuote;
      } else if (ch === delimiter && !inQuote) {
        fields.push(field.trim());
        field = "";
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z_]/g, "").trim());

  // Map known column aliases
  const col = (aliases: string[]) => {
    for (const a of aliases) { const i = headers.indexOf(a); if (i >= 0) return i; }
    return -1;
  };
  const nameCol = col(["name", "item", "item_name", "itemname", "dish"]);
  const priceCol = col(["price", "cost", "amount"]);
  const descCol = col(["description", "desc", "details", "notes"]);
  const catCol = col(["category", "cat", "section", "type"]);
  const dealCol = col(["is_deal", "deal", "special", "isdeal", "is_special"]);
  const dealNoteCol = col(["deal_note", "dealnote", "deal_description", "special_note"]);

  if (nameCol < 0 || priceCol < 0) return [];

  const items: MenuItem[] = [];
  for (let li = 1; li < lines.length; li++) {
    const row = parseRow(lines[li]);
    const rawName = nameCol < row.length ? row[nameCol] : "";
    const rawPrice = priceCol < row.length ? row[priceCol].replace(/[$\s,]/g, "") : "";
    if (!rawName || !rawPrice) continue;
    const name = cleanName(rawName);
    const price = parseFloat(rawPrice);
    if (!name || isNaN(price) || price <= 0 || price > 500) continue;
    const description = descCol >= 0 && descCol < row.length ? row[descCol] || null : null;
    const category = catCol >= 0 && catCol < row.length ? row[catCol] || null : null;
    const isDealRaw = dealCol >= 0 && dealCol < row.length ? row[dealCol].toLowerCase() : "";
    const isDeal = ["true", "yes", "1", "y"].includes(isDealRaw) || DEAL_WORDS.test(name);
    const dealNote = dealNoteCol >= 0 && dealNoteCol < row.length ? row[dealNoteCol] || null : null;
    items.push({ name, price, description, category, isDeal, dealNote });
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venue = await resolveVenue(id);
  if (!venue || venue.claimToken !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  // ── Text / CSV mode ────────────────────────────────────────────────────────
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    const text: string = body?.text ?? "";
    const mode: string = body?.mode ?? "text";
    if (!text.trim()) return NextResponse.json({ error: "No text provided" }, { status: 400 });

    // CSV mode — always use the regex CSV parser (reliable, no AI needed)
    if (mode === "csv") {
      const items = parseCsv(text);
      if (!items.length) return NextResponse.json({ error: "No items found — check the CSV has name and price columns." }, { status: 422 });
      return NextResponse.json({ items, method: "csv" });
    }

    // Text mode — try AI first, fall back to improved regex
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const items = parseWithRegex(text);
      return NextResponse.json({ items, method: "regex" });
    }

    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Parse this menu:\n\n${text}` }],
      });
      const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "[]";
      const aiItems = JSON.parse(raw.replace(/^```json\n?|```$/g, ""));
      // If AI returns very few items vs regex, use regex as a fallback check
      const regexItems = parseWithRegex(text);
      const items = aiItems.length >= Math.max(1, regexItems.length * 0.5) ? aiItems : regexItems;
      return NextResponse.json({ items, method: aiItems.length >= Math.max(1, regexItems.length * 0.5) ? "ai" : "regex" });
    } catch {
      const items = parseWithRegex(text);
      return NextResponse.json({ items, method: "regex" });
    }
  }

  // ── Image mode ─────────────────────────────────────────────────────────────
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) return NextResponse.json({ error: "Unsupported image type. Use JPG, PNG, or WebP." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      try {
        const { default: Anthropic } = await import("@anthropic-ai/sdk");
        const client = new Anthropic({ apiKey });
        const msg = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: [{
              type: "image",
              source: { type: "base64", media_type: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: buffer.toString("base64") },
            }, {
              type: "text",
              text: "Parse this menu image and return the JSON array of items.",
            }],
          }],
        });
        const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "[]";
        const items = JSON.parse(raw.replace(/^```json\n?|```$/g, ""));
        const existing = await getFoodItems(venue.id);
        const existingNames = new Set(existing.map((i) => i.name.toLowerCase()));
        const fresh = items.filter((i: { name: string }) => !existingNames.has(i.name.toLowerCase()));
        return NextResponse.json({ items: fresh, method: "ai" });
      } catch (err) {
        console.error("AI image extraction failed", err);
      }
    }

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(buffer);
      await worker.terminate();

      if (!text.trim()) {
        return NextResponse.json({ error: "Could not read any text from the image. Try a clearer photo or use the Paste text tab." }, { status: 422 });
      }

      const items = parseWithRegex(text);
      if (!items.length) {
        return NextResponse.json({ error: "Text was found but no menu items could be parsed. Try the Paste text tab and tidy it up first." }, { status: 422 });
      }

      const existing = await getFoodItems(venue.id);
      const existingNames = new Set(existing.map((i) => i.name.toLowerCase()));
      const fresh = items.filter((i) => !existingNames.has(i.name.toLowerCase()));
      return NextResponse.json({ items: fresh, method: "ocr" });
    } catch (err) {
      console.error("Tesseract OCR failed", err);
      return NextResponse.json({ error: "Image scanning failed. Try the Paste text tab instead." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
}
