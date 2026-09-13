import { NextResponse } from "next/server";
import { createTrip } from "@/lib/store";
export async function POST(req: Request) {
  const b = await req.json();
  return NextResponse.json(createTrip(b.name, b.destination, b.dateOptions));
}
