import { NextResponse } from "next/server";
import { listAllProductsGroupedByCategory } from "@/lib/db";
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

  try {
    const groups = await listAllProductsGroupedByCategory(branchIdParam);
    const totalProducts = groups.reduce(
      (sum, group) => sum + group.products.length,
      0,
    );

    return NextResponse.json({
      groups,
      totalProducts,
      categoryCount: groups.length,
    });
  } catch (error) {
    console.error("GET /api/products/grouped", error);
    return NextResponse.json(
      { error: "Error al cargar productos agrupados" },
      { status: 500 },
    );
  }
}
