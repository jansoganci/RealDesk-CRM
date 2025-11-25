import { useState, useEffect } from 'react';

/**
 * PDF File Management Hook
 * Handles PDF file state and resets on dialog close
 */

interface UsePdfFileManagementOptions {
  open: boolean;
}

interface UsePdfFileManagementReturn {
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
}

/**
 * Hook for managing PDF file state
 * Automatically resets PDF file when dialog closes
 */
export function usePdfFileManagement({
  open,
}: UsePdfFileManagementOptions): UsePdfFileManagementReturn {
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Reset PDF file when dialog closes
  useEffect(() => {
    if (!open) {
      setPdfFile(null);
    }
  }, [open]);

  return {
    pdfFile,
    setPdfFile,
  };
}

