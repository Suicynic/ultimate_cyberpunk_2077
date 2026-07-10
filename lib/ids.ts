/** Generate a collision-resistant local ID (user-owned records only). */
export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`;
}

/** Composite key for per-playthrough progress rows. */
export function progressId(playthroughId: string, refId: string): string {
  return `${playthroughId}:${refId}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
