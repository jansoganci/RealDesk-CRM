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
    <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-amber-200/50 bg-gradient-to-br from-amber-50 to-yellow-50 backdrop-blur-sm animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-xl shadow-gold">
              <Bell className={`h-5 w-5 ${COLORS.text.white}`} />
            </div>
            <div>
              <CardTitle className="text-amber-900 font-bold">{t('reminders.title')}</CardTitle>
              <CardDescription className="text-amber-700 font-medium">
                {t('reminders.description', { count: reminders.length, s: reminders.length > 1 ? 's' : '' })}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/reminders')}
            className="border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition-all"
          >
            {t('reminders.viewAll')} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.slice(0, 3).map((reminder) => {
          const urgency = remindersService.getReminderUrgencyCategory(reminder.days_until_end);
          return (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-200/50 hover:shadow-lg hover:border-amber-300 transition-all duration-200"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-amber-600" />
                  <p className="font-semibold text-slate-900">{reminder.property?.address}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('reminders.contractEnds')}: {format(new Date(reminder.end_date), 'MMM dd, yyyy')}
                  </span>
                  {reminder.expected_new_rent && (
                    <span className="flex items-center gap-1 font-medium text-amber-700">
                      <DollarSign className="h-3 w-3" />
                      ${reminder.rent_amount?.toFixed(0)} → ${reminder.expected_new_rent.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
              <Badge
                className={
                  urgency === 'urgent'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                    : urgency === 'soon'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg'
                }
              >
                {reminder.days_until_end} days
              </Badge>
            </div>
          );
        })}
        {reminders.length > 3 && (
          <p className={`text-sm ${COLORS.warning.textDark} text-center pt-2`}>
            {t('reminders.moreReminders', { count: reminders.length - 3, s: reminders.length - 3 > 1 ? 's' : '' })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

