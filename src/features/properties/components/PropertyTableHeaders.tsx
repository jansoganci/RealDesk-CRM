import { useTranslation } from 'react-i18next';
import { TableHead } from '@/components/ui/table';
import { MapPin, Building2, User, DollarSign, Calendar } from 'lucide-react';
import { COLORS } from '@/config/colors';

export function PropertyTableHeaders() {
  const { t } = useTranslation('properties');

  return (
    <>
      {/* Address - Always visible */}
      <TableHead>
        <div className="flex items-center gap-2">
          <Building2 className={`h-4 w-4 ${COLORS.primary.text}`} />
          <span>{t('properties:table.address')}</span>
        </div>
      </TableHead>
      {/* Location - Hidden on tablet, visible on laptop+ */}
      <TableHead className="hidden lg:table-cell">
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 ${COLORS.muted.textLight}`} />
          <span>{t('properties:table.location')}</span>
        </div>
      </TableHead>
      {/* Owner - Always visible */}
      <TableHead>
        <div className="flex items-center gap-2">
          <User className={`h-4 w-4 ${COLORS.muted.textLight}`} />
          <span>{t('properties:table.owner')}</span>
        </div>
      </TableHead>
      {/* Tenant - Hidden on tablet/laptop, visible on desktop */}
      <TableHead className="hidden xl:table-cell">
        <div className="flex items-center gap-2">
          <User className={`h-4 w-4 ${COLORS.muted.textLight}`} />
          <span>{t('properties:table.tenant')}</span>
        </div>
      </TableHead>
      {/* Price - Always visible */}
      <TableHead>
        <div className="flex items-center gap-2">
          <DollarSign className={`h-4 w-4 ${COLORS.muted.textLight}`} />
          <span>{t('properties:table.price')}</span>
        </div>
      </TableHead>
      {/* Contract End - Hidden on tablet, visible on laptop+ */}
      <TableHead className="hidden lg:table-cell whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Calendar className={`h-4 w-4 ${COLORS.muted.textLight}`} />
          <span>{t('properties:table.contractEndDate')}</span>
        </div>
      </TableHead>
      {/* Status - Always visible */}
      <TableHead>{t('properties:table.status')}</TableHead>
      {/* Actions - Always visible */}
      <TableHead className="text-right">{t('properties:table.actions')}</TableHead>
    </>
  );
}

