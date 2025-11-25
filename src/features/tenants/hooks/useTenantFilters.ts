import { useState, useMemo } from 'react';
import type { TenantWithProperty } from '@/types';

/**
 * Tenant Filters Hook
 * Handles filtering tenants by search query and assignment status
 */

interface UseTenantFiltersOptions {
  tenants: TenantWithProperty[];
}

interface UseTenantFiltersReturn {
  filteredTenants: TenantWithProperty[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  assignmentFilter: string;
  setAssignmentFilter: (filter: string) => void;
}

export function useTenantFilters({ tenants }: UseTenantFiltersOptions): UseTenantFiltersReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');

  const filteredTenants = useMemo(() => {
    if (!Array.isArray(tenants)) {
      return [];
    }

    let filtered = [...tenants];

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(query) ||
          tenant.phone?.toLowerCase().includes(query) ||
          tenant.email?.toLowerCase().includes(query) ||
          tenant.property?.address.toLowerCase().includes(query)
      );
    }

    // Filter by assignment status
    if (assignmentFilter === 'assigned') {
      filtered = filtered.filter((tenant) => tenant.property != null);
    } else if (assignmentFilter === 'unassigned') {
      filtered = filtered.filter((tenant) => tenant.property == null);
    }

    return filtered;
  }, [tenants, searchQuery, assignmentFilter]);

  return {
    filteredTenants,
    searchQuery,
    setSearchQuery,
    assignmentFilter,
    setAssignmentFilter,
  };
}

