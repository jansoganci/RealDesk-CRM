/**
 * Replace {{field}} tokens. Unknown keys become "—".
 */
export function interpolateTemplate(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = values[key];
    if (value == null || value === '') return '—';
    return value;
  });
}
