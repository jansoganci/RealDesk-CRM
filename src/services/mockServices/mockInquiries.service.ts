 import type {
  PropertyInquiry,
  PropertyInquiryInsert,
  PropertyInquiryUpdate,
  InquiryMatch,
  InquiryWithMatches,
  InquiryMatchWithProperty,
} from '../../types';

// Mock data stores
let mockInquiriesData: PropertyInquiry[] = [
  {
    id: 'inquiry-1',
    name: 'Ahmet Yılmaz',
    phone: '+90 532 123 4567',
    email: 'ahmet@example.com',
    preferred_city: 'Istanbul',
    preferred_district: 'Kadıköy',
    min_budget: 15000,
    max_budget: 25000,
    status: 'active',
    notes: 'Looking for a 3+1 apartment',
    created_at: new Date('2025-01-01').toISOString(),
    updated_at: new Date('2025-01-01').toISOString(),
    user_id: 'mock-user-id',
  },
  {
    id: 'inquiry-2',
    name: 'Ayşe Demir',
    phone: '+90 533 987 6543',
    email: 'ayse@example.com',
    preferred_city: 'Ankara',
    preferred_district: 'Çankaya',
    min_budget: 10000,
    max_budget: 18000,
    status: 'matched',
    notes: 'Prefers ground floor',
    created_at: new Date('2025-01-03').toISOString(),
    updated_at: new Date('2025-01-03').toISOString(),
    user_id: 'mock-user-id',
  },
];

let mockMatchesData: InquiryMatch[] = [
  {
    id: 'match-1',
    inquiry_id: 'inquiry-2',
    property_id: 'property-1',
    matched_at: new Date('2025-01-04').toISOString(),
    notification_sent: false,
    contacted: false,
    user_id: 'mock-user-id',
  },
];

// Simulate network delay for realistic UX
const simulateDelay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

class MockInquiriesService {
  async getAll(): Promise<PropertyInquiry[]> {
    await simulateDelay();

    return [...mockInquiriesData].sort(
      (a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
    );
  }

  async getById(id: string): Promise<InquiryWithMatches | null> {
    await simulateDelay();

    const inquiry = mockInquiriesData.find((i) => i.id === id);
    if (!inquiry) return null;

    const matches = await this.getMatchesByInquiry(id);

    return {
      ...inquiry,
      matches,
    };
  }

  async create(inquiry: PropertyInquiryInsert): Promise<PropertyInquiry> {
    await simulateDelay();

    const newInquiry: PropertyInquiry = {
      ...inquiry,
      id: `inquiry-${Date.now()}`,
      email: inquiry.email ?? null,
      preferred_city: inquiry.preferred_city ?? null,
      preferred_district: inquiry.preferred_district ?? null,
      min_budget: inquiry.min_budget ?? null,
      max_budget: inquiry.max_budget ?? null,
      status: inquiry.status ?? 'active',
      notes: inquiry.notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: inquiry.user_id || 'mock-user-id', // Ensure user_id is present
    };

    mockInquiriesData.push(newInquiry);
    return newInquiry;
  }

  async update(
    id: string,
    inquiry: PropertyInquiryUpdate
  ): Promise<PropertyInquiry> {
    await simulateDelay();

    const index = mockInquiriesData.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error('Inquiry not found');
    }

    const updatedInquiry: PropertyInquiry = {
      ...mockInquiriesData[index],
      ...inquiry,
      updated_at: new Date().toISOString(),
    };

    mockInquiriesData[index] = updatedInquiry;
    return updatedInquiry;
  }

  async delete(id: string): Promise<void> {
    await simulateDelay();

    const index = mockInquiriesData.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error('Inquiry not found');
    }

    // Remove associated matches
    mockMatchesData = mockMatchesData.filter((m) => m.inquiry_id !== id);

    // Remove inquiry
    mockInquiriesData.splice(index, 1);
  }

  async checkMatchesForNewProperty(propertyId: string): Promise<void> {
    await simulateDelay();

    // Mock implementation - in real app, would fetch property and run matching
    // For mock, we'll just simulate the behavior without actual matching
    console.log('Mock: Checking matches for property', propertyId);
  }

  async checkMatchesForPropertyUpdate(propertyId: string): Promise<void> {
    await this.checkMatchesForNewProperty(propertyId);
  }

  async markAsContacted(inquiryId: string): Promise<void> {
    await simulateDelay();

    // Update inquiry status to 'contacted'
    await this.update(inquiryId, { status: 'contacted' });

    // Mark all matches for this inquiry as contacted
    mockMatchesData = mockMatchesData.map((match) =>
      match.inquiry_id === inquiryId ? { ...match, contacted: true } : match
    );
  }

  async markNotificationSent(matchId: string): Promise<void> {
    await simulateDelay();

    const index = mockMatchesData.findIndex((m) => m.id === matchId);
    if (index !== -1) {
      mockMatchesData[index] = {
        ...mockMatchesData[index],
        notification_sent: true,
      };
    }
  }

  async getStats() {
    await simulateDelay();

    const stats = {
      total: mockInquiriesData.length || 0,
      active:
        mockInquiriesData.filter((i) => i.status === 'active').length || 0,
      matched:
        mockInquiriesData.filter((i) => i.status === 'matched').length || 0,
      contacted:
        mockInquiriesData.filter((i) => i.status === 'contacted').length || 0,
      closed:
        mockInquiriesData.filter((i) => i.status === 'closed').length || 0,
    };

    return stats;
  }

  async getActiveInquiries(): Promise<PropertyInquiry[]> {
    await simulateDelay();

    return mockInquiriesData
      .filter((i) => i.status === 'active')
      .sort(
        (a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        }
      );
  }

  async getUnreadMatchesCount(): Promise<number> {
    await simulateDelay();

    return mockMatchesData.filter((m) => !m.notification_sent).length;
  }

  async getMatchesByInquiry(
    inquiryId: string
  ): Promise<InquiryMatchWithProperty[]> {
    await simulateDelay();

    const matches = mockMatchesData.filter((m) => m.inquiry_id === inquiryId);

    // In mock, we don't have properties data here, so return matches without properties
    return matches.map((match) => ({
      ...match,
      property: undefined,
    }));
  }

  // Helper method to reset mock data to original state
  resetData(): void {
    mockInquiriesData = [
      {
        id: 'inquiry-1',
        name: 'Ahmet Yılmaz',
        phone: '+90 532 123 4567',
        email: 'ahmet@example.com',
        preferred_city: 'Istanbul',
        preferred_district: 'Kadıköy',
        min_budget: 15000,
        max_budget: 25000,
        status: 'active',
        notes: 'Looking for a 3+1 apartment',
        created_at: new Date('2025-01-01').toISOString(),
        updated_at: new Date('2025-01-01').toISOString(),
        user_id: 'mock-user-id',
      },
      {
        id: 'inquiry-2',
        name: 'Ayşe Demir',
        phone: '+90 533 987 6543',
        email: 'ayse@example.com',
        preferred_city: 'Ankara',
        preferred_district: 'Çankaya',
        min_budget: 10000,
        max_budget: 18000,
        status: 'matched',
        notes: 'Prefers ground floor',
        created_at: new Date('2025-01-03').toISOString(),
        updated_at: new Date('2025-01-03').toISOString(),
        user_id: 'mock-user-id',
      },
    ];

    mockMatchesData = [
      {
        id: 'match-1',
        inquiry_id: 'inquiry-2',
        property_id: 'property-1',
        matched_at: new Date('2025-01-04').toISOString(),
        notification_sent: false,
        contacted: false,
        user_id: 'mock-user-id',
      },
    ];
  }
}

export const mockInquiriesService = new MockInquiriesService();
