import { NextResponse } from "next/server";
import { getTrip } from "@/lib/store";
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const t = getTrip((await params).code);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
  const a = await req.json();
  t.answers = t.answers.filter((x) => x.name !== a.name).concat(a);
  return NextResponse.json({ ok: true });
}
