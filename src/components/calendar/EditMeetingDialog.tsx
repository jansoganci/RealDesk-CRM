
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import { ownersService, propertiesService, tenantsService, meetingsService } from '@/lib/serviceProxy';
import { PropertyOwner, Property, Tenant, MeetingUpdate } from '@/types';
import { MeetingWithRelations } from '@/services/meetings.service';

// Zod schema for validation
const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  start_time_date: z.date({ required_error: 'Date is required' }),
  start_time_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  notes: z.string().optional(),
  relation_type: z.enum(['tenant', 'property', 'owner', 'none']).default('none'),
  tenant_id: z.string().optional(),
  property_id: z.string().optional(),
  owner_id: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface EditMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMeetingUpdated: () => void;
  meeting: MeetingWithRelations | null;
}

export const EditMeetingDialog = ({ open, onOpenChange, onMeetingUpdated, meeting }: EditMeetingDialogProps) => {
  const { t } = useTranslation('calendar');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<PropertyOwner[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
  });
  
  const relationType = form.watch('relation_type');

  useEffect(() => {
    if (meeting) {
        const startTime = new Date(meeting.start_time);
        form.reset({
            title: meeting.title || '',
            start_time_date: startTime,
            start_time_time: format(startTime, 'HH:mm'),
            notes: meeting.notes || '',
            relation_type: meeting.tenant_id ? 'tenant' : meeting.property_id ? 'property' : meeting.owner_id ? 'owner' : 'none',
            tenant_id: meeting.tenant_id || undefined,
            property_id: meeting.property_id || undefined,
            owner_id: meeting.owner_id || undefined,
        });
    }
  }, [meeting, form]);

  useEffect(() => {
    if (open) {
      Promise.all([
        tenantsService.getAll(),
        propertiesService.getAll(),
        ownersService.getAll(),
      ]).then(([tenantsData, propertiesData, ownersData]) => {
        setTenants(tenantsData);
        setProperties(propertiesData);
        setOwners(ownersData);
      });
    }
  }, [open]);

  const onSubmit = async (values: MeetingFormData) => {
    if (!meeting) return;

    setIsSubmitting(true);
    try {
      const [hours, minutes] = values.start_time_time.split(':').map(Number);
      const startDate = new Date(values.start_time_date);
      startDate.setHours(hours, minutes);

      const meetingPayload: MeetingUpdate = {
        title: values.title,
        start_time: startDate.toISOString(),
        notes: values.notes,
        tenant_id: values.relation_type === 'tenant' ? values.tenant_id : null,
        property_id: values.relation_type === 'property' ? values.property_id : null,
        owner_id: values.relation_type === 'owner' ? values.owner_id : null,
      };

      await meetingsService.update(meeting.id, meetingPayload);

      onMeetingUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update meeting', error);
      toast.error(t('toasts.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('editMeetingDialog.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Form fields are identical to AddMeetingDialog */}
            <FormField name="title" control={form.control} render={({field}) => <FormItem><FormLabel>{t('addMeetingDialog.form.title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>} />
            <div className="grid grid-cols-2 gap-4">
                <FormField name="start_time_date" control={form.control} render={({field}) => <FormItem className="flex flex-col"><FormLabel>{t('addMeetingDialog.form.date')}</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>{field.value ? format(field.value, 'PPP') : <span>{t('addMeetingDialog.form.pickDate')}</span>}<CalendarIcon className='ml-auto h-4 w-4 opacity-50' /></Button></FormControl></PopoverTrigger><PopoverContent className='w-auto p-0' align='start'><Calendar mode='single' selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage/></FormItem>} />
                <FormField name="start_time_time" control={form.control} render={({field}) => <FormItem><FormLabel>{t('addMeetingDialog.form.time')}</FormLabel><FormControl><Input type='time' {...field} /></FormControl><FormMessage/></FormItem>} />
            </div>
            <FormField name="relation_type" control={form.control} render={({field}) => <FormItem><FormLabel>{t('addMeetingDialog.form.relatedTo')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('addMeetingDialog.form.selectRelation')} /></SelectTrigger></FormControl><SelectContent><SelectItem value='none'>{t('addMeetingDialog.form.none')}</SelectItem><SelectItem value='tenant'>{t('addMeetingDialog.form.tenant')}</SelectItem><SelectItem value='property'>{t('addMeetingDialog.form.property')}</SelectItem><SelectItem value='owner'>{t('addMeetingDialog.form.owner')}</SelectItem></SelectContent></Select></FormItem>} />
            {relationType === 'tenant' && <FormField name='tenant_id' control={form.control} render={({field}) => <FormItem><FormLabel>{t('addMeetingDialog.form.tenant')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('addMeetingDialog.form.selectTenant')} /></SelectTrigger></FormControl><SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></FormItem>} />} 
            {relationType === 'property' && <FormField name='property_id' control={form.control} render={({field}) => <FormItem><FormLabel>{t('addMeetingDialog.form.property')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('addMeetingDialog.form.selectProperty')} /></SelectTrigger></FormControl><SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>)}</SelectContent></Select></FormItem>} />} 
            {relationType === 'owner' && <FormField name='owner_id' control={form.control} render={({field}) => <FormItem><FormLabel>{t('addMeetingDialog.form.owner')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('addMeetingDialog.form.selectOwner')} /></SelectTrigger></FormControl><SelectContent>{owners.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></FormItem>} />} 
            <FormField name="notes" control={form.control} render={({field}) => <FormItem><FormLabel>{t('addMeetingDialog.form.notes')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage/></FormItem>} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">{t('common:cancel')}</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t('common:saving') : t('common:save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
