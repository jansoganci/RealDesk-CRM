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
        className={`bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md ${className}`}
      >
        <Zap className="mr-2 h-4 w-4" />
        {t('button')}
      </Button>

      <QuickAddDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onSuccess}
      />
    </>
  );
};
