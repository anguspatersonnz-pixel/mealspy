import { NextRequest, NextResponse } from "next/server";

export function requireAdmin(request: NextRequest) {
  const expected = process.env.ADMIN_API_KEY ?? process.env.YOURBEER_ADMIN_TOKEN;

  if (!expected && process.env.NODE_ENV !== "production") return null;

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const header = request.headers.get("x-admin-key");

  if (expected && (bearer === expected || header === expected)) return null;

  return NextResponse.json(
    {
      error: expected
        ? "Admin API key required."
        : "Set ADMIN_API_KEY before using admin routes in production.",
    },
    { status: 401 },
  );
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
