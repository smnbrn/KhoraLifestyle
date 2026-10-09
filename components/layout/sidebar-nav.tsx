"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { CREDITS_ITEM, NAV_GROUPS, SETTINGS_ITEM, type NavItem } from "@/lib/constants/nav";
import { PageDialog } from "./page-dialog";
import type { PageSection } from "@/lib/constants/second-brain";

export type SidebarPage = { id: string; title: string; icon: string | null; section: PageSection };

// "Home" (/dashboard) e "Calendario" non hanno intestazione; le altre voci sì.
// La pagina attiva è quella con l'href più lungo che combacia: così /finanze
// non risulta attiva quando si è su /finanze/investimenti.
function useActiveHref(items: string[]) {
  const pathname = usePathname();
  const matches = items.filter((href) => pathname === href || pathname.startsWith(href + "/"));
  return matches.sort((a, b) => b.length - a.length)[0] ?? null;
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent font-medium text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function SidebarNav({ onNavigate, pages = [] }: { onNavigate?: () => void; pages?: SidebarPage[] }) {
  const allHrefs = [
    ...NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href)),
    SETTINGS_ITEM.href,
    CREDITS_ITEM.href,
    ...pages.map((p) => `/pagine/${p.id}`),
  ];
  const activeHref = useActiveHref(allHrefs);

  return (
    <nav className="flex flex-col gap-4 p-3">
      {NAV_GROUPS.map((group) => {
        const groupPages = pages.filter((p) => p.section === (group.key === "main" ? "general" : group.key));
        return (
          <div key={group.key} className="flex flex-col gap-0.5">
            {group.label && (
              <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{group.label}</span>
            )}
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} active={activeHref === item.href} onNavigate={onNavigate} />
            ))}
            {groupPages.map((p) => {
              const href = `/pagine/${p.id}`;
              return (
                <Link
                  key={p.id}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                    activeHref === href
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  {p.icon ? <span className="w-4 shrink-0 text-center text-sm leading-none">{p.icon}</span> : <FileText className="size-4 shrink-0" />}
                  <span className="truncate">{p.title}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
      <div className="space-y-0.5 border-t pt-3">
        <PageDialog
          defaultSection="general"
          onDone={onNavigate}
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              <Plus className="size-4 shrink-0" />
              <span className="truncate">Crea una nuova pagina</span>
            </button>
          }
        />
        <NavLink item={SETTINGS_ITEM} active={activeHref === SETTINGS_ITEM.href} onNavigate={onNavigate} />
        <NavLink item={CREDITS_ITEM} active={activeHref === CREDITS_ITEM.href} onNavigate={onNavigate} />
      </div>
    </nav>
  );
}
