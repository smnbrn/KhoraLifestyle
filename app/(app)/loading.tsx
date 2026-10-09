import { Skeleton } from "@/components/ui/skeleton";

// Fallback di caricamento condiviso da tutte le pagine sotto (app): Next.js
// lo mostra automaticamente durante il fetch dei Server Component alla
// navigazione, invece di uno schermo bianco.
export default function Loading() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
