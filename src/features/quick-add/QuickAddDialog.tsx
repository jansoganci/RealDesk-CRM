import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2, Zap } from 'lucide-react';
import { useQuickAdd } from './useQuickAdd';
import { OwnerSection } from './sections/OwnerSection';
import { PropertySection } from './sections/PropertySection';
import { TenantSection } from './sections/TenantSection';

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const QuickAddDialog = ({ open, onOpenChange, onSuccess }: QuickAddDialogProps) => {
  const { t } = useTranslation('quick-add');

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const { form, owners, loading, loadingOwners, handleSubmit } = useQuickAdd(handleSuccess);

  const handleClose = () => {
    if (!loading) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4 pb-4">
              <OwnerSection
                form={form}
                owners={owners}
                loading={loading || loadingOwners}
              />

              <PropertySection
                form={form}
                loading={loading}
              />

              <TenantSection
                form={form}
                loading={loading}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50/50 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || loadingOwners}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('actions.creating')}
              </>
            ) : (
              t('actions.createAll')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
