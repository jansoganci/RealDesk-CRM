import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Mail, Lock } from 'lucide-react';
import { EditProfileDialog } from './EditProfileDialog';

interface SecurityRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}

function SecurityRow({ icon, title, description, buttonLabel, onClick }: SecurityRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500 truncate">{description}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        className="flex-shrink-0 text-gray-700 hover:text-gray-900 hover:bg-gray-50"
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

export function AccountSecurityCard() {
  const { t } = useTranslation('profile');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'password'>('email');

  const handleChangeEmail = () => {
    setActiveTab('email');
    setDialogOpen(true);
  };

  const handleChangePassword = () => {
    setActiveTab('password');
    setDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {t('accountSecurity.title')}
          </h3>
        </div>
        <div className="px-4 divide-y divide-gray-100">
          <SecurityRow
            icon={<Mail className="h-5 w-5" />}
            title={t('accountSecurity.changeEmailButton')}
            description={t('accountSecurity.emailDescription')}
            buttonLabel={t('accountSecurity.changeButton')}
            onClick={handleChangeEmail}
          />
          <SecurityRow
            icon={<Lock className="h-5 w-5" />}
            title={t('accountSecurity.changePasswordButton')}
            description={t('accountSecurity.passwordDescription')}
            buttonLabel={t('accountSecurity.changeButton')}
            onClick={handleChangePassword}
          />
        </div>
      </div>

      <EditProfileDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultTab={activeTab}
      />
    </>
  );
}
