"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTACT_KIND } from "@/lib/constants/second-brain";
import { involveContact, removeInvolvedContact } from "./actions";

export type InvolvedPerson = {
  id: string;
  role: string | null;
  contact: { id: string; name: string; company: string | null; email: string | null; phone: string | null; kind: string };
};

/** Persone della rubrica coinvolte nel progetto, con il loro ruolo. */
export function ProjectPeople({
  projectId,
  people,
  available,
}: {
  projectId: string;
  people: InvolvedPerson[];
  available: { id: string; name: string; company: string | null }[];
}) {
  const router = useRouter();
  const [contactId, setContactId] = useState("");
  const [role, setRole] = useState("");
  const [isPending, startTransition] = useTransition();

  const involvedIds = new Set(people.map((p) => p.contact.id));
  const choices = available.filter((c) => !involvedIds.has(c.id));

  function add() {
    startTransition(async () => {
      const result = await involveContact(projectId, contactId, role);
      if (result.success) {
        setContactId("");
        setRole("");
        toast.success("Persona coinvolta nel progetto");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(projectContactId: string) {
    startTransition(async () => {
      const result = await removeInvolvedContact(projectId, projectContactId);
      if (!result.success) toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {available.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          La rubrica è vuota: aggiungi le persone dalla sezione <span className="font-medium">Rubrica</span> per coinvolgerle qui.
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger>
                <SelectValue placeholder={choices.length ? "Scegli dalla rubrica…" : "Tutti già coinvolti"} />
              </SelectTrigger>
              <SelectContent>
                {choices.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` · ${c.company}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            className="w-48"
            placeholder="Ruolo nel progetto"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <Button onClick={add} disabled={!contactId || isPending}>
            <Plus />
            Coinvolgi
          </Button>
        </div>
      )}

      {people.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna persona coinvolta in questo progetto.</p>
      ) : (
        <ul className="space-y-2">
          {people.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {p.contact.name}
                  {p.contact.company && <span className="font-normal text-muted-foreground"> · {p.contact.company}</span>}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {p.role && <Badge variant="secondary">{p.role}</Badge>}
                  <Badge variant="outline">{CONTACT_KIND[p.contact.kind as keyof typeof CONTACT_KIND] ?? p.contact.kind}</Badge>
                  {p.contact.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3" /> {p.contact.email}
                    </span>
                  )}
                  {p.contact.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3" /> {p.contact.phone}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(p.id)}
                disabled={isPending}
              >
                <X />
                <span className="sr-only">Rimuovi dal progetto</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
