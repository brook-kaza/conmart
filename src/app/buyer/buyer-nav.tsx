"use client";

// =============================================================================
// ConMart — Buyer Navigation Bar (Client Component for Localization)
// =============================================================================

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Package, FileText, SendHorizontal } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

export function BuyerSidebarNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const links = [
    {
      href: "/buyer",
      label: t("nav_categories", "Categories"),
      icon: LayoutGrid,
      exact: true,
    },
    {
      href: "/buyer/category/all",
      label: t("nav_all_materials", "All Materials"),
      icon: Package,
    },
    {
      href: "/buyer/enquiries",
      label: t("buyer_enquiries_title", "My Enquiries"),
      icon: SendHorizontal,
    },
    {
      href: "/buyer/orders",
      label: t("nav_bank_proformas", "Bank Proformas"),
      icon: FileText,
    },
  ];

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {links.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BuyerMobileBottomNav({ signOutAction }: { signOutAction: () => Promise<void> }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const links = [
    {
      href: "/buyer",
      label: t("nav_categories", "Categories"),
      icon: LayoutGrid,
      exact: true,
    },
    {
      href: "/buyer/category/all",
      label: t("nav_all_materials", "Materials"),
      icon: Package,
    },
    {
      href: "/buyer/enquiries",
      label: "Enquiries",
      icon: SendHorizontal,
    },
    {
      href: "/buyer/orders",
      label: t("nav_bank_proformas", "Proformas"),
      icon: FileText,
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border bg-card py-2 md:hidden">
      {links.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
              isActive
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <form action={signOutAction}>
        <button
          type="submit"
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="text-sm">🚪</span>
          <span>{t("nav_sign_out", "Sign Out")}</span>
        </button>
      </form>
    </nav>
  );
}
