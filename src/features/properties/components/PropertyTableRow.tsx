import { useTranslation } from 'react-i18next';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableActionButtons } from '@/components/common/TableActionButtons';
import { formatCurrency, convertCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { getToday, daysDifference } from '@/lib/dates';
import { Images, AlertCircle, ExternalLink, FileText } from 'lucide-react';
import { COLORS, getStatusBadgeClasses } from '@/config/colors';
import type { PropertyWithOwner } from '@/types';

interface PropertyTableRowProps {
  property: PropertyWithOwner;
  onEdit: (property: PropertyWithOwner) => void;
  onDelete: (property: PropertyWithOwner) => void;
  onAddTenant: (propertyId: string) => void;
  onCreateLease?: (propertyId: string) => void;
  onStartPurchase?: (propertyId: string) => void;
  currency?: string;
}

export function PropertyTableRow({
  property,
  onEdit,
  onDelete,
  onAddTenant,
  onCreateLease,
  onStartPurchase,
  currency = 'USD',
}: PropertyTableRowProps) {
  const { t } = useTranslation('properties');

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Empty: { label: t('status.rental.empty'), className: getStatusBadgeClasses('empty') },
      Occupied: { label: t('status.rental.occupied'), className: getStatusBadgeClasses('occupied') },
      Available: { label: t('status.sale.available'), className: getStatusBadgeClasses('available') },
      'Under Offer': { label: t('status.sale.underOffer'), className: getStatusBadgeClasses('underOffer') },
      Sold: { label: t('status.sale.sold'), className: getStatusBadgeClasses('sold') },
      Inactive: { label: t('status.inactive'), className: getStatusBadgeClasses('inactive') },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Empty;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const isRental = property.property_type === 'rental';
  const isSale = property.property_type === 'sale';

  return (
    <TableRow>
      <TableCell>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`font-medium truncate max-w-[200px] md:max-w-none`}>
              {property.address}
            </span>
            {property.photos && property.photos.length > 0 && (
              <span className={`inline-flex items-center gap-1 text-xs ${COLORS.gray.text500} dark:text-muted-foreground flex-shrink-0`}>
                <Images className="h-3 w-3" />
                {t('photos', { count: property.photos.length })}
              </span>
            )}
            {property.listing_url && property.listing_url.trim() !== '' && (
              <a
                href={property.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-1.5 min-w-[28px] min-h-[28px] rounded-md hover:bg-primary/10 dark:hover:bg-muted transition-colors text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 cursor-pointer flex-shrink-0"
                title={t('properties:table.viewListing')}
                onClick={(e) => e.stopPropagation()}
                aria-label={t('properties:table.viewListing')}
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
              </a>
            )}
          </div>
          {property.notes && (
            <div className={`text-xs ${COLORS.gray.text500} dark:text-muted-foreground mt-1 line-clamp-1`}>
              {property.notes}
            </div>
          )}
        </div>
      </TableCell>
      {/* Location - Hidden on tablet, visible on laptop+ */}
      <TableCell className="hidden lg:table-cell">
        {property.city || property.state || property.zip_code ||
        property.district ||
        property.il ||
        property.district_legacy ? (
          <span className={`${COLORS.gray.text600} dark:text-foreground/80 text-sm truncate max-w-[150px] md:max-w-none block`}>
            {[
              property.city || property.il,
              property.state,
              property.zip_code,
              property.district || property.district_legacy,
            ]
              .filter(Boolean)
              .join(', ')}
          </span>
        ) : (
          <span className={`${COLORS.muted.textLight} dark:text-muted-foreground text-sm`}>{t('notAvailable')}</span>
        )}
      </TableCell>
      {/* Owner - Always visible */}
      <TableCell>
        {property.owner ? (
          <span className={`${COLORS.gray.text700} dark:text-foreground text-sm`}>{property.owner.name}</span>
        ) : (
          <span className={`${COLORS.muted.textLight} dark:text-muted-foreground text-sm`}>{t('notAvailable')}</span>
        )}
      </TableCell>
      {/* Tenant - Hidden on tablet/laptop, visible on desktop */}
      <TableCell className="hidden xl:table-cell">
        {property.status === 'Inactive' ? (
          <span className={`${COLORS.muted.textLight} dark:text-muted-foreground text-sm`}>{t('properties:table.inactive')}</span>
        ) : property.activeTenant ? (
          <span className={`${COLORS.gray.text700} dark:text-foreground text-sm`}>{property.activeTenant.name}</span>
        ) : (
          <span className={`${COLORS.muted.textLight} dark:text-muted-foreground text-sm`}>{t('properties:table.noTenant')}</span>
        )}
      </TableCell>
      <TableCell>
        {(() => {
          if (property.status === 'Inactive') {
            return <span className={`${COLORS.muted.textLight} dark:text-muted-foreground text-sm`}>{t('properties:table.noPrice')}</span>;
          }

          if (isRental) {
            if (!property.activeContract?.rent_amount) {
              return <span className={`${COLORS.muted.textLight} dark:text-muted-foreground text-sm`}>{t('properties:table.noRent')}</span>;
            }
            return (
              <span className={`${COLORS.gray.text700} dark:text-foreground text-sm`}>
                {formatCurrency(
                  convertCurrency(
                    property.activeContract.rent_amount,
                    property.activeContract.currency || 'USD',
                    currency
                  ),
                  currency
                )}
                {t('properties:table.perMonth')}
              </span>
            );
          } else if (isSale) {
            const salePrice = property.sale_price;
            if (!salePrice) {
              return <span className={`${COLORS.muted.textLight} dark:text-muted-foreground text-sm`}>{t('properties:table.noPrice')}</span>;
            }
            return (
              <span className={`${COLORS.gray.text700} dark:text-foreground text-sm`}>
                {formatCurrency(
                  convertCurrency(
                    salePrice,
                    property.currency || 'USD',
                    currency
                  ),
                  currency
                )}
              </span>
            );
          }

          return <span className={`${COLORS.muted.textLight} dark:text-muted-foreground text-sm`}>{t('properties:table.noPrice')}</span>;
        })()}
      </TableCell>
      {/* Contract End - Hidden on tablet, visible on laptop+ */}
      <TableCell className="hidden lg:table-cell">
        {property.status === 'Inactive' || !property.activeContract?.end_date ? (
          <span className={`${COLORS.muted.textLight} dark:text-muted-foreground text-sm`}>{t('properties:table.noContract')}</span>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <span className={`${COLORS.gray.text600} dark:text-foreground/80`}>
              {format(new Date(property.activeContract.end_date), 'dd MMM yyyy')}
            </span>
            {(() => {
              const today = getToday();
              const endDate = new Date(property.activeContract.end_date);
              const daysLeft = daysDifference(endDate, today);
              if (daysLeft <= 30 && daysLeft >= 0) {
                return (
                  <AlertCircle className={`h-3 w-3 ${COLORS.warning.text} flex-shrink-0`} />
                );
              }
              return null;
            })()}
          </div>
        )}
      </TableCell>
      {/* Status - Always visible */}
      <TableCell>
        {getStatusBadge(property.status)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {property.status === 'Empty' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAddTenant(property.id)}
              className="text-xs bg-success hover:bg-success/90 text-success-foreground shadow-sm"
            >
              + Tenant
            </Button>
          )}
          {isRental && onCreateLease && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCreateLease(property.id)}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              {t('actions.createLease')}
            </Button>
          )}
          {isSale && onStartPurchase && property.status !== 'Sold' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onStartPurchase(property.id)}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              {t('actions.createPurchaseAgreement')}
            </Button>
          )}
          <TableActionButtons
            onEdit={() => onEdit(property)}
            onDelete={() => onDelete(property)}
            showView={false}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

