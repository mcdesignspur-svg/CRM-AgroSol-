import { NextResponse } from "next/server";
import { getEntregasLiveSnapshot } from "@/lib/db/deliveries";

export async function GET() {
  const data = await getEntregasLiveSnapshot();
  return NextResponse.json(data);
}
