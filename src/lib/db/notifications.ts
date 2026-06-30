import { prisma } from "@/lib/prisma";
import { mapNotification } from "./mappers";

export async function getNotificationLogs(limit = 50) {
  const rows = await prisma.notificationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapNotification);
}

export async function clearNotificationLogs() {
  await prisma.notificationLog.deleteMany();
}
