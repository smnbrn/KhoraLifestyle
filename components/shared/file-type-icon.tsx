import { FileText, FileImage, FileSpreadsheet, File as FileIconLucide } from "lucide-react";

// Componente dedicato invece di "scegliere un componente in una variabile
// durante il render" (pattern segnalato dal React Compiler in
// react-hooks/static-components): qui l'icona è sempre la stessa funzione
// renderizzata con una condizione interna, non un riferimento ricalcolato.
export function FileTypeIcon({ mimeType, className }: { mimeType: string | null; className?: string }) {
  if (mimeType?.includes("pdf")) return <FileText className={className} />;
  if (mimeType?.includes("image")) return <FileImage className={className} />;
  if (mimeType?.includes("sheet") || mimeType?.includes("excel")) return <FileSpreadsheet className={className} />;
  return <FileIconLucide className={className} />;
}
