import { NextResponse } from "next/server";
import {
  getLoyverseStatus,
  isLoyverseBranchEnabled,
  isLoyverseConfigured,
  safeSyncLoyverseProducts,
} from "@/lib/loyverse";
import { isBranchId } from "@/lib/branch-definitions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let branchId: string = "gurabo";
  let mode: "full" | "incremental" = "full";
  let cursor: string | null | undefined;
  let singlePage = false;
  let pageSize = 100;

  try {
    const body = await request.json();
    if (typeof body.branchId === "string") branchId = body.branchId;
    if (body.mode === "incremental" || body.mode === "full") mode = body.mode;
    if (body.cursor === null || typeof body.cursor === "string") {
      cursor = body.cursor;
    }
    if (body.singlePage === true) singlePage = true;
    if (typeof body.pageSize === "number" && body.pageSize > 0 && body.pageSize <= 250) {
      pageSize = body.pageSize;
    }
  } catch {
    // body opcional
  }

  if (!isBranchId(branchId)) {
    return NextResponse.json(
      { error: "Sucursal inválida" },
      { status: 400 },
    );
  }

  if (!isLoyverseBranchEnabled(branchId)) {
    return NextResponse.json(
      { error: "Loyverse no está habilitado para esta sucursal" },
      { status: 400 },
    );
  }

  if (!isLoyverseConfigured(branchId)) {
    return NextResponse.json(
      { error: "Token Loyverse no configurado para esta sucursal" },
      { status: 400 },
    );
  }

  const connection = await getLoyverseStatus(branchId);
  if (!connection.connected) {
    return NextResponse.json({ error: connection.message }, { status: 401 });
  }

  const result = await safeSyncLoyverseProducts({
    branchId,
    mode,
    cursor,
    singlePage,
    pageSize,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result);
}
