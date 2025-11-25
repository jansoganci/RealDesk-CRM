import { useState } from 'react';
import type { PropertyWithOwner } from '@/types';

export function usePropertyDialogs() {
  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyWithOwner | null>(null);

  // Commission dialog state
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [commissionProperty, setCommissionProperty] = useState<PropertyWithOwner | null>(null);

  // Tenant dialog state
  const [isTenantDialogOpen, setIsTenantDialogOpen] = useState(false);
  const [selectedPropertyForTenant, setSelectedPropertyForTenant] = useState<string | null>(null);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyWithOwner | null>(null);

  // Mark as sold dialog state
  const [isMarkAsSoldDialogOpen, setIsMarkAsSoldDialogOpen] = useState(false);
  const [propertyToSell, setPropertyToSell] = useState<PropertyWithOwner | null>(null);

  // Create dialog handlers
  const openCreate = () => {
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
  };

  // Edit dialog handlers
  const openEdit = (property: PropertyWithOwner) => {
    setEditingProperty(property);
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditingProperty(null);
  };

  // Commission dialog handlers
  const openCommission = (property: PropertyWithOwner) => {
    setCommissionProperty(property);
    setIsCommissionOpen(true);
  };

  const closeCommission = () => {
    setIsCommissionOpen(false);
    setCommissionProperty(null);
  };

  // Tenant dialog handlers
  const openTenantDialog = (propertyId: string) => {
    setSelectedPropertyForTenant(propertyId);
    setIsTenantDialogOpen(true);
  };

  const closeTenantDialog = () => {
    setIsTenantDialogOpen(false);
    setSelectedPropertyForTenant(null);
  };

  // Delete dialog handlers
  const openDeleteDialog = (property: PropertyWithOwner) => {
    setPropertyToDelete(property);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setPropertyToDelete(null);
  };

  // Mark as sold dialog handlers
  const openMarkAsSoldDialog = (property: PropertyWithOwner) => {
    setPropertyToSell(property);
    setIsMarkAsSoldDialogOpen(true);
  };

  const closeMarkAsSoldDialog = () => {
    setIsMarkAsSoldDialogOpen(false);
    setPropertyToSell(null);
  };

  return {
    // Create dialog
    isCreateOpen,
    openCreate,
    closeCreate,

    // Edit dialog
    isEditOpen,
    editingProperty,
    openEdit,
    closeEdit,

    // Commission dialog
    isCommissionOpen,
    commissionProperty,
    openCommission,
    closeCommission,

    // Tenant dialog
    isTenantDialogOpen,
    selectedPropertyForTenant,
    openTenantDialog,
    closeTenantDialog,

    // Delete dialog
    isDeleteDialogOpen,
    propertyToDelete,
    openDeleteDialog,
    closeDeleteDialog,

    // Mark as sold dialog
    isMarkAsSoldDialogOpen,
    propertyToSell,
    openMarkAsSoldDialog,
    closeMarkAsSoldDialog,
  };
}

