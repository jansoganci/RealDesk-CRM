# Lead Schema Integration Examples

## 1. Lead Form with React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeadSchema, type CreateLeadFormData, LEAD_SOURCE_OPTIONS, US_STATES } from './schemas';
import { leadsService } from '@/lib/serviceProxy';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';

export function LeadForm() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  
  const form = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      inquiry_type: 'sale',
      pre_approved: false,
      lead_source: undefined,
    },
  });

  const onSubmit = async (data: CreateLeadFormData) => {
    if (!user?.id || !currentOrg?.id) return;
    
    try {
      // Phone is already formatted by schema transform
      await leadsService.createLead(data, user.id, currentOrg.id);
      toast.success('Lead created');
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Name */}
      <Input {...form.register('name')} />
      {form.formState.errors.name && <span>{form.formState.errors.name.message}</span>}

      {/* Phone - auto-formats on blur */}
      <Input {...form.register('phone')} placeholder="555-123-4567" />
      {form.formState.errors.phone && <span>{form.formState.errors.phone.message}</span>}

      {/* Lead Source */}
      <Select {...form.register('lead_source')}>
        {LEAD_SOURCE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </Select>

      {/* State */}
      <Select {...form.register('preferred_state')}>
        {US_STATES.map((state) => (
          <SelectItem key={state.value} value={state.value}>
            {state.label}
          </SelectItem>
        ))}
      </Select>

      {/* Pre-approved checkbox */}
      <Checkbox {...form.register('pre_approved')} />

      <Button type="submit">Create Lead</Button>
    </form>
  );
}
```

## 2. Buyer-Agent Agreement Form

```typescript
import { createBuyerAgentAgreementSchema, COMMISSION_TYPE_OPTIONS } from './schemas';

const form = useForm({
  resolver: zodResolver(createBuyerAgentAgreementSchema),
  defaultValues: {
    lead_id: leadId,
    commission_type: 'percentage',
    commission_rate: 2.5,
    status: 'active',
    signed_date: new Date(),
    expiration_date: addMonths(new Date(), 6),
  },
});

const onSubmit = async (data) => {
  await leadsService.createBuyerAgentAgreement(data, user.id, orgId);
};
```

## 3. Showing Log Form

```typescript
import { createShowingLogSchema, INTEREST_LEVEL_OPTIONS } from './schemas';

const form = useForm({
  resolver: zodResolver(createShowingLogSchema),
  defaultValues: {
    lead_id: leadId,
    property_id: propertyId,
    showing_date: new Date(),
    duration_minutes: 30,
    interest_level: undefined,
  },
});

const onSubmit = async (data) => {
  await leadsService.createShowingLog(data, user.id, orgId);
};
```

## 4. Status Update (Inline)

```typescript
import { leadStatusSchema } from './schemas';

const handleStatusChange = async (leadId: string, newStatus: string) => {
  // Validate status value
  const parsed = leadStatusSchema.safeParse(newStatus);
  if (!parsed.success) {
    toast.error('Invalid status');
    return;
  }
  
  await leadsService.updateLeadStatus(leadId, parsed.data, userId);
};
```

## 5. Conditional Budget Fields (Rental vs Sale)

```typescript
const inquiryType = form.watch('inquiry_type');

return (
  <>
    {inquiryType === 'rental' && (
      <>
        <Input
          type="number"
          {...form.register('min_rent_budget', { valueAsNumber: true })}
          placeholder="Minimum monthly rent"
        />
        <Input
          type="number"
          {...form.register('max_rent_budget', { valueAsNumber: true })}
          placeholder="Maximum monthly rent"
        />
      </>
    )}
    
    {inquiryType === 'sale' && (
      <>
        <Input
          type="number"
          {...form.register('min_sale_budget', { valueAsNumber: true })}
          placeholder="Minimum purchase price"
        />
        <Input
          type="number"
          {...form.register('max_sale_budget', { valueAsNumber: true })}
          placeholder="Maximum purchase price"
        />
      </>
    )}
  </>
);
```

## Validation Behavior

### Phone Number Transform

Input: `5551234567` → Output: `(555) 123-4567`  
Input: `+1 555-123-4567` → Output: `(555) 123-4567`  
Input: `555-123-4567` → Output: `(555) 123-4567`

### State Code Transform

Input: `tx` → Output: `TX`  
Input: `TX` → Output: `TX`

### Cross-Field Validation

- Min/max budget validation runs after all fields are parsed
- Error appears on the `max_*_budget` field
- Commission type validation ensures percentage has rate, flat_fee has amount

## Error Messages

All error messages are defined inline in the schemas. For i18n support, wrap schema creation in a function that accepts `t()`:

```typescript
export const getCreateLeadSchema = (t: TFunction) => {
  return z.object({
    name: z.string().min(1, t('validations.nameRequired')),
    phone: z.string().refine(isValidPhone, {
      message: t('validations.invalidPhone'),
    }),
    // ... rest of schema
  });
};
```

Then use in component:

```typescript
const { t } = useTranslation('leads');
const schema = useMemo(() => getCreateLeadSchema(t), [t]);
const form = useForm({ resolver: zodResolver(schema) });
```
