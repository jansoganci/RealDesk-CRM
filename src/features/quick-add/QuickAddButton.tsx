import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { QuickAddDialog } from './QuickAddDialog';

interface QuickAddButtonProps {
  onSuccess?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const QuickAddButton = ({
  onSuccess,
  variant = 'default',
  size = 'default',
  className = '',
}: QuickAddButtonProps) => {
  const { t } = useTranslation('quick-add');
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        variant={variant}
        size={size}
        className={`bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md h-8 md:h-10 px-2 md:px-4 text-xs md:text-sm ${className}`}
      >
        <Zap className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
        <span className="hidden sm:inline">{t('button')}</span>
        <span className="sm:hidden">{t('buttonShort')}</span>
      </Button>

      <QuickAddDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onSuccess}
      />
    </>
  );
};
