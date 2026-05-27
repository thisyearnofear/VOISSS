export const PROJECT_ATTRIBUTE = "VOISSS_BRAGA_CHALLENGE_V1";
export const ARKIV_EXPLORER_BASE = "https://explorer.braga.hoodi.arkiv.network/entity";

export const EXPIRY_CONFIG = {
  WORKING: { days: 30, color: "yellow", label: "Working (30 days)" },
  ARCHIVE: { days: 365, color: "blue", label: "Archive (1 year)" },
  PERMANENT: { days: 730, color: "green", label: "Certificate (2 years)" },
} as const;

export function getExpiryCountdown(expiresAt: number, totalDays: number): string {
  const now = Date.now();
  const remaining = expiresAt - now;
  const daysRemaining = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const totalMs = totalDays * 24 * 60 * 60 * 1000;
  const percent = Math.max(0, (remaining / totalMs) * 100);

  if (daysRemaining <= 0) return "Expired";
  if (daysRemaining >= totalDays) return `${totalDays}d`;
  return `${daysRemaining}d left (${Math.round(percent)}%)`;
}

export function getArkivExplorerUrl(entityKey: string): string {
  return `${ARKIV_EXPLORER_BASE}/${entityKey}`;
}

export function getArkivTxExplorerUrl(txHash: string): string {
  return `https://explorer.braga.hoodi.arkiv.network/tx/${txHash}`;
}
