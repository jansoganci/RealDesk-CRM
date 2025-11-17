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
  CardDescription,
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
import { UserCircle, Save, Loader2, CheckCircle2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { getProfileSchema } from './profileSchema';
import type * as z from 'zod';

export const Profile = () => {
  const { t } = useTranslation(['profile', 'common']);
  const { user, setLanguage, setCurrency } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    },
  });

  // Load user preferences
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
        });
      } catch (error) {
        console.error('Failed to load preferences:', error);
        toast.error(t('profile:messages.loadError'));
      }
    };

    loadPreferences();
  }, [user, form, t]);

  const handleSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setSaveSuccess(false);

    try {
      // Update via service
      await userPreferencesService.updatePreferences({
        full_name: data.full_name || null,
        phone_number: data.phone_number || null,
        language: data.language,
        currency: data.currency,
        meeting_reminder_minutes: data.meeting_reminder_minutes,
      });

      // Update global state (AuthContext) - triggers i18n and currency updates
      await setLanguage(data.language);
      await setCurrency(data.currency);

      // Show success
      toast.success(t('profile:messages.saveSuccess'));
      setSaveSuccess(true);

      // Hide success message after 3 seconds
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
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {t('profile:messages.saveSuccess')}
          </AlertDescription>
        </Alert>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information Card */}
        <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/20">
                <UserCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  {t('profile:sections.account')}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* User Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-gray-100 shadow-md">
                <AvatarFallback className="text-2xl font-bold bg-blue-600 text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-gray-500">
                  {t('profile:fields.email')}
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {user?.email || t('profile:fields.notAvailable')}
                </p>
              </div>
            </div>

            <Separator />

            {/* Full Name */}
            <div>
              <p className="text-sm text-gray-500 mb-1">
                {t('profile:fields.fullName')}
              </p>
              <p className="text-base font-medium text-slate-900">
                {form.watch('full_name') || t('profile:fields.notSet')}
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <p className="text-sm text-gray-500 mb-1">
                {t('profile:fields.phoneNumber')}
              </p>
              <p className="text-base font-medium text-slate-900">
                {form.watch('phone_number') || t('profile:fields.notSet')}
              </p>
            </div>

            <Separator />

            {/* User ID */}
            <div>
              <p className="text-sm text-gray-500 mb-2">
                {t('profile:fields.userId')}
              </p>
              <Badge variant="secondary" className="font-mono text-xs">
                {user?.id.substring(0, 20)}...
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-md">
                <Settings2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  {t('profile:sections.preferences')}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {t('profile:fields.fullName')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('profile:fields.fullNamePlaceholder')}
                          {...field}
                          disabled={loading}
                          className="bg-white border-gray-200 hover:border-gray-300 transition-colors"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {t('profile:fields.phoneNumber')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('profile:fields.phoneNumberPlaceholder')}
                          {...field}
                          disabled={loading}
                          className="bg-white border-gray-200 hover:border-gray-300 transition-colors"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                {/* Language */}
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {t('profile:fields.language')}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
                            <SelectValue
                              placeholder={t('profile:fields.languagePlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">
                            {t('profile:languages.en')}
                          </SelectItem>
                          <SelectItem value="tr">
                            {t('profile:languages.tr')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                {/* Currency */}
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {t('profile:fields.currency')}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
                            <SelectValue
                              placeholder={t('profile:fields.currencyPlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">
                            {t('profile:currencies.USD')}
                          </SelectItem>
                          <SelectItem value="TRY">
                            {t('profile:currencies.TRY')}
                          </SelectItem>
                          <SelectItem value="EUR">
                            {t('profile:currencies.EUR')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                {/* Meeting Reminder */}
                <FormField
                  control={form.control}
                  name="meeting_reminder_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {t('profile:fields.meetingReminder')}
                      </FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
                            <SelectValue
                              placeholder={t(
                                'profile:fields.meetingReminderPlaceholder'
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30">
                            {t('profile:reminderMinutes.30')}
                          </SelectItem>
                          <SelectItem value="60">
                            {t('profile:reminderMinutes.60')}
                          </SelectItem>
                          <SelectItem value="90">
                            {t('profile:reminderMinutes.90')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-gray-500 text-sm">
                        {t('profile:fields.meetingReminderDescription')}
                      </FormDescription>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
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
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Future: Security Card */}
      <Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm opacity-60">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">
            {t('profile:sections.security')}
          </CardTitle>
          <CardDescription>
            {t('profile:security.changePasswordDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            {t('profile:security.comingSoon')}
          </Button>
        </CardContent>
      </Card>
      </PageContainer>
    </MainLayout>
  );
};
