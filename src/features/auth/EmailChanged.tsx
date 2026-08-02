import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ROUTES } from '../../config/constants';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const EmailChanged = () => {
  const { t } = useTranslation('auth');

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
            {t('emailChanged.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('emailChanged.description')}
            <br />
            <span className="mt-2 block text-xs text-muted-foreground">
              {t('emailChanged.secondaryDescription')}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <Link to={ROUTES.LOGIN} className="w-full">
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {t('emailChanged.loginButton')}
              </Button>
            </Link>
            <Link to={ROUTES.DASHBOARD} className="w-full">
              <Button
                variant="outline"
                className="w-full"
              >
                {t('emailChanged.dashboardButton')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
