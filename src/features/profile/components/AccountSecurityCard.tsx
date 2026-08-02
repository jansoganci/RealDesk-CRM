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
        <div className="flex-shrink-0 text-muted-foreground/70 dark:text-muted-foreground group-hover:text-muted-foreground dark:group-hover:text-muted-foreground transition-colors">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        className="flex-shrink-0 text-foreground hover:text-foreground dark:hover:text-foreground hover:bg-muted dark:hover:bg-muted"
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
      <div className="rounded-lg border border-border dark:border-border bg-card dark:bg-muted shadow-sm">
        <div className="px-4 py-3 border-b border-border dark:border-border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t('accountSecurity.title')}
          </h3>
        </div>
        <div className="divide-y divide-border px-4">
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
