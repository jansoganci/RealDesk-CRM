
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ownersService, tenantsService, meetingsService } from '@/lib/serviceProxy';
import { PropertyOwner, Tenant, MeetingInsert } from '@/types';

// Zod schema for validation
const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  start_time_date: z.date({ required_error: 'Date is required' }),
  start_time_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  notes: z.string().optional(),
  relation_type: z.enum(['tenant', 'owner', 'other']).default('other'),
  tenant_id: z.string().optional(),
  property_id: z.string().optional(),
  owner_id: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface AddMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeetingAdded: () => void;
  initialTenantId?: string;
  initialPropertyId?: string;
  initialOwnerId?: string;
}

export const AddMeetingDialog = ({ 
    open, 
    onOpenChange, 
    onMeetingAdded, 
    initialTenantId, 
    initialPropertyId, 
    initialOwnerId 
}: AddMeetingDialogProps) => {
  const { t } = useTranslation('calendar');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
        title: '',
        start_time_time: '',
        notes: '',
        relation_type: 'other',
    }
  });
  
  const relationType = form.watch('relation_type');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Pre-fill form if initial IDs are provided
      if (initialTenantId) {
        form.reset({ relation_type: 'tenant', tenant_id: initialTenantId, title: t('addMeetingDialog.defaultTitle.tenant'), start_time_time: '' });
      } else if (initialOwnerId) {
        form.reset({ relation_type: 'owner', owner_id: initialOwnerId, title: t('addMeetingDialog.defaultTitle.owner'), start_time_time: '' });
      } else {
        form.reset({ title: '', notes: '', relation_type: 'other', start_time_time: '' });
      }

      // Fetch related data
      Promise.all([
        tenantsService.getAll(),
        ownersService.getAll(),
      ]).then(([tenantsData, ownersData]) => {
        setTenants(tenantsData);
        setOwners(ownersData);
      });
    }
  }, [open, initialTenantId, initialPropertyId, initialOwnerId, form, t]);

  const onSubmit = async (values: MeetingFormData) => {
    setIsSubmitting(true);
    try {
      // Combine date and time
      const [hours, minutes] = values.start_time_time.split(':').map(Number);
      const startDate = new Date(values.start_time_date);
      startDate.setHours(hours, minutes);

      const meetingPayload: MeetingInsert = {
        title: values.title,
        start_time: startDate.toISOString(),
        notes: values.notes,
        tenant_id: values.relation_type === 'tenant' ? values.tenant_id : undefined,
        owner_id: values.relation_type === 'owner' ? values.owner_id : undefined,
      };

      await meetingsService.create(meetingPayload);

      onMeetingAdded();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Failed to create meeting', error);
      // TODO: Show toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('addMeetingDialog.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addMeetingDialog.form.title')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="start_time_date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>{t('addMeetingDialog.form.date')}</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>{t('addMeetingDialog.form.pickDate')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="start_time_time"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('addMeetingDialog.form.time')}</FormLabel>
                        <FormControl>
                            <Input type="time" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <FormField
                control={form.control}
                name="relation_type"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('addMeetingDialog.form.relatedTo')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={t('addMeetingDialog.form.selectRelation')} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="tenant">{t('addMeetingDialog.form.tenant')}</SelectItem>
                                <SelectItem value="owner">{t('addMeetingDialog.form.owner')}</SelectItem>
                                <SelectItem value="other">{t('addMeetingDialog.form.other')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />

            {relationType === 'tenant' && (
                 <FormField
                    control={form.control}
                    name="tenant_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('addMeetingDialog.form.tenant')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder={t('addMeetingDialog.form.selectTenant')} /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
            )}
            

            {relationType === 'owner' && (
                 <FormField
                    control={form.control}
                    name="owner_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('addMeetingDialog.form.owner')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder={t('addMeetingDialog.form.selectOwner')} /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {owners.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
            )}

            {/* Similar selects for property and owner... */}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addMeetingDialog.form.notes')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t('common:cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common:saving') : t('common:save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
