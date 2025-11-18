import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import { Loader2 } from 'lucide-react';
import type { FinancialTransaction, ExpenseCategory } from '../../../types/financial';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: FinancialTransaction | null;
  categories: ExpenseCategory[];
  onSave: (data: any) => Promise<void>;
  loading?: boolean;
}

const getTransactionSchema = (t: any) =>
  z.object({
    transaction_date: z.string().min(1, t('finance:validation.dateRequired')),
    type: z.enum(['income', 'expense'], {
      required_error: t('finance:validation.typeRequired'),
    }),
    category: z.string().min(1, t('finance:validation.categoryRequired')),
    amount: z.coerce.number().positive(t('finance:validation.amountPositive')),
    description: z.string().min(1, t('finance:validation.descriptionRequired')),
    notes: z.string().optional(),
    payment_method: z.enum(['cash', 'bank_transfer', 'credit_card', 'check']).optional(),
    payment_status: z.enum(['completed', 'pending', 'cancelled']).optional(),
  });

type TransactionFormData = z.infer<ReturnType<typeof getTransactionSchema>>;

export const TransactionDialog = ({
  open,
  onOpenChange,
  transaction,
  categories,
  onSave,
  loading = false,
}: TransactionDialogProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const transactionSchema = getTransactionSchema(t);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      type: 'expense',
      category: '',
      amount: 0,
      description: '',
      notes: '',
      payment_method: 'bank_transfer',
      payment_status: 'completed',
    },
  });

  // Update form when transaction changes
  useEffect(() => {
    if (transaction) {
      form.reset({
        transaction_date: transaction.transaction_date,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description,
        notes: transaction.notes || '',
        payment_method: transaction.payment_method as any,
        payment_status: transaction.payment_status as any,
      });
    } else {
      form.reset({
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'expense',
        category: '',
        amount: 0,
        description: '',
        notes: '',
        payment_method: 'bank_transfer',
        payment_status: 'completed',
      });
    }
  }, [transaction, form]);

  const handleSubmit = async (data: TransactionFormData) => {
    await onSave(data);
    form.reset();
  };

  const selectedType = form.watch('type');
  const filteredCategories = categories.filter(c => c.type === selectedType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {transaction
              ? t('finance:dialog.editTitle')
              : t('finance:dialog.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? t('finance:dialog.editDescription')
              : t('finance:dialog.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Transaction Date */}
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance:fields.date')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance:fields.type')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('finance:fields.selectType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">
                          {t('finance:types.income')}
                        </SelectItem>
                        <SelectItem value="expense">
                          {t('finance:types.expense')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance:fields.category')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('finance:fields.selectCategory')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">
                            {t('finance:fields.noCategoriesAvailable')}
                          </div>
                        ) : (
                          filteredCategories.map(cat => {
                            // Translate category name using i18n
                            const categoryKey = `finance:categories.${selectedType}.${cat.name}`;
                            const translatedName = t(categoryKey, { defaultValue: cat.name });
                            return (
                              <SelectItem key={cat.id} value={cat.name}>
                                {translatedName}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance:fields.amount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('finance:fields.description')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('finance:fields.descriptionPlaceholder')}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('finance:fields.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('finance:fields.notesPlaceholder')}
                      {...field}
                      disabled={loading}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Payment Method */}
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance:fields.paymentMethod')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('finance:fields.selectPaymentMethod')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">
                          {t('finance:paymentMethods.cash')}
                        </SelectItem>
                        <SelectItem value="bank_transfer">
                          {t('finance:paymentMethods.bank_transfer')}
                        </SelectItem>
                        <SelectItem value="credit_card">
                          {t('finance:paymentMethods.credit_card')}
                        </SelectItem>
                        <SelectItem value="check">
                          {t('finance:paymentMethods.check')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Status */}
              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance:fields.paymentStatus')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('finance:fields.selectPaymentStatus')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="completed">
                          {t('finance:paymentStatus.completed')}
                        </SelectItem>
                        <SelectItem value="pending">
                          {t('finance:paymentStatus.pending')}
                        </SelectItem>
                        <SelectItem value="cancelled">
                          {t('finance:paymentStatus.cancelled')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common:actions.saving')}
                  </>
                ) : (
                  t('common:actions.save')
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
