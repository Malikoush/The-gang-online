/** Limiteur de fréquence simple en mémoire, une entrée par clé (ex: playerId). */
export class RateLimiter {
  private lastAt = new Map<string, number>();

  constructor(private minIntervalMs: number) {}

  /** Renvoie true si l'action est autorisée maintenant (et enregistre l'horodatage). */
  allow(key: string): boolean {
    const now = Date.now();
    const last = this.lastAt.get(key) ?? 0;
    if (now - last < this.minIntervalMs) return false;
    this.lastAt.set(key, now);
    return true;
  }
}
