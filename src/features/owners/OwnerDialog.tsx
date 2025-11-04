import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { PropertyOwner } from '../../types';
import { getOwnerSchema } from './ownerSchema';

interface OwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner?: PropertyOwner | null;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export const OwnerDialog = ({ open, onOpenChange, owner, onSubmit, loading }: OwnerDialogProps) => {
  const { t } = useTranslation(['owners', 'common']);
  const ownerSchema = getOwnerSchema(t);
  type OwnerFormData = z.infer<typeof ownerSchema>;
  
  // Type assertion for onSubmit to maintain type safety
  const typedOnSubmit = onSubmit as (data: OwnerFormData) => Promise<void>;
  
  const form = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (owner) {
        form.reset({
          name: owner.name || '',
          email: owner.email || '',
          phone: owner.phone || '',
          address: owner.address || '',
          notes: owner.notes || '',
        });
      } else {
        form.reset({
          name: '',
          email: '',
          phone: '',
          address: '',
          notes: '',
        });
      }
    }
  }, [open, owner, form]);

  const handleSubmit = async (data: OwnerFormData) => {
    const cleanedData = {
      ...data,
      address: data.address?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };
    await typedOnSubmit(cleanedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{owner ? t('dialog.editTitle') : t('dialog.addTitle')}</DialogTitle>
          <DialogDescription>
            {owner ? t('dialog.editDescription') : t('dialog.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog.form.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('dialog.form.namePlaceholder')} {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog.form.email')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('dialog.form.emailPlaceholder')} {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog.form.phone')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('dialog.form.phonePlaceholder')} {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog.form.address')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('dialog.form.addressPlaceholder')} {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog.form.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('dialog.form.notesPlaceholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('saving', { ns: 'common' }) : owner ? t('dialog.updateButton') : t('dialog.addButton')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
