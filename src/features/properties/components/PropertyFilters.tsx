import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { PropertyOwner } from '@/types';

interface PropertyFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  cityFilter: string;
  onCityChange: (value: string) => void;
  ownerFilter: string;
  onOwnerChange: (value: string) => void;
  owners: PropertyOwner[];
  statusFilterOptions: Array<{ value: string; label: string }>;
  cities: string[];
}

export function PropertyFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  cityFilter,
  onCityChange,
  ownerFilter,
  onOwnerChange,
  owners,
  statusFilterOptions,
  cities,
}: PropertyFiltersProps) {
  const { t } = useTranslation('properties');

  const hasActiveFilters = 
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    cityFilter !== 'all' ||
    ownerFilter !== 'all';

  const handleClearFilters = () => {
    onSearchChange('');
    onStatusChange('all');
    onCityChange('all');
    onOwnerChange('all');
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('filterPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {statusFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* City Filter */}
        <Select value={cityFilter} onValueChange={onCityChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('filters.city') || 'City'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all')}</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Owner Filter */}
        <Select value={ownerFilter} onValueChange={onOwnerChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('filters.owner') || 'Owner'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all')}</SelectItem>
            {owners.map((owner) => (
              <SelectItem key={owner.id} value={owner.id}>
                {owner.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {searchQuery.trim() !== '' && (
            <Badge variant="secondary" className="gap-1">
              {t('filters.search')}: {searchQuery}
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {statusFilterOptions.find((opt) => opt.value === statusFilter)?.label}
              <button
                onClick={() => onStatusChange('all')}
                className="ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {cityFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {cityFilter}
              <button
                onClick={() => onCityChange('all')}
                className="ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {ownerFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {owners.find((o) => o.id === ownerFilter)?.name}
              <button
                onClick={() => onOwnerChange('all')}
                className="ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-7 text-xs"
          >
            {t('filters.clearAll') || 'Clear all'}
          </Button>
        </div>
      )}
    </div>
  );
}

