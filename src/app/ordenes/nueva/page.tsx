import { getLoyverseStatus } from "@/lib/loyverse";
import NuevaOrdenClient from "./NuevaOrdenClient";

export const metadata = {
  title: "Nueva Orden",
};

export const dynamic = "force-dynamic";

export default async function NuevaOrdenPage() {
  const loyverseStatus = await getLoyverseStatus("gurabo");

  return <NuevaOrdenClient loyverseStatus={loyverseStatus} />;
}
