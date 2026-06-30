import { NextResponse } from "next/server";
import { createProduct, getCatalogProducts } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const products = await getCatalogProducts();
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

    const product = await createProduct({ name, sku, unitPrice });
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
