import type { Metadata } from "next";
import { PickupRetiroClient } from "@/components/pickup/PickupRetiroClient";

export const metadata: Metadata = {
  title: "Retiro de orden",
  description: "Avisa tu llegada para retirar tu orden en Agrocentro Solá.",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PickupRetiroPage({ params }: PageProps) {
  const { token } = await params;
  return <PickupRetiroClient token={token} />;
}
