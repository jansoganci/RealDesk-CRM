import type { 
  Property, 
  PropertyInsert, 
  PropertyUpdate, 
  PropertyWithOwner,
  PropertyWithOwnerDetails,
  PropertyPhoto,
  PropertyPhotoInsert,
  PropertyPhotoUpdate,
  Tenant
} from '../../types';
import { 
  mockProperties, 
  mockPropertyOwners, 
  mockPropertyPhotos, 
  mockTenants 
} from '../../data/mockData';

// In-memory data stores for mock service
let mockPropertiesData = [...mockProperties];
let mockPhotosData = [...mockPropertyPhotos];

// Simulate network delay for realistic UX
const simulateDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

class MockPropertiesService {
  async getAll(): Promise<PropertyWithOwner[]> {
    await simulateDelay();
    
    return mockPropertiesData
      .map(property => ({
        ...property,
        owner: mockPropertyOwners.find(owner => owner.id === property.owner_id),
        photos: mockPhotosData.filter(photo => photo.property_id === property.id),
      }))
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getById(id: string): Promise<PropertyWithOwnerDetails | null> {
    await simulateDelay();
    
    const property = mockPropertiesData.find(p => p.id === id);
    if (!property) return null;
    
    const owner = mockPropertyOwners.find(o => o.id === property.owner_id);
    if (!owner) return null;
    
    const photos = mockPhotosData.filter(photo => photo.property_id === id);
    
    return {
      ...property,
      owner,
      photos,
    };
  }

  async create(property: PropertyInsert): Promise<Property> {
    await simulateDelay();
    
    const newProperty: Property = {
      ...property,
      id: `property-${Date.now()}`,
      city: property.city ?? null,
      district: property.district ?? null,
      status: property.status ?? 'Empty',
      notes: property.notes ?? null,
      listing_url: property.listing_url ?? null,
      currency: property.currency ?? null,
      rent_amount: property.rent_amount ?? null,
      sale_price: property.sale_price ?? null,
      sold_at: property.sold_at ?? null,
      sold_price: property.sold_price ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    mockPropertiesData.push(newProperty);
    return newProperty;
  }

  async update(id: string, property: PropertyUpdate): Promise<Property> {
    await simulateDelay();
    
    const index = mockPropertiesData.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Property not found');
    }
    
    const updatedProperty: Property = {
      ...mockPropertiesData[index],
      ...property,
      listing_url: property.listing_url ?? mockPropertiesData[index].listing_url ?? null,
      updated_at: new Date().toISOString(),
    };
    
    mockPropertiesData[index] = updatedProperty;
    return updatedProperty;
  }

  async delete(id: string): Promise<void> {
    await simulateDelay();
    
    const index = mockPropertiesData.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Property not found');
    }
    
    // Check if property has tenants
    const hasTenants = mockTenants.some(t => t.property_id === id);
    if (hasTenants) {
      throw new Error('Cannot delete property with associated tenants');
    }
    
    // Remove property photos
    mockPhotosData = mockPhotosData.filter(photo => photo.property_id !== id);
    
    // Remove property
    mockPropertiesData.splice(index, 1);
  }

  async getByOwnerId(ownerId: string): Promise<Property[]> {
    await simulateDelay();
    
    return mockPropertiesData
      .filter(p => p.owner_id === ownerId)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getTenantsByPropertyId(propertyId: string): Promise<Tenant[]> {
    await simulateDelay();
    
    return mockTenants
      .filter(t => t.property_id === propertyId)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }

  async assignTenant(propertyId: string, _tenantId: string): Promise<void> {
    await simulateDelay();
    
    const property = mockPropertiesData.find(p => p.id === propertyId);
    if (!property) {
      throw new Error('Property not found');
    }
    
    // Update property status to Occupied if assigning tenant
    const propertyIndex = mockPropertiesData.findIndex(p => p.id === propertyId);
    mockPropertiesData[propertyIndex] = {
      ...property,
      status: 'Occupied',
      updated_at: new Date().toISOString(),
    };
  }

  async getStats() {
    await simulateDelay();
    
    const total = mockPropertiesData.length;
    const empty = mockPropertiesData.filter(p => p.status === 'Empty').length;
    const occupied = mockPropertiesData.filter(p => p.status === 'Occupied').length;
    const inactive = mockPropertiesData.filter(p => p.status === 'Inactive').length;
    
    return {
      total,
      empty,
      occupied,
      inactive,
    };
  }

  async getPropertiesWithMissingInfo() {
    await simulateDelay();
    
    const missingInfo = {
      noPhotos: 0,
      noLocation: 0,
      total: 0,
    };

    const propertiesWithMissingInfo = new Set<string>();

    mockPropertiesData.forEach((property) => {
      const photoCount = mockPhotosData.filter(p => p.property_id === property.id).length;
      const hasLocation = (property.city && property.city.trim() !== '') || (property.district && property.district.trim() !== '');
      
      if (photoCount === 0) {
        missingInfo.noPhotos++;
        propertiesWithMissingInfo.add(property.id);
      }
      
      if (!hasLocation) {
        missingInfo.noLocation++;
        propertiesWithMissingInfo.add(property.id);
      }
    });

    missingInfo.total = propertiesWithMissingInfo.size;

    return missingInfo;
  }

  // Photo management methods
  async getPhotos(propertyId: string): Promise<PropertyPhoto[]> {
    await simulateDelay();
    
    return mockPhotosData
      .filter(photo => photo.property_id === propertyId)
      .sort((a, b) => {
        const orderA = a.sort_order ?? 0;
        const orderB = b.sort_order ?? 0;
        return orderA - orderB;
      });
  }

  async getPhotosByPropertyId(propertyId: string): Promise<PropertyPhoto[]> {
    return this.getPhotos(propertyId);
  }

  async addPhoto(photo: PropertyPhotoInsert): Promise<PropertyPhoto> {
    await simulateDelay();
    
    const newPhoto: PropertyPhoto = {
      ...photo,
      id: `photo-${Date.now()}`,
      sort_order: photo.sort_order ?? 0,
      created_at: new Date().toISOString(),
    };
    
    mockPhotosData.push(newPhoto);
    return newPhoto;
  }

  async updatePhoto(id: string, photo: PropertyPhotoUpdate): Promise<PropertyPhoto> {
    await simulateDelay();
    
    const index = mockPhotosData.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Photo not found');
    }
    
    const updatedPhoto: PropertyPhoto = {
      ...mockPhotosData[index],
      ...photo,
    };
    
    mockPhotosData[index] = updatedPhoto;
    return updatedPhoto;
  }

  async deletePhoto(id: string): Promise<void> {
    await simulateDelay();
    
    const index = mockPhotosData.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Photo not found');
    }
    
    mockPhotosData.splice(index, 1);
  }

  async reorderPhotos(_propertyId: string, photoIds: string[]): Promise<void> {
    await simulateDelay();
    
    photoIds.forEach((photoId, index) => {
      const photoIndex = mockPhotosData.findIndex(p => p.id === photoId);
      if (photoIndex !== -1) {
        mockPhotosData[photoIndex] = {
          ...mockPhotosData[photoIndex],
          sort_order: index + 1,
        };
      }
    });
  }

  // Helper method to reset mock data to original state
  resetData(): void {
    mockPropertiesData = [...mockProperties];
    mockPhotosData = [...mockPropertyPhotos];
  }
}

export const mockPropertiesService = new MockPropertiesService();