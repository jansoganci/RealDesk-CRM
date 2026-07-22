import { describe, expect, it } from 'vitest';
import { resolveDashboardExperience } from '../dashboardExperience';

describe('resolveDashboardExperience', () => {
  it('shows the first-visit welcome for an unseen empty workspace', () => {
    expect(
      resolveDashboardExperience({ propertyCount: 0, leadCount: 0, welcomeSeenAt: null })
    ).toBe('first_visit');
  });

  it('shows the returning empty workspace after welcome is acknowledged', () => {
    expect(
      resolveDashboardExperience({
        propertyCount: 0,
        leadCount: 0,
        welcomeSeenAt: '2026-07-19T20:00:00.000Z',
      })
    ).toBe('empty_workspace');
  });

  it.each([
    { propertyCount: 1, leadCount: 0 },
    { propertyCount: 0, leadCount: 1 },
    { propertyCount: 1, leadCount: 1 },
  ])('shows the daily brief when workspace data exists', ({ propertyCount, leadCount }) => {
    expect(
      resolveDashboardExperience({ propertyCount, leadCount, welcomeSeenAt: null })
    ).toBe('daily_brief');
  });
});
