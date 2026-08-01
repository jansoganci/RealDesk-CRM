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
import { Checkbox } from '../../../components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import type { TFunction } from 'i18next';
import type {
  RecurringExpense,
  ExpenseCategory,
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
} from '../../../types/financial';

interface RecurringExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringExpense?: RecurringExpense | null; // For edit mode
  categories: ExpenseCategory[]; // Pre-filtered expense categories
  onSave: (data: CreateRecurringExpenseInput | UpdateRecurringExpenseInput) => Promise<void>;
  loading?: boolean;
}

const getRecurringExpenseSchema = (_t: TFunction) =>
  z.object({
    name: z.string().min(1, 'Name is required'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    currency: z.literal('USD', {
      required_error: 'Currency is required',
    }),
    category: z.string().min(1, 'Category is required'),
    frequency: z.enum(['monthly', 'quarterly', 'yearly'], {
      required_error: 'Frequency is required',
    }),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().nullable().optional(),
    day_of_month: z.coerce.number().min(1).max(31).nullable().optional(),
    vendor_name: z.string().optional(),
    payment_method: z.enum(['cash', 'bank_transfer', 'credit_card', 'check']).nullable().optional(),
    notes: z.string().optional(),
  });

type RecurringExpenseFormData = z.infer<ReturnType<typeof getRecurringExpenseSchema>>;

export const RecurringExpenseDialog = ({
  open,
  onOpenChange,
  recurringExpense,
  categories,
  onSave,
  loading = false,
}: RecurringExpenseDialogProps) => {
  const { t } = useTranslation(['finance', 'common']);
  const recurringExpenseSchema = getRecurringExpenseSchema(t);

  const normalizedDefaultCurrency = 'USD' as const;

  const form = useForm<RecurringExpenseFormData>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: {
      name: '',
      amount: 0,
      currency: normalizedDefaultCurrency,
      category: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      day_of_month: null,
      vendor_name: '',
      payment_method: null,
      notes: '',
    },
  });

  // Update form when recurringExpense changes (edit mode)
  useEffect(() => {
    if (recurringExpense) {
      // When editing: use expense's currency or fallback to user preference
      form.reset({
        name: recurringExpense.name,
        amount: recurringExpense.amount,
        currency: 'USD',
        category: recurringExpense.category,
        frequency: recurringExpense.frequency,
        start_date: recurringExpense.start_date,
        end_date: recurringExpense.end_date || null,
        day_of_month: recurringExpense.day_of_month || null,
        vendor_name: recurringExpense.vendor_name || '',
        payment_method: recurringExpense.payment_method ?? undefined,
        notes: recurringExpense.notes || '',
      });
    } else {
      // When creating new: use user preference or 'USD'
      form.reset({
        name: '',
        amount: 0,
        currency: 'USD',
        category: '',
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        day_of_month: null,
        vendor_name: '',
        payment_method: null,
        notes: '',
      });
    }
  }, [recurringExpense, form, normalizedDefaultCurrency]);

  const handleSubmit = async (data: RecurringExpenseFormData) => {
    // Convert form data to service input format
    const serviceData = {
      ...data,
      end_date: data.end_date || null, // Convert empty string to null
      day_of_month: data.day_of_month || null,
      vendor_name: data.vendor_name || undefined,
      payment_method: data.payment_method || null,
      notes: data.notes || undefined,
    };

    await onSave(serviceData);
    form.reset();
  };

  const isIndefinite = form.watch('end_date') === null || form.watch('end_date') === '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {recurringExpense
              ? t('finance:recurring.dialog.editTitle', { defaultValue: 'Edit Recurring Expense' })
              : t('finance:recurring.dialog.addTitle', { defaultValue: 'Add Recurring Expense' })}
          </DialogTitle>
          <DialogDescription>
            {recurringExpense
              ? t('finance:recurring.dialog.editDescription', { defaultValue: 'Update recurring expense details' })
              : t('finance:recurring.dialog.addDescription', { defaultValue: 'Create a new recurring expense' })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('finance:recurring.form.name', { defaultValue: 'Name' })}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('finance:recurring.form.name', { defaultValue: 'Name' })}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('finance:recurring.form.amount', { defaultValue: 'Amount' })}
                    </FormLabel>
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

              {/* Currency */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('finance:recurring.form.currency', { defaultValue: 'Currency' })}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('finance:recurring.form.currency', { defaultValue: 'Currency' })} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
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
                    <FormLabel>
                      {t('finance:recurring.form.category', { defaultValue: 'Category' })}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('finance:recurring.form.category', { defaultValue: 'Category' })}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-slate-400">
                            {t('finance:fields.noCategoriesAvailable', { defaultValue: 'No categories available' })}
                          </div>
                        ) : (
                          categories.map(cat => {
                            const categoryKey = `finance:categories.expense.${cat.name}`;
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

              {/* Frequency */}
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('finance:recurring.form.frequency', { defaultValue: 'Frequency' })}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('finance:recurring.form.frequency', { defaultValue: 'Frequency' })}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">
                          {t('finance:recurring.frequencies.monthly', { defaultValue: 'Monthly' })}
                        </SelectItem>
                        <SelectItem value="quarterly">
                          {t('finance:recurring.frequencies.quarterly', { defaultValue: 'Quarterly' })}
                        </SelectItem>
                        <SelectItem value="yearly">
                          {t('finance:recurring.frequencies.yearly', { defaultValue: 'Yearly' })}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('finance:recurring.form.startDate', { defaultValue: 'Start Date' })}
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date with Indefinite Checkbox */}
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('finance:recurring.form.endDate', { defaultValue: 'End Date' })}
                    </FormLabel>
                    <div className="space-y-2">
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ''}
                          disabled={isIndefinite || loading}
                        />
                      </FormControl>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="indefinite"
                          checked={isIndefinite}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange(null);
                            } else {
                              // When unchecked, set to start_date or today
                              const startDate = form.getValues('start_date');
                              field.onChange(startDate || new Date().toISOString().split('T')[0]);
                            }
                          }}
                          disabled={loading}
                        />
                        <label
                          htmlFor="indefinite"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {t('finance:recurring.form.indefinite', { defaultValue: 'Indefinite/No End Date' })}
                        </label>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Day of Month */}
              <FormField
                control={form.control}
                name="day_of_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('finance:recurring.form.dayOfMonth', { defaultValue: 'Day of Month' })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="1-31"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : Number(e.target.value);
                          field.onChange(value);
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vendor Name */}
              <FormField
                control={form.control}
                name="vendor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('finance:recurring.form.vendor', { defaultValue: 'Vendor Name' })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('finance:recurring.form.vendor', { defaultValue: 'Vendor Name' })}
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Payment Method */}
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('finance:recurring.form.paymentMethod', { defaultValue: 'Payment Method' })}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('finance:fields.selectPaymentMethod', { defaultValue: 'Select payment method' })}
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
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('finance:recurring.form.notes', { defaultValue: 'Notes' })}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('finance:fields.notesPlaceholder', { defaultValue: 'Add any additional notes' })}
                      {...field}
                      disabled={loading}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
