
/**
 * Service Proxy - Routes between real and mock services based on demo mode
 * This allows seamless switching between production and demo data without changing components
 */

// Real services
import { ownersService as realOwnersService } from '../services/owners.service';
import { propertiesService as realPropertiesService } from '../services/properties.service';
import { tenantsService as realTenantsService } from '../services/tenants.service';
import { contractsService as realContractsService } from '../services/contracts.service';
import { remindersService as realRemindersService } from '../services/reminders.service';
import { photosService as realPhotosService } from '../services/photos.service';
import { inquiriesService as realInquiriesService } from '../services/inquiries.service';
import { meetingsService as realMeetingsService } from '../services/meetings.service';
import { commissionsService as realCommissionsService } from '../services/commissions.service';
import { userPreferencesService as realUserPreferencesService } from '../services/userPreferences.service';
import * as realFinancialTransactionsService from '../services/financialTransactions.service';

// Mock services
import { mockOwnersService } from '../services/mockServices/mockOwners.service';
import { mockPropertiesService } from '../services/mockServices/mockProperties.service';
import { mockTenantsService } from '../services/mockServices/mockTenants.service';
import { mockContractsService } from '../services/mockServices/mockContracts.service';
import { mockRemindersService } from '../services/mockServices/mockReminders.service';
import { mockInquiriesService } from '../services/mockServices/mockInquiries.service';
import { mockMeetingsService } from '../services/mockServices/mockMeetings.service';
import { userPreferencesService as mockUserPreferencesService } from '../services/mockServices/userPreferences.service';
import * as mockFinancialTransactionsService from '../services/mockServices/financialTransactions.service';

// Service type definitions using typeof
export type OwnersServiceType = typeof realOwnersService;
export type PropertiesServiceType = typeof realPropertiesService;
export type TenantsServiceType = typeof realTenantsService;
export type ContractsServiceType = typeof realContractsService;
export type RemindersServiceType = typeof realRemindersService;
export type InquiriesServiceType = typeof realInquiriesService;
export type MeetingsServiceType = typeof realMeetingsService;
export type CommissionsServiceType = typeof realCommissionsService;
export type UserPreferencesServiceType = typeof realUserPreferencesService;
export type FinancialTransactionsServiceType = typeof realFinancialTransactionsService;

/**
 * Check if we're in demo mode by accessing auth context
 * This function safely checks demo mode without causing circular dependencies
 */
function isDemoMode(): boolean {
  try {
    // Access the demo mode from localStorage or global state
    // We'll use a simple check that doesn't require importing useAuth
    return (window as any).__DEMO_MODE__ === true;
  } catch {
    return false;
  }
}

/**
 * Owners Service Proxy
 */
export const ownersService = new Proxy(realOwnersService, {
  get(target, prop) {
    const service = isDemoMode() ? mockOwnersService : target;
    const value = (service as any)[prop];
    
    if (typeof value === 'function') {
      return value.bind(service);
    }
    
    return value;
  }
}) as typeof realOwnersService;

/**
 * Properties Service Proxy
 */
export const propertiesService = new Proxy(realPropertiesService, {
  get(target, prop) {
    const service = isDemoMode() ? mockPropertiesService : target;
    const value = (service as any)[prop];
    
    if (typeof value === 'function') {
      return value.bind(service);
    }
    
    return value;
  }
}) as typeof realPropertiesService;

/**
 * Photos Service Proxy
 */
export const photosService = new Proxy(realPhotosService, {
  get(target, prop) {
    const service = isDemoMode() ? mockPropertiesService : target;
    const value = (service as any)[prop];
    
    if (typeof value === 'function') {
      return value.bind(service);
    }
    
    return value;
  }
}) as typeof realPhotosService;

/**
 * Tenants Service Proxy
 */
export const tenantsService = new Proxy(realTenantsService, {
  get(target, prop) {
    const service = isDemoMode() ? mockTenantsService : target;
    const value = (service as any)[prop];
    
    if (typeof value === 'function') {
      return value.bind(service);
    }
    
    return value;
  }
}) as typeof realTenantsService;

/**
 * Contracts Service Proxy
 */
export const contractsService = new Proxy(realContractsService, {
  get(target, prop) {
    const service = isDemoMode() ? mockContractsService : target;
    const value = (service as any)[prop];
    
    if (typeof value === 'function') {
      return value.bind(service);
    }
    
    return value;
  }
}) as typeof realContractsService;

/**
 * Reminders Service Proxy
 */
export const remindersService = new Proxy(realRemindersService, {
  get(target, prop) {
    const service = isDemoMode() ? mockRemindersService : target;
    const value = (service as any)[prop];

    if (typeof value === 'function') {
      return value.bind(service);
    }

    return value;
  }
}) as typeof realRemindersService;

/**
 * Inquiries Service Proxy
 */
export const inquiriesService = new Proxy(realInquiriesService, {
  get(target, prop) {
    const service = isDemoMode() ? mockInquiriesService : target;
    const value = (service as any)[prop];

    if (typeof value === 'function') {
      return value.bind(service);
    }

    return value;
  }
}) as typeof realInquiriesService;

/**
 * Meetings Service Proxy
 */
export const meetingsService = new Proxy(realMeetingsService, {
  get(target, prop) {
    const service = isDemoMode() ? mockMeetingsService : target;
    const value = (service as any)[prop];

    if (typeof value === 'function') {
      return value.bind(service);
    }

    return value;
  }
}) as typeof realMeetingsService;

/**
 * Commissions Service Proxy
 * Note: No mock service for commissions yet, always uses real service
 */
export const commissionsService = new Proxy(realCommissionsService, {
  get(target, prop) {
    const service = target; // Always use real service for now
    const value = (service as any)[prop];

    if (typeof value === 'function') {
      return value.bind(service);
    }

    return value;
  }
}) as typeof realCommissionsService;

/**
 * User Preferences Service Proxy
 */
export const userPreferencesService = new Proxy(realUserPreferencesService, {
  get(target, prop) {
    const service = isDemoMode() ? mockUserPreferencesService : target;
    const value = (service as any)[prop];

    if (typeof value === 'function') {
      return value.bind(service);
    }

    return value;
  }
}) as typeof realUserPreferencesService;

/**
 * Financial Transactions Service Proxy
 */
export const financialTransactionsService = new Proxy(realFinancialTransactionsService, {
  get(target, prop) {
    const service = isDemoMode() ? mockFinancialTransactionsService : target;
    const value = (service as any)[prop];

    if (typeof value === 'function') {
      return value.bind(service);
    }

    return value;
  }
}) as typeof realFinancialTransactionsService;

/**
 * Utility function to reset all mock data to original state
 * Useful for demo mode when user wants to start fresh
 */
export const resetMockData = () => {
  if (isDemoMode()) {
    mockOwnersService.resetData();
    mockPropertiesService.resetData();
    mockTenantsService.resetData();
    mockContractsService.resetData();
    mockInquiriesService.resetData();
    mockMeetingsService.resetData();

    console.log('Demo: Mock data reset to original state');
  }
};

/**
 * Utility function to check current service mode
 */
export const getCurrentServiceMode = () => {
  return isDemoMode() ? 'mock' : 'real';
};

/**
 * Utility function to get mock data statistics
 * Only works in demo mode
 */
export const getMockDataStats = async () => {
  if (!isDemoMode()) {
    throw new Error('Mock data stats only available in demo mode');
  }

  const [ownersStats, propertiesStats, tenantsStats, contractsStats, remindersStats, inquiriesStats, meetingsStats] = await Promise.all([
    mockOwnersService.getStats(),
    mockPropertiesService.getStats(),
    mockTenantsService.getStats(),
    mockContractsService.getStats(),
    mockRemindersService.getStats(),
    mockInquiriesService.getStats(),
    mockMeetingsService.getStats(),
  ]);

  return {
    owners: ownersStats,
    properties: propertiesStats,
    tenants: tenantsStats,
    contracts: contractsStats,
    reminders: remindersStats,
    inquiries: inquiriesStats,
    meetings: meetingsStats,
    mode: 'demo',
    timestamp: new Date().toISOString(),
  };
};

export type { ReminderWithDetails } from '../services/reminders.service';