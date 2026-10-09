import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";

/**
 * Client Supabase per Client Component ("use client").
 * Non usare mai in Server Component/Server Action: per quelli vedi ./server.ts
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
