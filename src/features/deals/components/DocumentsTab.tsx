import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useTimelineTab } from '@/features/deals/hooks/useTimelineTab';
import type { DealMilestone } from '@/types';

type DocumentsTabProps = {
  dealId: string;
  readOnly?: boolean;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'MMM d, yyyy');
  } catch {
    return value;
  }
}

function canShowDocumentSection(milestone: DealMilestone): boolean {
  if (milestone.document_required) return true;
  if (milestone.document_path) return true;
  return ['home_inspection', 'appraisal_completed', 'title_report_clear', 'closing_disclosure_sent', 'repairs_completed', 'final_walkthrough'].includes(
    milestone.milestone_type
  );
}

export function DocumentsTab({ dealId, readOnly = false }: DocumentsTabProps) {
  const { t } = useTranslation('deals');
  const { toast } = useToast();
  const { milestones, loading, uploadDocument, getDocumentUrl } = useTimelineTab(dealId);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const rows = useMemo(
    () =>
      milestones
        .filter(canShowDocumentSection)
        .sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [milestones]
  );

  const handleUpload = async (milestoneId: string, file: File) => {
    try {
      setUploadingId(milestoneId);
      setUploadProgress(30);
      await uploadDocument(milestoneId, file);
      setUploadProgress(100);
      toast({
        title: t('documents.uploaded'),
        description: t('documents.toastUploadedDescription'),
      });
    } catch (error) {
      toast({
        title: t('documents.uploadFailed'),
        description: error instanceof Error ? error.message : t('documents.uploadFailedDescription'),
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => {
        setUploadingId(null);
        setUploadProgress(0);
      }, 300);
    }
  };

  const handleOpen = async (milestoneId: string) => {
    try {
      const url = await getDocumentUrl(milestoneId);
      if (!url) {
        toast({
          title: t('documents.noDocument'),
          description: t('documents.toastNoDocumentDescription'),
          variant: 'destructive',
        });
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast({
        title: t('documents.openError'),
        description: error instanceof Error ? error.message : t('documents.openErrorDescription'),
        variant: 'destructive',
      });
    }
  };

  const missingRequired = rows.filter(
    (milestone) =>
      milestone.document_required &&
      !milestone.document_path &&
      milestone.status === 'complete'
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">{t('documents.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">{t('documents.empty')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {missingRequired.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('documents.missingRequiredTitle')}</AlertTitle>
          <AlertDescription>
            {t('documents.missingRequiredDescription', { count: missingRequired.length })}
          </AlertDescription>
        </Alert>
      )}

      {rows.map((milestone) => {
        const isUploading = uploadingId === milestone.id;
        const hasDoc = Boolean(milestone.document_path);
        const isMissing = milestone.document_required && !hasDoc;

        return (
          <Card key={milestone.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-base">{milestone.title}</CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t('timeline.dueDate', { date: formatDate(milestone.due_date) })}
                  </p>
                </div>
                {hasDoc ? (
                  <Badge variant="success">{t('documents.uploaded')}</Badge>
                ) : isMissing ? (
                  <Badge variant="warning">{t('documents.missing')}</Badge>
                ) : (
                  <Badge variant="secondary">{t('documents.notRequired')}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="file"
                disabled={readOnly || isUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void handleUpload(milestone.id, file);
                  event.target.value = '';
                }}
              />

              {isUploading && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} />
                  <p className="text-xs text-slate-600 dark:text-slate-300">{uploadProgress}%</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!hasDoc}
                  onClick={() => void handleOpen(milestone.id)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {t('documents.openDocument')}
                </Button>
              </div>

              {milestone.document_uploaded_at && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('documents.uploadedAt', { date: formatDate(milestone.document_uploaded_at) })}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t('documents.sectionsCount', { count: rows.length })}
      </p>
    </div>
  );
}
