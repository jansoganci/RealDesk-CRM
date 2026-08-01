/**
 * Sale Contract Builder
 * 3-step wizard: Form → Editor → Save
 * Sprint 6B T16 — Org owners get a shortcut to the US purchase wizard (same guard as `/contracts/purchase/new`).
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROUTES } from '@/config/constants';
import { useOrg } from '@/contexts/OrgContext';
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react';
import { toast } from 'sonner';
import { contractBuilderService } from '@/services/contractBuilder.service';
import { contractPdfEngineService } from '@/services/contractPdfEngine.service';
import { saleContractFormSchema, type SaleContractFormData } from './schemas/saleContractForm.schema';
import { SALE_CONTRACT_TEMPLATE_CONTENT, replacePlaceholders } from '@/templates/salesContractContent';

type Step = 1 | 2 | 3;

export function SaleContractBuilder() {
  const navigate = useNavigate();
  const { t } = useTranslation(['contractsSale', 'common']);
  const { t: tContracts } = useTranslation('contracts');
  const { isOwner, loading: orgLoading } = useOrg();
  const [step, setStep] = useState<Step>(1);
  const [renderedContent, setRenderedContent] = useState('');
  const [saving, setSaving] = useState(false);

  const form = useForm<SaleContractFormData>({
    resolver: zodResolver(saleContractFormSchema),
    defaultValues: {
      agent_name: '',
      seller_name: '',
      seller_tc: '',
      buyer_name: '',
      buyer_tc: '',
      province_district: '',
      neighborhood: '',
      ada_no: '',
      parsel_no: '',
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

  const handleNextToEditor = useCallback(() => {
    const values = form.getValues();

    // Basic validation for required fields
    if (!values.agent_name || !values.seller_name || !values.seller_tc || !values.buyer_name || !values.buyer_tc || !values.province_district || !values.neighborhood || !values.sale_price) {
      toast.error(t('toasts.builder.missingRequired'));
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
      toast.error(t('toasts.builder.emptyContent'));
      return;
    }
    setStep(3);
  }, [renderedContent, t]);

  const fillTestData = useCallback(() => {
    form.setValue('agent_name', 'Mehmet Yılmaz - Yetkili Emlak Danışmanı');
    form.setValue('seller_name', 'Ahmet Şahin İçli');
    form.setValue('seller_tc', '12345678901');
    form.setValue('buyer_name', 'Gülay Öztürk Çakır');
    form.setValue('buyer_tc', '98765432109');
    form.setValue('province_district', 'İstanbul/Kadıköy');
    form.setValue('neighborhood', 'Fenerbahçe Mahallesi');
    form.setValue('ada_no', '1234');
    form.setValue('parsel_no', '5678');
    form.setValue('square_meters', 120);
    form.setValue('sale_price', 3500000);
    form.setValue('currency', 'USD');
    form.setValue('payment_method', 'bank_transfer');
    form.setValue('deposit_amount', 350000);
    form.setValue('closing_date', '2025-02-15');
    form.setValue('title', 'Kadıköy Bağdat Caddesi Daire Satışı');
    form.setValue('special_conditions', 'Ödeme şartları uygun görüldü. Müşteri memnuniyeti önemlidir. Taşınmaz temiz ve bakımlı teslim edilecektir.');
    toast.success('Test verileri yüklendi! ✅');
  }, [form]);

  const handleSave = useCallback(async (status: 'draft' | 'final') => {
    try {
      setSaving(true);
      const values = form.getValues();

      const instance = await contractBuilderService.createInstance({
        type: 'sale',
        form_data: values,
        rendered_content: renderedContent,
        title: values.title || t('builder.defaultTitle', { address: values.property_address }),
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

      // Generate PDF only for 'final' status
      if (status === 'final') {
        try {
          const pdfResult = await contractPdfEngineService.generateAndSave(
            'sale',
            values,
            instance.id,
            instance.user_id,
            true // trigger download
          );

          if (pdfResult.success) {
            toast.success(t('toasts.builder.savedFinalWithPdf'));
          } else {
            toast.warning(t('toasts.builder.savedFinalNoPdf'), {
              description: pdfResult.error
            });
          }
        } catch {
          toast.warning(t('toasts.builder.savedFinalNoPdf'));
        }
      } else {
        toast.success(t('toasts.builder.savedDraft'));
      }

      navigate(ROUTES.CONTRACTS_SALE);
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error(t('toasts.builder.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [form, renderedContent, navigate, t]);

  return (
    <MainLayout title={t('builder.pageTitle')}>
      <PageContainer>
        <div className="w-full">
          {/* Header */}
          <div className="mb-6">
            <PageHeader
              backTo={{ href: ROUTES.CONTRACTS_SALE, label: t('builder.backToList') }}
              actions={
                !orgLoading && isOwner ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(ROUTES.CONTRACTS_PURCHASE_NEW)}
                  >
                    {tContracts('purchaseWizard.entry.openWizard')}
                  </Button>
                ) : undefined
              }
            />
          </div>

          {/* Step 1: Form */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('builder.steps.form.title')}</CardTitle>
                    <CardDescription>
                      {t('builder.steps.form.description')}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fillTestData}
                    className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-950/40 dark:hover:bg-yellow-950/60 dark:border-yellow-700 dark:text-yellow-200"
                  >
                    🧪 TEST
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Agent Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 text-foreground">
                    Aracı Bilgileri
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="agent_name">Aracı Adı Soyadı</Label>
                      <Input
                        id="agent_name"
                        {...form.register('agent_name')}
                        placeholder="Mehmet Emlakçı"
                      />
                    </div>
                  </div>
                </div>

                {/* Seller Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 text-foreground">
                    {t('form.sections.seller')}
                  </h3>
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
                  </div>
                </div>

                {/* Buyer Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 text-foreground">
                    {t('form.sections.buyer')}
                  </h3>
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
                  </div>
                </div>

                {/* Property Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 text-foreground">
                    {t('form.sections.property')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="province_district">İl/İlçe *</Label>
                      <Input
                        id="province_district"
                        {...form.register('province_district')}
                        placeholder="Örn: İstanbul/Kadıköy"
                      />
                    </div>
                    <div>
                      <Label htmlFor="neighborhood">Mahalle *</Label>
                      <Input
                        id="neighborhood"
                        {...form.register('neighborhood')}
                        placeholder="Örn: Fenerbahçe Mahallesi"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ada_no">Ada No</Label>
                      <Input
                        id="ada_no"
                        {...form.register('ada_no')}
                        placeholder="Örn: 1234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="parsel_no">Parsel No</Label>
                      <Input
                        id="parsel_no"
                        {...form.register('parsel_no')}
                        placeholder="Örn: 5678"
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
                  <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 text-foreground">
                    {t('form.sections.saleTerms')}
                  </h3>
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
                  <h3 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 text-foreground">
                    {t('form.sections.contractTitle')}
                  </h3>
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
                    {t('builder.actions.cancel')}
                  </Button>
                  <Button onClick={handleNextToEditor}>
                    {t('builder.actions.nextToEditor')}
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
                <CardTitle>{t('builder.steps.editor.title')}</CardTitle>
                <CardDescription>
                  {t('builder.steps.editor.description')}
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
                    {t('builder.actions.back')}
                  </Button>
                  <Button onClick={handleNextToPreview}>
                    {t('builder.actions.nextToPreview')}
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
                <CardTitle>{t('builder.steps.preview.title')}</CardTitle>
                <CardDescription>
                  {t('builder.steps.preview.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/70 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t('builder.summary.seller')}</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">{form.getValues('seller_name')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t('builder.summary.buyer')}</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">{form.getValues('buyer_name')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t('builder.summary.amount')}</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {form.getValues('sale_price')?.toLocaleString('tr-TR')} {form.getValues('currency')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t('builder.summary.payment')}</span>{' '}
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
                    {t('builder.actions.back')}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSave('draft')}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {t('builder.actions.saveDraft')}
                    </Button>
                    <Button
                      onClick={() => handleSave('final')}
                      disabled={saving}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {t('builder.actions.finalize')}
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
