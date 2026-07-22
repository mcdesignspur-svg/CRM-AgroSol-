import { NextResponse } from "next/server";
import { createProduct, getCatalogProducts } from "@/lib/db";
import { isBranchId } from "@/lib/branch-definitions";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchIdParam = searchParams.get("branchId") ?? "gurabo";

    if (!isBranchId(branchIdParam)) {
      return NextResponse.json(
        { error: "Sucursal inválida" },
        { status: 400 },
      );
    }

    const products = await getCatalogProducts(branchIdParam);
    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const sku = String(body.sku ?? "").trim();
    const unitPrice = Number(body.unitPrice);
    const branchIdParam = String(body.branchId ?? "gurabo");

    if (!isBranchId(branchIdParam)) {
      return NextResponse.json(
        { error: "Sucursal inválida" },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 },
      );
    }
    if (!sku) {
      return NextResponse.json(
        { error: "El SKU es obligatorio" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return NextResponse.json(
        { error: "El precio debe ser mayor a 0" },
        { status: 400 },
      );
    }

    const product = await createProduct({
      branchId: branchIdParam,
      name,
      sku,
      unitPrice,
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un producto con ese SKU" },
        { status: 409 },
      );
    }
    console.error("POST /api/products", error);
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 },
    );
  }
}
