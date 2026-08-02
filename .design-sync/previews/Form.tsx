import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type LeaseFormValues = { tenantEmail: string };

export function Default() {
  const form = useForm<LeaseFormValues>({ defaultValues: { tenantEmail: '' } });

  return (
    <Form {...form}>
      <form className="w-80 space-y-4">
        <FormField
          control={form.control}
          name="tenantEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tenant email</FormLabel>
              <FormControl>
                <Input placeholder="tenant@example.com" {...field} />
              </FormControl>
              <FormDescription>
                We'll send the lease invitation to this address.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Send Invitation
        </Button>
      </form>
    </Form>
  );
}
