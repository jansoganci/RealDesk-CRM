import { useState } from 'react';
import type { TenantWithProperty } from '@/types';

/**
 * Tenant Dialogs Hook
 * Manages all dialog states and handlers for tenant operations (create, edit, delete)
 */

interface UseTenantDialogsReturn {
  // Create dialog
  isCreateOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;

  // Edit dialog
  isEditOpen: boolean;
  selectedTenant: TenantWithProperty | null;
  openEdit: (tenant: TenantWithProperty) => void;
  closeEdit: () => void;

  // Delete dialog
  isDeleteDialogOpen: boolean;
  tenantToDelete: TenantWithProperty | null;
  openDeleteDialog: (tenant: TenantWithProperty) => void;
  closeDeleteDialog: () => void;
}

export function useTenantDialogs(): UseTenantDialogsReturn {
  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithProperty | null>(null);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<TenantWithProperty | null>(null);

  // Create dialog handlers
  const openCreate = () => {
    setSelectedTenant(null);
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    setSelectedTenant(null);
  };

  // Edit dialog handlers
  const openEdit = (tenant: TenantWithProperty) => {
    setSelectedTenant(tenant);
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setSelectedTenant(null);
  };

  // Delete dialog handlers
  const openDeleteDialog = (tenant: TenantWithProperty) => {
    setTenantToDelete(tenant);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setTenantToDelete(null);
  };

  return {
    // Create dialog
    isCreateOpen,
    openCreate,
    closeCreate,

    // Edit dialog
    isEditOpen,
    selectedTenant,
    openEdit,
    closeEdit,

    // Delete dialog
    isDeleteDialogOpen,
    tenantToDelete,
    openDeleteDialog,
    closeDeleteDialog,
  };
}

