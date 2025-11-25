import { useState } from 'react';
import type { PropertyInquiry, InquiryWithMatches } from '@/types';

export function useInquiryDialogs() {
  // Inquiry dialog state (create/edit)
  const [isInquiryDialogOpen, setIsInquiryDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<PropertyInquiry | null>(null);

  // Matches dialog state
  const [isMatchesDialogOpen, setIsMatchesDialogOpen] = useState(false);
  const [selectedInquiryForMatches, setSelectedInquiryForMatches] = useState<InquiryWithMatches | null>(null);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<PropertyInquiry | null>(null);

  // Inquiry dialog handlers
  const openInquiryDialog = () => {
    setSelectedInquiry(null);
    setIsInquiryDialogOpen(true);
  };

  const closeInquiryDialog = () => {
    setIsInquiryDialogOpen(false);
    setSelectedInquiry(null);
  };

  const openEditInquiryDialog = (inquiry: PropertyInquiry) => {
    setSelectedInquiry(inquiry);
    setIsInquiryDialogOpen(true);
  };

  // Matches dialog handlers
  const openMatchesDialog = (inquiry: InquiryWithMatches) => {
    setSelectedInquiryForMatches(inquiry);
    setIsMatchesDialogOpen(true);
  };

  const closeMatchesDialog = () => {
    setIsMatchesDialogOpen(false);
    setSelectedInquiryForMatches(null);
  };

  // Delete dialog handlers
  const openDeleteDialog = (inquiry: PropertyInquiry) => {
    setInquiryToDelete(inquiry);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setInquiryToDelete(null);
  };

  return {
    // Inquiry dialog
    isInquiryDialogOpen,
    selectedInquiry,
    openInquiryDialog,
    closeInquiryDialog,
    openEditInquiryDialog,

    // Matches dialog
    isMatchesDialogOpen,
    selectedInquiryForMatches,
    openMatchesDialog,
    closeMatchesDialog,

    // Delete dialog
    isDeleteDialogOpen,
    inquiryToDelete,
    openDeleteDialog,
    closeDeleteDialog,
  };
}

