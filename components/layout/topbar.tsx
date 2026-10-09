import { MobileNav } from "./mobile-nav";
import type { SidebarPage } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsBell } from "./notifications-bell";
import type { Notification } from "@/services/notifications.service";

export function Topbar({
  userName,
  userEmail,
  notifications,
  pages,
}: {
  userName: string | null;
  userEmail: string | null;
  notifications: Notification[];
  pages: SidebarPage[];
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur md:px-6">
      <MobileNav pages={pages} />
      <div className="flex-1" />
      <ThemeToggle />
      <NotificationsBell notifications={notifications} />
      <UserMenu name={userName} email={userEmail} />
    </header>
  );
}
