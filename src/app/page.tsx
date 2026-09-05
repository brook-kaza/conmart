// =============================================================================
// ConMart — Landing Page (Ethiopian Market)
// =============================================================================
// Bilingual English & Amharic landing page with high-contrast theme support.
// =============================================================================

"use client";

import Link from "next/link";
import { HardHat, ArrowRight, ShoppingCart, Building2, Shield, Phone, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/lib/i18n/language-context";

export default function HomePage() {
  const { t } = useLanguage();
  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE ?? "+251 91 100 0000";

  return (
    <div className="flex min-h-screen flex-col">
      {/* --- Navigation Bar --- */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <HardHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none tracking-tight">ConMart</span>
              <span className="text-[10px] font-medium leading-none text-muted-foreground">Ethiopia</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs")}
            >
              {t("nav_sign_in")}
            </Link>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "sm" }), "text-xs font-bold")}
            >
              {t("nav_get_started")}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* --- Hero Section --- */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <MapPin className="mr-1.5 h-3 w-3 text-amber-500" />
            {t("hero_badge")}
          </div>

          <h1 className="mb-6 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("hero_title_1")}
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              {t("hero_title_highlight")}
            </span>
            <br />
            {t("hero_title_2")}
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("hero_description")}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/buyer"
              className={cn(buttonVariants({ size: "lg" }), "px-8 font-semibold")}
            >
              {t("hero_btn_start_buying")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "px-8 font-semibold"
              )}
            >
              {t("hero_btn_list_materials")}
            </Link>
          </div>
        </div>

        {/* --- Feature Cards --- */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-4 px-4 sm:mt-20 sm:grid-cols-3">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <ShoppingCart className="mb-3 h-8 w-8 text-amber-500" />
              <h3 className="mb-1 font-semibold text-foreground">
                {t("feature_transparent_title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("feature_transparent_desc")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <Building2 className="mb-3 h-8 w-8 text-amber-500" />
              <h3 className="mb-1 font-semibold text-foreground">
                {t("feature_proforma_title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("feature_proforma_desc")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <Shield className="mb-3 h-8 w-8 text-amber-500" />
              <h3 className="mb-1 font-semibold text-foreground">
                {t("feature_managed_title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("feature_managed_desc")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- How It Works --- */}
        <div className="mx-auto mt-16 max-w-3xl px-4 sm:mt-20">
          <h2 className="mb-8 text-center text-xl font-bold text-foreground sm:text-2xl">
            {t("how_it_works_title")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-lg font-bold text-amber-500">
                1
              </div>
              <h4 className="mb-1 text-sm font-semibold text-foreground">
                {t("step_1_title")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("step_1_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-lg font-bold text-amber-500">
                2
              </div>
              <h4 className="mb-1 text-sm font-semibold text-foreground">
                {t("step_2_title")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("step_2_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-lg font-bold text-amber-500">
                3
              </div>
              <h4 className="mb-1 text-sm font-semibold text-foreground">
                {t("step_3_title")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("step_3_desc")}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-border/50 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ConMart Ethiopia. {t("footer_tagline")}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{adminPhone}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
