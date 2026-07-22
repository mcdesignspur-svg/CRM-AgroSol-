import type { Metadata } from "next";
import { DeliveryTrackingClient } from "@/components/delivery/DeliveryTrackingClient";

export const metadata: Metadata = {
  title: "Seguimiento de entrega",
  description: "Monitorea el estado de tu entrega en Agrocentro Solá.",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function DeliveryTrackingPage({ params }: PageProps) {
  const { token } = await params;
  return <DeliveryTrackingClient token={token} />;
}
