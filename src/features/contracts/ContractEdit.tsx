/**
 * Contract Edit Page
 * Page wrapper for contract editing form
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContractEditForm } from './components/ContractEditForm';
import { useContractEditData } from './hooks/useContractEditData';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ContractEdit() {
  const { t } = useTranslation('contracts');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useContractEditData(id);

  // Loading state
  if (loading) {
    return (
      <MainLayout title={t('edit.title')}>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">{t('edit.loading')}</p>
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <MainLayout title={t('edit.title')}>
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('edit.errorTitle')}</AlertTitle>
              <AlertDescription>
                {error || t('edit.errorNotFound')}
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={() => navigate('/contracts')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('edit.backToList')}
            </Button>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={t('edit.title')}>
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/contracts')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('edit.backToList')}
            </Button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {t('edit.title')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {t('edit.subtitle')}
            </p>
          </div>
          <ContractEditForm
            contractId={data.contractId}
            tenantId={data.tenantId}
            propertyId={data.propertyId}
            ownerId={data.ownerId}
            initialData={data.formData}
          />
        </div>
      </PageContainer>
    </MainLayout>
  );
}
