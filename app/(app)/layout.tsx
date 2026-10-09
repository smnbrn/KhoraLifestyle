import { redirect } from "next/navigation";

import { getCurrentUser } from "@/services/auth.service";
import { getProfile } from "@/services/profiles.service";
import { getNotifications } from "@/services/notifications.service";
import { listPages } from "@/services/pages.service";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

// Il vero confine di autorizzazione (oltre alla RLS): proxy.ts fa solo un
// controllo "ottimistico", questo è quello autoritativo lato server — vedi
// sezione 2.3 dell'architettura.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, notifications, pages] = await Promise.all([
    getProfile(user.id),
    getNotifications(user.id),
    listPages(user.id),
  ]);

  const sidebarPages = pages.map((p) => ({ id: p.id, title: p.title, icon: p.icon, section: p.section }));

  return (
    <div className="min-h-screen bg-background">
      <Sidebar pages={sidebarPages} />
      <div className="flex min-h-screen flex-col md:pl-60">
        <Topbar userName={profile?.full_name ?? null} userEmail={user.email ?? null} notifications={notifications} pages={sidebarPages} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
