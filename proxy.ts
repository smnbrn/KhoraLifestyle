import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next.js 16 ha rinominato middleware.ts in proxy.ts per chiarire che questo
// file NON è un confine di sicurezza affidabile da solo (vedi sezione 2.3
// del documento di architettura). Qui facciamo solo:
//  1. refresh del cookie di sessione Supabase
//  2. redirect "ottimistico" verso /login se manca una sessione
// L'autorizzazione vera vive nella Row Level Security + nei controlli
// server-side di ogni layout/pagina protetta.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PUBLIC_PATHS = ["/login", "/registrati", "/recupera-password", "/auth/confirm"];

export async function proxy(request: NextRequest) {
  // Nessun progetto Supabase ancora collegato (Fase 1 appena scaffoldata):
  // non blocchiamo lo sviluppo, lasciamo semplicemente passare la richiesta.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
