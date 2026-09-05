// =============================================================================
// ConMart — Seller Dashboard (Server Component)
// =============================================================================
// Authenticates seller/admin, loads inventory from database, and delegates
// rendering to the bilingual SellerDashboardView client component.
// =============================================================================

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { fetchSellerListings } from "@/lib/data/admin";
import { db } from "@/lib/db";
import { SellerDashboardView } from "./seller-dashboard-view";

export default async function SellerDashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login?redirect=/seller/dashboard");
  }

  const dbUser = await db.user.findUnique({
    where: { authId: user.id },
    select: { role: true },
  });

  if (!dbUser || (dbUser.role !== "SELLER" && dbUser.role !== "ADMIN")) {
    redirect("/unauthorized");
  }

  const listings = await fetchSellerListings(user.id);

  return <SellerDashboardView listings={listings} />;
}
