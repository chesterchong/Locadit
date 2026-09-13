import { NextResponse } from "next/server";
import { getTrip } from "@/lib/store";
import { merge, balances } from "@/lib/engine";
export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const t = await getTrip((await params).code);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ trip: t, result: merge(t), balances: balances(t) });
}
