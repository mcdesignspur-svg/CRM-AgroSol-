import { NextResponse } from "next/server";
import { dismissPing } from "@/lib/db";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await dismissPing(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/pings/[id]", error);
    return NextResponse.json(
      { error: "Error al descartar ping" },
      { status: 500 },
    );
  }
}
