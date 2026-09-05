// =============================================================================
// ConMart — Buyer Category Showcase Hub (Stage 1)
// =============================================================================
// The primary portal when a contractor or developer logs in.
// Large, immersive material category cards, quick search, recent purchase requests,
// and ConMart Verified Counterparty Introduction guarantee.
// =============================================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Package,
  Search,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Container,
  Columns3,
  Mountain,
  LayoutGrid,
  Home,
  Pipette,
  TreePine,
  Zap,
  Coins,
  Unlock,
  Clock,
  ShieldAlert,
  SendHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  fetchCategoriesWithCounts,
  fetchRecentBuyerEnquiries,
} from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Container,
  Columns3,
  Mountain,
  LayoutGrid,
  Home,
  Pipette,
  TreePine,
  Zap,
};

export default async function BuyerCategoryHubPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login?redirect=/buyer");
  }

  const buyerName = (user.user_metadata?.name as string) ?? "Contractor";
  const companyName = (user.user_metadata?.companyName as string) ?? "General Contractor";

  const [categories, recentEnquiries] = await Promise.all([
    fetchCategoriesWithCounts(),
    fetchRecentBuyerEnquiries(user.id, 3),
  ]);

  const totalOffers = categories.reduce((sum, c) => sum + c.listingCount, 0);

  return (
    <div className="space-y-10">
      {/* ===================================================================== */}
      {/* 1. HERO HEADER & PROCUREMENT SEARCH                                 */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            ConMart Direct Introduction Service · Addis Ababa
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Direct wholesale materials with zero broker markup.
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Welcome back, <span className="font-semibold text-foreground">{companyName}</span> ({buyerName}).
            Compare competing wholesale offers from verified factories and depots across Addis Ababa, submit purchase requests with your exact site access feasibility, and connect directly to close your material deals.
          </p>

          {/* Search Form to /buyer/category/all */}
          <form
            action="/buyer/category/all"
            method="GET"
            className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                name="search"
                placeholder="Search Dangote, Mugher, Zuquala Rebar, River Sand, HCB..."
                className="w-full h-11 rounded-xl border border-border bg-background pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
              />
            </div>
            <button
              type="submit"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-11 px-5 rounded-xl text-xs font-bold shadow gap-2"
              )}
            >
              <span>Browse Materials</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Quick Search Chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-muted-foreground">
            <span>Popular:</span>
            <Link
              href="/buyer/category/cement?brand=Dangote"
              className="rounded-md border border-border bg-muted/40 px-2 py-0.5 hover:border-primary/50 hover:text-foreground transition-colors"
            >
              Dangote Cement
            </Link>
            <Link
              href="/buyer/category/rebar-structural-steel?brand=Zuquala"
              className="rounded-md border border-border bg-muted/40 px-2 py-0.5 hover:border-primary/50 hover:text-foreground transition-colors"
            >
              Zuquala Rebar Ø16mm
            </Link>
            <Link
              href="/buyer/category/sand-gravel-aggregates"
              className="rounded-md border border-border bg-muted/40 px-2 py-0.5 hover:border-primary/50 hover:text-foreground transition-colors"
            >
              Mojo River Sand
            </Link>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. BROWSE BY CATEGORY                                                 */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Official Material Categories
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Curated строительные materials directly available from verified Addis Ababa suppliers ({totalOffers} depot offers).
            </p>
          </div>
          <Link
            href="/buyer/category/all"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Materials</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((cat) => {
            const IconComponent = ICON_MAP[cat.iconName] || Package;

            return (
              <Link
                key={cat.id}
                href={`/buyer/category/${cat.slug}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 hover:border-primary/60 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {cat.listingCount} {cat.listingCount === 1 ? "depot" : "depots"}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {cat.description || "Wholesale building materials and certified specifications."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground group-hover:text-primary font-medium">
                  <span>Compare Offers</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. RECENT PURCHASE ENQUIRIES TRACKER                                  */}
      {/* ===================================================================== */}
      {recentEnquiries.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <SendHorizontal className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">
                Your Recent Purchase Enquiries
              </h3>
            </div>
            <Link
              href="/buyer/enquiries"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View All Enquiries ({recentEnquiries.length}) →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {recentEnquiries.map((enq) => {
              const isUnlocked = enq.isUnlocked;
              const isPending = enq.status === "PENDING";
              const isCompleted = enq.status === "COMPLETED";
              const isDisputed = enq.status === "DISPUTED";

              return (
                <Link
                  key={enq.id}
                  href="/buyer/enquiries"
                  className="group flex flex-col justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 hover:border-primary/50 hover:bg-muted/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-foreground">
                        {enq.referenceCode}
                      </span>
                      {isPending && (
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-semibold gap-1">
                          <Clock className="h-3 w-3" /> Waiting
                        </Badge>
                      )}
                      {isUnlocked && !isCompleted && !isDisputed && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold gap-1">
                          <Unlock className="h-3 w-3" /> Unlocked
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-semibold gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </Badge>
                      )}
                      {isDisputed && (
                        <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-semibold gap-1">
                          <ShieldAlert className="h-3 w-3" /> Dispute
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs font-bold text-foreground line-clamp-1">
                      {enq.productTitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {enq.qty.toLocaleString()} {enq.unit} · {enq.categoryName}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-[10px]">
                      {new Date(enq.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-[11px] font-semibold text-primary group-hover:underline">
                      View Tracker →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. CONMART COUNTERPARTY INTRODUCTION GUARANTEE                         */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-card to-muted/20 p-6">
        <div className="text-center max-w-xl mx-auto mb-6">
          <Badge variant="secondary" className="mb-2 text-[11px] font-semibold">
            How ConMart Connects the Market
          </Badge>
          <h3 className="text-lg font-bold text-foreground">
            The ConMart Counterparty Introduction Guarantee
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            We provide verified access to real suppliers with physical stock in Addis Ababa. No hidden middleman markups.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-border/40 bg-background/60 p-4 space-y-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
              <Building2 className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-foreground">1. Verified Depots & Mill Certs</h4>
            <p className="text-muted-foreground leading-relaxed">
              Every seller submits trade licenses and factory test certificates. Operations audits physical yard stock.
            </p>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/60 p-4 space-y-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 mb-2">
              <Coins className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-foreground">2. Prepaid Supplier Commitment</h4>
            <p className="text-muted-foreground leading-relaxed">
              Suppliers pay an introduction fee from their prepaid wallet to unlock your request — ensuring genuine, committed sellers.
            </p>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/60 p-4 space-y-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 mb-2">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-foreground">3. Fair Dispute Protection</h4>
            <p className="text-muted-foreground leading-relaxed">
              If a deal fails or specifications do not match, 80% fee credit is returned to the seller and ConMart mediates claims.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
