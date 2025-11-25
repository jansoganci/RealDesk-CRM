import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableActionButtons } from '@/components/common/TableActionButtons';
import { formatCurrency, convertCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { getToday, daysDifference } from '@/lib/dates';
import { 
  MapPin, 
  Building2, 
  User, 
  Images, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  ExternalLink 
} from 'lucide-react';
import { getStatusBadgeClasses } from '@/config/colors';
import type { PropertyWithOwner, PropertyStatus } from '@/types';

interface PropertyCardProps {
  property: PropertyWithOwner;
  onEdit: (property: PropertyWithOwner) => void;
  onCommission: (property: PropertyWithOwner) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: PropertyStatus) => void;
  onAddTenant?: (propertyId: string) => void;
  currency?: string;
}

export function PropertyCard({
  property,
  onEdit,
  onCommission,
  onDelete,
  onStatusChange,
  onAddTenant,
  currency = 'USD',
}: PropertyCardProps) {
  const { t } = useTranslation('properties');

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      // Rental statuses
      Empty: { label: t('status.rental.empty'), className: getStatusBadgeClasses('empty') },
      Occupied: { label: t('status.rental.occupied'), className: getStatusBadgeClasses('occupied') },
      // Sale statuses
      Available: { label: t('status.sale.available'), className: 'bg-emerald-600 text-white shadow-md' },
      'Under Offer': { label: t('status.sale.underOffer'), className: 'bg-orange-500 text-white shadow-md' },
      Sold: { label: t('status.sale.sold'), className: 'bg-purple-600 text-white shadow-md' },
      // Shared status
      Inactive: { label: t('status.inactive'), className: getStatusBadgeClasses('inactive') },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Empty;

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const propertyTyped = property as any;
  const isRental = propertyTyped.property_type === 'rental';
  const isSale = propertyTyped.property_type === 'sale';

  return (
    <div className="space-y-4">
      {/* Header with Image Placeholder */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base text-slate-900 truncate">
              {property.address}
            </span>
            {property.listing_url && (
              <a
                href={property.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-blue-50 transition-all text-blue-600 hover:text-blue-700 cursor-pointer hover:shadow-md"
                title={t('properties:table.viewListing')}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          {property.notes && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
              {property.notes}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          {getStatusBadge(property.status)}
        </div>
      </div>

      {/* Property Details Grid */}
      <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200/50">
        {(property.city || property.district) && (
          <div className="flex items-center gap-2.5 text-sm">
            <MapPin className="h-4 w-4 text-slate-600 flex-shrink-0" />
            <span className="text-slate-700 font-medium">
              {[property.city, property.district].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {property.owner && (
          <div className="flex items-center gap-2.5 text-sm">
            <User className="h-4 w-4 text-slate-600 flex-shrink-0" />
            <span className="text-slate-700 font-medium">
              <span className="text-slate-500 mr-1.5">Owner:</span>
              {property.owner.name}
            </span>
          </div>
        )}

        {property.status === 'Inactive' ? (
          <div className="flex items-center gap-2.5 text-sm">
            <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-500">{t('properties:table.inactive')}</span>
          </div>
        ) : property.activeTenant ? (
          <div className="flex items-center gap-2.5 text-sm">
            <User className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-slate-700 font-medium">
              <span className="text-slate-500 mr-1.5">Tenant:</span>
              {property.activeTenant.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-sm">
            <User className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-amber-700 font-medium">{t('properties:table.noTenant')}</span>
          </div>
        )}

        {property.status !== 'Inactive' && (() => {
          if (isRental && property.activeContract?.rent_amount) {
            return (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200/50 shadow-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-slate-600 font-medium">Monthly Rent:</span>
                </div>
                <span className="font-bold text-blue-700">
                  {formatCurrency(
                    convertCurrency(
                      property.activeContract.rent_amount,
                      property.activeContract.currency || 'USD',
                      currency
                    ),
                    currency
                  )}
                </span>
              </div>
            );
          } else if (isSale && propertyTyped.sale_price) {
            return (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200/50 shadow-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-slate-600 font-medium">Sale Price:</span>
                </div>
                <span className="font-bold text-amber-700">
                  {formatCurrency(
                    convertCurrency(
                      propertyTyped.sale_price,
                      propertyTyped.currency || 'USD',
                      currency
                    ),
                    currency
                  )}
                </span>
              </div>
            );
          }
          return null;
        })()}

        {property.status !== 'Inactive' && property.activeContract?.end_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-slate-600 flex-shrink-0" />
            <span className="text-slate-600 font-medium">
              Contract ends: <span className="text-slate-900">{format(new Date(property.activeContract.end_date), 'dd MMM yyyy')}</span>
            </span>
            {(() => {
              const today = getToday();
              const endDate = new Date(property.activeContract.end_date);
              const daysLeft = daysDifference(endDate, today);
              if (daysLeft <= 30 && daysLeft >= 0) {
                return (
                  <div className="ml-auto">
                    <Badge className="bg-red-600 text-white shadow-md text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {daysLeft} days left
                    </Badge>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {property.photos && property.photos.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Images className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-slate-600 font-medium">
              {t('photos', { count: property.photos.length })} photo{property.photos.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Footer - Actions */}
      <div className="flex flex-col gap-2.5 pt-1">
        {property.status === 'Empty' && onAddTenant && (
          <Button
            variant="secondary"
            size="default"
            onClick={() => onAddTenant(property.id)}
            className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-md hover:shadow-lg"
          >
            + {t('addTenantButton')}
          </Button>
        )}
        <div className="flex gap-2">
          <TableActionButtons
            onEdit={() => onEdit(property)}
            onDelete={() => onDelete(property.id)}
            showView={false}
          />
        </div>
      </div>
    </div>
  );
}

