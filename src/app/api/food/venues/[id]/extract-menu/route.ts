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
- isDeal = true only if explicitly marked as special/deal/promotion
- category = section heading the item appeared under (e.g. "Burgers", "Drinks"), or null
- Skip items with no price
- Return [] if nothing can be parsed`;

type MenuItem = { name: string; price: number; category: string | null; description: string | null; isDeal: boolean; dealNote: string | null };

// Matches price in many formats: $14, $14.50, 14.50, 14, $14.5, from $14
const PRICE_RE = /(?:from\s+)?\$?\s*(\d{1,3}(?:\.\d{1,2})?)\s*$/i;
// Price at start of line: $14 Burger
const PRICE_START_RE = /^\$?\s*(\d{1,3}(?:\.\d{1,2})?)\s+(.+)/;
// Dot/dash leaders: "Burger ......... $14" or "Burger - - - $14" or "Burger\t$14"
const LEADER_RE = /^(.+?)[\s.·\-–—]{3,}\$?\s*(\d{1,3}(?:\.\d{1,2})?)[\s]*$/;
// Tab separated: "Burger\t14.50"
const TAB_RE = /^(.+?)\t\$?\s*(\d{1,3}(?:\.\d{1,2})?)[\s]*$/;
// Deal/special keywords
const DEAL_WORDS = /\b(special|deal|offer|happy hour|lunch deal|early bird|promo|discount|today only|limited|value)\b/i;
// Heading: short line, no price, title-case or all-caps or ends with colon, not a description
const HEADING_RE = /^([A-Z][A-Za-z &'/()-]{1,40}|[A-Z\s&]{3,40}):?$/;
// Dietary tags to strip from name but keep for description
const DIETARY_RE = /\s*[\[(]?(v|vg|vegan|vegetarian|gf|gluten.?free|df|dairy.?free|nf|nut.?free|spicy|hot)[)\]]?/gi;

function extractPrice(str: string): number | null {
  const m = str.match(PRICE_RE);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return v > 0 && v <= 500 ? v : null;
}

function cleanName(raw: string): string {
  return raw
    .replace(DIETARY_RE, "")        // remove dietary tags
    .replace(/[.…\-–—]+$/, "")      // trailing dots/dashes
    .replace(/\s{2,}/g, " ")        // collapse spaces
    .trim();
}

function isHeading(line: string, hasPrice: boolean): boolean {
  if (hasPrice) return false;
  if (line.length > 50) return false;
  // All caps (with spaces/& allowed)
  if (line === line.toUpperCase() && line.length >= 3) return true;
  // Ends with colon
  if (line.endsWith(":")) return true;
  // Title-case short line with no lowercase-start words (e.g. "Burgers & Wraps")
  if (HEADING_RE.test(line.replace(/:$/, "").trim())) return true;
  return false;
}

function parseWithRegex(text: string) {
  const items: MenuItem[] = [];
  let currentCategory: string | null = null;
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // ── Try tab-separated ──────────────────────────────────────────────────
    const tabMatch = trimmed.match(TAB_RE);
    if (tabMatch) {
      const price = parseFloat(tabMatch[2]);
      const name = cleanName(tabMatch[1]);
      if (name && price > 0 && price <= 500) {
        const isDeal = DEAL_WORDS.test(name);
        items.push({ name, price, category: currentCategory, description: null, isDeal, dealNote: isDeal ? name : null });
        continue;
      }
    }

    // ── Try dot/dash leader ────────────────────────────────────────────────
    const leaderMatch = trimmed.match(LEADER_RE);
    if (leaderMatch) {
      const price = parseFloat(leaderMatch[2]);
      const name = cleanName(leaderMatch[1]);
      if (name && price > 0 && price <= 500) {
        const isDeal = DEAL_WORDS.test(name);
        // Peek at next line — might be a description
        const nextLine = lines[i + 1]?.trim();
        const desc = nextLine && !extractPrice(nextLine) && nextLine.length > 3 && nextLine.length < 120 && !isHeading(nextLine, false) ? nextLine : null;
        if (desc) i++; // consume description line
        items.push({ name, price, category: currentCategory, description: desc, isDeal, dealNote: isDeal ? name : null });
        continue;
      }
    }

    // ── Try price at start of line ─────────────────────────────────────────
    const startMatch = trimmed.match(PRICE_START_RE);
    if (startMatch) {
      const price = parseFloat(startMatch[1]);
      const name = cleanName(startMatch[2]);
      if (name && price > 0 && price <= 500) {
        const isDeal = DEAL_WORDS.test(name);
        items.push({ name, price, category: currentCategory, description: null, isDeal, dealNote: isDeal ? name : null });
        continue;
      }
    }

    // ── Try price at end of line ───────────────────────────────────────────
    const endPrice = extractPrice(trimmed);
    if (endPrice !== null) {
      const nameRaw = trimmed.slice(0, trimmed.lastIndexOf(endPrice.toString())).replace(/\$\s*$/, "").trim();
      const name = cleanName(nameRaw);
      if (name.length >= 2) {
        const isDeal = DEAL_WORDS.test(name);
        const nextLine = lines[i + 1]?.trim();
        const desc = nextLine && !extractPrice(nextLine) && nextLine.length > 3 && nextLine.length < 120 && !isHeading(nextLine, false) ? nextLine : null;
        if (desc) i++;
        items.push({ name, price: endPrice, category: currentCategory, description: desc, isDeal, dealNote: isDeal ? name : null });
        continue;
      }
    }

    // ── No price — check for heading ───────────────────────────────────────
    if (isHeading(trimmed, false)) {
      currentCategory = trimmed.replace(/:$/, "").trim();
    }
    // else: likely a standalone description line, skip
  }

  // Deduplicate by name (keep first occurrence)
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

  // ── Text mode ──────────────────────────────────────────────────────────────
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    const text: string = body?.text ?? "";
    if (!text.trim()) return NextResponse.json({ error: "No text provided" }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback: regex parser
      const items = parseWithRegex(text);
      return NextResponse.json({ items, method: "regex" });
    }

    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Parse this menu:\n\n${text}` }],
      });
      const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "[]";
      const items = JSON.parse(raw.replace(/^```json\n?|```$/g, ""));
      return NextResponse.json({ items, method: "ai" });
    } catch {
      const items = parseWithRegex(text);
      return NextResponse.json({ items, method: "regex" });
    }
  }

  // ── Image mode ─────────────────────────────────────────────────────────────
  if (contentType.includes("multipart/form-data")) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI image extraction requires ANTHROPIC_API_KEY to be set." }, { status: 501 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [{
            type: "image",
            source: { type: "base64", media_type: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: base64 },
          }, {
            type: "text",
            text: "Parse this menu image and return the JSON array of items.",
          }],
        }],
      });
      const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "[]";
      const items = JSON.parse(raw.replace(/^```json\n?|```$/g, ""));

      // Deduplicate against existing items
      const existing = await getFoodItems(venue.id);
      const existingNames = new Set(existing.map((i) => i.name.toLowerCase()));
      const fresh = items.filter((i: { name: string }) => !existingNames.has(i.name.toLowerCase()));

      return NextResponse.json({ items: fresh, method: "ai" });
    } catch (err) {
      console.error("AI image extraction failed", err);
      return NextResponse.json({ error: "Could not read image. Try copy-pasting the menu text instead." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
}
