"use client";

// =============================================================================
// ConMart — Listing Status Toggle Button
// =============================================================================

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { toggleListingStatus } from "@/app/actions/listings";
import { Loader2 } from "lucide-react";

interface ListingStatusButtonProps {
  listingId: string;
  initialActive: boolean;
}

export function ListingStatusButton({
  listingId,
  initialActive,
}: ListingStatusButtonProps) {
  const [isActive, setIsActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const nextState = !isActive;
    setIsActive(nextState);

    startTransition(async () => {
      const res = await toggleListingStatus(listingId, nextState);
      if (res.error) {
        // Revert on error
        setIsActive(!nextState);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="cursor-pointer transition-opacity hover:opacity-80 active:scale-95"
      title={isActive ? "Click to Pause Listing" : "Click to Activate Listing"}
    >
      <Badge
        variant={isActive ? "default" : "secondary"}
        className="text-xs gap-1"
      >
        {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        {isActive ? "Active (Live)" : "Paused"}
      </Badge>
    </button>
  );
}
