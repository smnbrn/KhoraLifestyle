import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// Gestisce i link nelle email di Supabase (conferma registrazione, recupero
// password). Supporta i due formati che Supabase può inviare:
//  - ?code=...                  → flusso PKCE (template email predefiniti)
//  - ?token_hash=...&type=...   → template email personalizzati
// Dopo la verifica rimanda a `next` (solo percorsi interni dell'app).
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  if (!ok) {
    return NextResponse.redirect(`${origin}/login?errore=link_non_valido`);
  }

  // Conferma email: l'account è ora attivo, ma l'utente deve vedere la pagina
  // di accesso. Chiudiamo la sessione aperta dalla verifica e mandiamo al login.
  if (next.startsWith("/login")) {
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(`${origin}${next}`);
}
