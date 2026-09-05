// =============================================================================
// ConMart — Branded 404 Not Found Page
// =============================================================================

import Link from "next/link";
import { HardHat, Home, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 shadow-sm">
        <HardHat className="h-8 w-8" />
      </div>

      <p className="text-sm font-bold uppercase tracking-wider text-primary">
        404 — Material or Page Not Found
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        We couldn&apos;t locate that record.
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        The construction material listing, order, or page you are looking for may have been archived, fulfilled, or the URL might be invalid.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/buyer/catalog">
          <Button className="gap-2 font-semibold">
            <Package className="h-4 w-4" />
            Browse Catalog
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>

      <div className="mt-12 text-xs text-muted-foreground">
        Need assistance with a procurement order? Call ConMart Desk:{" "}
        <span className="font-semibold text-foreground">
          {process.env.NEXT_PUBLIC_ADMIN_PHONE ?? "+251 91 100 0000"}
        </span>
      </div>
    </div>
  );
}
