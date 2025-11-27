import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';

interface PDFPreviewSectionProps {
  uploadedFile: File | null;
  extractedText: string;
}

export function PDFPreviewSection({ uploadedFile, extractedText }: PDFPreviewSectionProps) {
  const { t } = useTranslation('contracts');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {t('import.sections.uploadedFile')}
      </h3>

      {uploadedFile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📄</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Text (Collapsible) */}
      {extractedText && (
        <Accordion type="single" collapsible>
          <AccordionItem value="raw-text">
            <AccordionTrigger className="text-sm">
              {t('import.extractedText', { count: extractedText.length })}
            </AccordionTrigger>
            <AccordionContent>
              <Textarea
                value={extractedText}
                readOnly
                rows={10}
                className="font-mono text-xs"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}

