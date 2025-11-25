/**
 * useConfirmationDialog
 *
 * Custom hook for managing confirmation dialog state
 * Provides a Promise-based API for showing confirmations
 */

import { useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
}

export interface UseConfirmationDialogReturn {
  dialogState: ConfirmDialogState;
  showConfirmation: (title: string, message: string) => Promise<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
  closeDialog: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useConfirmationDialog(): UseConfirmationDialogReturn {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
  });

  // Store resolve function for the current promise
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const showConfirmation = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setResolveRef(() => resolve);
      setDialogState({
        open: true,
        title,
        message,
      });
    });
  }, []);

  const onConfirm = useCallback(() => {
    setDialogState(prev => ({ ...prev, open: false }));
    if (resolveRef) {
      resolveRef(true);
      setResolveRef(null);
    }
  }, [resolveRef]);

  const onCancel = useCallback(() => {
    setDialogState(prev => ({ ...prev, open: false }));
    if (resolveRef) {
      resolveRef(false);
      setResolveRef(null);
    }
  }, [resolveRef]);

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, open: false }));
    if (resolveRef) {
      resolveRef(false);
      setResolveRef(null);
    }
  }, [resolveRef]);

  return {
    dialogState,
    showConfirmation,
    onConfirm,
    onCancel,
    closeDialog,
  };
}
