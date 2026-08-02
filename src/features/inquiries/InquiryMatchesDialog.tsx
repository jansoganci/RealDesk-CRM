import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/config/colors';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button, buttonVariants } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { InquiryWithMatches, InquiryMatchWithProperty } from '../../types';
import { inquiriesService } from '../../lib/serviceProxy';
import { Phone, MapPin, Tag, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrencyRange } from '@/lib/currency';

interface InquiryMatchesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inquiry: InquiryWithMatches | null;
  onInquiryUpdate?: () => void;
}

export const InquiryMatchesDialog = ({
  open,
  onOpenChange,
  inquiry,
  onInquiryUpdate,
}: InquiryMatchesDialogProps) => {
  const { t } = useTranslation(['leads', 'common']);
  const [matches, setMatches] = useState<InquiryMatchWithProperty[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMatches = useCallback(async () => {
    if (!inquiry) return;

    try {
      setLoading(true);
      const data = await inquiriesService.getMatchesByInquiry(inquiry.id);
      setMatches(data);
    } catch (error) {
      console.error('Error loading matches:', error);
      toast.error(t('toasts.loadMatchesError'));
    } finally {
      setLoading(false);
    }
  }, [inquiry, t]);

  useEffect(() => {
    if (open && inquiry) {
      void loadMatches();
    }
  }, [open, inquiry, loadMatches]);

  const handleMarkAsContacted = async () => {
    if (!inquiry) return;

    try {
      setLoading(true);
      await inquiriesService.markAsContacted(inquiry.id);
      toast.success(t('toasts.markContactedSuccess'));
      onInquiryUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error marking as contacted:', error);
      toast.error(t('toasts.markContactedError'));
    } finally {
      setLoading(false);
    }
  };

  if (!inquiry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('matches.title')}</DialogTitle>
          <DialogDescription>
            {t('matches.description', { name: inquiry.name })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Inquiry Information */}
          <div className={`p-4 rounded-lg ${COLORS.gray.bg50} space-y-2`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${COLORS.gray.text900}`}>
                {inquiry.name}
              </h3>
              <Badge
                className={
                  inquiry.status === 'active'
                    ? `${COLORS.success.bg} text-success-foreground`
                    : inquiry.status === 'matched'
                    ? `${COLORS.primary.bg} text-primary-foreground`
                    : inquiry.status === 'contacted'
                    ? `${COLORS.warning.bg} text-warning-foreground`
                    : `${COLORS.status.inactive.bg} ${COLORS.status.inactive.text}`
                }
              >
                {t(`status.${inquiry.status}`)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Phone className={`h-4 w-4 ${COLORS.gray.text500}`} />
                <span className={COLORS.gray.text700}>{inquiry.phone}</span>
              </div>
              {(inquiry.preferred_city || inquiry.preferred_state || inquiry.preferred_district) && (
                <div className="flex items-center gap-1">
                  <MapPin className={`h-4 w-4 ${COLORS.gray.text500}`} />
                  <span className={COLORS.gray.text700}>
                    {[inquiry.preferred_city, inquiry.preferred_state, inquiry.preferred_district].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {/* Budget display based on inquiry type */}
              {(() => {
                const isRental = inquiry.inquiry_type === 'rental';
                const minBudget = isRental ? inquiry.min_rent_budget : inquiry.min_sale_budget;
                const maxBudget = isRental ? inquiry.max_rent_budget : inquiry.max_sale_budget;

                if (minBudget || maxBudget) {
                  return (
                    <span className={COLORS.gray.text700}>
                      {formatCurrencyRange(minBudget, maxBudget)}
                      {isRental && ` ${t('matches.perMonth')}`}
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Matched Properties */}
          <div className="space-y-3">
            <h4 className={`font-semibold ${COLORS.gray.text900}`}>
              {t('matches.matchedProperties')} ({matches.length})
            </h4>

            {loading ? (
              <div className={`text-center py-8 ${COLORS.gray.text500}`}>
                {t('loading', { ns: 'common' })}
              </div>
            ) : matches.length === 0 ? (
              <div className={`text-center py-8 ${COLORS.gray.text500}`}>
                {t('matches.noMatches')}
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
                  >
                    {match.property && (
                      <>
                        <div className="space-y-2">
                          <div className="font-medium text-foreground">
                            {match.property.address}
                          </div>
                          <div className="flex flex-col items-start gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                            {match.property.city && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                <span className="text-foreground/80">
                                  {match.property.city}
                                  {match.property.district && `, ${match.property.district}`}
                                </span>
                              </div>
                            )}
                            {(match.property.property_type === 'sale'
                              ? match.property.sale_price
                              : match.property.rent_amount) && (
                              <div className="flex items-center gap-1">
                                <Tag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                <span className="font-medium text-foreground/80">
                                  {formatCurrencyRange(
                                    match.property.property_type === 'sale'
                                      ? match.property.sale_price ?? 0
                                      : match.property.rent_amount ?? 0,
                                    null,
                                    match.property.currency || 'USD'
                                  )}
                                  {match.property.property_type === 'rental' &&
                                    ` ${t('matches.perMonth')}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <a
                            href={`tel:${inquiry.phone}`}
                            aria-label={t('matches.contactLeadAria', {
                              name: inquiry.name,
                              property: match.property.address,
                            })}
                            className={cn(
                              buttonVariants({ size: 'sm' }),
                              'w-full gap-2 text-primary-foreground sm:w-auto'
                            )}
                          >
                            <Phone className="h-4 w-4" aria-hidden="true" />
                            {t('matches.contactLead', { name: inquiry.name })}
                          </a>
                          {match.contacted && (
                            <Badge className={`${COLORS.success.bg} text-success-foreground`}>
                              <Check className="h-3 w-3 mr-1" />
                              {t('matches.contacted')}
                            </Badge>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('matches.close')}
          </Button>
          {inquiry.status !== 'contacted' && inquiry.status !== 'closed' && (
            <Button
              type="button"
              onClick={handleMarkAsContacted}
              disabled={loading}
              className={`${COLORS.success.bg} ${COLORS.success.hover}`}
            >
              <Check className="h-4 w-4 mr-2" />
              {t('matches.markAsContacted')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
