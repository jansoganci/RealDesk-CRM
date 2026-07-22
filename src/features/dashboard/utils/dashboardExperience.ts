export type DashboardExperience = 'first_visit' | 'empty_workspace' | 'daily_brief';

interface ResolveDashboardExperienceInput {
  propertyCount: number;
  leadCount: number;
  welcomeSeenAt: string | null;
}

export function resolveDashboardExperience({
  propertyCount,
  leadCount,
  welcomeSeenAt,
}: ResolveDashboardExperienceInput): DashboardExperience {
  if (propertyCount > 0 || leadCount > 0) {
    return 'daily_brief';
  }

  return welcomeSeenAt ? 'empty_workspace' : 'first_visit';
}
