import { prisma } from "@/lib/prisma";

export async function findCustomerByPhone(phone: string) {
  return prisma.customer.findFirst({
    where: { phone: phone.trim() },
  });
}

export async function findOrCreateCustomerForOrder(input: {
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
