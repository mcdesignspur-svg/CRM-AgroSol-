import { OrdenesLayoutShell } from "@/components/ordenes/OrdenesLayoutShell";

export default function OrdenesGestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OrdenesLayoutShell>{children}</OrdenesLayoutShell>;
}
