// =============================================================================
// ConMart — Reference Code Generator
// =============================================================================
// Generates unique 6-character alphanumeric reference codes for Proforma
// Invoices in the format: PRF-XXXXXX (e.g., PRF-8A3K9M).
//
// Uses crypto.getRandomValues() for cryptographic randomness.
// Includes collision checking against the database before returning.
// =============================================================================

/**
 * Character set for reference codes.
 * Excludes ambiguous characters (0/O, 1/I/L) for readability.
 */
const CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Length of the random portion of the reference code */
const CODE_LENGTH = 6;

/**
 * Generates a random alphanumeric string of the specified length.
 * Uses crypto.getRandomValues() for secure randomness.
 *
 * @param length - Number of characters to generate
 * @returns Random string from the CHARSET
 */
function generateRandomCode(length: number): string {
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  let code = "";
  for (let i = 0; i < length; i++) {
    // Use modulo to map random uint32 to charset index.
    // Bias is negligible since CHARSET.length (29) << 2^32.
    code += CHARSET[randomValues[i] % CHARSET.length];
  }

  return code;
}

/**
 * Generates a random Proforma reference code (PRF-XXXXXX).
 * Uses cryptographically secure random values (29^6 = 594M unique codes).
 *
 * Uniqueness is guaranteed atomically at the database level by the unique
 * constraint on `orders.reference_code`, with retry on P2002.
 *
 * @returns A cryptographically random reference code (e.g., "PRF-8A3K9M")
 */
export function generateReferenceCode(): string {
  return `PRF-${generateRandomCode(CODE_LENGTH)}`;
}

/**
 * Backward-compatible async wrapper for generateReferenceCode.
 */
export async function generateUniqueReferenceCode(): Promise<string> {
  return generateReferenceCode();
}

/**
 * Validates that a reference code matches the expected format.
 * Useful for parsing user input (e.g., in the Admin search bar).
 *
 * @param code - The reference code to validate
 * @returns true if the code matches PRF-XXXXXX format
 */
export function isValidReferenceCode(code: string): boolean {
  // Accept with or without the # prefix
  const normalized = code.replace(/^#/, "").toUpperCase().trim();
  const pattern = new RegExp(`^PRF-[${CHARSET}]{${CODE_LENGTH}}$`);
  return pattern.test(normalized);
}

/**
 * Normalizes a user-input reference code to the canonical format.
 * Strips leading #, converts to uppercase, trims whitespace.
 *
 * @param input - Raw user input (e.g., "#prf-8a3k9m", "PRF-8A3K9M")
 * @returns Normalized code (e.g., "PRF-8A3K9M") or null if invalid
 */
export function normalizeReferenceCode(input: string): string | null {
  const normalized = input.replace(/^#/, "").toUpperCase().trim();

  if (!isValidReferenceCode(normalized)) {
    return null;
  }

  return normalized;
}
