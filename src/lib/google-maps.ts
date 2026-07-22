const PUERTO_RICO_PATTERN =
  /\bpuerto rico\b|,\s*pr(?:\s+\d{5}(?:-\d{4})?)?\s*$/i;

export function buildGoogleMapsSearchUrl(address: string): string | null {
  const trimmedAddress = address.trim();
  if (!trimmedAddress) return null;

  const query = PUERTO_RICO_PATTERN.test(trimmedAddress)
    ? trimmedAddress
    : `${trimmedAddress}, Puerto Rico`;
  const searchParams = new URLSearchParams({ api: "1", query });

  return `https://www.google.com/maps/search/?${searchParams.toString()}`;
}
