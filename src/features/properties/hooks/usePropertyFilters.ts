import { useState, useEffect, useMemo } from 'react';
import type { PropertyWithOwner } from '@/types';

export function usePropertyFilters(properties: PropertyWithOwner[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.address.toLowerCase().includes(query) ||
          property.city?.toLowerCase().includes(query) ||
          property.district?.toLowerCase().includes(query) ||
          property.owner?.name.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((property) => property.status === statusFilter);
    }

    // Filter by city
    if (cityFilter !== 'all') {
      filtered = filtered.filter((property) => property.city === cityFilter);
    }

    // Filter by owner
    if (ownerFilter !== 'all') {
      filtered = filtered.filter((property) => property.owner?.id === ownerFilter);
    }

    return filtered;
  }, [properties, searchQuery, statusFilter, cityFilter, ownerFilter]);

  return {
    filteredProperties,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    cityFilter,
    setCityFilter,
    ownerFilter,
    setOwnerFilter,
  };
}

