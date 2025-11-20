/**
 * Address Normalization Service
 * Component-based address handling for accurate matching
 */

export interface AddressComponents {
  mahalle: string;
  cadde_sokak: string;
  bina_no: string;
  daire_no?: string;
  ilce: string;
  il: string;
}

/**
 * Normalize address for matching
 * Converts components to lowercase, standardized format
 *
 * @param components - Address components
 * @returns Normalized address string for matching
 *
 * @example
 * normalizeAddress({
 *   mahalle: 'Moda Mahallesi',
 *   cadde_sokak: 'Atatürk Caddesi',
 *   bina_no: '123',
 *   daire_no: '5',
 *   ilce: 'Kadıköy',
 *   il: 'İstanbul'
 * })
 * // Returns: "moda mah atatürk cad 123 5 kadıköy istanbul"
 */
export function normalizeAddress(components: AddressComponents): string {
  return [
    components.mahalle,
    components.cadde_sokak,
    components.bina_no,
    components.daire_no,
    components.ilce,
    components.il
  ]
    .filter(Boolean) // Remove undefined/empty
    .join(' ')
    .toLowerCase()
    // Standardize Turkish address terms
    .replace(/mahallesi/g, 'mah')
    .replace(/caddesi/g, 'cad')
    .replace(/sokak/g, 'sok')
    .replace(/sokağı/g, 'sok')
    .replace(/bulvarı/g, 'blv')
    .replace(/bulvar/g, 'blv')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate full address for display
 * Creates human-readable address string
 *
 * @param components - Address components
 * @returns Formatted full address
 *
 * @example
 * generateFullAddress({
 *   mahalle: 'Moda Mahallesi',
 *   cadde_sokak: 'Atatürk Caddesi',
 *   bina_no: '123',
 *   daire_no: '5',
 *   ilce: 'Kadıköy',
 *   il: 'İstanbul'
 * })
 * // Returns: "Moda Mahallesi Atatürk Caddesi No:123 D:5, Kadıköy/İstanbul"
 */
export function generateFullAddress(components: AddressComponents): string {
  const parts: string[] = [
    components.mahalle,
    components.cadde_sokak,
    `No:${components.bina_no}`
  ];

  if (components.daire_no) {
    parts.push(`D:${components.daire_no}`);
  }

  const street = parts.join(' ');
  const location = `${components.ilce}/${components.il}`;

  return `${street}, ${location}`;
}

/**
 * Parse full address into components
 * Attempts to extract components from full address string
 * Note: This is a simple parser and may not work for all formats
 *
 * @param fullAddress - Full address string
 * @returns Partial address components
 *
 * @example
 * parseAddress('Moda Mahallesi Atatürk Caddesi No:123 D:5, Kadıköy/İstanbul')
 * // Returns: { ilce: 'Kadıköy', il: 'İstanbul' }
 * // (Full parsing requires more complex logic)
 */
export function parseAddress(fullAddress: string): Partial<AddressComponents> {
  const parts = fullAddress.split(',');

  if (parts.length < 2) {
    return {}; // Invalid format
  }

  const streetPart = parts[0].trim();
  const locationPart = parts[1].trim();

  // Parse location (ilce/il)
  const locationMatch = locationPart.match(/(.+)\/(.+)/);
  if (!locationMatch) {
    return {};
  }

  const [, ilce, il] = locationMatch;

  // Try to parse building/apartment numbers
  const binaMatch = streetPart.match(/No:(\d+)/);
  const daireMatch = streetPart.match(/D:(\d+)/);

  return {
    ilce: ilce.trim(),
    il: il.trim(),
    bina_no: binaMatch ? binaMatch[1] : undefined,
    daire_no: daireMatch ? daireMatch[1] : undefined
  };
}

/**
 * Validate address components
 * Ensures all required fields are present
 *
 * @param components - Address components to validate
 * @returns true if all required fields present
 */
export function isValidAddress(components: Partial<AddressComponents>): components is AddressComponents {
  return !!(
    components.mahalle &&
    components.cadde_sokak &&
    components.bina_no &&
    components.ilce &&
    components.il
  );
}

/**
 * Compare two addresses for similarity
 * Uses normalized addresses for comparison
 *
 * @param addr1 - First address components
 * @param addr2 - Second address components
 * @returns true if addresses match
 */
export function addressesMatch(addr1: AddressComponents, addr2: AddressComponents): boolean {
  return normalizeAddress(addr1) === normalizeAddress(addr2);
}

/**
 * Get short address for display in lists
 * Returns abbreviated version
 *
 * @param components - Address components
 * @returns Short address string
 *
 * @example
 * getShortAddress({...})
 * // Returns: "Moda Mah. No:123/5, Kadıköy"
 */
export function getShortAddress(components: AddressComponents): string {
  const mahalle = components.mahalle.replace('Mahallesi', 'Mah.');
  const building = components.daire_no
    ? `No:${components.bina_no}/${components.daire_no}`
    : `No:${components.bina_no}`;

  return `${mahalle} ${building}, ${components.ilce}`;
}
