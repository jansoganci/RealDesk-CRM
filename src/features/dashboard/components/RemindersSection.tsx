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
    <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-amber-200/50 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 backdrop-blur-sm animate-fade-in">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 md:p-3 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-xl shadow-gold">
              <Bell className={`h-4 w-4 md:h-5 md:w-5 ${COLORS.text.white}`} />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-amber-900 dark:text-amber-100 font-bold text-base md:text-lg">{t('reminders.title')}</CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300 font-medium text-xs md:text-sm">
                {t('reminders.description', { count: reminders.length, s: reminders.length > 1 ? 's' : '' })}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/reminders')}
            className="border-amber-300 hover:bg-amber-100 hover:border-amber-400 dark:border-amber-700 dark:hover:bg-amber-950/50 dark:hover:border-amber-600 transition-all self-start sm:self-auto px-3 md:px-4"
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
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 md:p-4 bg-card rounded-xl border border-amber-200/50 dark:border-amber-800/50 hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                  <Home className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-600 flex-shrink-0" />
                  <p className="font-semibold text-foreground text-sm md:text-base line-clamp-1">{reminder.property?.address}</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{t('reminders.contractEnds')}: {format(new Date(reminder.end_date), 'MMM dd, yyyy')}</span>
                  </span>
                  {reminder.expected_new_rent && (
                    <span className="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300">
                      <DollarSign className="h-3 w-3 flex-shrink-0" />
                      ${reminder.rent_amount?.toFixed(0)} → ${reminder.expected_new_rent.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
              <Badge
                className={
                  urgency === 'urgent'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg text-xs md:text-sm self-start sm:self-auto'
                    : urgency === 'soon'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg text-xs md:text-sm self-start sm:self-auto'
                      : 'bg-gradient-to-r from-foreground to-foreground/70 text-white shadow-lg text-xs md:text-sm self-start sm:self-auto'
                }
              >
                {reminder.days_until_end} days
              </Badge>
            </div>
          );
        })}
        {reminders.length > 3 && (
          <p className={`text-sm ${COLORS.warning.textDark} dark:text-amber-300 text-center pt-2`}>
            {t('reminders.moreReminders', { count: reminders.length - 3, s: reminders.length - 3 > 1 ? 's' : '' })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

