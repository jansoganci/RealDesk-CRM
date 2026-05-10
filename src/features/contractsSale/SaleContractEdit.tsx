/**
 * Sale Contract Edit
 * Edit an existing sale contract instance
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROUTES } from '@/config/constants';
import { ArrowLeft, ArrowRight, Check, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { contractBuilderService } from '@/services/contractBuilder.service';
import { saleContractFormSchema, type SaleContractFormData } from './schemas/saleContractForm.schema';
import { SALE_CONTRACT_TEMPLATE_CONTENT, replacePlaceholders } from '@/templates/salesContractContent';

type Step = 1 | 2 | 3;

export function SaleContractEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['contractsSale', 'common']);
  const [step, setStep] = useState<Step>(1);
  const [renderedContent, setRenderedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<SaleContractFormData>({
    resolver: zodResolver(saleContractFormSchema),
    defaultValues: {
      seller_name: '',
      seller_tc: '',
      seller_phone: '',
      seller_email: '',
      seller_address: '',
      buyer_name: '',
      buyer_tc: '',
      buyer_phone: '',
      buyer_email: '',
      buyer_address: '',
      property_address: '',
      title_deed_no: '',
      parcel_info: '',
      square_meters: undefined,
      sale_price: undefined,
      currency: 'USD',
      payment_method: 'bank_transfer',
      deposit_amount: undefined,
      closing_date: '',
      title: '',
      special_conditions: '',
    },
  });

  // Load existing contract
  useEffect(() => {
    if (!id) {
      navigate(ROUTES.CONTRACTS_SALE);
      return;
    }

    const loadContract = async () => {
      try {
        setLoading(true);
        const instance = await contractBuilderService.getInstance(id);
        if (!instance) {
          toast.error(t('toasts.edit.notFound'));
          navigate(ROUTES.CONTRACTS_SALE);
          return;
        }

        const formData = instance.form_data as SaleContractFormData;
        form.reset(formData);
        setRenderedContent(instance.rendered_content);
      } catch (error) {
        console.error('Failed to load contract:', error);
        toast.error(t('toasts.edit.loadFailed'));
        navigate(ROUTES.CONTRACTS_SALE);
      } finally {
        setLoading(false);
      }
    };

    loadContract();
  }, [id, navigate, form, t]);

  const progress = useMemo(() => ((step - 1) / 2) * 100, [step]);

  const handleNextToEditor = useCallback(() => {
    const values = form.getValues();

    // Basic validation for required fields
    if (!values.seller_name || !values.buyer_name || !values.property_address || !values.sale_price) {
      toast.error(t('toasts.edit.missingRequired'));
      return;
    }

    // Generate content from template
    const content = replacePlaceholders(SALE_CONTRACT_TEMPLATE_CONTENT, {
      ...values,
      contract_date: new Date().toLocaleDateString('tr-TR'),
    });
    setRenderedContent(content);
    setStep(2);
  }, [form, t]);

  const handleNextToPreview = useCallback(() => {
    if (!renderedContent.trim()) {
      toast.error(t('toasts.edit.emptyContent'));
      return;
    }
    setStep(3);
  }, [renderedContent, t]);

  const handleSave = useCallback(async (status: 'draft' | 'final') => {
    if (!id) return;

    try {
      setSaving(true);
      const values = form.getValues();

      await contractBuilderService.updateInstance(id, {
        form_data: values,
        rendered_content: renderedContent,
        title: values.title || t('edit.defaultTitle', { address: values.property_address }),
        status,
        parties: {
          seller: {
            name: values.seller_name,
            tc_no: values.seller_tc,
            phone: values.seller_phone,
            email: values.seller_email,
            address: values.seller_address,
          },
          buyer: {
            name: values.buyer_name,
            tc_no: values.buyer_tc,
            phone: values.buyer_phone,
            email: values.buyer_email,
            address: values.buyer_address,
          },
        },
      });

      toast.success(status === 'draft' ? t('toasts.edit.savedDraft') : t('toasts.edit.savedFinal'));
      navigate(ROUTES.CONTRACTS_SALE);
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error(t('toasts.edit.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [id, form, renderedContent, navigate, t]);

  if (loading) {
    return (
      <MainLayout title={t('edit.pageTitle')}>
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={t('edit.pageTitle')}>
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <PageHeader
              title={t('edit.headerTitle')}
              subtitle={t('edit.stepLabel', { step })}
              backTo={{ href: ROUTES.CONTRACTS_SALE, label: t('edit.backToList') }}
            />
            <Progress value={progress} className="mt-4 h-2" />
          </div>

          {/* Step 1: Form */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('edit.steps.form.title')}</CardTitle>
                <CardDescription>
                  {t('edit.steps.form.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Seller Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 text-foreground">{t('form.sections.seller')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="seller_name">{t('form.labels.seller_name')}</Label>
                      <Input
                        id="seller_name"
                        {...form.register('seller_name')}
                        placeholder={t('form.placeholders.seller_name')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="seller_tc">{t('form.labels.seller_tc')}</Label>
                      <Input
                        id="seller_tc"
                        {...form.register('seller_tc')}
                        placeholder={t('form.placeholders.seller_tc')}
                        maxLength={11}
                      />
                    </div>
                    <div>
                      <Label htmlFor="seller_phone">{t('form.labels.seller_phone')}</Label>
                      <Input
                        id="seller_phone"
                        {...form.register('seller_phone')}
                        placeholder={t('form.placeholders.seller_phone')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="seller_email">{t('form.labels.seller_email')}</Label>
                      <Input
                        id="seller_email"
                        type="email"
                        {...form.register('seller_email')}
                        placeholder={t('form.placeholders.seller_email')}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="seller_address">{t('form.labels.seller_address')}</Label>
                    <Textarea
                      id="seller_address"
                      {...form.register('seller_address')}
                      placeholder={t('form.placeholders.seller_address')}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Buyer Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 text-foreground">{t('form.sections.buyer')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buyer_name">{t('form.labels.buyer_name')}</Label>
                      <Input
                        id="buyer_name"
                        {...form.register('buyer_name')}
                        placeholder={t('form.placeholders.buyer_name')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyer_tc">{t('form.labels.buyer_tc')}</Label>
                      <Input
                        id="buyer_tc"
                        {...form.register('buyer_tc')}
                        placeholder={t('form.placeholders.buyer_tc')}
                        maxLength={11}
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyer_phone">{t('form.labels.buyer_phone')}</Label>
                      <Input
                        id="buyer_phone"
                        {...form.register('buyer_phone')}
                        placeholder={t('form.placeholders.buyer_phone')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyer_email">{t('form.labels.buyer_email')}</Label>
                      <Input
                        id="buyer_email"
                        type="email"
                        {...form.register('buyer_email')}
                        placeholder={t('form.placeholders.buyer_email')}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="buyer_address">{t('form.labels.buyer_address')}</Label>
                    <Textarea
                      id="buyer_address"
                      {...form.register('buyer_address')}
                      placeholder={t('form.placeholders.buyer_address')}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Property Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 text-foreground">{t('form.sections.property')}</h3>
                  <div>
                    <Label htmlFor="property_address">{t('form.labels.property_address')}</Label>
                    <Textarea
                      id="property_address"
                      {...form.register('property_address')}
                      placeholder={t('form.placeholders.property_address')}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="title_deed_no">{t('form.labels.title_deed_no')}</Label>
                      <Input
                        id="title_deed_no"
                        {...form.register('title_deed_no')}
                        placeholder={t('form.placeholders.title_deed_no')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="parcel_info">{t('form.labels.parcel_info')}</Label>
                      <Input
                        id="parcel_info"
                        {...form.register('parcel_info')}
                        placeholder={t('form.placeholders.parcel_info')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="square_meters">{t('form.labels.square_meters')}</Label>
                      <Input
                        id="square_meters"
                        type="number"
                        {...form.register('square_meters', { valueAsNumber: true })}
                        placeholder={t('form.placeholders.square_meters')}
                      />
                    </div>
                  </div>
                </div>

                {/* Sale Terms Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 text-foreground">{t('form.sections.saleTerms')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="sale_price">{t('form.labels.sale_price')}</Label>
                      <Input
                        id="sale_price"
                        type="number"
                        {...form.register('sale_price', { valueAsNumber: true })}
                        placeholder={t('form.placeholders.sale_price')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">{t('form.labels.currency')}</Label>
                      <Select
                        value={form.watch('currency')}
                        onValueChange={(v) => form.setValue('currency', v as 'USD')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('form.placeholders.currency')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">{t('form.options.currency.USD')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="payment_method">{t('form.labels.payment_method')}</Label>
                      <Select
                        value={form.watch('payment_method')}
                        onValueChange={(v) => form.setValue('payment_method', v as 'cash' | 'bank_transfer' | 'installment' | 'mortgage')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('form.placeholders.payment_method')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">{t('form.options.paymentMethod.cash')}</SelectItem>
                          <SelectItem value="bank_transfer">{t('form.options.paymentMethod.bank_transfer')}</SelectItem>
                          <SelectItem value="installment">{t('form.options.paymentMethod.installment')}</SelectItem>
                          <SelectItem value="mortgage">{t('form.options.paymentMethod.mortgage')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deposit_amount">{t('form.labels.deposit_amount')}</Label>
                      <Input
                        id="deposit_amount"
                        type="number"
                        {...form.register('deposit_amount', { valueAsNumber: true })}
                        placeholder={t('form.placeholders.deposit_amount')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="closing_date">{t('form.labels.closing_date')}</Label>
                      <Input
                        id="closing_date"
                        type="date"
                        {...form.register('closing_date')}
                      />
                    </div>
                  </div>
                </div>

                {/* Contract Title */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 text-foreground">{t('form.sections.contractTitle')}</h3>
                  <div>
                    <Label htmlFor="title">{t('form.labels.title')}</Label>
                    <Input
                      id="title"
                      {...form.register('title')}
                      placeholder={t('form.placeholders.title')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="special_conditions">{t('form.labels.special_conditions')}</Label>
                    <Textarea
                      id="special_conditions"
                      {...form.register('special_conditions')}
                      placeholder={t('form.placeholders.special_conditions')}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    variant="outline"
                    onClick={() => navigate(ROUTES.CONTRACTS_SALE)}
                  >
                    {t('edit.actions.cancel')}
                  </Button>
                  <Button onClick={handleNextToEditor}>
                    {t('edit.actions.nextToEditor')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Editor */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('edit.steps.editor.title')}</CardTitle>
                <CardDescription>
                  {t('edit.steps.editor.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={renderedContent}
                  onChange={(e) => setRenderedContent(e.target.value)}
                  rows={25}
                  className="font-mono text-sm"
                />
                <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('edit.actions.back')}
                  </Button>
                  <Button onClick={handleNextToPreview}>
                    {t('edit.actions.nextToPreview')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Preview & Save */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('edit.steps.preview.title')}</CardTitle>
                <CardDescription>
                  {t('edit.steps.preview.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/70 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t('edit.summary.seller')}</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">{form.getValues('seller_name')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t('edit.summary.buyer')}</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">{form.getValues('buyer_name')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t('edit.summary.amount')}</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {form.getValues('sale_price')?.toLocaleString('tr-TR')} {form.getValues('currency')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t('edit.summary.payment')}</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">{form.getValues('payment_method')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 dark:text-gray-100">
                    {renderedContent}
                  </pre>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('edit.actions.back')}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSave('draft')}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {t('edit.actions.saveDraft')}
                    </Button>
                    <Button
                      onClick={() => handleSave('final')}
                      disabled={saving}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {t('edit.actions.finalize')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>
    </MainLayout>
  );
}
