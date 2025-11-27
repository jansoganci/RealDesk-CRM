/**
 * Success Step Component
 * Shows success confirmation after contract import
 */

import { useTranslation } from 'react-i18next';
import { CheckCircle, FileCheck, User, Building, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/constants';
import { cn } from '@/lib/utils';

interface SuccessStepProps {
  createdData: {
    created_owner: boolean;
    created_tenant: boolean;
    created_property: boolean;
    owner_name: string;
    tenant_name: string;
    property_address: string;
  } | null;
  onImportAnother: () => void;
}

export const SuccessStep = ({ createdData, onImportAnother }: SuccessStepProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('contracts');

  if (!createdData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">{t('import.noData')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      {/* Big Success Icon */}
      <div className="relative mb-8">
        <CheckCircle className="h-32 w-32 text-green-600 animate-bounce" style={{
          animationDuration: '1s',
          animationIterationCount: '2'
        }} />
        <div className="absolute inset-0 h-32 w-32 text-green-200 animate-ping" style={{
          animationDuration: '1s',
          animationIterationCount: '1'
        }}>
          <CheckCircle className="h-32 w-32" />
        </div>
      </div>

      {/* Success Message */}
      <h2 className="text-4xl font-bold text-gray-900 mb-2">
        {t('import.success.title')}
      </h2>
      <p className="text-xl text-gray-600 mb-12">
        {t('import.success.description')}
      </p>

      {/* Summary Card */}
      <Card className="w-full max-w-2xl mb-8 border-2 border-green-100 bg-green-50/30">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-green-600" />
            {t('import.success.createdRecords')}
          </h3>

          <div className="space-y-3">
            {/* Owner */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
              <div className="flex-shrink-0">
                <User className="h-5 w-5 text-green-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {t('import.success.owner')}: {createdData.owner_name}
                </p>
                <p className={cn(
                  "text-sm",
                  createdData.created_owner ? "text-green-600" : "text-blue-600"
                )}>
                  {createdData.created_owner ? t('create.toasts.ownerCreated') : t('create.toasts.ownerUsed')}
                </p>
              </div>
            </div>

            {/* Tenant */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
              <div className="flex-shrink-0">
                <User className="h-5 w-5 text-green-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {t('import.success.tenant')}: {createdData.tenant_name}
                </p>
                <p className={cn(
                  "text-sm",
                  createdData.created_tenant ? "text-green-600" : "text-blue-600"
                )}>
                  {createdData.created_tenant ? t('create.toasts.tenantCreated') : t('create.toasts.tenantUsed')}
                </p>
              </div>
            </div>

            {/* Property */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
              <div className="flex-shrink-0">
                <Building className="h-5 w-5 text-green-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {t('import.success.property')}: {createdData.property_address}
                </p>
                <p className={cn(
                  "text-sm",
                  createdData.created_property ? "text-green-600" : "text-blue-600"
                )}>
                  {createdData.created_property ? t('create.toasts.propertyCreated') : t('create.toasts.propertyUsed')}
                </p>
              </div>
            </div>

            {/* PDF Saved */}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
              <div className="flex-shrink-0">
                <FileCheck className="h-5 w-5 text-green-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {t('import.success.pdfFile')}
                </p>
                <p className="text-sm text-green-600">
                  {t('import.success.pdfSaved')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
        {/* Import Another */}
        <Button
          onClick={onImportAnother}
          variant="outline"
          size="lg"
          className="flex-1 h-14 text-base border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-500"
        >
          <FileCheck className="mr-2 h-5 w-5" />
          {t('import.success.createAnother')}
        </Button>

        {/* View Contracts */}
        <Button
          onClick={() => navigate(ROUTES.CONTRACTS)}
          size="lg"
          className="flex-1 h-14 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {t('import.success.viewContract')}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Help Text */}
      <p className="mt-8 text-sm text-gray-500 text-center whitespace-pre-line">
        {t('import.success.helpText')}
      </p>
    </div>
  );
};
