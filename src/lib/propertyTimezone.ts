/**
 * US property state → default IANA timezone and display strings for lease/PDF copy.
 * One zone per state (majority / capital-based); split states use the most common zone for CRM defaults.
 */

/** Two-letter US state / DC code → default IANA timezone id. */
export const STATE_TO_IANA_TIMEZONE: Readonly<Record<string, string>> = {
  AL: 'America/Chicago',
  AK: 'America/Anchorage',
  AZ: 'America/Phoenix',
  AR: 'America/Chicago',
  CA: 'America/Los_Angeles',
  CO: 'America/Denver',
  CT: 'America/New_York',
  DE: 'America/New_York',
  DC: 'America/New_York',
  FL: 'America/New_York',
  GA: 'America/New_York',
  HI: 'Pacific/Honolulu',
  ID: 'America/Boise',
  IL: 'America/Chicago',
  IN: 'America/Indiana/Indianapolis',
  IA: 'America/Chicago',
  KS: 'America/Chicago',
  KY: 'America/New_York',
  LA: 'America/Chicago',
  ME: 'America/New_York',
  MD: 'America/New_York',
  MA: 'America/New_York',
  MI: 'America/Detroit',
  MN: 'America/Chicago',
  MS: 'America/Chicago',
  MO: 'America/Chicago',
  MT: 'America/Denver',
  NE: 'America/Chicago',
  NV: 'America/Los_Angeles',
  NH: 'America/New_York',
  NJ: 'America/New_York',
  NM: 'America/Denver',
  NY: 'America/New_York',
  NC: 'America/New_York',
  ND: 'America/Chicago',
  OH: 'America/New_York',
  OK: 'America/Chicago',
  OR: 'America/Los_Angeles',
  PA: 'America/New_York',
  RI: 'America/New_York',
  SC: 'America/New_York',
  SD: 'America/Chicago',
  TN: 'America/Chicago',
  TX: 'America/Chicago',
  UT: 'America/Denver',
  VT: 'America/New_York',
  VA: 'America/New_York',
  WA: 'America/Los_Angeles',
  WV: 'America/New_York',
  WI: 'America/Chicago',
  WY: 'America/Denver',
};

const FALLBACK_IANA = 'America/New_York';

/**
 * Normalize "ca" → "CA"; unknown codes fall back to Eastern.
 */
export function getPropertyTimezone(stateCode: string | null | undefined): string {
  if (!stateCode || typeof stateCode !== 'string') return FALLBACK_IANA;
  const upper = stateCode.trim().toUpperCase();
  return STATE_TO_IANA_TIMEZONE[upper] ?? FALLBACK_IANA;
}

/** Sprint 6B alias — same behavior as `getPropertyTimezone`. */
export const getTimezoneFromState = getPropertyTimezone;

/**
 * Returns compact US timezone abbreviations used in legal PDF copy.
 * Examples: ET, CT, MT, PT
 */
export function getTimezoneAbbreviation(ianaZone: string): string {
  const zone = (ianaZone || '').trim();
  if (!zone) return 'ET';
  if (
    zone.includes('New_York') ||
    zone.includes('Detroit') ||
    zone.includes('Indiana')
  ) {
    return 'ET';
  }
  if (zone.includes('Chicago')) return 'CT';
  if (
    zone.includes('Denver') ||
    zone.includes('Boise') ||
    zone.includes('Phoenix')
  ) {
    return 'MT';
  }
  if (zone.includes('Los_Angeles')) return 'PT';
  if (zone.includes('Anchorage')) return 'AKT';
  if (zone.includes('Honolulu')) return 'HST';

  try {
    const short = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'short',
    })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value;
    if (short && /^[A-Z]{2,4}$/.test(short)) return short;
  } catch {
    /* ignore */
  }
  return 'ET';
}

/**
 * Short label for UI, e.g. "Central Time (CT)".
 */
export function getTimezoneDisplayLabel(iana: string, locale: string = 'en-US'): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone: iana,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    const generic = new Intl.DateTimeFormat(locale, {
      timeZone: iana,
      timeZoneName: 'longGeneric',
    })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value;
    if (generic && name) {
      return `${generic} (${name})`;
    }
    return generic ?? name ?? iana;
  } catch {
    return iana;
  }
}

function getGenericTimezoneName(iana: string, locale: string): string {
  try {
    return (
      new Intl.DateTimeFormat(locale, {
        timeZone: iana,
        timeZoneName: 'longGeneric',
      })
        .formatToParts(new Date())
        .find((p) => p.type === 'timeZoneName')?.value ?? 'Local Time'
    );
  } catch {
    return 'Local Time';
  }
}

/**
 * PDF-style phrase: "3:45 PM local time at the Property (Central Time)".
 */
export function formatLocalTimeAtProperty(
  date: Date,
  iana: string,
  locale: string = 'en-US',
): string {
  const time = new Intl.DateTimeFormat(locale, {
    timeZone: iana,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
  const tzShort =
    new Intl.DateTimeFormat(locale, {
      timeZone: iana,
      timeZoneName: 'longGeneric',
    })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'local time';
  return `${time} local time at the Property (${tzShort})`;
}

/**
 * Sprint 6B alias-format helper.
 * Example: "3:00 PM local time at the Property (Central Time — CT)"
 */
export function formatTimeWithZone(
  time: string,
  ianaZone: string,
  locale: string = 'en-US',
): string {
  const generic = getGenericTimezoneName(ianaZone, locale);
  const abbr = getTimezoneAbbreviation(ianaZone);
  return `${time} local time at the Property (${generic} — ${abbr})`;
}
