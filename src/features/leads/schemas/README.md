# Lead Form Schemas

Zod validation schemas for Sprint 2 lead pipeline with US market validation.

## Files

- **`lead-form.ts`** — Lead creation/update with US phone + state validation
- **`buyer-agent-agreement-form.ts`** — Buyer-agent agreement with commission validation
- **`showing-log-form.ts`** — Property showing logs with interest tracking

## Usage Example

### Lead Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLeadSchema, type CreateLeadFormData, LEAD_SOURCE_OPTIONS, US_STATES } from './schemas/lead-form';

const form = useForm<CreateLeadFormData>({
  resolver: zodResolver(createLeadSchema),
  defaultValues: {
    inquiry_type: 'sale',
    pre_approved: false,
    lead_source: undefined,
  },
});

const onSubmit = async (data: CreateLeadFormData) => {
  // data.phone is auto-formatted to (555) 123-4567
  // data.preferred_state is uppercase 2-letter code
  await leadsService.createLead(data, userId, orgId);
};
```

### Buyer-Agent Agreement Form

```typescript
import { createBuyerAgentAgreementSchema, COMMISSION_TYPE_OPTIONS } from './schemas/buyer-agent-agreement-form';

const form = useForm({
  resolver: zodResolver(createBuyerAgentAgreementSchema),
  defaultValues: {
    commission_type: 'percentage',
    commission_rate: 2.5,
    status: 'active',
  },
});
```

### Showing Log Form

```typescript
import { createShowingLogSchema, INTEREST_LEVEL_OPTIONS } from './schemas/showing-log-form';

const form = useForm({
  resolver: zodResolver(createShowingLogSchema),
  defaultValues: {
    interest_level: undefined,
    duration_minutes: 30,
  },
});
```

## Validation Rules

### Lead Form

- **Phone**: US NANP validation (10 digits, valid area code + exchange)
- **Email**: Standard email format (optional)
- **State**: 2-letter uppercase code from 50 US states + DC
- **Budget**: Min cannot exceed max (cross-field validation)
- **Phone Transform**: Auto-formats to `(555) 123-4567` on valid input

### Buyer-Agent Agreement

- **Commission**: Percentage requires `commission_rate`, flat fee requires `flat_fee_amount`
- **Dates**: Expiration must be after signed date
- **Commission Rate**: 0-100% range

### Showing Log

- **Duration**: 1-480 minutes (8 hours max)
- **Interest Level**: high | medium | low | none
- **Feedback**: Max 1000 characters

## Dropdown Options

All schemas export `*_OPTIONS` arrays for Select components:

- `LEAD_SOURCE_OPTIONS` — 8 lead sources
- `LEAD_STATUS_OPTIONS` — 9 pipeline statuses
- `US_STATES` — 50 states + DC
- `COMMISSION_TYPE_OPTIONS` — 3 commission types
- `AGREEMENT_STATUS_OPTIONS` — 3 agreement statuses
- `INTEREST_LEVEL_OPTIONS` — 4 interest levels

## Integration with Services

The schemas align with service layer types:

```typescript
// lead-form.ts CreateLeadFormData → leadsService.createLead()
// buyer-agent-agreement-form.ts → leadsService.createBuyerAgentAgreement()
// showing-log-form.ts → leadsService.createShowingLog()
```
