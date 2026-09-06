// =============================================================================
// ConMart — Seller Localized Navigation Component
// =============================================================================
// Client component providing bilingual navigation links for the Seller portal.
// =============================================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, PlusCircle, LogOut, Wallet, Inbox, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { signOut } from "@/app/actions/auth";

export function SellerSidebarNav() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const links = [
    {
      href: "/seller/dashboard",
      label: t("seller_my_listings"),
      icon: Package,
      active: pathname === "/seller/dashboard",
    },
    {
      href: "/seller/enquiries",
      label: t("enquiries_title"),
      icon: Inbox,
      active: pathname.startsWith("/seller/enquiries"),
    },
    {
      href: "/seller/wallet",
      label: t("wallet_title"),
      icon: Wallet,
      active: pathname === "/seller/wallet",
    },
    {
      href: "/seller/listings/new",
      label: t("seller_add_material"),
      icon: PlusCircle,
      active: pathname === "/seller/listings/new",
    },
    {
      href: "/about",
      label: t("nav_about", "About Us"),
      icon: Info,
      active: pathname === "/about",
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

export function SellerBottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border bg-card py-2 md:hidden shadow-lg">
      <Link
        href="/seller/dashboard"
        className={cn(
          "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors",
          pathname === "/seller/dashboard"
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Package className="h-5 w-5" />
        <span>{t("seller_my_listings")}</span>
      </Link>
      <Link
        href="/seller/enquiries"
        className={cn(
          "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors",
          pathname.startsWith("/seller/enquiries")
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Inbox className="h-5 w-5" />
        <span>{t("enquiries_tab_all")}</span>
      </Link>
      <Link
        href="/seller/wallet"
        className={cn(
          "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors",
          pathname === "/seller/wallet"
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Wallet className="h-5 w-5" />
        <span>Wallet</span>
      </Link>
      <Link
        href="/seller/listings/new"
        className={cn(
          "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors",
          pathname === "/seller/listings/new"
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <PlusCircle className="h-5 w-5" />
        <span>{t("seller_add_material")}</span>
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>{t("nav_sign_out")}</span>
        </button>
      </form>
    </nav>
  );
}

export function SellerSignOutButton() {
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
