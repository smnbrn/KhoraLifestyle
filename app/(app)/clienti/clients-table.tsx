import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientRowActions } from "./client-row-actions";
import type { ClientListItem } from "@/services/clients.service";

export function ClientsTable({ clients }: { clients: ClientListItem[] }) {
  if (clients.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Nessun cliente trovato.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead className="hidden sm:table-cell">Referente</TableHead>
          <TableHead className="hidden md:table-cell">Email</TableHead>
          <TableHead className="hidden lg:table-cell">Città</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">
              <Link href={`/clienti/${client.id}`} className="hover:underline">
                {client.name}
              </Link>
              {client.archived_at && (
                <Badge variant="secondary" className="ml-2">
                  Archiviato
                </Badge>
              )}
            </TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">
              {client.referent_name ?? "—"}
            </TableCell>
            <TableCell className="hidden text-muted-foreground md:table-cell">{client.email ?? "—"}</TableCell>
            <TableCell className="hidden text-muted-foreground lg:table-cell">{client.city ?? "—"}</TableCell>
            <TableCell>
              <ClientRowActions client={client} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
