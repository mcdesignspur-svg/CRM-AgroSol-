import { prisma } from "@/lib/prisma";
import { loyverseFetch, loyverseListAll } from "./client";
import type { LoyverseCustomer } from "./types";

export async function upsertCustomerFromLoyverse(
  customer: Pick<
    LoyverseCustomer,
    "id" | "name" | "phone_number" | "email" | "address"
  >,
) {
  const phone = customer.phone_number?.trim() || null;
  const email = customer.email?.trim() || null;

  const existing = await prisma.customer.findFirst({
    where: {
      OR: [
        { loyverseCustomerId: customer.id },
        ...(phone ? [{ phone }] : []),
      ],
    },
  });

  if (existing) {
    return prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: customer.name,
        phone,
        email,
        address: customer.address?.trim() || null,
        loyverseCustomerId: customer.id,
      },
    });
  }

  return prisma.customer.create({
    data: {
      name: customer.name,
      phone,
      email,
      address: customer.address?.trim() || null,
      loyverseCustomerId: customer.id,
    },
  });
}

export async function findOrCreateLocalCustomer(input: {
  name: string;
  phone?: string;
  address?: string;
}) {
  const phone = input.phone?.trim() || null;

  const existing = phone
    ? await prisma.customer.findFirst({ where: { phone } })
    : null;

  if (existing) {
    return prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: input.name.trim(),
        address: input.address?.trim() || existing.address,
      },
    });
  }

  return prisma.customer.create({
    data: {
      name: input.name.trim(),
      phone,
      address: input.address?.trim() || null,
    },
  });
}

export async function ensureLoyverseCustomer(
  customerId: string,
): Promise<string | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    return null;
  }

  if (customer.loyverseCustomerId) {
    return customer.loyverseCustomerId;
  }

  const payload = {
    name: customer.name,
    phone_number: customer.phone ?? undefined,
    email: customer.email ?? undefined,
    address: customer.address ?? undefined,
  };

  const created = await loyverseFetch<LoyverseCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: { loyverseCustomerId: created.id },
  });

  return created.id;
}

export async function syncCustomersFromLoyverse() {
  const customers = await loyverseListAll<"customers", LoyverseCustomer>(
    "/customers",
    "customers",
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const customer of customers) {
    if (customer.deleted_at) {
      skipped += 1;
      continue;
    }

    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { loyverseCustomerId: customer.id },
          ...(customer.phone_number
            ? [{ phone: customer.phone_number }]
            : []),
        ],
      },
    });

    await upsertCustomerFromLoyverse(customer);

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return { created, updated, skipped, errors: [] as string[] };
}

export async function getSyncedCustomerCount(): Promise<number> {
  return prisma.customer.count({
    where: { loyverseCustomerId: { not: null } },
  });
}
