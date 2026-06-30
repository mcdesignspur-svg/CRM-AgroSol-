import { NextResponse } from "next/server";
import { searchCatalogProducts } from "@/lib/db";
import { isBranchId } from "@/lib/branch-definitions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const branchIdParam = searchParams.get("branchId") ?? "gurabo";
  const limitParam = Number(searchParams.get("limit") ?? "50");

  if (!isBranchId(branchIdParam)) {
    return NextResponse.json(
      { error: "Sucursal inválida" },
      { status: 400 },
    );
  }

  if (query.trim().length < 2) {
    return NextResponse.json({
      products: [],
      message: "Escribe al menos 2 caracteres para buscar",
    });
  }

  try {
    const products = await searchCatalogProducts({
      branchId: branchIdParam,
      query,
      limit: Number.isFinite(limitParam) ? Math.min(limitParam, 100) : 50,
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
