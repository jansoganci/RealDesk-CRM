import { supabase } from '../config/supabase';
import type { Property, PropertyInsert, PropertyUpdate, PropertyWithOwner } from '../types';
import { insertRow, updateRow } from '../lib/db';
import { getAuthenticatedUserId } from '../lib/auth';

class PropertiesService {
  async getAll(): Promise<PropertyWithOwner[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:property_owners(*),
        photos:property_photos(*),
        contracts(
          id,
          status,
          rent_amount,
          currency,
          end_date,
          tenant:tenants(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
    
    // Transform the data to extract activeTenant and activeContract from active contracts
    const properties = (data || []) as any[];
    return properties.map((property) => {
      // Find the active contract and extract its tenant and contract details
      const contracts = Array.isArray(property.contracts) ? property.contracts : [];
      const activeContractData = contracts.find(
        (contract: any) => contract?.status === 'Active'
      );
      const activeTenant = activeContractData?.tenant || null;
      const activeContract = activeContractData ? {
        id: activeContractData.id,
        rent_amount: activeContractData.rent_amount,
        currency: activeContractData.currency,
        end_date: activeContractData.end_date,
        status: activeContractData.status,
      } : null;
      
      const { contracts: _, ...rest } = property;
      return {
        ...rest,
        activeTenant: activeTenant || undefined,
        activeContract: activeContract || undefined,
      } as PropertyWithOwner;
    });
  }

  async getById(id: string): Promise<PropertyWithOwner | null> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:property_owners(*),
        photos:property_photos(*),
        contracts(
          id,
          status,
          rent_amount,
          currency,
          end_date,
          tenant:tenants(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
    if (!data) return null;
    
    // Transform the data to extract activeTenant and activeContract from active contracts
    const property = data as any;
    const contracts = Array.isArray(property.contracts) ? property.contracts : [];
    const activeContractData = contracts.find(
      (contract: any) => contract?.status === 'Active'
    );
    const activeTenant = activeContractData?.tenant || null;
    const activeContract = activeContractData ? {
      id: activeContractData.id,
      rent_amount: activeContractData.rent_amount,
      currency: activeContractData.currency,
      end_date: activeContractData.end_date,
      status: activeContractData.status,
    } : null;
    
    const { contracts: _, ...rest } = property;
    return {
      ...rest,
      activeTenant: activeTenant || undefined,
      activeContract: activeContract || undefined,
    } as PropertyWithOwner;
  }

  async getByOwnerId(ownerId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Property[];
  }

  async create(property: PropertyInsert): Promise<Property> {
    // Get authenticated user ID with session fallback
    const userId = await getAuthenticatedUserId();

    // Inject user_id into property data
    const newProperty = await insertRow('properties', {
      ...property,
      user_id: userId,
    });

    // Trigger matching if property is Empty
    if (newProperty.status === 'Empty') {
      // Import at call time to avoid circular dependency
      const { inquiriesService } = await import('../lib/serviceProxy');
      await inquiriesService.checkMatchesForNewProperty(newProperty.id);
    }

    return newProperty;
  }

  async update(id: string, property: PropertyUpdate): Promise<Property> {
    const oldProperty = await this.getById(id);
    const updatedProperty = await updateRow('properties', id, property);

    // Trigger matching if status changed to Empty
    if (oldProperty?.status !== 'Empty' && updatedProperty.status === 'Empty') {
      // Import at call time to avoid circular dependency
      const { inquiriesService } = await import('../lib/serviceProxy');
      await inquiriesService.checkMatchesForNewProperty(id);
    }

    return updatedProperty;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getStats() {
    const { data, error } = await supabase
      .from('properties')
      .select('status');

    if (error) throw error;

    const properties = (data || []) as Array<{ status: string }>;

    const stats = {
      total: properties.length || 0,
      empty: properties.filter(p => p.status === 'Empty').length || 0,
      occupied: properties.filter(p => p.status === 'Occupied').length || 0,
      inactive: properties.filter(p => p.status === 'Inactive').length || 0,
    };

    return stats;
  }

  async getPropertiesWithMissingInfo() {
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        id,
        city,
        district,
        photos:property_photos(count)
      `);

    if (error) throw error;

    const missingInfo = {
      noPhotos: 0,
      noLocation: 0,
      total: 0,
    };

    const propertiesWithMissingInfo = new Set<string>();

    properties?.forEach((p: any) => {
      const photoCount = p.photos?.[0]?.count || 0;
      const hasLocation = (p.city && p.city.trim() !== '') || (p.district && p.district.trim() !== '');
      
      if (photoCount === 0) {
        missingInfo.noPhotos++;
        propertiesWithMissingInfo.add(p.id);
      }
      
      if (!hasLocation) {
        missingInfo.noLocation++;
        propertiesWithMissingInfo.add(p.id);
      }
    });

    missingInfo.total = propertiesWithMissingInfo.size;

    return missingInfo;
  }
}

export const propertiesService = new PropertiesService();
