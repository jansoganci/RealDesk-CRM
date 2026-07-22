import { supabase } from '../config/supabase';
import type { Property, PropertyInsert, PropertyUpdate, PropertyWithOwner } from '../types';
import { insertRow, updateRow } from '../lib/db';
import { getAuthenticatedUserId } from '../lib/auth';
import { getActiveOrgId, softDelete } from '../lib/orgHelpers';
import { createLogger } from '../lib/logger';

const logger = createLogger('Properties');

class PropertiesService {
  // Private helper to transform properties data
  private transformProperties(data: any[]): PropertyWithOwner[] {
    return data.map((property) => {
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

  async getAll(): Promise<PropertyWithOwner[]> {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('properties')
      .select(`
        id,
        address,
        street_address,
        city,
        state,
        zip_code,
        district,
        status,
        property_type,
        rent_amount,
        sale_price,
        currency,
        created_at,
        notes,
        listing_url,
        owner:property_owners(id, name, phone),
        photos:property_photos(id, file_path),
        contracts(
          id,
          status,
          rent_amount,
          currency,
          end_date,
          tenant:tenants(id, name, phone)
        )
      `)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Error fetching properties:', error);
      throw error;
    }

    return this.transformProperties(data || []);
  }

  async getRentalProperties(): Promise<PropertyWithOwner[]> {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('properties')
      .select(`
        id,
        address,
        street_address,
        city,
        state,
        zip_code,
        district,
        status,
        property_type,
        rent_amount,
        sale_price,
        currency,
        created_at,
        notes,
        listing_url,
        owner:property_owners(id, name, phone),
        photos:property_photos(id, file_path),
        contracts(
          id,
          status,
          rent_amount,
          currency,
          end_date,
          tenant:tenants(id, name, phone)
        )
      `)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .eq('property_type', 'rental')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Error fetching rental properties:', error);
      throw error;
    }

    return this.transformProperties(data || []);
  }

  async getSaleProperties(): Promise<PropertyWithOwner[]> {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('properties')
      .select(`
        id,
        address,
        street_address,
        city,
        state,
        zip_code,
        district,
        status,
        property_type,
        rent_amount,
        sale_price,
        currency,
        created_at,
        notes,
        listing_url,
        owner:property_owners(id, name, phone),
        photos:property_photos(id, file_path)
      `)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .eq('property_type', 'sale')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Error fetching sale properties:', error);
      throw error;
    }

    return (data || []) as PropertyWithOwner[];
  }

  async getById(id: string): Promise<PropertyWithOwner | null> {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('properties')
      .select(`
        id,
        address,
        street_address,
        unit,
        city,
        state,
        zip_code,
        year_built,
        district,
        status,
        property_type,
        rent_amount,
        sale_price,
        currency,
        created_at,
        notes,
        listing_url,
        owner:property_owners(id, name, phone),
        photos:property_photos(id, file_path),
        contracts(
          id,
          status,
          rent_amount,
          currency,
          end_date,
          tenant:tenants(id, name, phone)
        )
      `)
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching property:', error);
      throw error;
    }
    if (!data) return null;

    const transformed = this.transformProperties([data]);
    return transformed[0] || null;
  }

  async getByOwnerId(ownerId: string): Promise<Property[]> {
    const orgId = await getActiveOrgId();

    const { data, error } = await supabase
      .from('properties')
      .select(`
        id,
        address,
        city,
        district,
        status,
        property_type,
        rent_amount,
        sale_price,
        currency,
        created_at
      `)
      .eq('owner_id', ownerId)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching owner properties:', error);
      throw error;
    }
    return (data || []) as Property[];
  }

  async create(property: Omit<PropertyInsert, 'user_id' | 'org_id'>): Promise<Property> {
    // Validate that required fields match property_type
    if (property.property_type === 'rental' && !property.rent_amount) {
      throw new Error('Rent amount is required for rental properties');
    }
    if (property.property_type === 'sale' && !property.sale_price) {
      throw new Error('Sale price is required for sale properties');
    }

    // Get authenticated user ID and org ID
    const userId = await getAuthenticatedUserId();
    const orgId = await getActiveOrgId();

    // Inject user_id and org_id into property data
    const newProperty = await insertRow('properties', {
      ...property,
      user_id: userId,
      org_id: orgId,
    });

    // Trigger matching for rental properties that are Empty
    // or sale properties that are Available
    const shouldTriggerMatching =
      (newProperty.property_type === 'rental' && newProperty.status === 'Empty') ||
      (newProperty.property_type === 'sale' && newProperty.status === 'Available');

    if (shouldTriggerMatching) {
      // Import at call time to avoid circular dependency
      const { inquiriesService } = await import('../lib/serviceProxy');
      await inquiriesService.checkMatchesForNewProperty(newProperty.id);
    }

    // Track property_created event (GA4)
    const { trackPropertyCreated } = await import('../utils/gtm');
    trackPropertyCreated(newProperty.id);

    return newProperty;
  }

  async update(id: string, property: PropertyUpdate): Promise<Property> {
    const oldProperty = await this.getById(id);
    const updatedProperty = await updateRow('properties', id, property);

    // Trigger matching if status changed to Empty (rental) or Available (sale)
    const rentalNowEmpty =
      updatedProperty.property_type === 'rental' &&
      oldProperty?.status !== 'Empty' &&
      updatedProperty.status === 'Empty';

    const saleNowAvailable =
      updatedProperty.property_type === 'sale' &&
      oldProperty?.status !== 'Available' &&
      updatedProperty.status === 'Available';

    if (rentalNowEmpty || saleNowAvailable) {
      // Import at call time to avoid circular dependency
      const { inquiriesService } = await import('../lib/serviceProxy');
      await inquiriesService.checkMatchesForNewProperty(id);
    }

    return updatedProperty;
  }

  async delete(id: string): Promise<void> {
    await softDelete('properties', id);
  }

  async getStats() {
    const orgId = await getActiveOrgId();

    // Select only needed columns for stats calculation
    const { data, error } = await supabase
      .from('properties')
      .select('status, property_type')
      .eq('org_id', orgId)
      .is('deleted_at', null);

    if (error) {
      logger.error('Error fetching property stats:', error);
      throw error;
    }

    // Extract only the fields we need
    const properties = (data || []).map(p => ({
      status: p.status,
      property_type: p.property_type,
    })) as Array<{ status: string; property_type: string }>;

    const stats = {
      total: properties.length || 0,
      // Legacy stats (for backward compatibility)
      empty: properties.filter((p) => p.status === 'Empty').length || 0,
      occupied: properties.filter((p) => p.status === 'Occupied').length || 0,
      inactive: properties.filter((p) => p.status === 'Inactive').length || 0,
      // Rental stats
      rental: {
        total: properties.filter((p) => p.property_type === 'rental').length || 0,
        empty: properties.filter((p) => p.property_type === 'rental' && p.status === 'Empty').length || 0,
        occupied: properties.filter((p) => p.property_type === 'rental' && p.status === 'Occupied').length || 0,
        inactive: properties.filter((p) => p.property_type === 'rental' && p.status === 'Inactive').length || 0,
      },
      // Sale stats
      sale: {
        total: properties.filter((p) => p.property_type === 'sale').length || 0,
        available: properties.filter((p) => p.property_type === 'sale' && p.status === 'Available').length || 0,
        underOffer: properties.filter((p) => p.property_type === 'sale' && p.status === 'Under Offer').length || 0,
        sold: properties.filter((p) => p.property_type === 'sale' && p.status === 'Sold').length || 0,
        inactive: properties.filter((p) => p.property_type === 'sale' && p.status === 'Inactive').length || 0,
      },
    };

    return stats;
  }

  async getPropertiesWithMissingInfo() {
    const orgId = await getActiveOrgId();

    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        id,
        city,
        district,
        photos:property_photos(id)
      `)
      .eq('org_id', orgId)
      .is('deleted_at', null);

    if (error) {
      logger.error('Error fetching properties with missing info:', error);
      throw error;
    }

    const missingInfo = {
      noPhotos: 0,
      noLocation: 0,
      total: 0,
    };

    const propertiesWithMissingInfo = new Set<string>();

    properties?.forEach((p: any) => {
      const photoCount = p.photos?.length || 0;
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
