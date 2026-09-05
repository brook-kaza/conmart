"use client";

// =============================================================================
// ConMart — Category Catalog Interactive Toolbar (Stage 2)
// =============================================================================
// Provides instant client filtering by:
// - Search keyword (product title, brand, supplier)
// - Brand facets (Dangote, Derba, Mugher, Zuquala, Akaki, etc.)
// - Yard city location (Addis Ababa, Adama, Bahir Dar, Hawassa, Dire Dawa)
// - Sort order (Price ascending, Price descending, Newest)
// =============================================================================

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, MapPin, X, ArrowUpDown, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useLanguage } from "@/lib/i18n/language-context";
import { getLocalizedLocation } from "@/lib/i18n/translations";

const ETHIOPIAN_LOCATIONS = [
  "Addis Ababa",
  "Adama (Nazret)",
  "Bahir Dar",
  "Hawassa",
  "Dire Dawa",
  "Sululta",
  "Mekelle",
];

interface CategoryToolbarProps {
  availableBrands: string[];
  initialSearch?: string;
  initialLocation?: string;
  initialBrand?: string;
  initialSort?: string;
}

export function CategoryToolbar({
  availableBrands,
  initialSearch = "",
  initialLocation = "",
  initialBrand = "",
  initialSort = "newest",
}: CategoryToolbarProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [sortBy, setSortBy] = useState(initialSort);

  const updateFilters = (newParams: {
    search?: string | null;
    brand?: string | null;
    location?: string | null;
    sort?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newParams.search !== undefined) {
      if (newParams.search && newParams.search.trim()) {
        params.set("search", newParams.search.trim());
      } else {
        params.delete("search");
      }
    }

    if (newParams.brand !== undefined) {
      if (newParams.brand && newParams.brand !== "all") {
        params.set("brand", newParams.brand);
      } else {
        params.delete("brand");
      }
    }

    if (newParams.location !== undefined) {
      if (newParams.location && newParams.location !== "all") {
        params.set("location", newParams.location);
      } else {
        params.delete("location");
      }
    }

    if (newParams.sort !== undefined) {
      if (newParams.sort && newParams.sort !== "newest") {
        params.set("sort", newParams.sort);
      } else {
        params.delete("sort");
      }
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handleClear = () => {
    setSearch("");
    setSelectedBrand("");
    setSelectedLocation("");
    setSortBy("newest");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = Boolean(
    search || selectedBrand || selectedLocation || (sortBy && sortBy !== "newest")
  );

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
      {/* Top row: Search Bar + Location Dropdown + Sort Dropdown */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-md flex items-center"
        >
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("filter_search_placeholder")}
            className="pl-9 pr-14 h-9 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                updateFilters({ search: "" });
              }}
              className="absolute right-12 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 h-7 px-2.5 text-xs font-semibold"
          >
            {t("catalog_find_btn")}
          </Button>
        </form>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Location Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedLocation}
              onChange={(e) => {
                const loc = e.target.value;
                setSelectedLocation(loc);
                updateFilters({ location: loc });
              }}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{t("filter_all_locations")}</option>
              {ETHIOPIAN_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {getLocalizedLocation(loc, locale)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => {
                const s = e.target.value;
                setSortBy(s);
                updateFilters({ sort: s });
              }}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newest">{t("filter_sort_newest")}</option>
              <option value="price_asc">{t("filter_sort_price_low")}</option>
              <option value="price_desc">{t("filter_sort_price_high")}</option>
            </select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
            >
              <X className="h-3 w-3" />
              {t("filter_reset")}
            </Button>
          )}
        </div>
      </div>

      {/* Bottom row: Brand Facet Chips (if available) */}
      {availableBrands.length > 0 && (
        <div className="pt-2 border-t border-border/40 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Tag className="h-3 w-3" />
            {t("catalog_brands_label")}
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedBrand("");
              updateFilters({ brand: null });
            }}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              !selectedBrand
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "border border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {t("catalog_all_brands")}
          </button>

          {availableBrands.map((b) => {
            const isSelected = selectedBrand.toLowerCase() === b.toLowerCase();
            return (
              <button
                key={b}
                type="button"
                onClick={() => {
                  const next = isSelected ? "" : b;
                  setSelectedBrand(next);
                  updateFilters({ brand: next ? b : null });
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "border border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {b}
              </button>
            );
          })}
        </div>
      )}

      {isPending && (
        <div className="h-0.5 w-full bg-primary/20 overflow-hidden rounded-full">
          <div className="h-full bg-primary animate-pulse w-1/3" />
        </div>
      )}
    </div>
  );
}
