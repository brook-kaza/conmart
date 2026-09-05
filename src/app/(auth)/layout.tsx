// =============================================================================
// ConMart — Auth Layout
// =============================================================================
// Minimal centered layout for login/register pages.
// High-contrast industrial aesthetic with ConMart branding and language/theme toggles.
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { HardHat } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Sign In | ConMart Ethiopia",
  description: "Sign in to ConMart B2B Construction Materials Marketplace",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Top Controls: Language & Theme Switcher */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      {/* --- Branding Header --- */}
      <Link href="/" className="mb-8 flex items-center gap-3 transition-opacity hover:opacity-90">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary">
          <HardHat className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ConMart
          </h1>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Construction Marketplace
          </p>
        </div>
      </Link>

      {/* --- Page Content (Login/Register Form) --- */}
      <div className="w-full max-w-md">{children}</div>

      {/* --- Footer --- */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} ConMart Ethiopia. Industrial-grade procurement.
      </p>
    </div>
  );
}
