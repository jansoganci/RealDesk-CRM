/**
 * Contract PDF Engine Service V2
 * Shared PDF generation, storage, and download service for all v2 contract types
 *
 * Features:
 * - Turkish character support via embedded Roboto fonts (İ, ı, Ş, ş, Ğ, ğ, Ü, ü, Ö, ö, Ç, ç)
 * - Template-based PDF generation
 * - Supabase storage integration
 * - Browser download triggers
 *
 * Reference: IMPL-SPEC-contract-pdf-engine-v2.md
 * Architecture: docs/reference/ADR-002-contract-engine-v2-architecture.md
 * Font System: See src/services/pdfFonts.ts for font registration details
 *
 * IMPORTANT: This service is for v2 contract types ONLY (sale, commission, showing).
 * It does NOT handle Rent contracts (those use the legacy contractPdf.service.ts).
 */

import jsPDF from 'jspdf';
import { addTurkishFonts } from './pdfFonts';
import { supabase } from '../config/supabase';
import { contractBuilderService } from './contractBuilder.service';
import { generateSalePdfTemplate } from '../templates/salePdf.template';

// ============================================================================
// Types
// ============================================================================

export type V2ContractType = 'sale' | 'commission' | 'showing';

export interface PdfTemplateSection {
  type: 'title' | 'heading' | 'paragraph' | 'table' | 'signature' | 'spacer';
  content?: string;
  data?: Record<string, string>[];
  options?: {
    fontSize?: number;
    bold?: boolean;
    align?: 'left' | 'center' | 'right';
  };
}

export interface PdfTemplate {
  metadata: {
    title: string;
    author: string;
    subject: string;
  };
  sections: PdfTemplateSection[];
}

export type TemplateGenerator<T> = (formData: T, instanceId: string) => PdfTemplate;

export interface PdfGenerationResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

export interface PdfUploadResult {
  success: boolean;
  storagePath?: string;
  error?: string;
}

export interface PdfDownloadResult {
  success: boolean;
  signedUrl?: string;
  error?: string;
}

export interface GenerateAndSaveResult {
  success: boolean;
  storagePath?: string;
  downloadTriggered: boolean;
  error?: string;
}

// ============================================================================
// Template Registry
// ============================================================================

const templateRegistry: Record<V2ContractType, TemplateGenerator<any>> = {
  sale: generateSalePdfTemplate,
  commission: () => {
    throw new Error('Commission template not implemented yet');
  },
  showing: () => {
    throw new Error('Showing template not implemented yet');
  },
};

// ============================================================================
// Service Implementation
// ============================================================================

class ContractPdfEngineService {
  private readonly STORAGE_BUCKET = 'contract-pdfs';
  private readonly PAGE_MARGIN = 20;
  private readonly LINE_HEIGHT = 7;

  /**
   * Generate PDF blob from contract instance data
   */
  async generatePdf(
    type: V2ContractType,
    formData: Record<string, unknown>,
    instanceId: string
  ): Promise<PdfGenerationResult> {
    try {
      // 1. Get template generator for type
      const templateGenerator = templateRegistry[type];
      if (!templateGenerator) {
        return { success: false, error: `No template for type: ${type}` };
      }

      // 2. Generate template structure
      const template = templateGenerator(formData, instanceId);

      // 3. Create jsPDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add Turkish font support (Roboto with full Unicode)
      // Enables rendering of Turkish characters: İ, ı, Ş, ş, Ğ, ğ, Ü, ü, Ö, ö, Ç, ç
      addTurkishFonts(doc);

      // 4. Set metadata
      doc.setProperties({
        title: template.metadata.title,
        author: template.metadata.author,
        subject: template.metadata.subject,
      });

      // 5. Render sections
      let yPosition = this.PAGE_MARGIN;
      for (const section of template.sections) {
        yPosition = this.renderSection(doc, section, yPosition);
      }

      // 6. Output as blob
      const blob = doc.output('blob');

      return { success: true, blob };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
      };
    }
  }

  /**
   * Upload PDF blob to Supabase Storage
   */
  async uploadPdf(
    blob: Blob,
    type: V2ContractType,
    userId: string,
    instanceId: string
  ): Promise<PdfUploadResult> {
    try {
      const storagePath = `v2/${type}/${userId}/${instanceId}.pdf`;

      const { error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(storagePath, blob, {
          contentType: 'application/pdf',
          upsert: true, // Replace if exists (for regeneration)
        });

      if (error) throw error;

      return { success: true, storagePath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Get signed download URL for existing PDF
   */
  async getDownloadUrl(storagePath: string): Promise<PdfDownloadResult> {
    try {
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .createSignedUrl(storagePath, 60 * 60); // 1 hour expiry

      if (error) throw error;

      return { success: true, signedUrl: data.signedUrl };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get download URL',
      };
    }
  }

  /**
   * Delete PDF from storage
   */
  async deletePdf(storagePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([storagePath]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  /**
   * Full pipeline: generate + upload + update DB + trigger download
   */
  async generateAndSave(
    type: V2ContractType,
    formData: Record<string, unknown>,
    instanceId: string,
    userId: string,
    triggerDownload: boolean = true
  ): Promise<GenerateAndSaveResult> {
    // Step 1: Generate PDF
    const genResult = await this.generatePdf(type, formData, instanceId);
    if (!genResult.success || !genResult.blob) {
      return { success: false, downloadTriggered: false, error: genResult.error };
    }

    // Step 2: Upload to storage
    const uploadResult = await this.uploadPdf(genResult.blob, type, userId, instanceId);
    if (!uploadResult.success) {
      // Storage failed - still trigger download so user has the PDF
      if (triggerDownload) {
        this.triggerBrowserDownload(
          genResult.blob,
          `${type}_contract_${instanceId.slice(0, 8)}.pdf`
        );
      }
      return {
        success: false,
        downloadTriggered: triggerDownload,
        error: `Upload failed: ${uploadResult.error}. PDF downloaded locally.`,
      };
    }

    // Step 3: Update database with pdf_path
    try {
      await contractBuilderService.updateInstance(instanceId, {
        pdf_path: uploadResult.storagePath,
      });
    } catch (error) {
      // Log but continue - PDF exists even if path not saved
      console.error('Failed to update pdf_path in database:', error);
    }

    // Step 4: Trigger browser download
    let downloadTriggered = false;
    if (triggerDownload) {
      this.triggerBrowserDownload(
        genResult.blob,
        `${type}_contract_${instanceId.slice(0, 8)}.pdf`
      );
      downloadTriggered = true;
    }

    return {
      success: true,
      storagePath: uploadResult.storagePath,
      downloadTriggered,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Render a single PDF section using jsPDF
   */
  private renderSection(doc: jsPDF, section: PdfTemplateSection, yPosition: number): number {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const maxWidth = pageWidth - 2 * this.PAGE_MARGIN;

    // Check if we need a new page
    if (yPosition > pageHeight - this.PAGE_MARGIN) {
      doc.addPage();
      yPosition = this.PAGE_MARGIN;
    }

    switch (section.type) {
      case 'title':
        doc.setFontSize(section.options?.fontSize || 18);
        doc.setFont('Roboto', section.options?.bold !== false ? 'bold' : 'normal');
        const titleAlign = section.options?.align || 'center';
        const titleX =
          titleAlign === 'center'
            ? pageWidth / 2
            : titleAlign === 'right'
            ? pageWidth - this.PAGE_MARGIN
            : this.PAGE_MARGIN;
        doc.text(section.content || '', titleX, yPosition, { align: titleAlign });
        yPosition += this.LINE_HEIGHT * 2;
        break;

      case 'heading':
        doc.setFontSize(section.options?.fontSize || 12);
        doc.setFont('Roboto', section.options?.bold !== false ? 'bold' : 'normal');
        doc.text(section.content || '', this.PAGE_MARGIN, yPosition);
        yPosition += this.LINE_HEIGHT;
        break;

      case 'paragraph':
        doc.setFontSize(section.options?.fontSize || 10);
        doc.setFont('Roboto', section.options?.bold ? 'bold' : 'normal');
        const paragraphAlign = section.options?.align || 'left';
        const paragraphX =
          paragraphAlign === 'center'
            ? pageWidth / 2
            : paragraphAlign === 'right'
            ? pageWidth - this.PAGE_MARGIN
            : this.PAGE_MARGIN;

        const lines = doc.splitTextToSize(section.content || '', maxWidth);
        doc.text(lines, paragraphX, yPosition, { align: paragraphAlign });
        yPosition += lines.length * this.LINE_HEIGHT;
        break;

      case 'table':
        doc.setFontSize(10);
        doc.setFont('Roboto', 'normal');
        if (section.data) {
          for (const row of section.data) {
            const label = row.label || '';
            const value = row.value || '';
            doc.setFont('Roboto', 'bold');
            doc.text(label, this.PAGE_MARGIN, yPosition);
            doc.setFont('Roboto', 'normal');
            doc.text(value, this.PAGE_MARGIN + 60, yPosition);
            yPosition += this.LINE_HEIGHT;
          }
        }
        break;

      case 'signature':
        yPosition += this.LINE_HEIGHT * 2;
        doc.setFontSize(10);
        doc.setFont('Roboto', 'normal');
        if (section.data) {
          const signatureWidth = maxWidth / section.data.length;
          section.data.forEach((sig, index) => {
            const xPos = this.PAGE_MARGIN + index * signatureWidth;
            doc.text('_____________________', xPos, yPosition);
            doc.text(sig.role || '', xPos, yPosition + this.LINE_HEIGHT);
            doc.text(sig.name || '', xPos, yPosition + this.LINE_HEIGHT * 2);
          });
          yPosition += this.LINE_HEIGHT * 4;
        }
        break;

      case 'spacer':
        yPosition += this.LINE_HEIGHT;
        break;
    }

    return yPosition;
  }

  /**
   * Trigger browser download of PDF blob
   */
  private triggerBrowserDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const contractPdfEngineService = new ContractPdfEngineService();

