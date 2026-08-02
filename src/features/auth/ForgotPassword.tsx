import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { toast } from 'sonner';
import { ROUTES, APP_NAME } from '../../config/constants';
import { Building2, Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { getForgotPasswordSchema, ForgotPasswordFormData } from './authSchemas';

export const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { requestPasswordReset } = useAuth();
  const { t } = useTranslation(['auth', 'common']);

  const forgotPasswordSchema = getForgotPasswordSchema(t);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const result = await requestPasswordReset(data.email);

    if (!result.success) {
      setErrorMessage(t('forgotPassword.errorMessage', { error: result.error }));
    } else {
      setSuccessMessage(t('forgotPassword.successMessageInline'));
      setEmailSent(true);
      toast.success(t('toast.resetEmailSent'));
    }

    setLoading(false);
  };

  // Success state after email is sent
  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {t('forgotPassword.successTitle')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('forgotPassword.successMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 p-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {form.getValues('email')}
                </span>
              </div>

              <Link to={ROUTES.LOGIN} className="w-full">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('forgotPassword.backToLogin')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="mr-2 h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {t('forgotPassword.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('forgotPassword.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <div className="mb-4 rounded-lg border border-success/30 bg-success/15 p-3">
              <p className="text-sm text-foreground">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/15 p-3">
              <p className="text-sm text-foreground">{errorMessage}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('forgotPassword.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('forgotPassword.emailPlaceholder')}
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common:loading')}
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    {t('forgotPassword.submit')}
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center text-sm text-primary hover:text-primary/80 hover:underline"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
