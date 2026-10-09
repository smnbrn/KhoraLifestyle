"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Error boundary per tutta la sezione autenticata (sezione 22: mai mostrare
// errori tecnici incomprensibili). Next.js lo intercetta automaticamente per
// ogni errore non gestito nei Server/Client Component sotto (app).
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <CardTitle>Qualcosa è andato storto</CardTitle>
          <CardDescription>
            Si è verificato un errore imprevisto. Riprova — se il problema persiste, i dati sono al sicuro,
            nessuna modifica è andata persa senza conferma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset}>Riprova</Button>
        </CardContent>
      </Card>
    </div>
  );
}
