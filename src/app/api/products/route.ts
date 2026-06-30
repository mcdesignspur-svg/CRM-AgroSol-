import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/db";

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
