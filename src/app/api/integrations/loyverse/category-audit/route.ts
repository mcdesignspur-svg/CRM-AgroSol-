import { NextResponse } from "next/server";
import {
  LoyverseApiError,
  loyverseGetAllPages,
  loyverseGetPage,
} from "@/lib/loyverse/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface LoyverseCategory {
  id: string;
  name: string;
  deleted_at?: string | null;
}

interface LoyverseItemWithCategory {
  id: string;
  item_name?: string;
  name?: string;
  category_id?: string | null;
  deleted_at?: string | null;
}

export async function GET(request: Request) {
  const branchId = "gurabo" as const;
  const { searchParams } = new URL(request.url);
  const maxPages = Math.min(
    Math.max(Number(searchParams.get("maxPages") ?? "60"), 1),
    120,
  );

  try {
    const categories = await loyverseGetAllPages<
      "categories",
      LoyverseCategory
    >("/categories", "categories", branchId);

    const activeCategories = categories.filter((category) => !category.deleted_at);
    const categoryNames = new Map(
      activeCategories.map((category) => [category.id, category.name]),
    );

    let cursor: string | null = null;
    let pages = 0;
    let totalItems = 0;
    let deletedItems = 0;
    let withCategory = 0;
    let withoutCategory = 0;
    const uncategorizedSamples: string[] = [];
    const categoryCounts = new Map<string, number>();

    while (pages < maxPages) {
      const page: { items: LoyverseItemWithCategory[]; nextCursor: string | null } =
        await loyverseGetPage<"items", LoyverseItemWithCategory>(
          "/items",
          "items",
          branchId,
          { limit: 250, cursor },
        );

      pages += 1;

      for (const item of page.items) {
        totalItems += 1;

        if (item.deleted_at) {
          deletedItems += 1;
          continue;
        }

        const categoryId = item.category_id?.trim();
        if (categoryId) {
          withCategory += 1;
          categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
        } else {
          withoutCategory += 1;
          if (uncategorizedSamples.length < 8) {
            uncategorizedSamples.push(
              (item.item_name ?? item.name ?? item.id).trim(),
            );
          }
        }
      }

      cursor = page.nextCursor;
      if (!cursor) break;
    }

    const topCategories = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([categoryId, count]) => ({
        categoryId,
        name: categoryNames.get(categoryId) ?? "(sin nombre en Loyverse)",
        itemCount: count,
      }));

    const activeItems = withCategory + withoutCategory;

    return NextResponse.json({
      branchId,
      audit: {
        pagesFetched: pages,
        maxPages,
        complete: !cursor,
      },
      categories: {
        total: categories.length,
        active: activeCategories.length,
        names: activeCategories.map((category) => category.name).sort(),
      },
      items: {
        scanned: totalItems,
        deleted: deletedItems,
        active: activeItems,
        withCategory,
        withoutCategory,
        withCategoryPercent:
          activeItems > 0
            ? Number(((withCategory / activeItems) * 100).toFixed(1))
            : 0,
      },
      topCategories,
      uncategorizedSamples,
    });
  } catch (error) {
    if (error instanceof LoyverseApiError) {
      return NextResponse.json(
        { error: error.message, status: error.status },
        { status: error.status || 500 },
      );
    }

    console.error("GET /api/integrations/loyverse/category-audit", error);
    return NextResponse.json(
      { error: "Error al auditar categorías en Loyverse" },
      { status: 500 },
    );
  }
}
