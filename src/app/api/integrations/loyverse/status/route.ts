import { NextResponse } from "next/server";
import { getLoyverseStatus } from "@/lib/loyverse";
import { isBranchId } from "@/lib/branch-definitions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchIdParam = searchParams.get("branchId") ?? "gurabo";

  if (!isBranchId(branchIdParam)) {
    return NextResponse.json(
      { error: "Sucursal inválida" },
      { status: 400 },
    );
  }

  const status = await getLoyverseStatus(branchIdParam);
  return NextResponse.json(status);
}
