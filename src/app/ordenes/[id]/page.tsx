import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderByDisplayId } from "@/lib/db";
import { OrderDetailClient } from "@/components/ordenes/OrderDetailClient";

export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderByDisplayId(decodeURIComponent(id));

  if (!order) {
    return { title: "Orden no encontrada" };
  }

  return { title: `Orden ${order.id}` };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderByDisplayId(decodeURIComponent(id));

  if (!order) {
    notFound();
  }

  return <OrderDetailClient initialOrder={order} />;
}
