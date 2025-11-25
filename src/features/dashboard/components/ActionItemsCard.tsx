import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleAlert as AlertCircle } from 'lucide-react';
import { COLORS } from '@/config/colors';

interface ActionItems {
  propertiesMissingInfo: {
    noPhotos: number;
    noLocation: number;
    total: number;
  };
  tenantsMissingInfo: {
    noPhone: number;
    noEmail: number;
    noContact: number;
    total: number;
  };
  ownersMissingInfo: {
    noPhone: number;
    noEmail: number;
    noContact: number;
    total: number;
  };
}

interface ActionItemsCardProps {
  actionItems: ActionItems;
}

export function ActionItemsCard({ actionItems }: ActionItemsCardProps) {
  const { t } = useTranslation('dashboard');

  // Don't render if there are no action items
  if (
    actionItems.propertiesMissingInfo.total === 0 &&
    actionItems.tenantsMissingInfo.total === 0 &&
    actionItems.ownersMissingInfo.total === 0
  ) {
    return null;
  }

  return (
    <Card className="shadow-luxury hover:shadow-luxury-lg transition-all duration-300 border-blue-200/50 bg-gradient-to-br from-blue-50 to-slate-50 backdrop-blur-sm animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 rounded-xl shadow-lg shadow-blue-900/20">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-slate-900 font-bold">{t('actionItems.title')}</CardTitle>
            <CardDescription className="text-slate-700 font-medium">
              {t('actionItems.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {actionItems.propertiesMissingInfo.total > 0 && (
          <div>
            <p className={`font-medium ${COLORS.gray.text900} mb-2`}>{t('actionItems.properties.title')}</p>
            <ul className={`space-y-1 text-sm ${COLORS.gray.text600}`}>
              {actionItems.propertiesMissingInfo.noPhotos > 0 && (
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>{t('actionItems.properties.noPhotos', { count: actionItems.propertiesMissingInfo.noPhotos })}</span>
                </li>
              )}
              {actionItems.propertiesMissingInfo.noLocation > 0 && (
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>{t('actionItems.properties.noLocation', { count: actionItems.propertiesMissingInfo.noLocation })}</span>
                </li>
              )}
            </ul>
          </div>
        )}
        {actionItems.tenantsMissingInfo.total > 0 && (
          <div>
            <p className={`font-medium ${COLORS.gray.text900} mb-2`}>{t('actionItems.tenants.title')}</p>
            <ul className={`space-y-1 text-sm ${COLORS.gray.text600}`}>
              {actionItems.tenantsMissingInfo.noContact > 0 && (
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>{t('actionItems.tenants.noContact', { count: actionItems.tenantsMissingInfo.noContact })}</span>
                </li>
              )}
            </ul>
          </div>
        )}
        {actionItems.ownersMissingInfo.total > 0 && (
          <div>
            <p className={`font-medium ${COLORS.gray.text900} mb-2`}>{t('actionItems.owners.title')}</p>
            <ul className={`space-y-1 text-sm ${COLORS.gray.text600}`}>
              {actionItems.ownersMissingInfo.noContact > 0 && (
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>{t('actionItems.owners.noContact', { count: actionItems.ownersMissingInfo.noContact })}</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

