import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { FileInput } from 'lucide-react';

/**
 * Contract Import Banner Component
 * Displays a banner promoting the contract import feature
 */

interface ContractImportBannerProps {
  onImportClick: () => void;
  disabled?: boolean;
}

export function ContractImportBanner({ onImportClick, disabled }: ContractImportBannerProps) {
  const { t } = useTranslation(['contracts', 'common']);

  return (
    <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-r from-primary to-warning/25 p-4 dark:from-primary/40 dark:to-warning/25">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileInput className="h-5 w-5 text-primary dark:text-primary" />
            {t('import.banner.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('import.banner.description')}
          </p>
        </div>
        <Button
          onClick={onImportClick}
          disabled={disabled}
          title={disabled ? t('common:readOnlyMode') : undefined}
          className="bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary whitespace-nowrap"
        >
          <FileInput className="h-4 w-4 mr-2" />
          {t('import.banner.button')}
        </Button>
      </div>
    </div>
  );
}
