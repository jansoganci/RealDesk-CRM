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
import { getOwnerSchema } from './ownerSchema';
import type { OwnerCreatePayload, OwnerWithSensitiveFields } from '@/lib/serviceProxy';

interface OwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner?: OwnerWithSensitiveFields | null;
  onSubmit: (data: OwnerCreatePayload) => Promise<void>;
  loading?: boolean;
}

export const OwnerDialog = ({ open, onOpenChange, owner, onSubmit, loading }: OwnerDialogProps) => {
  const { t } = useTranslation(['owners', 'common']);
  const ownerSchema = getOwnerSchema(t);
  type OwnerFormData = z.infer<typeof ownerSchema>;

  const form = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      routing_number: '',
      account_number: '',
      tax_id: '',
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
          routing_number: owner.routing_number,
          account_number: owner.account_number,
          tax_id: owner.tax_id || '',
        });
      } else {
        form.reset({
          name: '',
          email: '',
          phone: '',
          address: '',
          notes: '',
          routing_number: '',
          account_number: '',
          tax_id: '',
        });
      }
    }
  }, [open, owner, form]);

  const handleSubmit = async (data: OwnerFormData) => {
    const cleanedData: OwnerCreatePayload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      tax_id: data.tax_id?.trim() ? data.tax_id.trim() : null,
      routing_number: data.routing_number?.trim() || null,
      account_number: data.account_number?.trim() || null,
    };
    await onSubmit(cleanedData);
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
              name="routing_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog.form.routingNumber')}</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder={t('dialog.form.routingPlaceholder')}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog.form.accountNumber')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" placeholder={t('dialog.form.accountPlaceholder')} {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog.form.taxId')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" placeholder={t('dialog.form.taxIdPlaceholder')} {...field} disabled={loading} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t('dialog.form.taxIdHint')}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {owner ? (
              <p className="text-xs text-muted-foreground">{t('dialog.form.bankEditHint')}</p>
            ) : null}

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
