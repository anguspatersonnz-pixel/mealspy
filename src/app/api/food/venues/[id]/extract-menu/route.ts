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

function parseWithRegex(text: string) {
  const items: Array<{ name: string; price: number; category: string | null; description: string | null; isDeal: boolean; dealNote: string | null }> = [];
  let currentCategory: string | null = null;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect category heading — line with no price, all caps or ends with colon
    const priceMatch = trimmed.match(/\$?([\d]+\.?\d{0,2})\s*$/);
    if (!priceMatch) {
      if (trimmed.length < 40 && (trimmed === trimmed.toUpperCase() || trimmed.endsWith(":"))) {
        currentCategory = trimmed.replace(/:$/, "").trim();
      }
      continue;
    }

    const price = parseFloat(priceMatch[1]);
    if (isNaN(price) || price <= 0 || price > 500) continue;

    const name = trimmed.slice(0, trimmed.lastIndexOf(priceMatch[0])).replace(/[.\-–]+$/, "").trim();
    if (!name) continue;

    items.push({ name, price, category: currentCategory, description: null, isDeal: false, dealNote: null });
  }

  return items;
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
