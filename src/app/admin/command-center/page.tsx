// =============================================================================
// ConMart — Admin Command Center (Operations Hub)
// =============================================================================
// Operational control room for:
// 1. Unlocked Introductions & Prepaid Wallet Revenue Analytics
// 2. Prepaid Top-Up Deposit Approvals (CBE & Telebirr receipts)
// 3. Trade Dispute Mediation Queue (Shortage, Spec Mismatch, Non-Delivery)
// 4. Supplier Document Verification & Yard Compliance Queue
// 5. Category Introduction Fee & Status Switcher
// =============================================================================

import { redirect } from "next/navigation";
import {
  Clock,
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  Coins,
  Inbox,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchAllOrders, fetchAdminStats } from "@/lib/data/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { getAdminPendingTopUpsAction } from "@/app/actions/wallet";
import { getAdminCategoriesAction } from "@/app/actions/categories";
import { getAdminDisputesAction } from "@/app/actions/enquiries";
import { getAdminSellersAction } from "@/app/actions/sellers";
import { OrdersTable } from "./orders-table";
import { TopUpsApprovalTable } from "./topups-approval-table";
import { CategoryFeeEditor } from "./category-fee-editor";
import { DisputesTable } from "./disputes-table";
import { SellerVerificationTable } from "./seller-verification-table";
import { formatETB } from "@/lib/types";

export default async function CommandCenterPage() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    redirect("/login?redirect=/admin/command-center");
  }

  const dbUser = await db.user.findUnique({
    where: { authId: authUser.id },
    select: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const [orders, stats, topUpsRes, categoriesRes, disputesRes, sellersRes] = await Promise.all([
    fetchAllOrders(),
    fetchAdminStats(),
    getAdminPendingTopUpsAction(),
    getAdminCategoriesAction(),
    getAdminDisputesAction(),
    getAdminSellersAction(),
  ]);

  const topUps = topUpsRes.success && topUpsRes.data ? topUpsRes.data : [];
  const categories = categoriesRes.success && categoriesRes.data ? categoriesRes.data : [];
  const disputes = disputesRes.success && disputesRes.data ? disputesRes.data : [];
  const sellers = sellersRes.success && sellersRes.data ? sellersRes.data : [];

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          Addis Ababa Construction Materials Trading Hub
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform Operations Command Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time oversight: prepaid wallet top-up approvals, introduction revenue, dispute mediation, supplier document verification, and category fee administration.
        </p>
      </div>

      {/* Primary Introduction Platform Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={<Coins className="h-5 w-5 text-emerald-500" />}
          label="Introduction Revenue"
          value={formatETB(stats.unlockRevenue)}
        />
        <StatCard
          icon={<Inbox className="h-5 w-5 text-primary" />}
          label="Purchase Enquiries"
          value={stats.totalEnquiries.toString()}
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-blue-500" />}
          label="Unlocked Leads"
          value={stats.unlockedEnquiries.toString()}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          label="Pending Deposits"
          value={topUps.length.toString()}
        />
        <StatCard
          icon={<ShieldAlert className="h-5 w-5 text-rose-500" />}
          label="Open Disputes"
          value={disputes.filter((d) => d.status === "OPEN" || d.status === "MEDIATING").length.toString()}
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5 text-indigo-500" />}
          label="Verified Suppliers"
          value={sellers.filter((s) => s.verificationStatus === "VERIFIED").length.toString()}
        />
      </div>

      {/* 1. Prepaid Top-Up Deposit Approvals */}
      <TopUpsApprovalTable initialTopUps={topUps} />

      {/* 2. Trade Disputes & Mediation Queue */}
      <DisputesTable initialDisputes={disputes} />

      {/* 3. Supplier Verification & Document Compliance Queue */}
      <SellerVerificationTable initialSellers={sellers} />

      {/* 4. Category Introduction Fees & Enable Switcher */}
      <CategoryFeeEditor initialCategories={categories} />

      {/* 5. Legacy Logistics & Bank Proformas (Preserved for Backwards Compatibility) */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Bank Proforma Invoices & Fulfillment
            </h2>
            <p className="text-xs text-muted-foreground">
              Official bank proformas generated by contractors for loan, LC, or offline procurement.
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {orders.length} total proformas
          </span>
        </div>
        <OrdersTable orders={orders} />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-border/50 shadow-2xs">
      <CardContent className="flex items-center gap-3 pt-4 pb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
          <p className="text-base font-bold text-foreground font-mono">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
