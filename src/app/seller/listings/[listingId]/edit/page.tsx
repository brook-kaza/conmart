// =============================================================================
// ConMart — Edit Seller Listing Page (Server Component)
// =============================================================================

import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { EditListingForm } from "./edit-listing-form";

interface EditListingPageProps {
  params: Promise<{ listingId: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { listingId } = await params;

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/login?redirect=/seller/listings/${listingId}/edit`);
  }

  const dbUser = await db.user.findUnique({
    where: { authId: user.id },
    select: { id: true, companyName: true, role: true },
  });

  if (!dbUser || (dbUser.role !== "SELLER" && dbUser.role !== "ADMIN")) {
    redirect("/unauthorized");
  }

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: {
      product: {
        include: {
          category: true,
        },
      },
      priceTiers: {
        orderBy: { minQty: "asc" },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  // Authorization: must own listing or be admin
  if (listing.sellerId !== dbUser.id && dbUser.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <EditListingForm
      listingId={listing.id}
      initialTitle={listing.product.title}
      initialLocation={listing.location}
      initialImageUrl={listing.imageUrl || listing.product.imageUrl || ""}
      categoryName={listing.product.category.name}
      unit={listing.product.unit}
      sellerCompanyName={dbUser.companyName || "Your Company"}
      initialTiers={listing.priceTiers.map((t) => ({
        id: t.id,
        minQty: t.minQty,
        maxQty: t.maxQty,
        unitPrice: Number(t.unitPrice),
        validUntil: t.validUntil,
      }))}
    />
  );
}
