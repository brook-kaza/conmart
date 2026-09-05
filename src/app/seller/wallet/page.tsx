// =============================================================================
// ConMart — Seller Prepaid Wallet Page
// =============================================================================

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getSellerWalletAction } from "@/app/actions/wallet";
import { SellerWalletView } from "./wallet-view";

export const metadata = {
  title: "Prepaid Introduction Wallet | ConMart Ethiopia",
  description: "Manage your prepaid balances and top-up requests for verified contractor introduction unlocks.",
};

export default async function SellerWalletPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login?redirect=/seller/wallet");
  }

  const result = await getSellerWalletAction();
  if (!result.success || !result.data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        Failed to load wallet data: {result.error || "Unknown error"}
      </div>
    );
  }

  return <SellerWalletView initialData={result.data} />;
}
