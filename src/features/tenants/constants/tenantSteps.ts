import { Users, FileText, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Tenant Edit Dialog Steps Configuration
 * Defines the steps for the EnhancedTenantEditDialog multi-step form
 */

export interface TenantEditStep {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const TENANT_EDIT_STEPS: TenantEditStep[] = [
  {
    id: 1,
    title: 'Tenant Information',
    description: 'Basic tenant details',
    icon: Users,
  },
  {
    id: 2,
    title: 'Property & Contract',
    description: 'Property selection and contract details',
    icon: FileText,
  },
  {
    id: 3,
    title: 'Contract Settings',
    description: 'Reminders and document upload',
    icon: Settings,
  },
];

