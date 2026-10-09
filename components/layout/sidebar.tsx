import Link from "next/link";

import { APP_NAME } from "@/lib/constants/brand";
import { SidebarNav, type SidebarPage } from "./sidebar-nav";

export function Sidebar({ pages }: { pages: SidebarPage[] }) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="font-semibold text-foreground">
          {APP_NAME}
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav pages={pages} />
      </div>
    </aside>
  );
}
