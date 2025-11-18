import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { userPreferencesService } from '../../lib/serviceProxy';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { Save, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getProfileSchema } from './profileSchema';
import { refreshExchangeRates, getCurrentExchangeRates, getExchangeRatesTimestamp, initializeExchangeRates } from '../../lib/currency';
import type * as z from 'zod';

export const Profile = () => {
  const { t } = useTranslation(['profile', 'common']);
  const { user, setLanguage, setCurrency } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [refreshingRates, setRefreshingRates] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const profileSchema = getProfileSchema(t);
  type ProfileFormData = z.infer<typeof profileSchema>;

  const normalizeLanguage = (
    lang: string | null | undefined
  ): ProfileFormData['language'] => (lang === 'tr' || lang === 'en' ? lang : 'tr');

  const normalizeCurrency = (
    value: string | null | undefined
  ): ProfileFormData['currency'] =>
    value === 'TRY' || value === 'USD' || value === 'EUR' ? value : 'TRY';

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone_number: '',
      language: 'tr',
      currency: 'TRY',
      meeting_reminder_minutes: 30,
      commission_rate: 4.0,
    },
  });

  // Load user preferences and exchange rates
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const prefs = await userPreferencesService.getPreferences();
        form.reset({
          full_name: prefs.full_name || '',
          phone_number: prefs.phone_number || '',
          language: normalizeLanguage(prefs.language),
          currency: normalizeCurrency(prefs.currency),
          meeting_reminder_minutes: prefs.meeting_reminder_minutes || 30,
          commission_rate: prefs.commission_rate || 4.0,
        });
      } catch (error) {
        console.error('Failed to load preferences:', error);
        toast.error(t('profile:messages.loadError'));
      }
    };

    const loadExchangeRates = async () => {
      await initializeExchangeRates();
      setExchangeRates(getCurrentExchangeRates());
      setLastUpdated(getExchangeRatesTimestamp());
    };

    loadPreferences();
    loadExchangeRates();
  }, [user, form, t]);

  const handleRefreshRates = async () => {
    setRefreshingRates(true);
    try {
      await refreshExchangeRates();
      setExchangeRates(getCurrentExchangeRates());
      setLastUpdated(getExchangeRatesTimestamp());
      toast.success(t('profile:exchangeRates.refreshSuccess'));
    } catch (error) {
      console.error('Failed to refresh exchange rates:', error);
      toast.error(t('profile:exchangeRates.refreshError'));
    } finally {
      setRefreshingRates(false);
    }
  };

  const formatLastUpdated = (timestamp: number | null): string => {
    if (!timestamp) return t('profile:exchangeRates.justNow');
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('profile:exchangeRates.justNow');
    if (minutes < 60) return t('profile:exchangeRates.minutesAgo', { minutes });
    if (hours < 24) return t('profile:exchangeRates.hoursAgo', { hours });
    return t('profile:exchangeRates.daysAgo', { days });
  };

  const handleSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setSaveSuccess(false);

    try {
      await userPreferencesService.updatePreferences({
        full_name: data.full_name || null,
        phone_number: data.phone_number || null,
        language: data.language,
        currency: data.currency,
        meeting_reminder_minutes: data.meeting_reminder_minutes,
        commission_rate: data.commission_rate,
      });

      await setLanguage(data.language);
      await setCurrency(data.currency);

      toast.success(t('profile:messages.saveSuccess'));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error(t('profile:messages.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <MainLayout title={t('profile:pageTitle')}>
      <PageContainer>
        {/* Success Alert */}
        {saveSuccess && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {t('profile:messages.saveSuccess')}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Profile Card */}
        <Card className="shadow-md border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                {t('profile:pageTitle')}
              </CardTitle>
              <Button
                onClick={form.handleSubmit(handleSubmit)}
                disabled={loading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('profile:actions.saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('profile:actions.save')}
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Header - Compact */}
            <div className="flex items-start gap-4 pb-4 border-b">
              <Avatar className="h-14 w-14 border-2 border-gray-200">
                <AvatarFallback className="text-lg font-semibold bg-blue-600 text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div>
                  <p className="text-xs text-gray-500">{t('profile:fields.email')}</p>
                  <p className="text-sm font-medium text-slate-900">
                    {user?.email || t('profile:fields.notAvailable')}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">{t('profile:fields.fullName')}: </span>
                    <span className="text-slate-700">
                      {form.watch('full_name') || t('profile:fields.notSet')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('profile:fields.phoneNumber')}: </span>
                    <span className="text-slate-700">
                      {form.watch('phone_number') || t('profile:fields.notSet')}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono text-xs mt-1">
                  ID: {user?.id.substring(0, 12)}...
                </Badge>
              </div>
            </div>

            {/* Form Section */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">{t('profile:fields.fullName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('profile:fields.fullNamePlaceholder')}
                            {...field}
                            disabled={loading}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Phone Number */}
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">{t('profile:fields.phoneNumber')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('profile:fields.phoneNumberPlaceholder')}
                            {...field}
                            disabled={loading}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Language */}
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">{t('profile:fields.language')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={t('profile:fields.languagePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">{t('profile:languages.en')}</SelectItem>
                            <SelectItem value="tr">{t('profile:languages.tr')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Currency */}
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">{t('profile:fields.currency')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={t('profile:fields.currencyPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">{t('profile:currencies.USD')}</SelectItem>
                            <SelectItem value="TRY">{t('profile:currencies.TRY')}</SelectItem>
                            <SelectItem value="EUR">{t('profile:currencies.EUR')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Meeting Reminder */}
                  <FormField
                    control={form.control}
                    name="meeting_reminder_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">{t('profile:fields.meetingReminder')}</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={t('profile:fields.meetingReminderPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="30">{t('profile:reminderMinutes.30')}</SelectItem>
                            <SelectItem value="60">{t('profile:reminderMinutes.60')}</SelectItem>
                            <SelectItem value="90">{t('profile:reminderMinutes.90')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          {t('profile:fields.meetingReminderDescription')}
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Commission Rate */}
                  <FormField
                    control={form.control}
                    name="commission_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">{t('profile:fields.commissionRate')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              max="20"
                              placeholder="4.0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={loading}
                              className="h-9 pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          {t('profile:fields.commissionRateDescription')}
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>

            <Separator />

            {/* Exchange Rates - Compact */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t('profile:exchangeRates.title')}
                  </h3>
                  <p className="text-xs text-gray-500">{t('profile:exchangeRates.description')}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshRates}
                  disabled={refreshingRates}
                  className="h-8"
                >
                  {refreshingRates ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center justify-between p-2 rounded-md bg-blue-50 border border-blue-100">
                  <span className="text-xs font-medium text-slate-700">USD</span>
                  <span className="text-xs font-bold text-slate-900">1.00</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-emerald-50 border border-emerald-100">
                  <span className="text-xs font-medium text-slate-700">TRY</span>
                  <span className="text-xs font-bold text-slate-900">
                    {exchangeRates.TRY?.toFixed(2) || '42.30'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-purple-50 border border-purple-100">
                  <span className="text-xs font-medium text-slate-700">EUR</span>
                  <span className="text-xs font-bold text-slate-900">
                    {exchangeRates.EUR?.toFixed(2) || '49.09'}
                  </span>
                </div>
              </div>

              {lastUpdated && (
                <p className="text-xs text-gray-500 text-center">
                  {t('profile:exchangeRates.lastUpdated')}: {formatLastUpdated(lastUpdated)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </MainLayout>
  );
};
