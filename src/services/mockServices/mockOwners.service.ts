import type { 
  PropertyOwner, 
  PropertyOwnerInsert, 
  PropertyOwnerUpdate, 
  PropertyWithOwnerDetails 
} from '../../types';
import { mockPropertyOwners, mockProperties, mockPropertyPhotos } from '../../data/mockData';

// In-memory data store for mock service
let mockOwnersData = [...mockPropertyOwners];

// Simulate network delay for realistic UX
const simulateDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

class MockOwnersService {
  async getAll(): Promise<PropertyOwner[]> {
    await simulateDelay();
    return [...mockOwnersData].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getById(id: string): Promise<PropertyOwner | null> {
    await simulateDelay();
    return mockOwnersData.find(owner => owner.id === id) || null;
  }

  async create(owner: PropertyOwnerInsert): Promise<PropertyOwner> {
    await simulateDelay();
    
    const newOwner: PropertyOwner = {
      ...owner,
      id: `owner-${Date.now()}`,
      phone: owner.phone ?? null,
      email: owner.email ?? null,
      address: owner.address ?? null,
      notes: owner.notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    mockOwnersData.push(newOwner);
    return newOwner;
  }

  async update(id: string, owner: PropertyOwnerUpdate): Promise<PropertyOwner> {
    await simulateDelay();
    
    const index = mockOwnersData.findIndex(o => o.id === id);
    if (index === -1) {
      throw new Error('Owner not found');
    }
    
    const updatedOwner: PropertyOwner = {
      ...mockOwnersData[index],
      ...owner,
      updated_at: new Date().toISOString(),
    };
    
    mockOwnersData[index] = updatedOwner;
    return updatedOwner;
  }

  async delete(id: string): Promise<void> {
    await simulateDelay();
    
    const index = mockOwnersData.findIndex(o => o.id === id);
    if (index === -1) {
      throw new Error('Owner not found');
    }
    
    // Check if owner has properties
    const hasProperties = mockProperties.some(p => p.owner_id === id);
    if (hasProperties) {
      throw new Error('Cannot delete owner with associated properties');
    }
    
    mockOwnersData.splice(index, 1);
  }

  async getPropertiesByOwnerId(ownerId: string): Promise<PropertyWithOwnerDetails[]> {
    await simulateDelay();
    
    const owner = mockOwnersData.find(o => o.id === ownerId);
    if (!owner) {
      return [];
    }
    
    const ownerProperties = mockProperties
      .filter(p => p.owner_id === ownerId)
      .map(property => ({
        ...property,
        owner,
        photos: mockPropertyPhotos.filter(photo => photo.property_id === property.id),
      }));
    
    return ownerProperties;
  }

  async getStats() {
    await simulateDelay();
    
    const total = mockOwnersData.length;
    const withProperties = mockOwnersData.filter(owner => 
      mockProperties.some(p => p.owner_id === owner.id)
    ).length;
    const withoutProperties = total - withProperties;
    
    return {
      total,
      withProperties,
      withoutProperties,
    };
  }

  // Helper method to reset mock data to original state
  resetData(): void {
    mockOwnersData = [...mockPropertyOwners];
  }

  // Missing method that is called by the app
  async getOwnersWithPropertyCount(): Promise<(PropertyOwner & { property_count: number })[]> {
    await simulateDelay();
    
    return mockOwnersData.map(owner => ({
      ...owner,
      property_count: mockProperties.filter(p => p.owner_id === owner.id).length,
    })).sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getOwnersWithMissingInfo() {
    await simulateDelay();
    
    const missingInfo = {
      noPhone: 0,
      noEmail: 0,
      noContact: 0,
      total: 0,
    };

    mockOwnersData.forEach((o) => {
      const hasPhone = o.phone && o.phone.trim() !== '';
      const hasEmail = o.email && o.email.trim() !== '';
      
      if (!hasPhone) missingInfo.noPhone++;
      if (!hasEmail) missingInfo.noEmail++;
      if (!hasPhone && !hasEmail) {
        missingInfo.noContact++;
        missingInfo.total++;
      }
    });

    return missingInfo;
  }
}

export const mockOwnersService = new MockOwnersService();