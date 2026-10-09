import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Crediti" };

const DEVELOPER = {
  name: "Simone Bruni",
  email: "simonebruni14gen@gmail.com",
  linkedin: "https://www.linkedin.com/in/simonebruni14/",
};

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export default function CreditiPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-6 md:py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Crediti</h1>
        <p className="text-sm text-muted-foreground">
          {APP_NAME} — {APP_TAGLINE}
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
            aria-hidden="true"
          >
            SB
          </div>
          <div className="space-y-0.5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Developer Name</p>
            <p className="text-xl font-semibold text-foreground">{DEVELOPER.name}</p>
            <p className="text-sm text-muted-foreground">Progettazione e sviluppo di {APP_NAME}.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contatti</CardTitle>
          <CardDescription>Per domande, segnalazioni o nuove idee scrivimi pure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href={`mailto:${DEVELOPER.email}`}
            className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors hover:border-primary/60 hover:bg-accent"
          >
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{DEVELOPER.email}</span>
            <span className="text-xs text-muted-foreground">Email</span>
          </a>
          <a
            href={DEVELOPER.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors hover:border-primary/60 hover:bg-accent"
          >
            <LinkedInIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">linkedin.com/in/simonebruni14</span>
            <span className="text-xs text-muted-foreground">LinkedIn</span>
          </a>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {DEVELOPER.name}. Tutti i diritti riservati.
      </p>
    </div>
  );
}
