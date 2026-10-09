"use client";

import { APP_NAME } from "@/lib/constants/brand";
import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav, type SidebarPage } from "./sidebar-nav";

export function MobileNav({ pages }: { pages: SidebarPage[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">Apri il menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>{APP_NAME}</SheetTitle>
        </SheetHeader>
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
          <SidebarNav pages={pages} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
