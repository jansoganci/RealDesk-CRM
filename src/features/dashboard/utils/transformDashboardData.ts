import type { DashboardStats } from '../hooks/useDashboardData';

interface RawDashboardData {
  propertyStats: {
    total: number;
    occupied: number;
    empty: number;
    inactive: number;
    rental?: {
      total: number;
      empty: number;
      occupied: number;
      inactive: number;
    };
    sale?: {
      total: number;
      available: number;
      underOffer: number;
      sold: number;
      inactive: number;
    };
  };
  owners: Array<unknown>;
  tenantStats: {
    total: number;
    unassigned: number;
  };
  contractStats: {
    active: number;
    expiringSoon: number;
  };
  inquiryStats: {
    active: number;
    rental?: { active: number };
    sale?: { active: number };
  };
}

/**
 * Transforms raw dashboard data from multiple API calls into a unified stats object
 */
export function transformDashboardData(rawData: RawDashboardData): DashboardStats {
  const { propertyStats, owners, tenantStats, contractStats, inquiryStats } = rawData;

  return {
    totalProperties: propertyStats.total,
    occupied: propertyStats.occupied,
    empty: propertyStats.empty,
    inactive: propertyStats.inactive,
    totalOwners: owners.length,
    totalTenants: tenantStats.total,
    unassignedTenants: tenantStats.unassigned,
    activeContracts: contractStats.active,
    expiringSoon: contractStats.expiringSoon,
    activeInquiries: inquiryStats.active,
    rental: propertyStats.rental || {
      total: 0,
      empty: 0,
      occupied: 0,
      inactive: 0,
    },
    sale: propertyStats.sale || {
      total: 0,
      available: 0,
      underOffer: 0,
      sold: 0,
      inactive: 0,
    },
    rentalInquiries: inquiryStats.rental?.active || 0,
    saleInquiries: inquiryStats.sale?.active || 0,
  };
}

