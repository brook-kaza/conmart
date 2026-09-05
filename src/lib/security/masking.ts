// =============================================================================
// ConMart — Strict Pre-Unlock Contact Masking & Sanitization Engine
// =============================================================================
// Protects the platform's paid asset: Verified Counterparty Introduction.
// Guarantees zero contact leakage (phone numbers, email addresses, exact depot
// coordinates, or legal business names) in raw API payloads prior to unlock.
// =============================================================================

/**
 * Regular expressions detecting Ethiopian phone formats, emails, and telegram handles:
 * Matches: +251..., 09..., 07..., spaced or dotted numbers, telegram handles, email addresses.
 */
const PHONE_PATTERN =
  /(?:\+?251|0)?\s*(?:9\d{1}|7\d{1})\s*[\s.-]?\d{3}\s*[\s.-]?\d{4}/gi;
const EMAIL_PATTERN =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const SOCIAL_HANDLE_PATTERN =
  /(?:t\.me\/|@)[a-zA-Z0-9_]{4,}/gi;

/**
 * Cleanses user-generated descriptions or text to prevent pre-unlock contact leakage.
 */
export function filterLeakedContactText(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(PHONE_PATTERN, "[Contact Number Masked]")
    .replace(EMAIL_PATTERN, "[Email Masked]")
    .replace(SOCIAL_HANDLE_PATTERN, "[Handle Masked]");
}

/**
 * Masked seller introduction placeholder generator.
 */
export function getMaskedSellerLabel(sellerId: string): string {
  const shortId = sellerId.slice(-4).toUpperCase();
  return `ConMart Verified Supplier Depot (#DEPOT-${shortId})`;
}

/**
 * Masks a catalog listing before returning to public / buyer view.
 */
export function maskListingForPublic<
  T extends {
    seller?: { id?: string; name?: string; phone?: string; companyName?: string | null } | null;
    location?: string;
  }
>(listing: T): T {
  if (!listing) return listing;

  const sanitized = { ...listing };

  if (sanitized.seller) {
    const sellerId = sanitized.seller.id || "GEN";
    sanitized.seller = {
      id: sellerId,
      name: "Verified Depot Coordinator",
      companyName: getMaskedSellerLabel(sellerId),
      phone: undefined as unknown as string, // Completely scrubbed from JSON payload
    };
  }

  return sanitized;
}

export interface SanitizedEnquiryContact {
  isUnlocked: boolean;
  buyer: {
    name: string;
    companyName?: string | null;
    phone?: string;
  };
  seller: {
    name: string;
    companyName?: string | null;
    phone?: string;
    location: string;
  };
}

/**
 * Sanitizes enquiry details according to viewer role and unlock status.
 */
export function sanitizeEnquiryForViewer({
  enquiry,
  viewerUserId,
  viewerRole,
}: {
  enquiry: {
    id: string;
    buyerId: string;
    sellerId: string;
    buyer: { name: string; phone: string; companyName?: string | null };
    seller: { name: string; phone: string; companyName?: string | null };
    listing?: { location?: string } | null;
    unlockRecord?: { id: string } | null;
  };
  viewerUserId: string;
  viewerRole: string;
}): SanitizedEnquiryContact {
  const isParticipant =
    viewerUserId === enquiry.buyerId ||
    viewerUserId === enquiry.sellerId ||
    viewerRole === "ADMIN";

  if (!isParticipant) {
    // Strictly block unauthorized third parties from accessing contact data
    return {
      isUnlocked: false,
      buyer: {
        name: "Prospective Commercial Contractor",
        companyName: null,
        phone: undefined,
      },
      seller: {
        name: "Verified Depot Coordinator",
        companyName: getMaskedSellerLabel(enquiry.sellerId),
        phone: undefined,
        location: enquiry.listing?.location || "Addis Ababa",
      },
    };
  }

  const isUnlocked = !!enquiry.unlockRecord || viewerRole === "ADMIN";

  // If unlocked or admin: full introduction details revealed to verified participants
  if (isUnlocked) {
    return {
      isUnlocked: true,
      buyer: {
        name: enquiry.buyer.name,
        companyName: enquiry.buyer.companyName,
        phone: enquiry.buyer.phone,
      },
      seller: {
        name: enquiry.seller.name,
        companyName: enquiry.seller.companyName,
        phone: enquiry.seller.phone,
        location: enquiry.listing?.location || "Addis Ababa",
      },
    };
  }

  // Pre-unlock masking:
  const isBuyer = viewerUserId === enquiry.buyerId;

  return {
    isUnlocked: false,
    buyer: {
      name: isBuyer ? enquiry.buyer.name : "Prospective Commercial Contractor",
      companyName: isBuyer ? enquiry.buyer.companyName : null,
      phone: isBuyer ? enquiry.buyer.phone : undefined, // Scrubbed from seller before unlock
    },
    seller: {
      name: "Verified Depot Coordinator",
      companyName: getMaskedSellerLabel(enquiry.sellerId),
      phone: undefined, // Scrubbed from buyer before unlock
      location: enquiry.listing?.location || "Addis Ababa",
    },
  };
}
