import { describe, expect, it } from 'vitest';

import { interpolateTemplate } from '../interpolate';

describe('interpolateTemplate', () => {
  it('replaces a token with its value', () => {
    expect(interpolateTemplate('Hello {{name}}.', { name: 'Alex' })).toBe('Hello Alex.');
  });

  it('replaces a missing key with an em-dash', () => {
    expect(interpolateTemplate('Value: {{unknown}}.', {})).toBe('Value: —.');
  });

  it('replaces a null/undefined-resolved key with an em-dash', () => {
    // Record<string, string> values are always strings at the type level, but
    // callers do sometimes hand through null/undefined at runtime — guard stays.
    const values = { maybe: undefined } as unknown as Record<string, string>;
    expect(interpolateTemplate('Value: {{maybe}}.', values)).toBe('Value: —.');
  });

  it('leaves an explicit empty-string value blank, with no separator inserted', () => {
    // This is the fix for issue 3/4a: optional inline clauses (name suffixes,
    // trailing time clauses) resolve to '' when absent and must vanish
    // completely rather than being coerced into a stray em-dash.
    expect(interpolateTemplate('{{name}}{{suffix_block}}.', { name: 'Alex Landlord', suffix_block: '' })).toBe(
      'Alex Landlord.',
    );
  });

  it('does not double up when two adjacent tokens both resolve to empty string', () => {
    expect(
      interpolateTemplate('{{name}}{{block_a}}{{block_b}}.', { name: 'Taylor Tenant', block_a: '', block_b: '' }),
    ).toBe('Taylor Tenant.');
  });
});
