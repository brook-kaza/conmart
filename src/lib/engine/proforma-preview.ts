// =============================================================================
// ConMart — Client-Safe Proforma Preview Calculator
// =============================================================================
// Pure function for client-side price preview calculations.
// NO database imports, NO server-only code — safe for Client Components.
//
// The result is ALWAYS re-validated on the server via calculateProforma()
// before an order is committed.
// =============================================================================

/**
 * Rounds a number to exactly 2 decimal places.
 */
function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Client-side preview calculation for the live pricing calculator UI.
 *
 * This is a pure function with NO database access — it takes the unit price
 * directly and calculates the breakdown. Used for instant UI feedback.
 *
 * @param qty - Requested quantity
 * @param unitPrice - Per-unit price from the selected tier
 * @param platformFeePercent - Platform fee percentage (default 0 under contact-unlock model)
 * @param vatRatePercent - VAT rate percentage (default 15)
 * @returns Preview breakdown object
 */
export function calculateProformaPreview(
  qty: number,
  unitPrice: number,
  platformFeePercent: number = 0,
  vatRatePercent: number = 15
): {
  baseSubtotal: number;
  platformFee: number;
  tax: number;
  grandTotal: number;
} {
  const baseSubtotal = roundToTwoDecimals(qty * unitPrice);
  const platformFee = roundToTwoDecimals(
    baseSubtotal * (platformFeePercent / 100)
  );
  const tax = roundToTwoDecimals(
    (baseSubtotal + platformFee) * (vatRatePercent / 100)
  );
  const grandTotal = roundToTwoDecimals(baseSubtotal + platformFee + tax);

  return { baseSubtotal, platformFee, tax, grandTotal };
}
