import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { purchaseAgreementService } from '@/lib/serviceProxy';

export interface CounterOfferModalProps {
  contractId: string;
  currentPrice: number;
  currentClosingDate?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type OfferedBy = 'buyer' | 'seller';

export function CounterOfferModal({
  contractId,
  currentPrice,
  currentClosingDate,
  isOpen,
  onClose,
  onSuccess,
}: CounterOfferModalProps) {
  const { t } = useTranslation('contracts');
  const { toast } = useToast();
  const [offeredBy, setOfferedBy] = useState<OfferedBy>('seller');
  const [purchasePrice, setPurchasePrice] = useState<number>(currentPrice);
  const [closingDate, setClosingDate] = useState<string>(currentClosingDate ?? '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOfferedBy('seller');
    setPurchasePrice(currentPrice);
    setClosingDate(currentClosingDate ?? '');
    setNotes('');
  }, [isOpen, currentPrice, currentClosingDate]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await purchaseAgreementService.addCounterOffer(contractId, {
        offered_by: offeredBy,
        purchase_price: purchasePrice,
        closing_date: closingDate || undefined,
        notes: notes || undefined,
      });
      toast({
        title: t('purchaseWizard.step9.counterOffer.success'),
      });
      onSuccess();
      onClose();
    } catch (e) {
      toast({
        title: t('purchaseWizard.step9.counterOffer.error'),
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('purchaseWizard.step9.counterOffer.title')}</DialogTitle>
          <DialogDescription>{t('purchaseWizard.step9.counterOffer.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('purchaseWizard.step9.counterOffer.offeredBy')}</Label>
            <RadioGroup value={offeredBy} onValueChange={(v) => setOfferedBy(v as OfferedBy)} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="buyer" id="counter-buyer" />
                <Label htmlFor="counter-buyer">{t('purchaseWizard.step9.counterOffer.buyerCounter')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="seller" id="counter-seller" />
                <Label htmlFor="counter-seller">{t('purchaseWizard.step9.counterOffer.sellerCounter')}</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="counter-price">{t('purchaseWizard.step9.counterOffer.price')}</Label>
            <Input
              id="counter-price"
              type="number"
              min={0}
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value || 0))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="counter-closing">{t('purchaseWizard.step9.counterOffer.closingDate')}</Label>
            <Input
              id="counter-closing"
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="counter-notes">{t('purchaseWizard.step9.counterOffer.notes')}</Label>
            <Textarea
              id="counter-notes"
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground">{t('purchaseWizard.step9.counterOffer.note')}</p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t('purchaseWizard.step9.counterOffer.cancel')}
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {t('purchaseWizard.step9.counterOffer.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

