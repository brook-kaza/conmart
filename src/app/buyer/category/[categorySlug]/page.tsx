// =============================================================================
// ConMart — Focused Category Catalog Page (Stage 2)
// =============================================================================
// Dedicated category catalog route (/buyer/category/[categorySlug]).
// 100% focused on product comparison with horizontal category switcher tabs,
// brand facets, yard location filter, sorting, and direct proforma calculation.
// =============================================================================

import { notFound } from "next/navigation";
import {
  fetchCatalogListings,
  fetchCategoriesWithCounts,
  fetchCategoryBySlug,
} from "@/lib/data/catalog";
import { CategoryView } from "./category-view";

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{
    search?: string;
    location?: string;
    brand?: string;
    sort?: string;
  }>;
}

export default async function FocusedCategoryCatalogPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { categorySlug } = await params;
  const sParams = await searchParams;

  const searchQuery = sParams.search;
  const locationFilter = sParams.location;
  const brandFilter = sParams.brand;
  const sortBy = sParams.sort || "newest";

  const isAll = categorySlug === "all";

  // Fetch data in parallel
  const [allCategories, categoryDetail, listings] = await Promise.all([
    fetchCategoriesWithCounts(),
    isAll ? null : fetchCategoryBySlug(categorySlug),
    fetchCatalogListings(categorySlug, searchQuery, locationFilter, brandFilter, sortBy),
  ]);

  if (!isAll && !categoryDetail) {
    notFound();
  }

  const availableBrands = isAll
    ? Array.from(
        new Set(
          listings
            .map((l) => l.product.specs?.brand)
            .filter((b): b is string => Boolean(b))
        )
      ).sort()
    : categoryDetail?.availableBrands || [];

  return (
    <CategoryView
      allCategories={allCategories}
      categorySlug={categorySlug}
      categoryDetail={categoryDetail}
      listings={listings}
      availableBrands={availableBrands}
      searchQuery={searchQuery}
      locationFilter={locationFilter}
      brandFilter={brandFilter}
      sortBy={sortBy}
    />
  );
}
