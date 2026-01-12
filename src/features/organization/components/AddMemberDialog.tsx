import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOrg } from '@/contexts/OrgContext';
import { organizationService } from '@/services/organization.service';
import { createAddMemberSchema, type AddMemberFormData } from '../schemas/addMemberSchema';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddMemberDialog({
  isOpen,
  onClose,
  onSuccess,
}: AddMemberDialogProps) {
  const { t } = useTranslation(['team', 'common']);
  const { currentOrg } = useOrg();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const schema = createAddMemberSchema(t);

  const form = useForm<AddMemberFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      role: 'member',
    },
  });

  const handleClose = () => {
    if (form.formState.isDirty) {
      setShowDiscardDialog(true);
    } else {
      form.reset();
      onClose();
    }
  };

  const handleDiscardConfirm = () => {
    setShowDiscardDialog(false);
    form.reset();
    onClose();
  };

  const onSubmit = async (data: AddMemberFormData) => {
    if (!currentOrg) {
      toast.error(t('common:error'));
      return;
    }

    setIsSubmitting(true);
    try {
      await organizationService.inviteMember(currentOrg.id, data.email, data.role);

      toast.success(t('team:success.memberAdded'));
      form.reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to add member:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('team:errors.addFailed');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form content - shared between Dialog and Drawer
  const formContent = (
    <Form {...form}>
      <form
        id="add-member-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('team:addDialog.emailLabel')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t('team:addDialog.emailPlaceholder')}
                  disabled={isSubmitting}
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Role */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('team:addDialog.roleLabel')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('team:addDialog.roleLabel')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="member">{t('team:roles.member')}</SelectItem>
                  <SelectItem value="owner">{t('team:roles.owner')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {t('team:addDialog.roleHelp')}
              </FormDescription>
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
              <DrawerTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                {t('team:addDialog.title')}
              </DrawerTitle>
              <DrawerDescription>
                {t('team:addDialog.description')}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">{formContent}</div>
            <DrawerFooter>
              <Button
                type="submit"
                form="add-member-form"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('team:addDialog.submitting')}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('team:addDialog.submit')}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t('common:cancel')}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Discard Changes Dialog */}
        <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('common:discardDialog.title')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('common:discardDialog.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('common:discardDialog.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDiscardConfirm}>
                {t('common:discardDialog.confirm')}
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
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t('team:addDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('team:addDialog.description')}
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
              {t('common:cancel')}
            </Button>
            <Button
              type="submit"
              form="add-member-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('team:addDialog.submitting')}
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('team:addDialog.submit')}
                </>
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
              {t('common:discardDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common:discardDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common:discardDialog.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardConfirm}>
              {t('common:discardDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
