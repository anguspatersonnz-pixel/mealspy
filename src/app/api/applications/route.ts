import { NextRequest, NextResponse } from "next/server";
import { addApplication } from "@/lib/storage";

type ApplicationType = "venue" | "maker";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid application" }, { status: 400 });
  }

  const type = body.type as ApplicationType;
  const businessName = String(body.businessName ?? "").trim();
  const contactEmail = String(body.contactEmail ?? "").trim();
  const licence = String(body.licence ?? "").trim();

  if (!["venue", "maker"].includes(type) || !businessName || !contactEmail || !licence) {
    return NextResponse.json(
      { error: "Business name, email, licence details, and type are required." },
      { status: 400 },
    );
  }

  const application = await addApplication({
    id: `app_${Date.now()}`,
    type,
    businessName,
    contactEmail,
    licence,
    region: String(body.region ?? "Wellington"),
    createdAt: new Date().toISOString(),
    status: "received",
  });

  return NextResponse.json({
    ...application,
    nextStep:
      type === "maker"
        ? "We will verify your licence and direct-sale setup before listings go live."
        : "We will verify your venue before price and specials posting is enabled.",
  });
}
