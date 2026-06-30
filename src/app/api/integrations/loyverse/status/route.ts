import { NextResponse } from "next/server";
import { getLoyverseStatus } from "@/lib/loyverse";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getLoyverseStatus();
  return NextResponse.json(status);
}
