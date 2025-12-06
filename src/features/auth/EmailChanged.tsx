import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ROUTES, APP_NAME } from '../../config/constants';
import { CheckCircle } from 'lucide-react';
import { COLORS } from '@/config/colors';

export const EmailChanged = () => {
  return (
    <div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            E-posta Adresin Güncellendi
          </CardTitle>
          <CardDescription className="text-center">
            Yeni e-posta adresin başarıyla doğrulandı. Artık hesabına bu adresle giriş yapabilirsin.
            <br />
            <span className="text-xs text-gray-500 mt-2 block">
              Your email address has been successfully updated. You can now sign in with your new email.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <Link to={ROUTES.LOGIN} className="w-full">
              <Button
                className={`w-full ${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover}`}
              >
                Giriş Yap
              </Button>
            </Link>
            <Link to={ROUTES.DASHBOARD} className="w-full">
              <Button
                variant="outline"
                className="w-full"
              >
                Dashboard'a Git
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

