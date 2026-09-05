// =============================================================================
// ConMart — Admin Layout (Responsive & Localized)
// =============================================================================

import { redirect } from "next/navigation";
import { HardHat, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { db } from "@/lib/db";
import {
  AdminSidebarNav,
  AdminBottomNav,
  AdminSignOutButton,
} from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirect=/admin/command-center");
  }

  const dbUser = await db.user.findUnique({
    where: { authId: user.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const userName = (user.user_metadata?.name as string) ?? "Admin";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <HardHat className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">ConMart</span>
              <span className="ml-1 text-[10px] font-medium text-destructive uppercase">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <Separator />

        <AdminSidebarNav />

        <Separator />

        <div className="p-4">
          <div className="mb-3 truncate text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">{userName}</span>
            <span className="block truncate">{user.email}</span>
          </div>
          <AdminSignOutButton />
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <HardHat className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold tracking-tight">ConMart</span>
          <span className="text-[10px] font-medium text-destructive uppercase">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span className="max-w-[80px] truncate">{userName}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-background pb-16 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <AdminBottomNav />
    </div>
  );
}
