export const DEFAULT_ALLOWED_DOMAIN = 'hbplus.fit';
export const DEFAULT_FIXED_ADMIN_EMAIL = 'admin@hbplus.fit';
export const DEFAULT_FIXED_ADMIN_PASSWORD = 'Admin@123';

/**
 * Exact error message required when a user attempts to sign in
 * with an email outside the configured company domain.
 */
export const UNAUTHORIZED_DOMAIN_ERROR =
  'Access restricted. Please login using your official domain email.';

/**
 * Normalizes a domain string (trims whitespace, removes leading "@", lowercases).
 */
export function normalizeDomain(rawDomain: string | undefined | null): string {
  if (!rawDomain) {
    return DEFAULT_ALLOWED_DOMAIN;
  }
  const cleaned = rawDomain.trim().replace(/^@+/, '').toLowerCase();
  return cleaned.length > 0 ? cleaned : DEFAULT_ALLOWED_DOMAIN;
}

/**
 * Reads the allowed corporate email domain from EXPO_PUBLIC_ALLOWED_DOMAIN,
 * defaulting to "hbplus.fit".
 */
export function getAllowedDomain(): string {
  return normalizeDomain(process.env.EXPO_PUBLIC_ALLOWED_DOMAIN);
}

/**
 * Returns the fixed workspace admin credentials (configurable via env vars).
 */
export function getFixedAdminConfig(): { email: string; password: string } {
  const email = (
    process.env.EXPO_PUBLIC_FIXED_ADMIN_EMAIL || DEFAULT_FIXED_ADMIN_EMAIL
  )
    .trim()
    .toLowerCase();
  const password =
    process.env.EXPO_PUBLIC_FIXED_ADMIN_PASSWORD ||
    DEFAULT_FIXED_ADMIN_PASSWORD;
  return { email, password };
}

/**
 * Checks whether an email matches the permanent fixed admin email.
 */
export function isFixedAdminEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return email.trim().toLowerCase() === getFixedAdminConfig().email;
}

/**
 * Strictly validates that an email address belongs to the allowed domain
 * (or matches the permanent fixed admin account).
 * Prevents substring / suffix spoofing (e.g., user@fakehbplus.fit or user@hbplus.fit.evil.com).
 */
export function isEmailAllowed(
  email: string | null | undefined,
  allowedDomain: string = getAllowedDomain()
): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmed = email.trim().toLowerCase();
  if (isFixedAdminEmail(trimmed)) {
    return true;
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) {
    return false;
  }

  return domainPart === normalizeDomain(allowedDomain);
}

/**
 * Formats the domain policy chip label shown on the login screen.
 */
export function formatAllowedDomainChip(
  allowedDomain: string = getAllowedDomain()
): string {
  return `Allowed domain: @${normalizeDomain(allowedDomain)}`;
}
