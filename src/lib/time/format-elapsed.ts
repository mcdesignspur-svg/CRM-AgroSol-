export function getElapsedMs(
  createdAt: Date | string,
  now = Date.now(),
): number {
  const created =
    typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return Math.max(0, now - created.getTime());
}

export function formatElapsedTime(
  createdAt: Date | string,
  now = Date.now(),
): string {
  const totalSeconds = Math.floor(getElapsedMs(createdAt, now) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}
