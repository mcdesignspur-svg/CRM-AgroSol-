#!/usr/bin/env node

const token = process.env.LOYVERSE_ACCESS_TOKEN?.trim();
const baseUrl = "https://api.loyverse.com/v1.0";

if (!token) {
  console.error("Falta LOYVERSE_ACCESS_TOKEN en el entorno.");
  process.exit(1);
}

async function fetchPage(cursor) {
  const params = new URLSearchParams({ limit: "250" });
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`${baseUrl}/items?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  return res.json();
}

async function main() {
  const merchantRes = await fetch(`${baseUrl}/merchant`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!merchantRes.ok) {
    throw new Error(`Merchant check failed: HTTP ${merchantRes.status}`);
  }

  const merchant = await merchantRes.json();
  const businessName =
    merchant.business_name?.trim() || merchant.name?.trim() || "Loyverse";

  let cursor;
  let pages = 0;
  let items = 0;
  let variants = 0;
  let activeVariants = 0;
  let sampleNames = [];

  do {
    const page = await fetchPage(cursor);
    pages += 1;

    for (const item of page.items ?? []) {
      if (item.deleted_at) continue;
      items += 1;

      const itemVariants = item.variants?.length
        ? item.variants
        : [{ variant_id: item.id, sku: item.id, default_price: 0 }];

      for (const variant of itemVariants) {
        if (variant.deleted_at) continue;
        variants += 1;
        activeVariants += 1;

        if (sampleNames.length < 5) {
          const name = (item.item_name ?? item.name ?? "Producto").trim();
          const options = [
            variant.option1_value,
            variant.option2_value,
            variant.option3_value,
          ]
            .filter(Boolean)
            .join(" / ");
          sampleNames.push(options ? `${name} (${options})` : name);
        }
      }
    }

    cursor = page.cursor ?? undefined;
  } while (cursor);

  console.log(JSON.stringify({
    businessName,
    pages,
    items,
    variants: activeVariants,
    catalogSizeLabel:
      activeVariants === variants
        ? `${activeVariants} variantes activas en ${items} ítems`
        : `${activeVariants} variantes activas`,
    sampleProducts: sampleNames,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
