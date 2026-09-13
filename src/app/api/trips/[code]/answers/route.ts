import { NextResponse } from "next/server";
import { getTrip, saveTrip } from "@/lib/store";
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const t = await getTrip((await params).code);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
  const a = await req.json();
  t.answers = t.answers.filter((x) => x.name !== a.name).concat(a);
  await saveTrip(t);
  return NextResponse.json({ ok: true });
}
