import { useTranslation } from 'react-i18next';
import { Pencil, Building2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrg } from '@/contexts/OrgContext';

interface OrganizationSettingsCardProps {
  onEditClick: () => void;
}

export function OrganizationSettingsCard({
  onEditClick,
}: OrganizationSettingsCardProps) {
  const { t } = useTranslation('profile');
  const { currentOrg, loading } = useOrg();

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-9 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show if no org or not owner
  if (!currentOrg) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 rounded-xl shadow-lg shadow-blue-900/20">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg font-bold text-slate-900">
            {t('organizationSettings.title')}
          </CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onEditClick}
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t('organizationSettings.editButton')}
          </span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 py-3">
            <span className="text-sm text-muted-foreground">
              {t('organizationSettings.fields.name')}
            </span>
            <span className="text-sm font-medium text-foreground">
              {currentOrg.name}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

