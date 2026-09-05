// =============================================================================
// ConMart — Shared Type Definitions & Constants
// =============================================================================
// Central type definitions mirroring the Prisma schema enums and domain types.
// Localized for the Ethiopian construction market.
// =============================================================================

// =============================================================================
// ETHIOPIAN LOCALE CONSTANTS
// =============================================================================

/** Ethiopian Birr currency code */
export const CURRENCY_CODE = "ETB" as const;

/** Ethiopian Birr symbol (commonly used in pricing displays) */
export const CURRENCY_SYMBOL = "Br" as const;

/** Ethiopia country calling code */
export const COUNTRY_CODE = "+251" as const;

/**
 * Formats a number as Ethiopian Birr currency.
 * Examples:
 *   formatETB(1500)    → "ETB 1,500.00"
 *   formatETB(1500, true) → "Br 1,500.00"
 *
 * @param amount - The numeric amount to format
 * @param useSymbol - If true, uses "Br" instead of "ETB"
 * @returns Formatted currency string
 */
export function formatETB(amount: number, useSymbolOrLocale: boolean | string = false): string {
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (useSymbolOrLocale === "am") {
    return `${formatted} ብር`;
  }
  if (useSymbolOrLocale === true) {
    return `${CURRENCY_SYMBOL} ${formatted}`;
  }
  return `ETB ${formatted}`;
}

/**
 * Formats a compact ETB display for tight spaces (e.g., table cells).
 * Examples:
 *   formatETBCompact(1500) → "1,500.00"
 *
 * @param amount - The numeric amount
 * @returns Formatted number without currency prefix
 */
export function formatETBCompact(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// =============================================================================
// ENUM MIRRORS (safe for client-side imports)
// =============================================================================

/** User roles in the marketplace */
export const USER_ROLES = ["BUYER", "SELLER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Standard construction material units (Ethiopian market) */
export const PRODUCT_UNITS = ["BAG", "QUINTAL", "TON", "PIECE", "M3"] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

/** Human-readable labels for product units */
export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  BAG: "Bags",
  QUINTAL: "Quintals",
  TON: "Tonnes",
  PIECE: "Pieces",
  M3: "Cubic Meters (m³)",
} as const;

/** Singular labels for units (used in per-unit pricing) */
export const PRODUCT_UNIT_SINGULAR: Record<ProductUnit, string> = {
  BAG: "bag",
  QUINTAL: "quintal",
  TON: "tonne",
  PIECE: "piece",
  M3: "m³",
} as const;

/** Order lifecycle states — strict forward-only progression */
export const ORDER_STATUSES = [
  "GENERATED",
  "CALL_RECEIVED",
  "PROCURED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Human-readable labels for order statuses */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  GENERATED: "Proforma Generated",
  CALL_RECEIVED: "Call Received",
  PROCURED: "Material Procured",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
} as const;

/**
 * Maps each order status to the next valid status in the state machine.
 * `null` means the status is terminal (no further progression).
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus | null> =
  {
    GENERATED: "CALL_RECEIVED",
    CALL_RECEIVED: "PROCURED",
    PROCURED: "IN_TRANSIT",
    IN_TRANSIT: "DELIVERED",
    DELIVERED: null,
    CANCELLED: null,
  } as const;

// =============================================================================
// PLATFORM CONFIGURATION CONSTANTS
// =============================================================================

/**
 * Platform fee percentage — read from environment variable at runtime.
 * Falls back to 10% if not configured.
 */
export function getPlatformFeePercent(): number {
  const envValue = process.env.PLATFORM_FEE_PERCENT;
  if (envValue === undefined || envValue === "") {
    return 10;
  }
  const parsed = parseFloat(envValue);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(
      `Invalid PLATFORM_FEE_PERCENT: "${envValue}". Must be a number between 0 and 100.`
    );
  }
  return parsed;
}

/**
 * VAT rate percentage — read from environment variable at runtime.
 * Falls back to 15% (Ethiopia's standard VAT rate).
 */
export function getVatRatePercent(): number {
  const envValue = process.env.VAT_RATE_PERCENT;
  if (envValue === undefined || envValue === "") {
    return 15;
  }
  const parsed = parseFloat(envValue);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(
      `Invalid VAT_RATE_PERCENT: "${envValue}". Must be a number between 0 and 100.`
    );
  }
  return parsed;
}

// =============================================================================
// PROFORMA CALCULATION TYPES
// =============================================================================

/** Input to the proforma calculation engine */
export interface ProformaCalculationInput {
  listingId: string;
  requestedQty: number;
}

/** Successful result from the proforma calculation engine */
export interface ProformaCalculationResult {
  /** The price tier that was matched */
  tierId: string;
  /** Per-unit price from the matched tier */
  unitPrice: number;
  /** Requested quantity */
  qty: number;
  /** qty × unitPrice */
  baseSubtotal: number;
  /** baseSubtotal × (platformFeePercent / 100) */
  platformFee: number;
  /** (baseSubtotal + platformFee) × (vatRate / 100) */
  tax: number;
  /** baseSubtotal + platformFee + tax */
  grandTotal: number;
  /** Listing ID for reference */
  listingId: string;
  /** Seller ID (owner of the listing) */
  sellerId: string;
}

/** Error codes from the proforma calculation engine */
export const PROFORMA_ERROR_CODES = [
  "NO_MATCHING_TIER",
  "TIER_EXPIRED",
  "LISTING_INACTIVE",
  "LISTING_NOT_FOUND",
  "INVALID_QUANTITY",
] as const;
export type ProformaErrorCode = (typeof PROFORMA_ERROR_CODES)[number];

/** Error result from the proforma calculation engine */
export interface ProformaCalculationError {
  code: ProformaErrorCode;
  message: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/** Discriminated union for type-safe API responses */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
