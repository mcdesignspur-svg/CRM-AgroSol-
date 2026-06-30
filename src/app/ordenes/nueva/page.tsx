import { redirect } from "next/navigation";

export default function NuevaOrdenPage() {
  redirect("/ordenes?tab=nueva");
}
