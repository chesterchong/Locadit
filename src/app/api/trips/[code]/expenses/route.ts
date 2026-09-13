import { NextResponse } from "next/server";
import { getTrip } from "@/lib/store";
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const t = getTrip((await params).code);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
  const e = await req.json();
  t.expenses.push({ ...e, id: crypto.randomUUID() });
  return NextResponse.json({ ok: true });
}
