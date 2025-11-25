import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  propertiesService,
  ownersService,
  tenantsService,
  contractsService,
  remindersService,
  inquiriesService,
  ReminderWithDetails,
} from '@/lib/serviceProxy';
import { transformDashboardData } from '../utils/transformDashboardData';

export interface DashboardStats {
  totalProperties: number;
  occupied: number;
  empty: number;
  inactive: number;
  totalOwners: number;
  totalTenants: number;
  unassignedTenants: number;
  activeContracts: number;
  expiringSoon: number;
  activeInquiries: number;
  rental: {
    total: number;
    empty: number;
    occupied: number;
    inactive: number;
  };
  sale: {
    total: number;
    available: number;
    underOffer: number;
    sold: number;
    inactive: number;
  };
  rentalInquiries: number;
  saleInquiries: number;
}

interface ActionItems {
  propertiesMissingInfo: {
    noPhotos: number;
    noLocation: number;
    total: number;
  };
  tenantsMissingInfo: {
    noPhone: number;
    noEmail: number;
    noContact: number;
    total: number;
  };
  ownersMissingInfo: {
    noPhone: number;
    noEmail: number;
    noContact: number;
    total: number;
  };
}

interface UseDashboardDataReturn {
  stats: DashboardStats;
  actionItems: ActionItems;
  reminders: ReminderWithDetails[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataReturn {
  const { t } = useTranslation('dashboard');
  
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    occupied: 0,
    empty: 0,
    inactive: 0,
    totalOwners: 0,
    totalTenants: 0,
    unassignedTenants: 0,
    activeContracts: 0,
    expiringSoon: 0,
    activeInquiries: 0,
    rental: {
      total: 0,
      empty: 0,
      occupied: 0,
      inactive: 0,
    },
    sale: {
      total: 0,
      available: 0,
      underOffer: 0,
      sold: 0,
      inactive: 0,
    },
    rentalInquiries: 0,
    saleInquiries: 0,
  });

  const [actionItems, setActionItems] = useState<ActionItems>({
    propertiesMissingInfo: {
      noPhotos: 0,
      noLocation: 0,
      total: 0,
    },
    tenantsMissingInfo: {
      noPhone: 0,
      noEmail: 0,
      noContact: 0,
      total: 0,
    },
    ownersMissingInfo: {
      noPhone: 0,
      noEmail: 0,
      noContact: 0,
      total: 0,
    },
  });

  const [reminders, setReminders] = useState<ReminderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        propertyStats,
        owners,
        tenantStats,
        contractStats,
        upcomingReminders,
        propertiesMissingInfo,
        tenantsMissingInfo,
        ownersMissingInfo,
        inquiryStats,
      ] = await Promise.all([
        propertiesService.getStats(),
        ownersService.getAll(),
        tenantsService.getStats(),
        contractsService.getStats(),
        remindersService.getUpcomingReminders(60),
        propertiesService.getPropertiesWithMissingInfo(),
        tenantsService.getTenantsWithMissingInfo(),
        ownersService.getOwnersWithMissingInfo(),
        inquiriesService.getStats(),
      ]);

      // Transform raw data into stats object
      setStats(
        transformDashboardData({
          propertyStats,
          owners,
          tenantStats,
          contractStats,
          inquiryStats,
        })
      );

      setActionItems({
        propertiesMissingInfo,
        tenantsMissingInfo,
        ownersMissingInfo,
      });

      setReminders(upcomingReminders);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast.error(t('errors.loadStatsFailed') || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    stats,
    actionItems,
    reminders,
    loading,
    refreshData,
  };
}

