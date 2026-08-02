import { getStatusBadgeClasses } from '@/config/colors';

export interface StatusBadgeConfig {
  label: string;
  className: string;
}

export const getStatusBadgeConfig = (status: string, t: (key: string) => string): StatusBadgeConfig => {
  const statusConfig: Record<string, StatusBadgeConfig> = {
    Empty: { label: t('status.rental.empty'), className: getStatusBadgeClasses('empty') },
    Occupied: { label: t('status.rental.occupied'), className: getStatusBadgeClasses('occupied') },
    Available: { label: t('status.sale.available'), className: getStatusBadgeClasses('available') },
    'Under Offer': { label: t('status.sale.underOffer'), className: getStatusBadgeClasses('underOffer') },
    Sold: { label: t('status.sale.sold'), className: getStatusBadgeClasses('sold') },
    Inactive: { label: t('status.inactive'), className: getStatusBadgeClasses('inactive') },
  };

  return statusConfig[status] || statusConfig.Empty;
};

export const getStatusFilterOptions = (
  propertyTypeFilter: 'all' | 'rental' | 'sale',
  t: (key: string) => string
): Array<{ value: string; label: string }> => {
  const allOption = { value: 'all', label: t('filters.all') };

  if (propertyTypeFilter === 'rental') {
    return [
      allOption,
      { value: 'Empty', label: t('status.rental.empty') },
      { value: 'Occupied', label: t('status.rental.occupied') },
      { value: 'Inactive', label: t('status.inactive') },
    ];
  } else if (propertyTypeFilter === 'sale') {
    return [
      allOption,
      { value: 'Available', label: t('status.sale.available') },
      { value: 'Under Offer', label: t('status.sale.underOffer') },
      { value: 'Sold', label: t('status.sale.sold') },
      { value: 'Inactive', label: t('status.inactive') },
    ];
  } else {
    return [
      allOption,
      { value: 'Empty', label: t('status.rental.empty') },
      { value: 'Occupied', label: t('status.rental.occupied') },
      { value: 'Available', label: t('status.sale.available') },
      { value: 'Under Offer', label: t('status.sale.underOffer') },
      { value: 'Sold', label: t('status.sale.sold') },
      { value: 'Inactive', label: t('status.inactive') },
    ];
  }
};
