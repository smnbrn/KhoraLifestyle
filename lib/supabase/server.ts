import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";

/**
 * Client Supabase per Server Component, Server Action e Route Handler.
 * `import "server-only"` impedisce che questo file finisca per errore
 * in un bundle client.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` chiamato da un Server Component senza possibilità di
            // scrivere cookie: innocuo perché ci pensa proxy.ts a rinfrescare
            // la sessione ad ogni richiesta.
          }
        },
      },
    }
  );
}
