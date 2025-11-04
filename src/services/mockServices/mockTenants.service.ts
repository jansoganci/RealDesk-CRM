import type { 
  Tenant, 
  TenantInsert, 
  TenantUpdate, 
  TenantWithProperty,
  Contract,
  TenantWithContractData,
  TenantWithContractResult
} from '../../types';
import { 
  mockTenants, 
  mockProperties, 
  mockContracts 
} from '../../data/mockData';

// In-memory data stores for mock service
let mockTenantsData = [...mockTenants];
const mockContractsData = [...mockContracts];

// Simulate network delay for realistic UX
const simulateDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

class MockTenantsService {
  async getAll(): Promise<TenantWithProperty[]> {
    await simulateDelay();
    
    return mockTenantsData
      .map(tenant => ({
        ...tenant,
        property: mockProperties.find(property => property.id === tenant.property_id),
      }))
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getById(id: string): Promise<TenantWithProperty | null> {
    await simulateDelay();
    
    const tenant = mockTenantsData.find(t => t.id === id);
    if (!tenant) return null;
    
    const property = mockProperties.find(p => p.id === tenant.property_id);
    
    return {
      ...tenant,
      property,
    };
  }

  async getByPropertyId(propertyId: string): Promise<Tenant[]> {
    await simulateDelay();
    
    return mockTenantsData
      .filter(tenant => tenant.property_id === propertyId)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getUnassigned(): Promise<Tenant[]> {
    await simulateDelay();
    
    return mockTenantsData
      .filter(tenant => !tenant.property_id)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }

  async create(tenant: TenantInsert): Promise<Tenant> {
    await simulateDelay();
    
    const newTenant: Tenant = {
      ...tenant,
      id: `tenant-${Date.now()}`,
      property_id: tenant.property_id ?? null,
      phone: tenant.phone ?? null,
      email: tenant.email ?? null,
      notes: tenant.notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    mockTenantsData.push(newTenant);
    return newTenant;
  }

  async update(id: string, tenant: TenantUpdate): Promise<Tenant> {
    await simulateDelay();
    
    const index = mockTenantsData.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Tenant not found');
    }
    
    const updatedTenant: Tenant = {
      ...mockTenantsData[index],
      ...tenant,
      updated_at: new Date().toISOString(),
    };
    
    mockTenantsData[index] = updatedTenant;
    return updatedTenant;
  }

  async delete(id: string): Promise<void> {
    await simulateDelay();
    
    const index = mockTenantsData.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Tenant not found');
    }
    
    // Check if tenant has active contracts
    const hasActiveContracts = mockContractsData.some(c => 
      c.tenant_id === id && c.status === 'Active'
    );
    if (hasActiveContracts) {
      throw new Error('Cannot delete tenant with active contracts');
    }
    
    mockTenantsData.splice(index, 1);
  }

  async assignToProperty(tenantId: string, propertyId: string | null): Promise<Tenant> {
    await simulateDelay();
    
    return this.update(tenantId, { property_id: propertyId });
  }

  async getStats() {
    await simulateDelay();
    
    const total = mockTenantsData.length;
    const assigned = mockTenantsData.filter(t => t.property_id !== null).length;
    const unassigned = total - assigned;
    
    return {
      total,
      assigned,
      unassigned,
    };
  }

  async getTenantsWithMissingInfo() {
    await simulateDelay();
    
    const missingInfo = {
      noPhone: 0,
      noEmail: 0,
      noContact: 0,
      total: 0,
    };

    mockTenantsData.forEach((t) => {
      const hasPhone = t.phone && t.phone.trim() !== '';
      const hasEmail = t.email && t.email.trim() !== '';
      
      if (!hasPhone) missingInfo.noPhone++;
      if (!hasEmail) missingInfo.noEmail++;
      if (!hasPhone && !hasEmail) {
        missingInfo.noContact++;
        missingInfo.total++;
      }
    });

    return missingInfo;
  }

  /**
   * Mock implementation of createTenantWithContract
   * Simulates atomic transaction by creating both tenant and contract
   */
  async createTenantWithContract(data: TenantWithContractData): Promise<TenantWithContractResult> {
    await simulateDelay(500); // Longer delay for complex operation
    
    const { tenant: tenantData, contract: contractData, pdfFile } = data;

    // Validate input data
    if (!tenantData.name || tenantData.name.trim() === '') {
      throw new Error('Tenant name is required');
    }
    
    if (!contractData.property_id) {
      throw new Error('Property selection is required');
    }
    
    if (!contractData.start_date || !contractData.end_date) {
      throw new Error('Contract dates are required');
    }
    
    // Validate end date is after start date
    const startDate = new Date(contractData.start_date);
    const endDate = new Date(contractData.end_date);
    
    if (endDate <= startDate) {
      throw new Error('Contract end date must be after start date');
    }

    try {
      // Step 1: Create the tenant
      const newTenant: Tenant = {
        ...tenantData,
        id: `tenant-${Date.now()}`,
        property_id: contractData.property_id ?? null, // Assign tenant to property
        phone: tenantData.phone ?? null,
        email: tenantData.email ?? null,
        notes: tenantData.notes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockTenantsData.push(newTenant);

      // Step 2: Create the contract
      const newContract: Contract = {
        ...contractData,
        id: `contract-${Date.now()}`,
        tenant_id: newTenant.id,
        rent_amount: contractData.rent_amount ?? null,
        status: contractData.status ?? 'Active',
        contract_pdf_path: contractData.contract_pdf_path ?? null,
        rent_increase_reminder_enabled: contractData.rent_increase_reminder_enabled ?? false,
        rent_increase_reminder_days: contractData.rent_increase_reminder_days ?? null,
        rent_increase_reminder_contacted: false,
        expected_new_rent: contractData.expected_new_rent ?? null,
        reminder_notes: contractData.reminder_notes ?? null,
        notes: contractData.notes ?? null,
        currency: contractData.currency ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockContractsData.push(newContract);

      // Step 3: Update property status if contract is Active
      if (contractData.status === 'Active') {
        // In a real mock service, we would also update the property status
        // This is handled by the mock properties service
      }

      // Simulate PDF file handling (in demo mode, we just acknowledge it)
      if (pdfFile) {
        console.log(`Demo: PDF file "${pdfFile.name}" would be uploaded for contract ${newContract.id}`);
      }

      return {
        tenant: newTenant,
        contract: newContract,
      };

    } catch (error) {
      console.error('Mock createTenantWithContract failed:', error);
      throw error;
    }
  }

  // Helper method to reset mock data to original state
  resetData(): void {
    mockTenantsData = [...mockTenants];
  }
}

export const mockTenantsService = new MockTenantsService();