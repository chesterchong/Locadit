import { NextResponse } from "next/server";
import { getTrip } from "@/lib/store";
import { assessRisk } from "@/lib/risk";

// Visitor's country: Vercel sets x-vercel-ip-country at the edge; locally fall back to an IP lookup.
async function visitorCountry(req: Request): Promise<string | null> {
  const h = req.headers.get("x-vercel-ip-country");
  if (h) return h;
  try {
    const r = await fetch("https://ipwho.is/", { next: { revalidate: 3600 }, signal: AbortSignal.timeout(1200) });
    const j = await r.json();
    return j?.country_code ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const t = await getTrip((await params).code);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(await assessRisk(t, await visitorCountry(req)));
}
