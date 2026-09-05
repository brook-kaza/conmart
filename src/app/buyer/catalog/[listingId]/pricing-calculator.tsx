// =============================================================================
// ConMart — Live Pricing Calculator (Client Component)
// =============================================================================
// Interactive quantity input with real-time price breakdown.
// Uses the client-side preview calculator for instant feedback.
// On "Generate Proforma", calls the server action for tamper-proof calculation.
// =============================================================================

"use client";

import { useState, useMemo, useTransition } from "react";
import { Calculator, FileText, Loader2, AlertCircle, Phone, ShieldCheck, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { calculateProformaPreview } from "@/lib/engine/proforma-preview";
import { generateProformaAction } from "@/app/actions/orders";
import { formatETB } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/language-context";
import { getLocalizedUnit } from "@/lib/i18n/translations";

interface PriceTier {
  id: string;
  minQty: number;
  maxQty: number;
  unitPrice: number;
}

interface PricingCalculatorProps {
  listingId: string;
  sellerId?: string;
  depotCode?: string;
  location?: string;
  productTitle: string;
  unitLabel: string;
  tiers: PriceTier[];
}

export function PricingCalculator({
  listingId,
  sellerId,
  depotCode,
  location,
  productTitle,
  unitLabel,
  tiers,
}: PricingCalculatorProps) {
  const { t, locale } = useLanguage();
  const localizedUnit = getLocalizedUnit(unitLabel, locale);

  const { addItem } = useCart();
  const [isPending, startTransition] = useTransition();
  const [qty, setQty] = useState<string>("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const numericQty = parseInt(qty, 10);
  const isValidQty = !isNaN(numericQty) && numericQty > 0;

  // Find the matching tier for the current quantity
  const matchedTier = useMemo(() => {
    if (!isValidQty) return null;
    return (
      tiers.find((t) => numericQty >= t.minQty && numericQty <= t.maxQty) ??
      null
    );
  }, [numericQty, isValidQty, tiers]);

  // Calculate preview breakdown
  const preview = useMemo(() => {
    if (!matchedTier || !isValidQty) return null;
    return calculateProformaPreview(numericQty, matchedTier.unitPrice);
  }, [numericQty, matchedTier, isValidQty]);

  // Find which tier the quantity falls closest to (for guidance messaging)
  const tierGuidance = useMemo(() => {
    if (!isValidQty || matchedTier) return null;
    // Find the nearest tier
    const nearest = tiers.reduce<PriceTier | null>((best, tier) => {
      if (numericQty < tier.minQty) {
        if (!best || tier.minQty < best.minQty) return tier;
      }
      return best;
    }, null);
    return nearest;
  }, [numericQty, isValidQty, matchedTier, tiers]);

  function handleGenerate() {
    if (!isValidQty || !matchedTier) return;
    setServerError(null);

    startTransition(async () => {
      const result = await generateProformaAction({
        listingId,
        qty: numericQty,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setGeneratedCode(result.data.referenceCode);
    });
  }

  // Admin contact info from env (public variables)
  const adminPhone =
    process.env.NEXT_PUBLIC_ADMIN_PHONE ?? "+251 91 100 0000";
  const adminWhatsApp =
    process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "251911000000";

  // If proforma was generated, show success state
  if (generatedCode) {
    return (
      <Card className="border-primary/50 bg-card shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-primary">
            <FileText className="h-5 w-5" />
            {t("calc_proforma_generated")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-primary/5 p-4 text-center">
            <p className="text-xs text-muted-foreground">{t("calc_ref_code")}</p>
            <p className="text-2xl font-mono font-bold tracking-wider text-foreground">
              #{generatedCode}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs text-muted-foreground space-y-1.5">
            <p className="font-bold text-foreground flex items-center gap-1.5 text-xs">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t("calc_managed_steps_title")}
            </p>
            <ol className="list-inside list-decimal space-y-1 text-[11px] text-muted-foreground pl-0.5">
              <li>{t("calc_step_1")}</li>
              <li>{t("calc_step_2")}</li>
              <li>{t("calc_step_3")}</li>
            </ol>
          </div>

          <a
            href={`https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(
              locale === "am"
                ? `ሰላም የኮንማርት ኦፕሬሽን፣ በኮንማርት ላይ ይፋዊ የፕሮፎርማ ደረሰኝ አዘጋጅቻለሁ፡ የማጣቀሻ ቁጥር #${generatedCode} ለ ${numericQty} ${localizedUnit} ${productTitle}። እባክዎ ዕቃው መጋዘን መኖሩን አረጋግጠው ማጓጓዣውን ያመቻቹ።`
                : `Hello ConMart Operations Desk, I have generated an official Proforma Invoice on ConMart: Reference #${generatedCode} for ${numericQty} ${unitLabel} of ${productTitle}. Please verify stock and schedule site delivery.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#1DA851] shadow-md"
          >
            <Phone className="h-4 w-4" />
            {t("calc_whatsapp_desk")}
          </a>

          <p className="text-center text-[11px] text-muted-foreground">
            {t("calc_or_call")} <span className="font-semibold text-foreground">{adminPhone}</span>
          </p>

          <a
            href={`/buyer/proforma/${generatedCode}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <FileText className="h-4 w-4" />
            {t("calc_view_print")}
          </a>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setGeneratedCode(null);
              setQty("");
            }}
          >
            {t("calc_generate_another")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          {t("calc_title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* No tiers available */}
        {tiers.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {t("calc_no_tiers")}
          </div>
        ) : (
          <>
            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="calc-qty">
                {t("calc_qty_label")} ({localizedUnit})
              </Label>
              <Input
                id="calc-qty"
                type="number"
                min={1}
                step={1}
                placeholder={`e.g., ${tiers[0]?.minQty ?? 100}`}
                value={qty}
                onChange={(e) => {
                  setQty(e.target.value);
                  setServerError(null);
                }}
                disabled={isPending}
              />
              {/* Tier guidance */}
              {tierGuidance && isValidQty && (
                <p className="text-xs text-muted-foreground">
                  {t("calc_min_order")}{" "}
                  <span className="font-medium text-foreground">
                    {tierGuidance.minQty.toLocaleString()} {localizedUnit}
                  </span>{" "}
                  {t("calc_at")} {formatETB(tierGuidance.unitPrice, locale)}/{localizedUnit}
                </p>
              )}
              {isValidQty && !matchedTier && !tierGuidance && (
                <p className="text-xs text-destructive">
                  {t("calc_exceeds")}
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            {preview && matchedTier && (
              <>
                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      {numericQty.toLocaleString()} × {formatETB(matchedTier.unitPrice, locale)}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatETB(preview.baseSubtotal, locale)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("cart_fee")}</span>
                    <span>
                      {formatETB(preview.platformFee, locale)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("cart_vat")}</span>
                    <span>
                      {formatETB(preview.tax, locale)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">
                      {t("cart_grand_total")}
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {formatETB(preview.grandTotal, locale)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Server Error */}
            {serverError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                className="w-full font-bold shadow-md gap-2"
                size="lg"
                disabled={!isValidQty || !matchedTier || isPending}
                onClick={() => {
                  if (!isValidQty || !matchedTier) return;
                  addItem({
                    listingId,
                    sellerId: sellerId ?? "",
                    depotCode: depotCode ?? "ConMart Partner Depot",
                    location: location ?? "Addis Ababa",
                    productTitle,
                    unit: unitLabel,
                    imageUrl: null,
                    qty: numericQty,
                    unitPrice: matchedTier.unitPrice,
                    subtotal: numericQty * matchedTier.unitPrice,
                    minQty: matchedTier.minQty,
                    maxQty: matchedTier.maxQty,
                  });
                }}
              >
                <ShoppingBag className="h-4 w-4" />
                {t("calc_btn_add_cart")}
              </Button>

              <Button
                variant="outline"
                className="w-full text-xs font-semibold"
                size="sm"
                disabled={!isValidQty || !matchedTier || isPending}
                onClick={handleGenerate}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    {t("calc_generating")}
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-3.5 w-3.5" />
                    {t("calc_btn_instant_proforma")}
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground/60">
              {t("calc_official_verified")}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

