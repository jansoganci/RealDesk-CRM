import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Building2, Copy, Check, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOrg } from '@/contexts/OrgContext';

interface OrganizationSettingsCardProps {
  onEditClick: () => void;
}

export function OrganizationSettingsCard({
  onEditClick,
}: OrganizationSettingsCardProps) {
  const { t } = useTranslation('profile');
  const { currentOrg, loading } = useOrg();
  const [copied, setCopied] = useState(false);

  const handleCopyOrgId = async () => {
    if (!currentOrg) return;

    try {
      await navigator.clipboard.writeText(currentOrg.id);
      setCopied(true);
      toast.success(t('organizationSettings.idCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('common:error'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
        <div className="space-y-0 divide-y divide-gray-100">
          {/* Organization Name */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 py-3">
            <span className="text-sm text-muted-foreground">
              {t('organizationSettings.fields.name')}
            </span>
            <span className="text-sm font-medium text-foreground">
              {currentOrg.name}
            </span>
          </div>

          {/* Created Date */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 py-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {t('organizationSettings.fields.createdAt')}
            </span>
            <span className="text-sm text-foreground">
              {formatDate(currentOrg.created_at)}
            </span>
          </div>

          {/* Organization ID */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 py-3">
            <span className="text-sm text-muted-foreground">
              {t('organizationSettings.fields.orgId')}
            </span>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600 truncate max-w-[200px]">
                {currentOrg.id}
              </code>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCopyOrgId}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('organizationSettings.copyId')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

