// =============================================================================
// ConMart — Print Button (Client Component)
// =============================================================================

"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="gap-1.5 text-xs"
    >
      <Printer className="h-4 w-4" />
      Print Invoice
    </Button>
  );
}
