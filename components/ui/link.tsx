import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * Link dell'app: come next/link ma senza caricamento in anticipo di base.
 * Con next/link ogni link visibile (menu laterale, tabelle, schede della
 * Home) chiede la sua pagina al server appena compare sullo schermo: decine
 * di funzioni Vercel a ogni apertura, quasi tutte per pagine mai aperte.
 * Dove serve davvero si può ancora passare `prefetch`.
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
