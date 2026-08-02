import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, ArrowRight, Calendar, DollarSign, Home } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { remindersService, ReminderWithDetails } from '@/lib/serviceProxy';

interface RemindersSectionProps {
  reminders: ReminderWithDetails[];
}

export function RemindersSection({ reminders }: RemindersSectionProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  if (reminders.length === 0) {
    return null;
  }

  return (
    <Card className="animate-fade-in border-warning/30 bg-gradient-to-br from-warning/15 to-card shadow-luxury backdrop-blur-sm transition-all duration-300 hover:shadow-luxury-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 md:p-3 bg-secondary rounded-xl shadow-gold">
              <Bell className="h-4 w-4 text-secondary-foreground md:h-5 md:w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-warning md:text-lg">{t('reminders.title')}</CardTitle>
              <CardDescription className="text-xs font-medium text-foreground/80 md:text-sm">
                {t('reminders.description', { count: reminders.length, s: reminders.length > 1 ? 's' : '' })}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/reminders')}
            className="self-start border-warning/40 px-3 transition-all hover:border-warning/60 hover:bg-warning/15 sm:self-auto md:px-4"
          >
            <span className="hidden sm:inline">{t('reminders.viewAll')}</span>
            <span className="sm:hidden text-xs">{t('reminders.viewAll')}</span>
            <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 md:space-y-3">
        {reminders.slice(0, 3).map((reminder) => {
          const urgency = remindersService.getReminderUrgencyCategory(reminder.days_until_end);
          return (
            <div
              key={reminder.id}
              className="flex flex-col gap-2 rounded-xl border border-warning/30 bg-card p-3 transition-all duration-200 hover:border-warning/50 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between sm:gap-0 md:p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                  <Home className="h-3.5 w-3.5 flex-shrink-0 text-warning md:h-4 md:w-4" />
                  <p className="font-semibold text-foreground text-sm md:text-base line-clamp-1">{reminder.property?.address}</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{t('reminders.contractEnds')}: {format(new Date(reminder.end_date), 'MMM dd, yyyy')}</span>
                  </span>
                  {reminder.expected_new_rent && (
                    <span className="flex items-center gap-1 font-medium text-warning">
                      <DollarSign className="h-3 w-3 flex-shrink-0" />
                      ${reminder.rent_amount?.toFixed(0)} → ${reminder.expected_new_rent.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
              <Badge
                className={
                  urgency === 'urgent'
                    ? 'self-start bg-destructive text-xs text-destructive-foreground shadow-lg sm:self-auto md:text-sm'
                    : urgency === 'soon'
                      ? 'bg-secondary text-secondary-foreground shadow-lg text-xs md:text-sm self-start sm:self-auto'
                      : 'self-start bg-primary text-xs text-primary-foreground shadow-lg sm:self-auto md:text-sm'
                }
              >
                {reminder.days_until_end} days
              </Badge>
            </div>
          );
        })}
        {reminders.length > 3 && (
          <p className={`pt-2 text-center text-sm ${COLORS.warning.textDark}`}>
            {t('reminders.moreReminders', { count: reminders.length - 3, s: reminders.length - 3 > 1 ? 's' : '' })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
