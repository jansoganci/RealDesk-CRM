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
// Convert mock data to Tenant type by removing property_id (tenants are related via contracts)
let mockTenantsData: Tenant[] = mockTenants.map(({ property_id, ...tenant }) => tenant as Tenant);
const mockContractsData = [...mockContracts];

// Simulate network delay for realistic UX
const simulateDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

class MockTenantsService {
  async getAll(): Promise<TenantWithProperty[]> {
    await simulateDelay();
    
    return mockTenantsData
      .map(tenant => {
        // Find the active contract for this tenant
        const activeContract = mockContractsData.find(
          c => c.tenant_id === tenant.id && c.status === 'Active'
        );
        const property = activeContract 
          ? mockProperties.find(p => p.id === activeContract.property_id)
          : undefined;
        
        return {
          ...tenant,
          property,
        };
      })
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
    
    // Find the active contract for this tenant
    const activeContract = mockContractsData.find(
      c => c.tenant_id === tenant.id && c.status === 'Active'
    );
    const property = activeContract 
      ? mockProperties.find(p => p.id === activeContract.property_id)
      : undefined;
    
    return {
      ...tenant,
      property,
    };
  }

  async getByPropertyId(propertyId: string): Promise<Tenant[]> {
    await simulateDelay();
    
    // Find all tenants with active contracts for this property
    const tenantIdsWithContracts = mockContractsData
      .filter(c => c.property_id === propertyId && c.status === 'Active')
      .map(c => c.tenant_id);
    
    return mockTenantsData
      .filter(tenant => tenantIdsWithContracts.includes(tenant.id))
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getUnassigned(): Promise<Tenant[]> {
    await simulateDelay();
    
    // Find tenants without active contracts
    const tenantsWithActiveContracts = new Set(
      mockContractsData
        .filter(c => c.status === 'Active')
        .map(c => c.tenant_id)
    );
    
    return mockTenantsData
      .filter(tenant => !tenantsWithActiveContracts.has(tenant.id))
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

  async assignToProperty(tenantId: string, _propertyId: string | null): Promise<Tenant> {
    await simulateDelay();
    
    // In the new model, tenants are assigned via contracts, not directly
    // This method is kept for backward compatibility but doesn't modify tenant directly
    // The assignment should be done via contract creation/update
    // _propertyId parameter is unused but kept for API compatibility
    const tenant = mockTenantsData.find(t => t.id === tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    // Return the tenant as-is (assignment is handled via contracts)
    return tenant;
  }

  async getStats() {
    await simulateDelay();
    
    const total = mockTenantsData.length;
    // Count tenants with active contracts (assigned)
    const tenantsWithActiveContracts = new Set(
      mockContractsData
        .filter(c => c.status === 'Active')
        .map(c => c.tenant_id)
    );
    const assigned = mockTenantsData.filter(t => tenantsWithActiveContracts.has(t.id)).length;
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
      // Note: property_id is not part of Tenant - tenants are related to properties via contracts
      const newTenant: Tenant = {
        ...tenantData,
        id: `tenant-${Date.now()}`,
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
    // Convert mock data to Tenant type by removing property_id
    mockTenantsData = mockTenants.map(({ property_id, ...tenant }) => tenant as Tenant);
  }
}

export const mockTenantsService = new MockTenantsService();