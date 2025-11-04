import type { 
  Contract, 
  ContractInsert, 
  ContractUpdate, 
  ContractWithDetails
} from '../../types';
import { 
  mockContracts, 
  mockTenants, 
  mockProperties
} from '../../data/mockData';
import { getToday, addDaysToDate, formatDateForDb } from '../../lib/dates';

// In-memory data store for mock service
let mockContractsData = [...mockContracts];

// Simulate network delay for realistic UX
const simulateDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

class MockContractsService {
  async getAll(): Promise<ContractWithDetails[]> {
    await simulateDelay();
    
    return mockContractsData
      .map(contract => ({
        ...contract,
        tenant: mockTenants.find(tenant => tenant.id === contract.tenant_id),
        property: mockProperties.find(property => property.id === contract.property_id),
      }))
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getById(id: string): Promise<ContractWithDetails | null> {
    await simulateDelay();
    
    const contract = mockContractsData.find(c => c.id === id);
    if (!contract) return null;
    
    const tenant = mockTenants.find(t => t.id === contract.tenant_id);
    const property = mockProperties.find(p => p.id === contract.property_id);
    
    return {
      ...contract,
      tenant,
      property,
    };
  }

  async getByTenantId(tenantId: string): Promise<Contract[]> {
    await simulateDelay();
    
    return mockContractsData
      .filter(contract => contract.tenant_id === tenantId)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getByPropertyId(propertyId: string): Promise<Contract[]> {
    await simulateDelay();
    
    return mockContractsData
      .filter(contract => contract.property_id === propertyId)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getActiveContracts(): Promise<ContractWithDetails[]> {
    await simulateDelay();
    
    return mockContractsData
      .filter(contract => contract.status === 'Active')
      .map(contract => ({
        ...contract,
        tenant: mockTenants.find(tenant => tenant.id === contract.tenant_id),
        property: mockProperties.find(property => property.id === contract.property_id),
      }))
      .sort((a, b) => {
        const dateA = a.end_date ? new Date(a.end_date).getTime() : 0;
        const dateB = b.end_date ? new Date(b.end_date).getTime() : 0;
        return dateA - dateB;
      });
  }

  async getExpiringContracts(days: number = 30): Promise<ContractWithDetails[]> {
    await simulateDelay();
    
    const today = getToday();
    const futureDate = addDaysToDate(today, days);
    const todayFormatted = formatDateForDb(today);
    const futureDateFormatted = formatDateForDb(futureDate);
    
    return mockContractsData
      .filter(contract => {
        if (contract.status !== 'Active') return false;
        return contract.end_date >= todayFormatted && contract.end_date <= futureDateFormatted;
      })
      .map(contract => ({
        ...contract,
        tenant: mockTenants.find(tenant => tenant.id === contract.tenant_id),
        property: mockProperties.find(property => property.id === contract.property_id),
      }))
      .sort((a, b) => {
        const dateA = a.end_date ? new Date(a.end_date).getTime() : 0;
        const dateB = b.end_date ? new Date(b.end_date).getTime() : 0;
        return dateA - dateB;
      });
  }

  async create(contract: ContractInsert): Promise<Contract> {
    await simulateDelay();
    
    const newContract: Contract = {
      ...contract,
      id: `contract-${Date.now()}`,
      rent_amount: contract.rent_amount ?? null,
      status: contract.status ?? 'Active',
      contract_pdf_path: contract.contract_pdf_path ?? null,
      rent_increase_reminder_enabled: contract.rent_increase_reminder_enabled ?? false,
      rent_increase_reminder_days: contract.rent_increase_reminder_days ?? null,
      rent_increase_reminder_contacted: contract.rent_increase_reminder_contacted ?? false,
      expected_new_rent: contract.expected_new_rent ?? null,
      reminder_notes: contract.reminder_notes ?? null,
      notes: contract.notes ?? null,
      currency: contract.currency ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    mockContractsData.push(newContract);
    return newContract;
  }

  async update(id: string, contract: ContractUpdate): Promise<Contract> {
    await simulateDelay();
    
    const index = mockContractsData.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Contract not found');
    }
    
    const updatedContract: Contract = {
      ...mockContractsData[index],
      ...contract,
      updated_at: new Date().toISOString(),
    };
    
    mockContractsData[index] = updatedContract;
    return updatedContract;
  }

  async delete(id: string): Promise<void> {
    await simulateDelay();
    
    const index = mockContractsData.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Contract not found');
    }
    
    mockContractsData.splice(index, 1);
  }

  async updateStatus(id: string, status: 'Active' | 'Inactive' | 'Archived'): Promise<Contract> {
    await simulateDelay();
    
    return this.update(id, { status });
  }

  async getRentIncreaseReminders(): Promise<ContractWithDetails[]> {
    await simulateDelay();
    
    const today = new Date();
    
    return mockContractsData
      .filter(contract => {
        if (contract.status !== 'Active' || !contract.rent_increase_reminder_enabled) {
          return false;
        }
        
        const endDate = new Date(contract.end_date);
        const reminderDate = new Date(endDate);
        reminderDate.setDate(endDate.getDate() - (contract.rent_increase_reminder_days || 90));
        
        return today >= reminderDate && today <= endDate && !contract.rent_increase_reminder_contacted;
      })
      .map(contract => ({
        ...contract,
        tenant: mockTenants.find(tenant => tenant.id === contract.tenant_id),
        property: mockProperties.find(property => property.id === contract.property_id),
      }))
      .sort((a, b) => {
        const dateA = a.end_date ? new Date(a.end_date).getTime() : 0;
        const dateB = b.end_date ? new Date(b.end_date).getTime() : 0;
        return dateA - dateB;
      });
  }

  async markReminderContacted(id: string): Promise<Contract> {
    await simulateDelay();
    
    return this.update(id, { rent_increase_reminder_contacted: true });
  }

  async getStats() {
    await simulateDelay();
    
    const all = mockContractsData;
    const active = all.filter(c => c.status === 'Active').length;
    const archived = all.filter(c => c.status === 'Archived').length;
    const inactive = all.filter(c => c.status === 'Inactive').length;
    
    // Calculate expiring contracts (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const expiring = all.filter(c => {
      if (c.status !== 'Active') return false;
      const endDate = new Date(c.end_date);
      return endDate >= today && endDate <= thirtyDaysFromNow;
    }).length;
    
    return {
      total: all.length,
      active,
      archived,
      inactive,
      expiring,
    };
  }

  // PDF file handling methods (mocked)
  async uploadContractPdf(file: File, contractId: string): Promise<string> {
    await simulateDelay(800); // Longer delay for file upload simulation
    
    // In demo mode, we just simulate the upload
    const mockPath = `/demo-contracts/${contractId}_${file.name}`;
    console.log(`Demo: PDF file "${file.name}" uploaded to ${mockPath}`);
    
    return mockPath;
  }

  async uploadContractPdfAndPersist(file: File, contractId: string): Promise<void> {
    await simulateDelay(800);
    
    const filePath = await this.uploadContractPdf(file, contractId);
    
    // Update contract with PDF path
    const contractIndex = mockContractsData.findIndex(c => c.id === contractId);
    if (contractIndex !== -1) {
      mockContractsData[contractIndex] = {
        ...mockContractsData[contractIndex],
        contract_pdf_path: filePath,
        updated_at: new Date().toISOString(),
      };
    }
  }

  async deleteContractPdf(contractId: string): Promise<void> {
    await simulateDelay();
    
    const contractIndex = mockContractsData.findIndex(c => c.id === contractId);
    if (contractIndex !== -1) {
      mockContractsData[contractIndex] = {
        ...mockContractsData[contractIndex],
        contract_pdf_path: null,
        updated_at: new Date().toISOString(),
      };
    }
  }

  // Helper method to reset mock data to original state
  resetData(): void {
    mockContractsData = [...mockContracts];
  }
}

export const mockContractsService = new MockContractsService();