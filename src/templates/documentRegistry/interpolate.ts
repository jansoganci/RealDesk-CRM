/**
 * Replace {{field}} tokens. A missing key becomes "—" (unknown value).
 * A key resolved to an explicit empty string is left blank — this is how
 * optional inline clauses (see optionalClause() in formatHelpers.ts) vanish
 * cleanly instead of leaving a stray separator character behind.
 */
export function interpolateTemplate(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = values[key];
    if (value == null) return '—';
    return value;
  });
}
