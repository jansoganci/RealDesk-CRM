import { Button } from '../../components/ui/button';
import { TableActionButtons } from '../../components/common/TableActionButtons';
import { FileDown, Upload, Loader2 } from 'lucide-react';
import type { ContractWithDetails } from '../../../types';

/**
 * Contract PDF Action Buttons Component
 * Renders PDF download/upload buttons along with edit/delete action buttons
 */

interface ContractPdfActionButtonsProps {
  contract: ContractWithDetails;
  uploadingContractId: string | null;
  actionLoading: boolean;
  pdfActionLoading: boolean;
  onDownload: (contract: ContractWithDetails) => void;
  onUpload: (contractId: string) => void;
  onEdit: (contract: ContractWithDetails) => void;
  onDelete: (contract: ContractWithDetails) => void;
}

export function ContractPdfActionButtons({
  contract,
  uploadingContractId,
  actionLoading,
  pdfActionLoading,
  onDownload,
  onUpload,
  onEdit,
  onDelete,
}: ContractPdfActionButtonsProps) {
  const hasPdf = !!contract.contract_pdf_path;
  const isUploading = uploadingContractId === contract.id;

  return (
    <div className="flex items-center gap-1">
      {hasPdf ? (
        // Download PDF Button
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload(contract)}
          disabled={actionLoading || pdfActionLoading}
          className="h-8 px-2"
          title="PDF İndir"
        >
          <FileDown className="h-4 w-4" />
        </Button>
      ) : (
        // Upload PDF Button
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUpload(contract.id)}
          disabled={actionLoading || isUploading}
          className="h-8 px-2"
          title="PDF Yükle"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Existing Edit/Delete buttons */}
      <TableActionButtons
        onEdit={() => onEdit(contract)}
        onDelete={() => onDelete(contract)}
        showView={false}
      />
    </div>
  );
}

