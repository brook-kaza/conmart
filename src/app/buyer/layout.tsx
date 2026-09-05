// =============================================================================
// ConMart — Buyer Dashboard Layout
// =============================================================================
// Responsive layout: Desktop sidebar + Mobile bottom navigation bar.
// =============================================================================

import { redirect } from "next/navigation";
import { HardHat, LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { CartProvider } from "@/lib/cart/cart-context";
import { CartDrawer, CartTriggerButton } from "@/components/cart/cart-drawer";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { BuyerSidebarNav, BuyerMobileBottomNav } from "./buyer-nav";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirect=/buyer/catalog");
  }

  const userName = (user.user_metadata?.name as string) ?? "Buyer";

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* --- Desktop Sidebar (hidden on mobile) --- */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <HardHat className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none tracking-tight">ConMart</span>
                <span className="text-[10px] font-medium leading-none text-muted-foreground">Ethiopia</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          <Separator />

          {/* Navigation */}
          <BuyerSidebarNav />

          <div className="px-4 pb-4">
            <CartTriggerButton />
          </div>

          <Separator />

          {/* User Info + Logout */}
          <div className="p-4">
            <div className="mb-3 truncate text-xs text-muted-foreground">
              <span className="block font-medium text-foreground">{userName}</span>
              <span className="block truncate">{user.email}</span>
            </div>
            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </aside>

        {/* --- Mobile Top Bar (hidden on desktop) --- */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <HardHat className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold tracking-tight">ConMart</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <CartTriggerButton />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="max-w-[70px] truncate">{userName}</span>
            </div>
          </div>
        </header>

        {/* --- Main Content --- */}
        <main className="flex-1 overflow-auto bg-background pb-16 md:pb-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>

        {/* --- Mobile Bottom Navigation (hidden on desktop) --- */}
        <BuyerMobileBottomNav signOutAction={signOut} />

        {/* Slide-over Cart Drawer */}
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
