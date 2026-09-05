// =============================================================================
// ConMart — Seller Dashboard Client View (Bilingual English & Amharic)
// =============================================================================
// Displays supplier inventory, image thumbnails, volume price tiers,
// order counters, and active status toggles with direct "List New Material" CTA.
// =============================================================================

"use client";

import Link from "next/link";
import {
  Calendar,
  Package,
  ShoppingCart,
  PlusCircle,
  ExternalLink,
  MapPin,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatETB } from "@/lib/types";
import { ListingStatusButton } from "./listing-status-button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getCategoryTitle,
  getLocalizedUnit,
  getLocalizedLocation,
} from "@/lib/i18n/translations";

export interface SellerListingItem {
  id: string;
  active: boolean;
  location: string;
  imageUrl: string | null;
  productTitle: string;
  productUnit: string;
  categoryName: string;
  orderCount: number;
  priceTiers: {
    id: string;
    minQty: number;
    maxQty: number;
    unitPrice: number;
    validUntil: Date;
    isExpired: boolean;
  }[];
}

interface SellerDashboardViewProps {
  listings: SellerListingItem[];
}

export function SellerDashboardView({ listings }: SellerDashboardViewProps) {
  const { t, locale } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("seller_inventory_title")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {t("seller_inventory_subtitle")}
          </p>
        </div>

        <Link
          href="/seller/listings/new"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "h-9 gap-2 text-xs font-bold px-4 shadow-sm self-start sm:self-auto"
          )}
        >
          <PlusCircle className="h-4 w-4" />
          {t("seller_btn_add")}
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/40 py-16 px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <Package className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {t("seller_empty_title")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {t("seller_empty_desc")}
          </p>
          <Link
            href="/seller/listings/new"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "mt-5 h-9 gap-2 text-xs font-bold shadow"
            )}
          >
            <PlusCircle className="h-4 w-4" />
            {t("seller_btn_list_first")}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {listings.map((listing) => {
            const unitLabel = getLocalizedUnit(listing.productUnit, locale);
            const localizedLocation = getLocalizedLocation(listing.location, locale);
            const localizedCategory = getCategoryTitle(
              listing.categoryName.toLowerCase(),
              listing.categoryName,
              locale
            );

            const displayImage =
              listing.imageUrl ||
              "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80";

            return (
              <Card key={listing.id} className="overflow-hidden border-border/60 bg-card">
                <CardHeader className="border-b border-border/40 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Material Title and Thumbnail */}
                    <div className="flex items-center gap-3.5">
                      <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={displayImage}
                          alt={listing.productTitle}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {localizedCategory}
                          </Badge>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {localizedLocation}
                          </span>
                        </div>
                        <CardTitle className="text-base font-bold mt-1 text-foreground">
                          {listing.productTitle}
                        </CardTitle>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/40">
                        <ShoppingCart className="h-3 w-3 text-primary" />
                        <span className="font-semibold text-foreground">
                          {listing.orderCount}
                        </span>{" "}
                        {t("seller_orders_badge")}
                      </div>

                      <ListingStatusButton
                        listingId={listing.id}
                        initialActive={listing.active}
                      />

                      <Link
                        href={`/seller/listings/${listing.id}/edit`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-8 gap-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                        )}
                        title="Edit Material & Pricing Tiers"
                      >
                        <Pencil className="h-3.5 w-3.5 text-primary" />
                        <span>{t("seller_btn_edit")}</span>
                      </Link>

                      <Link
                        href={`/buyer/catalog/${listing.id}`}
                        target="_blank"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        )}
                        title="View Public Catalog Page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t("seller_btn_preview")}</span>
                      </Link>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead className="text-xs font-semibold">{t("seller_col_tier")}</TableHead>
                        <TableHead className="text-xs font-semibold">{t("seller_col_price")}</TableHead>
                        <TableHead className="text-xs font-semibold">{t("seller_col_valid")}</TableHead>
                        <TableHead className="text-xs font-semibold">{t("seller_col_status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listing.priceTiers.map((tier) => (
                        <TableRow
                          key={tier.id}
                          className={tier.isExpired ? "opacity-50" : ""}
                        >
                          <TableCell className="font-medium text-xs">
                            {tier.minQty.toLocaleString()} –{" "}
                            {tier.maxQty.toLocaleString()} {unitLabel}
                          </TableCell>
                          <TableCell className="font-bold text-xs text-foreground">
                            {formatETB(tier.unitPrice, locale)}
                            <span className="text-[10px] font-normal text-muted-foreground ml-1">
                              /{unitLabel}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {tier.validUntil.toLocaleDateString(
                                locale === "am" ? "am-ET" : "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tier.isExpired ? "destructive" : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {tier.isExpired ? t("detail_tier_expired") : t("detail_tier_active")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {listing.priceTiers.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-xs text-muted-foreground py-4"
                          >
                            {t("seller_no_tiers")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
