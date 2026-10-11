import "server-only";

import { headers } from "next/headers";

// Indirizzo pubblico dell'app (es. https://khora.vercel.app) ricavato dalla
// richiesta in corso. Serve per costruire i link che finiscono nelle email
// (conferma registrazione, recupero password).
export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;

  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
