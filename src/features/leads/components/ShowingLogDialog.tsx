import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { leadsService } from '@/lib/serviceProxy';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createShowingLogSchema,
  SHOWING_FEEDBACK_OPTIONS,
  type CreateShowingLogFormData,
} from '../schemas/showing-log-form';
import type { ShowingLog } from '@/services/leads.service';
import type { Property } from '@/types';

interface ShowingLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  existingShowing?: ShowingLog;
  onSuccess?: () => void;
}

export function ShowingLogDialog({
  open,
  onOpenChange,
  leadId,
  existingShowing,
  onSuccess,
}: ShowingLogDialogProps) {
  const { t } = useTranslation('leads');
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const form = useForm<CreateShowingLogFormData>({
    resolver: zodResolver(createShowingLogSchema),
    defaultValues: {
      lead_id: leadId,
      showing_date: new Date(),
    },
  });

  useEffect(() => {
    if (open) {
      if (existingShowing) {
        const mappedFeedback =
          existingShowing.feedback_enum ??
          (existingShowing.interest_level === 'high'
            ? 'loved'
            : existingShowing.interest_level === 'medium'
            ? 'interested'
            : existingShowing.interest_level === 'low' || existingShowing.interest_level === 'none'
            ? 'pass'
            : 'interested');
        form.reset({
          lead_id: leadId,
          property_id: existingShowing.property_id,
          showing_date: new Date(existingShowing.showing_date),
          duration_minutes: existingShowing.duration_minutes ?? undefined,
          feedback: mappedFeedback,
          interest_level: existingShowing.interest_level as any,
        });
      } else {
        form.reset({
          lead_id: leadId,
          showing_date: new Date(),
          feedback: 'interested',
        });
      }
    }
  }, [open, existingShowing, leadId, form]);

  useEffect(() => {
    const loadProperties = async () => {
      if (!open || !currentOrg?.id || existingShowing) return;
      setLoadingProperties(true);
      try {
        const { propertiesService } = await import('@/lib/serviceProxy');
        const data = await propertiesService.getAll();
        setProperties(data);
      } catch (error) {
        console.error('Failed to load properties:', error);
      } finally {
        setLoadingProperties(false);
      }
    };
    void loadProperties();
  }, [open, currentOrg?.id, existingShowing]);

  const onSubmit = async (data: CreateShowingLogFormData) => {
    if (!user?.id || !currentOrg?.id) {
      toast.error('Authentication required');
      return;
    }

    try {
      if (existingShowing) {
        await leadsService.updateShowingFeedback(existingShowing.id, data.feedback);
        toast.success(t('toasts.showingUpdated', 'Showing updated'));
      } else {
        const mappedInterestLevel =
          data.feedback === 'loved' ? 'high' : data.feedback === 'interested' ? 'medium' : 'low';

        const serviceData = {
          ...data,
          duration_minutes: data.duration_minutes ?? undefined,
          interest_level: mappedInterestLevel as 'high' | 'medium' | 'low' | 'none',
        };
        await leadsService.createShowingLog(serviceData, user.id, currentOrg.id);
        toast.success(t('toasts.showingCreated', 'Showing logged successfully'));
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        existingShowing
          ? t('toasts.showingUpdateError', 'Failed to update showing')
          : t('toasts.showingCreateError', 'Failed to log showing')
      );
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingShowing
              ? t('showings.updateShowing', 'Update Property Showing')
              : t('showings.logShowing', 'Log Property Showing')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!existingShowing && (
              <FormField
                control={form.control}
                name="property_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('showings.selectProperty', 'Property')}</FormLabel>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-full justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? properties.find((p) => p.id === field.value)?.address ||
                                'Select property'
                              : t('showings.selectProperty', 'Select property')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput
                            placeholder={t('showings.searchProperties', 'Search properties...')}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {loadingProperties
                                ? t('common:loading', 'Loading...')
                                : t('showings.noProperties', 'No properties found.')}
                            </CommandEmpty>
                            <CommandGroup>
                              {properties.map((property) => (
                                <CommandItem
                                  key={property.id}
                                  value={property.id}
                                  onSelect={() => {
                                    form.setValue('property_id', property.id);
                                    setPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      property.id === field.value ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  <div>
                                    <p className="font-medium">{property.address}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {property.city} {property.district && `- ${property.district}`}
                                    </p>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!existingShowing && (
              <FormField
                control={form.control}
                name="showing_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('showings.showingDate', 'Showing Date & Time')}</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().slice(0, 16)
                            : ''
                        }
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!existingShowing && (
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('showings.duration', 'Duration (minutes)')}{' '}
                      <span className="text-muted-foreground">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : parseInt(val));
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('showings.durationHint', 'How long did the showing last?')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('showings.feedbackLabel', 'Showing Feedback')}</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {SHOWING_FEEDBACK_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={field.value === option.value ? 'default' : 'outline'}
                          className="justify-start"
                          onClick={() => field.onChange(option.value)}
                        >
                          <span className="mr-2" aria-hidden="true">
                            {option.emoji}
                          </span>
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>{t('showings.feedbackHint', 'How did the buyer react?')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common:actions.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? t('common:actions.saving', 'Saving...')
                  : existingShowing
                  ? t('showings.updateShowing', 'Update Showing')
                  : t('showings.logShowing', 'Log Showing')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
