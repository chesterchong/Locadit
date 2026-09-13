import { NextResponse } from "next/server";
import { createTrip } from "@/lib/store";
import { geocode } from "@/lib/geo";
export async function POST(req: Request) {
  const b = await req.json();
  const place = (await geocode(b.destination)) ?? undefined;
  return NextResponse.json(createTrip(b.name, b.destination, b.dateOptions, place));
}
