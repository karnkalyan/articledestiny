function firstMatch(value: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1].trim();
    if (match?.[0]) return match[0].trim();
  }
  return "";
}

export function normalizeSearchConsoleToken(value: string) {
  const input = value.trim();
  if (!input) return "";

  return firstMatch(input, [
    /<meta[^>]+name=["']google-site-verification["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']google-site-verification["']/i,
  ]) || input;
}

export function normalizeGa4MeasurementId(value: string) {
  const input = value.trim();
  if (!input) return "";

  return firstMatch(input, [
    /\b(G-[A-Z0-9]+)\b/i,
    /gtag\/js\?id=([^"'&\s<>]+)/i,
    /gtag\(["']config["'],\s*["']([^"']+)["']\)/i,
  ]).toUpperCase() || input;
}

export function normalizeAdSenseClientId(value: string) {
  const input = value.trim();
  if (!input) return "";

  const publisherId = firstMatch(input, [
    /\b(ca-pub-\d+)\b/i,
    /\bpub-(\d+)\b/i,
    /\b(\d{8,})\b/,
  ]);

  if (!publisherId) return input;
  return publisherId.toLowerCase().startsWith("ca-pub-") ? publisherId.toLowerCase() : `ca-pub-${publisherId.replace(/^pub-/i, "")}`;
}

export function getAdsTxtLine(adsenseClientId: string) {
  const clientId = normalizeAdSenseClientId(adsenseClientId);
  const publisherId = clientId.match(/^ca-pub-(\d+)$/i)?.[1];

  return publisherId ? `google.com, pub-${publisherId}, DIRECT, f08c47fec0942fa0` : "";
}
