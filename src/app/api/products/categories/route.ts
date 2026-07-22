import { NextResponse } from "next/server";
import { listProductCategories } from "@/lib/db";
import { isBranchId } from "@/lib/branch-definitions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchIdParam = searchParams.get("branchId") ?? "gurabo";

  if (!isBranchId(branchIdParam)) {
    return NextResponse.json({ error: "Sucursal inválida" }, { status: 400 });
  }

  try {
    const categories = await listProductCategories(branchIdParam);
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /api/products/categories", error);
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 },
    );
  }
}
