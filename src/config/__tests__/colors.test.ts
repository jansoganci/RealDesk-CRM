import { describe, expect, it } from 'vitest';
import { COLORS, getStatusBadgeClasses } from '../colors';

describe('property status badge colors', () => {
  it('uses warning for empty rental properties', () => {
    expect(getStatusBadgeClasses('empty')).toBe(
      'bg-warning text-warning-foreground'
    );
  });

  it('uses info for occupied rental properties', () => {
    expect(getStatusBadgeClasses('occupied')).toBe(
      'bg-info text-info-foreground'
    );
  });

  it('keeps available properties on the success semantic', () => {
    expect(getStatusBadgeClasses('available')).toBe(
      'bg-success text-success-foreground'
    );
  });

  it('does not duplicate CSS token values as hex colors', () => {
    expect(JSON.stringify(COLORS)).not.toMatch(/#[\da-f]{3,8}/i);
  });
});
