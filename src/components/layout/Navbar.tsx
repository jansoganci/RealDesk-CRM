import { Menu, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '@/config/colors';
import { ROUTES } from '@/config/constants';
import { useBilling } from '@/contexts/BillingContext';
import { calculateTrialDaysRemaining } from '@/utils/trial';
import { AlertCenter } from '@/features/deals/components/AlertCenter';

interface NavbarProps {
  title: string;
  onMenuClick: () => void;
}

export const Navbar = ({ title, onMenuClick }: NavbarProps) => {
  const { t: tBilling } = useTranslation('billing');
  const navigate = useNavigate();
  const { billingStatus } = useBilling();
  const trialDaysRemaining = calculateTrialDaysRemaining(billingStatus?.trialEndsAt ?? null);
  const showTrialBadge = billingStatus?.isTrial;

  return (
    <header className={`sticky top-0 z-30 ${COLORS.card.bg} border-b ${COLORS.border.DEFAULT_class} shadow-sm`}>
      <div className="flex items-center justify-between gap-4 px-4 h-[72px] lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className={`text-xl font-semibold ${COLORS.gray.text900}`}>{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {showTrialBadge && (
            <button
              className="hidden sm:flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-900 transition hover:bg-blue-100"
              onClick={() => navigate(ROUTES.PRICING)}
              aria-label={tBilling('trialReminder.badge', { count: trialDaysRemaining ?? 0 })}
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {tBilling('trialReminder.badge', { count: trialDaysRemaining ?? 0 })}
              </span>
            </button>
          )}

          <AlertCenter />
        </div>
      </div>
    </header>
  );
};
