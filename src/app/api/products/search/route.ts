import { NextResponse } from "next/server";
import { searchCatalogProducts } from "@/lib/db";
import { isBranchId } from "@/lib/branch-definitions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const branchIdParam = searchParams.get("branchId") ?? "gurabo";
  const categoryIdParam = searchParams.get("categoryId");
  const limitParam = Number(searchParams.get("limit") ?? "100");

  if (!isBranchId(branchIdParam)) {
    return NextResponse.json(
      { error: "Sucursal inválida" },
      { status: 400 },
    );
  }

  const categoryId =
    categoryIdParam === "__uncategorized__"
      ? "__uncategorized__"
      : categoryIdParam?.trim() || undefined;

  if (!categoryId && query.trim().length < 2) {
    return NextResponse.json({
      products: [],
      message: "Selecciona una categoría o escribe al menos 2 caracteres",
    });
  }

  try {
    const products = await searchCatalogProducts({
      branchId: branchIdParam,
      query,
      categoryId,
      limit: Number.isFinite(limitParam) ? Math.min(limitParam, 200) : 100,
    });

    return NextResponse.json({ products, total: products.length });
  } catch (error) {
    console.error("GET /api/products/search", error);
    return NextResponse.json(
      { error: "Error al buscar productos" },
      { status: 500 },
    );
  }
}
