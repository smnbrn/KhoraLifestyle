// Helper per leggere FormData dalle server action senza ripetere controlli.
export function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v == null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function oneOf<T extends string>(fd: FormData, key: string, allowed: readonly T[], fallback: T): T {
  const v = str(fd, key);
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}
