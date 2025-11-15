---
description: Create form with React Hook Form and Zod validation following project patterns
---

# Add Form

You are creating a form using React Hook Form and Zod validation for the Real Estate CRM. Follow the established patterns for consistency.

## Required Information

Ask the user:
1. **Form name** (e.g., "PropertyForm", "TenantForm")
2. **Form purpose** (create, edit, or both)
3. **Fields needed** with their types and validation rules
4. **Form location** (Dialog, Page, or standalone component)

## Form Template

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COLORS } from '@/config/colors';

// Define validation schema
const formSchema = z.object({
  // Text field (required)
  name: z.string().min(1, 'Required'),

  // Email field
  email: z.string().email('Invalid email').optional(),

  // Number field
  amount: z.number().min(0, 'Must be positive'),

  // Select/enum field
  status: z.enum(['active', 'inactive', 'archived']),

  // Date field
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  }),

  // Optional text field
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface [FormName]Props {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function [FormName]({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: [FormName]Props) {
  const { t } = useTranslation('[namespace]');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      amount: 0,
      status: 'active',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Grid layout: 1 column on mobile, 2 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Text Input */}
        <div className="space-y-2">
          <Label htmlFor="name">
            {t('fields.name')}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            {...form.register('name')}
            placeholder={t('fields.namePlaceholder')}
            disabled={loading}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="email">{t('fields.email')}</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email')}
            placeholder={t('fields.emailPlaceholder')}
            disabled={loading}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Number Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">{t('fields.amount')}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...form.register('amount', { valueAsNumber: true })}
            placeholder="0.00"
            disabled={loading}
          />
          {form.formState.errors.amount && (
            <p className="text-sm text-red-500">
              {form.formState.errors.amount.message}
            </p>
          )}
        </div>

        {/* Select Input */}
        <div className="space-y-2">
          <Label htmlFor="status">{t('fields.status')}</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(value) => form.setValue('status', value as any)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('fields.statusPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t('status.active')}</SelectItem>
              <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
              <SelectItem value="archived">{t('status.archived')}</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.status && (
            <p className="text-sm text-red-500">
              {form.formState.errors.status.message}
            </p>
          )}
        </div>

        {/* Date Input */}
        <div className="space-y-2">
          <Label htmlFor="date">{t('fields.date')}</Label>
          <Input
            id="date"
            type="date"
            {...form.register('date')}
            disabled={loading}
          />
          {form.formState.errors.date && (
            <p className="text-sm text-red-500">
              {form.formState.errors.date.message}
            </p>
          )}
        </div>
      </div>

      {/* Full-width fields */}
      <div className="space-y-2">
        <Label htmlFor="notes">{t('fields.notes')}</Label>
        <Textarea
          id="notes"
          {...form.register('notes')}
          placeholder={t('fields.notesPlaceholder')}
          rows={4}
          disabled={loading}
        />
        {form.formState.errors.notes && (
          <p className="text-sm text-red-500">
            {form.formState.errors.notes.message}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
        )}
        <Button
          type="submit"
          className={`${COLORS.primary.bgGradient} ${COLORS.primary.shadow}`}
          disabled={loading}
        >
          {loading ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}
```

## Validation Patterns

### Required Fields
```typescript
z.string().min(1, 'Field is required')
z.string().min(1, { message: 'Field is required' })
```

### Email
```typescript
z.string().email('Invalid email address')
```

### Phone (Turkish format)
```typescript
z.string().regex(/^(\+90|0)?5\d{9}$/, 'Invalid Turkish phone number')
```

### Number Range
```typescript
z.number().min(0, 'Must be positive')
z.number().min(1, 'Must be at least 1')
z.number().max(100, 'Must be at most 100')
```

### String Length
```typescript
z.string().min(3, 'Minimum 3 characters')
z.string().max(100, 'Maximum 100 characters')
```

### Date Validation
```typescript
z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date',
})

// Date in future
z.string().refine((val) => new Date(val) > new Date(), {
  message: 'Date must be in the future',
})
```

### Conditional Validation
```typescript
z.object({
  hasContract: z.boolean(),
  contractId: z.string().optional(),
}).refine((data) => {
  if (data.hasContract) {
    return !!data.contractId;
  }
  return true;
}, {
  message: 'Contract is required when hasContract is true',
  path: ['contractId'],
})
```

### File Upload
```typescript
z.instanceof(File).refine((file) => file.size <= 5000000, {
  message: 'File must be less than 5MB',
}).refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
  message: 'Only JPEG and PNG files are allowed',
})
```

## Form Input Components

### Text Input
```typescript
<Input
  {...form.register('fieldName')}
  placeholder="Enter value"
  disabled={loading}
/>
```

### Number Input
```typescript
<Input
  type="number"
  step="0.01"
  {...form.register('amount', { valueAsNumber: true })}
  disabled={loading}
/>
```

### Textarea
```typescript
<Textarea
  {...form.register('description')}
  rows={4}
  placeholder="Enter description"
  disabled={loading}
/>
```

### Select
```typescript
<Select
  value={form.watch('status')}
  onValueChange={(value) => form.setValue('status', value)}
  disabled={loading}
>
  <SelectTrigger>
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Checkbox
```typescript
<div className="flex items-center space-x-2">
  <Checkbox
    id="agree"
    checked={form.watch('agree')}
    onCheckedChange={(checked) => form.setValue('agree', checked as boolean)}
    disabled={loading}
  />
  <Label htmlFor="agree">I agree to the terms</Label>
</div>
```

### Radio Group
```typescript
<RadioGroup
  value={form.watch('type')}
  onValueChange={(value) => form.setValue('type', value)}
  disabled={loading}
>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="r1" />
    <Label htmlFor="r1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="r2" />
    <Label htmlFor="r2">Option 2</Label>
  </div>
</RadioGroup>
```

### File Upload
```typescript
const [file, setFile] = useState<File | null>(null);

<Input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) setFile(file);
  }}
  disabled={loading}
/>
```

## Form Usage Examples

### In Dialog
```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t('title')}</DialogTitle>
    </DialogHeader>
    <FormComponent
      initialData={editData}
      onSubmit={handleSubmit}
      onCancel={() => setOpen(false)}
      loading={loading}
    />
  </DialogContent>
</Dialog>
```

### In Page
```typescript
<PageContainer title={t('title')}>
  <Card>
    <CardContent className="pt-6">
      <FormComponent
        onSubmit={handleSubmit}
        loading={loading}
      />
    </CardContent>
  </Card>
</PageContainer>
```

## Form State Management

### Reset Form
```typescript
form.reset();
form.reset(defaultValues);
```

### Set Individual Field
```typescript
form.setValue('fieldName', value);
```

### Watch Field Changes
```typescript
const fieldValue = form.watch('fieldName');
const allValues = form.watch();
```

### Manual Validation
```typescript
const isValid = await form.trigger(); // Validate all
const isFieldValid = await form.trigger('fieldName'); // Validate one field
```

### Form State
```typescript
const { errors, isSubmitting, isValid, isDirty } = form.formState;
```

## Error Display Patterns

### Inline Error
```typescript
{form.formState.errors.fieldName && (
  <p className="text-sm text-red-500">
    {form.formState.errors.fieldName.message}
  </p>
)}
```

### Error Summary
```typescript
{Object.keys(form.formState.errors).length > 0 && (
  <div className="bg-red-50 border border-red-200 rounded-md p-4">
    <p className="text-sm text-red-600">
      {t('pleaseFixErrors')}
    </p>
  </div>
)}
```

## Multi-Step Form Pattern

```typescript
const [step, setStep] = useState(1);
const totalSteps = 3;

// Step 1 schema
const step1Schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// Step 2 schema
const step2Schema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
});

// Combined schema
const fullSchema = step1Schema.merge(step2Schema);

const form = useForm({
  resolver: zodResolver(
    step === 1 ? step1Schema :
    step === 2 ? step2Schema :
    fullSchema
  ),
});

const nextStep = async () => {
  const isValid = await form.trigger();
  if (isValid) setStep(step + 1);
};
```

Now, please provide the form details and I'll generate the complete form component with validation for you!
