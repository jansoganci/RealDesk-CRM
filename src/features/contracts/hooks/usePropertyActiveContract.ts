/**
 * usePropertyActiveContract
 *
 * Custom hook to check if a property (by address) has an existing active contract
 * Used to warn users before they try to create overlapping contracts
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { generateFullAddress, type AddressComponents } from '@/services/address.service';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// Types
// ============================================================================

export interface ActiveContractInfo {
  id: string;
  tenant_name: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  currency: string;
  property_id: string;
  property_address: string;
}

export interface UsePropertyActiveContractResult {
  activeContract: ActiveContractInfo | null;
  isLoading: boolean;
  error: string | null;
  checkAddress: (components: AddressComponents) => void;
  clearWarning: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function usePropertyActiveContract(): UsePropertyActiveContractResult {
  const { user } = useAuth();
  const [activeContract, setActiveContract] = useState<ActiveContractInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedAddress, setLastCheckedAddress] = useState<string | null>(null);

  const checkAddress = useCallback(async (components: AddressComponents) => {
    // Validate required fields
    if (!components.mahalle || !components.cadde_sokak || !components.bina_no ||
        !components.ilce || !components.il) {
      setActiveContract(null);
      return;
    }

    if (!user?.id) {
      return;
    }

    // Generate full address for lookup
    const fullAddress = generateFullAddress(components);

    // Skip if we just checked this address
    if (fullAddress === lastCheckedAddress) {
      return;
    }

    setLastCheckedAddress(fullAddress);
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Find property by address
      const { data: property, error: propError } = await supabase
        .from('properties')
        .select('id, address')
        .eq('address', fullAddress)
        .eq('user_id', user.id)
        .maybeSingle();

      if (propError) {
        console.error('Property lookup error:', propError);
        setError('Mülk kontrolü başarısız');
        setActiveContract(null);
        return;
      }

      // No property found with this address - no warning needed
      if (!property) {
        setActiveContract(null);
        return;
      }

      // Step 2: Check for active contract on this property
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select(`
          id,
          start_date,
          end_date,
          rent_amount,
          currency,
          tenant:tenants(name)
        `)
        .eq('property_id', property.id)
        .eq('status', 'Active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (contractError) {
        console.error('Contract lookup error:', contractError);
        setError('Sözleşme kontrolü başarısız');
        setActiveContract(null);
        return;
      }

      // No active contract - no warning needed
      if (!contract) {
        setActiveContract(null);
        return;
      }

      // Active contract found - set warning data
      setActiveContract({
        id: contract.id,
        tenant_name: (contract.tenant as any)?.name || 'Bilinmeyen',
        start_date: contract.start_date,
        end_date: contract.end_date,
        rent_amount: contract.rent_amount || 0,
        currency: contract.currency || 'TRY',
        property_id: property.id,
        property_address: property.address || fullAddress,
      });

    } catch (err) {
      console.error('Active contract check error:', err);
      setError('Beklenmeyen hata');
      setActiveContract(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, lastCheckedAddress]);

  const clearWarning = useCallback(() => {
    setActiveContract(null);
    setLastCheckedAddress(null);
    setError(null);
  }, []);

  return {
    activeContract,
    isLoading,
    error,
    checkAddress,
    clearWarning,
  };
}
