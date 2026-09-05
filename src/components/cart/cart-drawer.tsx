// =============================================================================
// ConMart — Multi-Product Proforma Cart Drawer
// =============================================================================
// Slide-over drawer showing selected materials grouped by Supplier Depot.
// Calculates real-time 10% platform fee and 15% VAT before atomic submission.
// =============================================================================

"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ShoppingBag,
  Trash2,
  Building2,
  MapPin,
  FileText,
  Loader2,
  AlertCircle,
  Truck,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatETB } from "@/lib/types";
import { generateMultiItemProformaAction } from "@/app/actions/orders";
import { useLanguage } from "@/lib/i18n/language-context";
import { getLocalizedUnit, getLocalizedLocation } from "@/lib/i18n/translations";

export function CartDrawer() {
  const { t, locale } = useLanguage();
  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    updateItemQty,
    clearCart,
    totalItemCount,
    distinctDepotCount,
    baseSubtotal,
    platformFee,
    tax,
    grandTotal,
  } = useCart();

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Group items by Depot
  const groupedByDepot = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = `${item.depotCode}__${item.location}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const handleCheckout = () => {
    if (items.length === 0) return;
    setError(null);

    startTransition(async () => {
      const payload = items.map((i) => ({
        listingId: i.listingId,
        qty: i.qty,
      }));

      const result = await generateMultiItemProformaAction(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      clearCart();
      setIsOpen(false);
      router.push(`/buyer/proforma/${result.data.referenceCode}`);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {t("cart_title")}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {locale === "am"
                  ? `${totalItemCount} ${t("cart_items_count")} ${distinctDepotCount} ${t("cart_depots_count")}`
                  : `${totalItemCount} material${totalItemCount === 1 ? "" : "s"} across ${distinctDepotCount} depot${distinctDepotCount === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Logistics Optimization Banner */}
        {items.length > 0 && (
          <div className="border-b border-border/40 bg-muted/30 px-5 py-2.5 text-xs">
            {distinctDepotCount === 1 ? (
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>{t("cart_bundled_badge")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 font-medium">
                <Truck className="h-4 w-4 shrink-0" />
                <span>
                  {locale === "am"
                    ? `ዕቃዎች ከተለያዩ ${distinctDepotCount} መጋዘኖች ተጭነው ይላካሉ።`
                    : `Materials will be fulfilled from ${distinctDepotCount} distinct depots across town.`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">{t("cart_empty_title")}</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {t("cart_empty_desc")}
              </p>
            </div>
          ) : (
            Object.entries(groupedByDepot).map(([depotKey, depotItems]) => {
              const [code, location] = depotKey.split("__");
              const localizedLoc = getLocalizedLocation(location, locale);

              return (
                <div key={depotKey} className="rounded-xl border border-border/60 bg-muted/10 p-3.5 space-y-3">
                  {/* Depot Tag */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      <span>{code}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 text-amber-500" />
                      <span>{localizedLoc}</span>
                    </div>
                  </div>

                  {/* Depot Line Items */}
                  <div className="space-y-3 pt-1">
                    {depotItems.map((item) => {
                      const unitLabel = getLocalizedUnit(item.unit, locale);

                      return (
                        <div
                          key={item.listingId}
                          className="flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {item.productTitle}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {formatETB(item.unitPrice, locale)} / {unitLabel}
                            </p>

                            {/* Qty Controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() =>
                                  updateItemQty(
                                    item.listingId,
                                    Math.max(item.minQty, item.qty - 10)
                                  )
                                }
                                className="h-6 w-6 rounded flex items-center justify-center bg-muted border border-border hover:bg-card"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="font-mono font-medium px-1">
                                {item.qty.toLocaleString()} {unitLabel}
                              </span>
                              <button
                                onClick={() =>
                                  updateItemQty(
                                    item.listingId,
                                    Math.min(item.maxQty, item.qty + 10)
                                  )
                                }
                                className="h-6 w-6 rounded flex items-center justify-center bg-muted border border-border hover:bg-card"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-foreground">
                              {formatETB(item.subtotal, locale)}
                            </p>
                            <button
                              onClick={() => removeItem(item.listingId)}
                              className="mt-2 text-muted-foreground hover:text-destructive transition-colors p-1"
                              title={locale === "am" ? "ዕቃ አስወግድ" : "Remove item"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Totals */}
        {items.length > 0 && (
          <div className="border-t border-border/60 bg-card p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("cart_base_subtotal")}</span>
                <span className="font-medium text-foreground">{formatETB(baseSubtotal, locale)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("cart_fee")}</span>
                <span>{formatETB(platformFee, locale)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("cart_vat")}</span>
                <span>{formatETB(tax, locale)}</span>
              </div>
              <Separator className="my-1.5" />
              <div className="flex justify-between text-sm font-bold text-foreground">
                <span>{t("cart_grand_total")}</span>
                <span className="text-base text-primary font-extrabold">
                  {formatETB(grandTotal, locale)}
                </span>
              </div>
            </div>

            <Button
              className="w-full font-bold shadow-md"
              size="lg"
              disabled={isPending || items.length === 0}
              onClick={handleCheckout}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("cart_btn_generating")}
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  {locale === "am"
                    ? `${t("cart_btn_checkout")} (${items.length} ዕቃዎች)`
                    : `${t("cart_btn_checkout")} (${items.length} items)`}
                </>
              )}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              {t("cart_validity_note")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function CartTriggerButton() {
  const { t } = useLanguage();
  const { totalItemCount, setIsOpen } = useCart();

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="relative flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-muted shadow-xs"
    >
      <ShoppingBag className="h-4 w-4 text-primary" />
      <span>{t("cart_trigger_btn")}</span>
      {totalItemCount > 0 && (
        <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {totalItemCount}
        </Badge>
      )}
    </button>
  );
}

