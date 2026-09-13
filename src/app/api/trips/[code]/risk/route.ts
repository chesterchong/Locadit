import { NextResponse } from "next/server";
import { getTrip } from "@/lib/store";
import { assessRisk } from "@/lib/risk";
export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const t = getTrip((await params).code);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(await assessRisk(t));
}
