import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/contexts/AuthContext';
import { userPreferencesService } from '@/lib/serviceProxy';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import {
  getEditProfileInfoSchema,
  type EditProfileInfoFormData,
} from '../schemas/editProfileInfoSchema';

interface EditProfileInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    fullName: string;
    phoneNumber?: string | null;
    language: 'tr' | 'en';
    currency: string;
    meetingReminderMinutes: number;
    commissionRate: number;
  };
  onSaveSuccess?: () => void;
}

export function EditProfileInfoDialog({
  isOpen,
  onClose,
  initialData,
  onSaveSuccess,
}: EditProfileInfoDialogProps) {
  const { t } = useTranslation(['profile', 'common']);
  const { user, setLanguage, setCurrency } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const schema = getEditProfileInfoSchema(t);

  const form = useForm<EditProfileInfoFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: initialData.fullName || '',
      phone_number: initialData.phoneNumber || '',
      language: initialData.language,
      currency: initialData.currency as 'USD' | 'TRY' | 'EUR',
      meeting_reminder_minutes: initialData.meetingReminderMinutes,
      commission_rate: initialData.commissionRate,
    },
  });

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (isOpen) {
      form.reset({
        full_name: initialData.fullName || '',
        phone_number: initialData.phoneNumber || '',
        language: initialData.language,
        currency: initialData.currency as 'USD' | 'TRY' | 'EUR',
        meeting_reminder_minutes: initialData.meetingReminderMinutes,
        commission_rate: initialData.commissionRate,
      });
    }
  }, [isOpen, initialData, form]);

  const handleClose = () => {
    if (form.formState.isDirty) {
      setShowDiscardDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscardConfirm = () => {
    setShowDiscardDialog(false);
    form.reset();
    onClose();
  };

  const onSubmit = async (data: EditProfileInfoFormData) => {
    setIsSubmitting(true);
    try {
      await userPreferencesService.updatePreferences({
        full_name: data.full_name || null,
        phone_number: data.phone_number || null,
        language: data.language,
        currency: data.currency,
        meeting_reminder_minutes: data.meeting_reminder_minutes,
        commission_rate: data.commission_rate,
      });

      // Update auth context
      const { setManualLanguage } = await import('@/lib/localeDetection');
      setManualLanguage(data.language as 'tr' | 'en');
      await setLanguage(data.language);
      await setCurrency(data.currency);

      toast.success(t('profile:profileInfo.updateSuccess'));
      onSaveSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t('profile:profileInfo.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form content - shared between Dialog and Drawer
  const formContent = (
    <Form {...form}>
      <form
        id="edit-profile-info-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Full Name */}
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile:profileInfo.fields.fullName')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('profile:fields.fullNamePlaceholder')}
                  disabled={isSubmitting}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email (Disabled) */}
        <FormItem>
          <FormLabel>{t('profile:profileInfo.fields.email')}</FormLabel>
          <div className="relative">
            <Input
              value={user?.email || ''}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed pr-10"
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <FormDescription>
            {t('profile:profileInfo.fields.emailHelp')}
          </FormDescription>
        </FormItem>

        {/* Phone Number */}
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile:profileInfo.fields.phone')}</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder={t('profile:fields.phoneNumberPlaceholder')}
                  disabled={isSubmitting}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Language */}
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile:profileInfo.fields.language')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('profile:fields.languagePlaceholder')}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="tr">
                    {t('profile:profileInfo.languages.tr')}
                  </SelectItem>
                  <SelectItem value="en">
                    {t('profile:profileInfo.languages.en')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Currency */}
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile:profileInfo.fields.currency')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('profile:fields.currencyPlaceholder')}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="TRY">
                    {t('profile:profileInfo.currencies.TRY')}
                  </SelectItem>
                  <SelectItem value="USD">
                    {t('profile:profileInfo.currencies.USD')}
                  </SelectItem>
                  <SelectItem value="EUR">
                    {t('profile:profileInfo.currencies.EUR')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Meeting Reminder */}
        <FormField
          control={form.control}
          name="meeting_reminder_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('profile:profileInfo.fields.meetingReminder')}
              </FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('profile:fields.meetingReminderPlaceholder')}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="30">
                    {t('profile:profileInfo.reminderOptions.30')}
                  </SelectItem>
                  <SelectItem value="60">
                    {t('profile:profileInfo.reminderOptions.60')}
                  </SelectItem>
                  <SelectItem value="90">
                    {t('profile:profileInfo.reminderOptions.90')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Commission Rate */}
        <FormField
          control={form.control}
          name="commission_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('profile:profileInfo.fields.commissionRate')}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="20"
                    placeholder="4.0"
                    disabled={isSubmitting}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  // Footer buttons - shared between Dialog and Drawer
  const footerContent = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={isSubmitting}
      >
        {t('common:cancel')}
      </Button>
      <Button
        type="submit"
        form="edit-profile-info-form"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('common:saving')}
          </>
        ) : (
          t('common:saveChanges')
        )}
      </Button>
    </>
  );

  return (
    <>
      {/* Discard Confirmation Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('profile:profileInfo.discardDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile:profileInfo.discardDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('profile:profileInfo.discardDialog.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardConfirm}>
              {t('profile:profileInfo.discardDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile: Drawer */}
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>
                {t('profile:profileInfo.editDialog.title')}
              </DrawerTitle>
              <DrawerDescription>
                {t('profile:profileInfo.editDialog.description')}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto max-h-[60vh]">
              {formContent}
            </div>
            <DrawerFooter className="flex-row gap-2">
              {footerContent}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        /* Desktop: Dialog */
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {t('profile:profileInfo.editDialog.title')}
              </DialogTitle>
              <DialogDescription>
                {t('profile:profileInfo.editDialog.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto py-4">
              {formContent}
            </div>
            <DialogFooter>{footerContent}</DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
