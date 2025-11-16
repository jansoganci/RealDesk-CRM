---
description: Create React component following Real Estate CRM design system and patterns
---

# Add Component

You are creating a new React component for the Real Estate CRM. Follow the established design patterns and design system.

## Required Information

Ask the user:
1. **Component name** (PascalCase, e.g., "PropertyCard", "TenantDialog")
2. **Component type** (Page, Dialog, Card, List, Form, or UI element)
3. **Component purpose** and main functionality
4. **Props needed**
5. **Design system elements** (colors, buttons, layouts)

## Component Location

Based on component type:
- **Page components**: `src/features/[feature-name]/[ComponentName].tsx`
- **Feature components**: `src/features/[feature-name]/components/[ComponentName].tsx`
- **Common components**: `src/components/common/[ComponentName].tsx`
- **Layout components**: `src/components/layout/[ComponentName].tsx`
- **UI primitives**: `src/components/ui/[component-name].tsx` (shadcn/ui style)

## Component Templates

### 1. Page Component Template

```typescript
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { COLORS } from '@/config/colors';
import { [serviceName]Service } from '@/lib/serviceProxy';
import type { [Entity] } from '@/types';

export function [ComponentName]() {
  const { t } = useTranslation('[namespace]');
  const [items, setItems] = useState<[Entity][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await [serviceName]Service.getAll();
      setItems(data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <PageContainer
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <Button
            onClick={() => {/* Open dialog */}}
            className={`${COLORS.primary.bgGradient} ${COLORS.primary.shadow}`}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('add')}
          </Button>
        }
      >
        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <EmptyState
            title={t('empty')}
            description={t('emptyDescription')}
            action={
              <Button onClick={() => {/* Open dialog */}}>
                {t('addFirst')}
              </Button>
            }
          />
        ) : (
          <div>
            {/* List or table content */}
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}
```

### 2. Dialog Component Template

```typescript
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { COLORS } from '@/config/colors';

// Validation schema
const formSchema = z.object({
  field1: z.string().min(1, 'Required'),
  field2: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof formSchema>;

interface [ComponentName]Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: Partial<FormData>;
}

export function [ComponentName]({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: [ComponentName]Props) {
  const { t } = useTranslation('[namespace]');
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      field1: '',
      field2: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      if (initialData) {
        // Update
        await service.update(initialData.id, data);
        toast.success(t('updated'));
      } else {
        // Create
        await service.create(data);
        toast.success(t('created'));
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('edit') : t('add')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field1">{t('fields.field1')}</Label>
            <Input
              id="field1"
              {...form.register('field1')}
              placeholder={t('fields.field1Placeholder')}
            />
            {form.formState.errors.field1 && (
              <p className="text-sm text-red-500">
                {form.formState.errors.field1.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              className={`${COLORS.primary.bgGradient}`}
              disabled={loading}
            >
              {loading ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Card Component Template

```typescript
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import { COLORS, getStatusBadgeClasses } from '@/config/colors';
import type { [Entity] } from '@/types';

interface [ComponentName]Props {
  item: [Entity];
  onEdit?: (item: [Entity]) => void;
  onDelete?: (item: [Entity]) => void;
}

export function [ComponentName]({ item, onEdit, onDelete }: [ComponentName]Props) {
  const { t } = useTranslation('[namespace]');

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          {item.title}
        </CardTitle>
        <Badge className={getStatusBadgeClasses(item.status)}>
          {t(`status.${item.status}`)}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          {item.description}
        </div>

        <div className="flex gap-2 pt-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('edit')}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(item)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4. List Component Template (Responsive)

```typescript
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { [ComponentName]Card } from './[ComponentName]Card';
import type { [Entity] } from '@/types';

interface [ComponentName]Props {
  items: [Entity][];
  onEdit?: (item: [Entity]) => void;
  onDelete?: (item: [Entity]) => void;
}

export function [ComponentName]({ items, onEdit, onDelete }: [ComponentName]Props) {
  const { t } = useTranslation('[namespace]');

  return (
    <>
      {/* Mobile: Card view */}
      <div className="md:hidden space-y-4">
        {items.map((item) => (
          <[ComponentName]Card
            key={item.id}
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Desktop: Table view */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('fields.name')}</TableHead>
              <TableHead>{t('fields.status')}</TableHead>
              <TableHead>{t('fields.date')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeClasses(item.status)}>
                    {t(`status.${item.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(item.date)}</TableCell>
                <TableCell className="text-right">
                  <TableActionButtons
                    onEdit={() => onEdit?.(item)}
                    onDelete={() => onDelete?.(item)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
```

## Design System Usage

### Colors

```typescript
import { COLORS } from '@/config/colors';

// Primary button
<Button className={`${COLORS.primary.bgGradient} ${COLORS.primary.shadow}`}>
  Primary Action
</Button>

// Success button
<Button className={COLORS.success.bgGradient}>
  Success
</Button>

// Status badge
<Badge className={getStatusBadgeClasses(status)}>
  {status}
</Badge>

// Card
<Card className={getCardClasses()}>
  Content
</Card>
```

### Icons (Lucide React)

```typescript
import {
  Plus, Edit, Trash2, Search, Filter, Download,
  Home, Users, FileText, Calendar, DollarSign,
  Settings, LogOut, ChevronDown, X, Check
} from 'lucide-react';

<Plus className="h-4 w-4 mr-2" />
```

### Responsive Design

```typescript
// Mobile-first approach
<div className="space-y-4 md:grid md:grid-cols-2 md:gap-4">
  {/* Stack on mobile, grid on desktop */}
</div>

// Touch targets: min 44px on mobile
<Button className="h-11 md:h-9">
  {/* Larger on mobile */}
</Button>

// Hide on mobile
<div className="hidden md:block">
  Desktop only
</div>

// Show only on mobile
<div className="md:hidden">
  Mobile only
</div>
```

## Component Best Practices

1. **Use TypeScript** for all props and state
2. **Use i18n** for all text content
3. **Handle loading states** with loading prop/state
4. **Handle empty states** with EmptyState component
5. **Handle errors** with toast notifications
6. **Follow mobile-first** responsive design
7. **Use design system** colors and utilities
8. **Add JSDoc comments** for props
9. **Export as named export** (not default)
10. **Keep components focused** (single responsibility)

## Component Testing Checklist

- [ ] TypeScript types correct
- [ ] i18n keys added (TR and EN)
- [ ] Mobile responsive (tested at 375px)
- [ ] Tablet responsive (tested at 768px)
- [ ] Desktop responsive (tested at 1024px+)
- [ ] Loading state works
- [ ] Empty state works
- [ ] Error handling works
- [ ] Touch targets 44px+ on mobile
- [ ] Design system colors used
- [ ] Accessibility (keyboard navigation, ARIA labels)

Now, please provide the component details and I'll generate the complete component for you!
