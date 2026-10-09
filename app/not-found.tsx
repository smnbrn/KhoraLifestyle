import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <FileQuestion className="size-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold text-foreground">Pagina non trovata</h1>
      <p className="text-sm text-muted-foreground">La pagina che cerchi non esiste o è stata spostata.</p>
      <Button asChild className="mt-2">
        <Link href="/dashboard">Torna alla dashboard</Link>
      </Button>
    </div>
  );
}
