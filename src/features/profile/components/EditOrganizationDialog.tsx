import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOrg } from '@/contexts/OrgContext';
import { organizationService } from '@/services/organization.service';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const createOrgNameSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(2, { message: t('organizationSettings.validation.nameMin') })
      .max(255, { message: t('organizationSettings.validation.nameMax') })
      .trim(),
  });

type EditOrganizationFormData = z.infer<ReturnType<typeof createOrgNameSchema>>;

interface EditOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  onSaveSuccess?: () => void;
}

export function EditOrganizationDialog({
  isOpen,
  onClose,
  initialName,
  onSaveSuccess,
}: EditOrganizationDialogProps) {
  const { t } = useTranslation(['profile', 'common']);
  const { currentOrg, isOwner, refreshOrg } = useOrg();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const schema = createOrgNameSchema((key: string) => t(`profile:${key}`));

  const form = useForm<EditOrganizationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialName || '',
    },
  });

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: initialName || '',
      });
    }
  }, [isOpen, initialName, form]);

  const handleClose = () => {
    if (form.formState.isDirty) {
      setShowDiscardDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscardConfirm = () => {
    setShowDiscardDialog(false);
    form.reset();
    onClose();
  };

  const onSubmit = async (data: EditOrganizationFormData) => {
    if (!currentOrg || !isOwner) {
      toast.error(t('profile:organizationSettings.errors.notOwner'));
      return;
    }

    setIsSubmitting(true);
    try {
      await organizationService.updateName(currentOrg.id, data.name);
      await refreshOrg();

      toast.success(t('profile:organizationSettings.updateSuccess'));
      onSaveSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update organization name:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('profile:organizationSettings.updateError');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form content - shared between Dialog and Drawer
  const formContent = (
    <Form {...form}>
      <form
        id="edit-organization-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Organization Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('profile:organizationSettings.fields.name')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t(
                    'profile:organizationSettings.fields.namePlaceholder'
                  )}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  // Mobile: Drawer
  if (isMobile) {
    return (
      <>
        <Drawer open={isOpen} onOpenChange={handleClose}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                {t('profile:organizationSettings.editDialog.title')}
              </DrawerTitle>
              <DrawerDescription>
                {t('profile:organizationSettings.editDialog.description')}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">{formContent}</div>
            <DrawerFooter>
              <Button
                type="submit"
                form="edit-organization-form"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('profile:actions.saving')}
                  </>
                ) : (
                  t('profile:actions.save')
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t('profile:actions.cancel')}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Discard Changes Dialog */}
        <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('profile:organizationSettings.discardDialog.title')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('profile:organizationSettings.discardDialog.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('profile:organizationSettings.discardDialog.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDiscardConfirm}>
                {t('profile:organizationSettings.discardDialog.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Desktop: Dialog
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('profile:organizationSettings.editDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('profile:organizationSettings.editDialog.description')}
            </DialogDescription>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('profile:actions.cancel')}
            </Button>
            <Button
              type="submit"
              form="edit-organization-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('profile:actions.saving')}
                </>
              ) : (
                t('profile:actions.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('profile:organizationSettings.discardDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile:organizationSettings.discardDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('profile:organizationSettings.discardDialog.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardConfirm}>
              {t('profile:organizationSettings.discardDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

