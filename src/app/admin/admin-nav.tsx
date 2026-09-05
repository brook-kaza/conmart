// =============================================================================
// ConMart — Admin Localized Navigation Component
// =============================================================================
// Client component providing bilingual navigation links for the Admin command center.
// =============================================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { signOut } from "@/app/actions/auth";

export function AdminSidebarNav() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const links = [
    {
      href: "/admin/command-center",
      label: t("nav_command_center"),
      icon: BarChart3,
      active: pathname === "/admin/command-center",
    },
  ];

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              link.active
                ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminBottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border bg-card py-2 md:hidden shadow-lg">
      <Link
        href="/admin/command-center"
        className={cn(
          "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
          pathname === "/admin/command-center"
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <BarChart3 className="h-5 w-5" />
        <span>{t("nav_command_center")}</span>
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>{t("nav_sign_out")}</span>
        </button>
      </form>
    </nav>
  );
}

export function AdminSignOutButton() {
  const { t } = useLanguage();

  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
        {t("nav_sign_out")}
      </Button>
    </form>
  );
}
