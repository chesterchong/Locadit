import { NextResponse } from "next/server";
import { getTrip, saveTrip } from "@/lib/store";
import { geocode } from "@/lib/geo";
// Where the group is staying (town/area). The radar re-scores around this point.
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const t = await getTrip((await params).code);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { stay } = await req.json();
  if (!stay || !String(stay).trim()) { t.stay = undefined; await saveTrip(t); return NextResponse.json({ ok: true, stay: null }); }
  const place = await geocode(`${stay}, ${t.place?.country ?? t.destination}`);
  if (!place) return NextResponse.json({ error: "Couldn't place that on the map" }, { status: 422 });
  t.stay = place;
  await saveTrip(t);
  return NextResponse.json({ ok: true, stay: place });
}
