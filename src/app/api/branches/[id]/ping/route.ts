import { NextResponse } from "next/server";
import { sendBranchPing } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const branch = await sendBranchPing(id, body.message);
    return NextResponse.json(branch);
  } catch (error) {
    console.error("POST /api/branches/[id]/ping", error);
    return NextResponse.json(
      { error: "Error al enviar ping a sucursal" },
      { status: 500 },
    );
  }
}
