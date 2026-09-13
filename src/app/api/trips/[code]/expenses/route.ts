import { NextResponse } from "next/server";
import { getTrip, saveTrip } from "@/lib/store";
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const t = await getTrip((await params).code);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
  const e = await req.json();
  t.expenses.push({ ...e, id: crypto.randomUUID() });
  await saveTrip(t);
  return NextResponse.json({ ok: true });
}
