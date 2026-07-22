import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import {
  getEmailChangeSchema,
  getPasswordChangeSchema,
  type EmailChangeFormData,
  type PasswordChangeFormData,
} from '../schemas/editProfileSchema';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'email' | 'password';
}

export const EditProfileDialog = ({ open, onOpenChange, defaultTab = 'email' }: EditProfileDialogProps) => {
  const { t } = useTranslation('profile');
  const { user, changeEmail, updatePassword, reauthenticate } = useAuth();
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Email form
  const emailForm = useForm<EmailChangeFormData>({
    resolver: zodResolver(getEmailChangeSchema(t)),
    defaultValues: {
      email: user?.email || '',
    },
  });

  // Password form
  const passwordForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(getPasswordChangeSchema(t)),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Handle email change
  const handleEmailChange = async (data: EmailChangeFormData) => {
    if (data.email === user?.email) {
      toast.info(t('editProfile.errors.sameEmail'));
      return;
    }

    setEmailLoading(true);
    try {
      const result = await changeEmail(data.email);

      if (result.success) {
        toast.success(t('editProfile.success.emailChanged'));
        onOpenChange(false);
      } else {
        toast.error(result.error || t('editProfile.errors.emailFailed'));
      }
    } catch (error) {
      toast.error(t('editProfile.errors.emailFailed'));
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (data: PasswordChangeFormData) => {
    setPasswordLoading(true);
    try {
      // First, reauthenticate with current password
      const authResult = await reauthenticate(data.currentPassword);

      if (!authResult.success) {
        toast.error(t('editProfile.errors.invalidPassword'));
        setPasswordLoading(false);
        return;
      }

      // Update password
      const updateResult = await updatePassword(data.newPassword);

      if (updateResult.success) {
        toast.success(t('editProfile.success.passwordChanged'));
        passwordForm.reset();
        onOpenChange(false);
      } else {
        toast.error(updateResult.error || t('editProfile.errors.passwordFailed'));
      }
    } catch (error) {
      toast.error(t('editProfile.errors.passwordFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-900 dark:to-slate-950 border-blue-200/50 dark:border-slate-700 shadow-luxury">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 rounded-xl shadow-lg shadow-blue-900/20">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {t('editProfile.title')}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {t('editProfile.description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-blue-200/50 dark:border-slate-600 shadow-md p-1">
            <TabsTrigger
              value="email"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
            >
              <Mail className="h-4 w-4" />
              {t('editProfile.tabs.basicInfo')}
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
            >
              <Lock className="h-4 w-4" />
              {t('editProfile.tabs.security')}
            </TabsTrigger>
          </TabsList>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4 mt-6 p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-blue-200/30 dark:border-slate-700 shadow-sm">
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailChange)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('editProfile.fields.email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('editProfile.fields.emailPlaceholder')}
                          disabled={emailLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={emailLoading}
                    className="flex-1 border-blue-200 hover:bg-blue-50 dark:border-slate-600 dark:hover:bg-slate-800 transition-all duration-300"
                  >
                    {t('editProfile.buttons.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={emailLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md transition-all duration-300 hover:shadow-lg"
                  >
                    {emailLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('editProfile.buttons.updating')}
                      </>
                    ) : (
                      t('editProfile.buttons.save')
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-4 mt-6 p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-blue-200/30 dark:border-slate-700 shadow-sm">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('editProfile.fields.currentPassword')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={passwordLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('editProfile.fields.newPassword')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={passwordLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('editProfile.fields.confirmPassword')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={passwordLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={passwordLoading}
                    className="flex-1 border-blue-200 hover:bg-blue-50 dark:border-slate-600 dark:hover:bg-slate-800 transition-all duration-300"
                  >
                    {t('editProfile.buttons.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md transition-all duration-300 hover:shadow-lg"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('editProfile.buttons.updating')}
                      </>
                    ) : (
                      t('editProfile.buttons.save')
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
