import { useTranslation } from 'react-i18next';
import { Pencil, User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfileInfoData {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  currency: string;
  meetingReminderMinutes: number;
  commissionRate: number;
}

interface ProfileInfoCardProps {
  data: ProfileInfoData;
  onEditClick: () => void;
  isLoading?: boolean;
}

export function ProfileInfoCard({
  data,
  onEditClick,
  isLoading = false,
}: ProfileInfoCardProps) {
  const { t } = useTranslation('profile');

  // Format display values
  const formatCurrency = (currency: string) => {
    return t(`profileInfo.currencies.${currency}`);
  };

  const formatMeetingReminder = (minutes: number) => {
    return t(`profileInfo.reminderOptions.${minutes}`);
  };

  const formatCommissionRate = (rate: number) => {
    return `${rate}%`;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-9 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 pb-3 border-b border-border/50 last:border-0 last:pb-0"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Define the fields to display
  const fields = [
    {
      label: t('profileInfo.fields.fullName'),
      value: data.fullName || t('fields.notSet'),
      isEmpty: !data.fullName,
    },
    {
      label: t('profileInfo.fields.email'),
      value: data.email,
      isEmpty: false,
    },
    {
      label: t('profileInfo.fields.phone'),
      value: data.phoneNumber || t('fields.notSet'),
      isEmpty: !data.phoneNumber,
    },
    {
      label: t('profileInfo.fields.currency'),
      value: formatCurrency(data.currency),
      isEmpty: false,
    },
    {
      label: t('profileInfo.fields.meetingReminder'),
      value: formatMeetingReminder(data.meetingReminderMinutes),
      isEmpty: false,
    },
    {
      label: t('profileInfo.fields.commissionRate'),
      value: formatCommissionRate(data.commissionRate),
      isEmpty: false,
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 rounded-xl shadow-lg shadow-blue-900/20">
            <User className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg font-bold text-slate-900">
            {t('profileInfo.title')}
          </CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onEditClick}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">{t('profileInfo.editButton')}</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {fields.map((field, index) => (
            <div
              key={field.label}
              className={`grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 py-3 ${
                index !== fields.length - 1
                  ? 'border-b border-border/50'
                  : ''
              }`}
            >
              <span className="text-sm text-muted-foreground">
                {field.label}
              </span>
              <span
                className={`text-sm font-medium ${
                  field.isEmpty ? 'text-muted-foreground italic' : 'text-foreground'
                }`}
              >
                {field.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
