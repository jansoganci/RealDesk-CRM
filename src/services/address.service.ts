/**
 * Address Normalization Service
 * US address handling with validation and formatting
 */

export interface AddressComponents {
  street_address: string;
  unit?: string;
  city: string;
  state: string;
  zip_code: string;
}

/**
 * US States and DC
 * All 50 states plus District of Columbia with 2-letter codes
 */
export const US_STATES: Array<{ code: string; name: string }> = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

/**
 * Normalize address string for display
 * Trims whitespace and normalizes capitalization
 *
 * @param input - Raw address string
 * @returns Normalized address string
 *
 * @example
 * normalizeAddress('  123 MAIN ST  ')
 * // Returns: "123 Main St"
 */
export function normalizeAddress(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate full address for display
 * Creates formatted US address string
 *
 * @param components - Address components
 * @returns Formatted full address
 *
 * @example
 * generateFullAddress({
 *   street_address: '123 Main St',
 *   unit: 'Apt 4B',
 *   city: 'Austin',
 *   state: 'TX',
 *   zip_code: '78701'
 * })
 * // Returns: "123 Main St, Apt 4B, Austin, TX 78701"
 *
 * @example
 * generateFullAddress({
 *   street_address: '456 Oak Ave',
 *   city: 'Portland',
 *   state: 'OR',
 *   zip_code: '97201'
 * })
 * // Returns: "456 Oak Ave, Portland, OR 97201"
 */
export function generateFullAddress(components: AddressComponents): string {
  const parts: string[] = [components.street_address];

  if (components.unit) {
    parts.push(components.unit);
  }

  parts.push(`${components.city}, ${components.state} ${components.zip_code}`);

  return parts.join(', ');
}

/**
 * Parse full address into components
 * Best-effort extraction of address components from single-line string
 *
 * @param fullAddress - Full address string
 * @returns Partial address components
 *
 * @example
 * parseAddress('123 Main St, Apt 4B, Austin, TX 78701')
 * // Returns: {
 * //   street_address: '123 Main St',
 * //   unit: 'Apt 4B',
 * //   city: 'Austin',
 * //   state: 'TX',
 * //   zip_code: '78701'
 * // }
 *
 * @example
 * parseAddress('456 Oak Ave, Portland OR 97201-1234')
 * // Returns: {
 * //   street_address: '456 Oak Ave',
 * //   city: 'Portland',
 * //   state: 'OR',
 * //   zip_code: '97201-1234'
 * // }
 */
export function parseAddress(fullAddress: string): Partial<AddressComponents> {
  const result: Partial<AddressComponents> = {};

  // Extract ZIP code (5 or 5+4 format)
  const zipMatch = fullAddress.match(/\b(\d{5}(?:-\d{4})?)\b/);
  if (zipMatch) {
    result.zip_code = zipMatch[1];
  }

  // Extract state (2-letter code before ZIP)
  const stateMatch = fullAddress.match(/\b([A-Z]{2})\s+\d{5}/i);
  if (stateMatch) {
    result.state = stateMatch[1].toUpperCase();
  }

  // Split by commas
  const parts = fullAddress.split(',').map(p => p.trim());

  if (parts.length >= 1) {
    // First part is street address
    result.street_address = parts[0];
  }

  if (parts.length >= 3) {
    // Middle part might be unit (if it contains apt, suite, unit, etc.)
    const middlePart = parts[1];
    if (/\b(apt|apartment|suite|unit|ste|#)\b/i.test(middlePart)) {
      result.unit = middlePart;
    }

    // Last part contains city, state, zip
    const lastPart = parts[parts.length - 1];
    const cityStateMatch = lastPart.match(/^(.+?)\s+([A-Z]{2})\s+\d{5}/i);
    if (cityStateMatch) {
      result.city = cityStateMatch[1].trim();
    }
  } else if (parts.length === 2) {
    // Format: "street, city state zip"
    const lastPart = parts[1];
    const cityStateMatch = lastPart.match(/^(.+?)\s+([A-Z]{2})\s+\d{5}/i);
    if (cityStateMatch) {
      result.city = cityStateMatch[1].trim();
    }
  }

  return result;
}

/**
 * Validate address components
 * Ensures all required fields are present and valid
 *
 * @param components - Address components to validate
 * @returns true if all required fields are valid
 *
 * @example
 * isValidAddress({
 *   street_address: '123 Main St',
 *   city: 'Austin',
 *   state: 'TX',
 *   zip_code: '78701'
 * })
 * // Returns: true
 *
 * @example
 * isValidAddress({
 *   street_address: '12',
 *   city: 'Austin',
 *   state: 'XX',
 *   zip_code: '787'
 * })
 * // Returns: false
 */
export function isValidAddress(components: Partial<AddressComponents>): components is AddressComponents {
  return !!(
    components.street_address &&
    components.street_address.length >= 3 &&
    components.city &&
    components.state &&
    isValidState(components.state) &&
    components.zip_code &&
    isValidZipCode(components.zip_code)
  );
}

/**
 * Compare two addresses for equality
 * Case-insensitive comparison of all fields
 *
 * @param a - First address components
 * @param b - Second address components
 * @returns true if addresses match
 *
 * @example
 * addressesMatch(
 *   { street_address: '123 Main St', city: 'Austin', state: 'TX', zip_code: '78701' },
 *   { street_address: '123 MAIN ST', city: 'austin', state: 'tx', zip_code: '78701' }
 * )
 * // Returns: true
 */
export function addressesMatch(a: AddressComponents, b: AddressComponents): boolean {
  return (
    a.street_address.toLowerCase() === b.street_address.toLowerCase() &&
    (a.unit || '').toLowerCase() === (b.unit || '').toLowerCase() &&
    a.city.toLowerCase() === b.city.toLowerCase() &&
    a.state.toUpperCase() === b.state.toUpperCase() &&
    a.zip_code === b.zip_code
  );
}

/**
 * Get short address for display in lists
 * Returns abbreviated version without ZIP or unit
 *
 * @param components - Address components
 * @returns Short address string
 *
 * @example
 * getShortAddress({
 *   street_address: '123 Main St',
 *   unit: 'Apt 4B',
 *   city: 'Austin',
 *   state: 'TX',
 *   zip_code: '78701'
 * })
 * // Returns: "123 Main St, Austin TX"
 */
export function getShortAddress(components: AddressComponents): string {
  return `${components.street_address}, ${components.city} ${components.state}`;
}

/**
 * Validate ZIP code format
 * Checks for 5-digit or 5+4 format
 *
 * @param zip - ZIP code string
 * @returns true if valid ZIP format
 *
 * @example
 * isValidZipCode('78701')
 * // Returns: true
 *
 * @example
 * isValidZipCode('78701-1234')
 * // Returns: true
 *
 * @example
 * isValidZipCode('787')
 * // Returns: false
 */
export function isValidZipCode(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip);
}

/**
 * Validate US state code
 * Checks if state code exists in US_STATES list
 *
 * @param state - State code (2 letters)
 * @returns true if valid state code
 *
 * @example
 * isValidState('TX')
 * // Returns: true
 *
 * @example
 * isValidState('tx')
 * // Returns: true
 *
 * @example
 * isValidState('XX')
 * // Returns: false
 */
export function isValidState(state: string): boolean {
  const upperState = state.toUpperCase();
  return US_STATES.some(s => s.code === upperState);
}
