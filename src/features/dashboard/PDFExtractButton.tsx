import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { extractTextFromFileViaProxy, parseContractFromText } from '@/lib/serviceProxy';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface PDFExtractButtonProps {
  onExtract?: (text: string, parsedData?: any) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const PDFExtractButton = ({
  onExtract,
  variant = 'default',
  size = 'default',
  className = '',
}: PDFExtractButtonProps) => {
  const { t } = useTranslation('contracts');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/epub+zip'];
    const allowedExtensions = ['.pdf', '.epub'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error(t('pdfExtract.invalidFileType'));
      return;
    }

    // Validate file size (100 MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('pdfExtract.fileTooLarge'));
      return;
    }

    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type || fileExtension,
    });

    setExtracting(true);
    setDialogOpen(true);

    try {
      // Extract text
      const result = await extractTextFromFileViaProxy(file);

      if (!result.text || result.text.length === 0) {
        throw new Error(t('pdfExtract.extractionFailed'));
      }

      setExtractedText(result.text);

      // Parse contract data
      const parsed = parseContractFromText(result.text);
      setParsedData(parsed);

      toast.success(
        t('pdfExtract.success', {
          tokens: result.token_count ? `${result.token_count} ${t('pdfExtract.tokens')}` : ''
        })
      );

      // Callback
      onExtract?.(result.text, parsed);
    } catch (error) {
      console.error('PDF extraction error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('pdfExtract.processingError')
      );
      setDialogOpen(false);
    } finally {
      setExtracting(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    if (!extracting) {
      setDialogOpen(false);
      setExtractedText('');
      setParsedData(null);
      setFileInfo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.epub"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={handleButtonClick}
        variant={variant}
        size={size}
        disabled={extracting}
        className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md h-8 md:h-10 px-2 md:px-4 text-xs md:text-sm ${className}`}
        title={t('pdfExtract.buttonTitle')}
      >
        {extracting ? (
          <Loader2 className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
        ) : (
          <FileText className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
        )}
        <span className="hidden sm:inline">{t('pdfExtract.buttonText')}</span>
        <span className="sm:hidden">PDF</span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {t('pdfExtract.dialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {fileInfo && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-600">
                    {fileInfo.name} ({formatFileSize(fileInfo.size)})
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {extracting ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">{t('pdfExtract.processing')}</span>
              </div>
            ) : (
              <>
                {parsedData && Object.keys(parsedData).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900">{t('pdfExtract.extractedInfo')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {parsedData.tenantName && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs text-gray-600">{t('pdfExtract.tenant')}</div>
                          <div className="text-sm font-medium">{parsedData.tenantName}</div>
                        </div>
                      )}
                      {parsedData.ownerName && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs text-gray-600">{t('pdfExtract.owner')}</div>
                          <div className="text-sm font-medium">{parsedData.ownerName}</div>
                        </div>
                      )}
                      {parsedData.rentAmount && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs text-gray-600">{t('pdfExtract.rentAmount')}</div>
                          <div className="text-sm font-medium">{parsedData.rentAmount.toLocaleString('tr-TR')} ₺</div>
                        </div>
                      )}
                      {parsedData.deposit && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs text-gray-600">{t('pdfExtract.deposit')}</div>
                          <div className="text-sm font-medium">{parsedData.deposit.toLocaleString('tr-TR')} ₺</div>
                        </div>
                      )}
                      {parsedData.startDate && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs text-gray-600">{t('pdfExtract.startDate')}</div>
                          <div className="text-sm font-medium">{parsedData.startDate}</div>
                        </div>
                      )}
                      {parsedData.endDate && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs text-gray-600">{t('pdfExtract.endDate')}</div>
                          <div className="text-sm font-medium">{parsedData.endDate}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {extractedText && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-gray-900">{t('pdfExtract.extractedText')}</h4>
                      <Badge variant="outline" className="text-xs">
                        {t('pdfExtract.characters', { count: extractedText.length })}
                      </Badge>
                    </div>
                    <Textarea
                      value={extractedText}
                      readOnly
                      className="min-h-[200px] font-mono text-xs"
                      placeholder={t('pdfExtract.textPlaceholder')}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={extracting}>
              {t('pdfExtract.close')}
            </Button>
            {extractedText && (
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(extractedText);
                  toast.success(t('pdfExtract.copiedToClipboard'));
                }}
                variant="default"
              >
                {t('pdfExtract.copy')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

