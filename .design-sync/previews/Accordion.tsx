import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

export function Default() {
  return (
    <Accordion type="single" collapsible defaultValue="item-1" className="w-96">
      <AccordionItem value="item-1">
        <AccordionTrigger>What happens when a lease renews?</AccordionTrigger>
        <AccordionContent>
          Closewell sends a renewal offer 60 days before the lease end date and tracks
          the tenant's response automatically.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Can I customize the deposit return timeline?</AccordionTrigger>
        <AccordionContent>
          Yes — the deposit tracker follows your state's statutory return window by
          default, but you can adjust it per property.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
