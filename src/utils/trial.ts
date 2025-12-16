export const calculateTrialDaysRemaining = (trialEndsAt: string | null): number | null => {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt).getTime();
  if (Number.isNaN(end)) return null;

  const now = Date.now();
  const diffMs = end - now;

  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export type TrialUrgency = 'default' | 'warning' | 'critical';

export const getTrialUrgency = (daysRemaining: number | null): TrialUrgency => {
  if (daysRemaining === null) return 'default';
  if (daysRemaining <= 1) return 'critical';
  if (daysRemaining <= 3) return 'warning';
  return 'default';
};
