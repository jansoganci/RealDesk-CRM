import { useState, useMemo } from 'react';
import type { ContractWithDetails } from '../../../types';

/**
 * Contracts Filter Hook
 * Handles filtering contracts by search query and status
 */

interface UseContractsFiltersOptions {
  contracts: ContractWithDetails[];
}

interface UseContractsFiltersReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  filteredContracts: ContractWithDetails[];
}

/**
 * Hook for filtering contracts by search query and status
 * Filters by tenant name, property address, and contract status
 */
export function useContractsFilters({
  contracts,
}: UseContractsFiltersOptions): UseContractsFiltersReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredContracts = useMemo(() => {
    if (!Array.isArray(contracts)) {
      return [];
    }

    let filtered = [...contracts];

    // Filter by search query (tenant name or property address)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contract) =>
          contract.tenant?.name?.toLowerCase().includes(query) ||
          contract.property?.address?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((contract) => contract.status === statusFilter);
    }

    return filtered;
  }, [contracts, searchQuery, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredContracts,
  };
}

