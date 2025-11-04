import { useEffect, useState } from 'react';
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
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { InquiryWithMatches, InquiryMatchWithProperty } from '../../types';
import { inquiriesService } from '../../lib/serviceProxy';
import { Phone, MapPin, DollarSign, Check } from 'lucide-react';
import { toast } from 'sonner';

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
  const { t } = useTranslation(['inquiries', 'common']);
  const [matches, setMatches] = useState<InquiryMatchWithProperty[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && inquiry) {
      loadMatches();
    }
  }, [open, inquiry]);

  const loadMatches = async () => {
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
  };

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
                    ? `${COLORS.success.bgGradient} ${COLORS.text.white}`
                    : inquiry.status === 'matched'
                    ? `${COLORS.primary.bgGradient} ${COLORS.text.white}`
                    : inquiry.status === 'contacted'
                    ? `${COLORS.warning.bgGradient} ${COLORS.text.white}`
                    : `${COLORS.status.inactive.gradient} ${COLORS.text.white}`
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
              {inquiry.preferred_city && (
                <div className="flex items-center gap-1">
                  <MapPin className={`h-4 w-4 ${COLORS.gray.text500}`} />
                  <span className={COLORS.gray.text700}>
                    {inquiry.preferred_city}
                    {inquiry.preferred_district && `, ${inquiry.preferred_district}`}
                  </span>
                </div>
              )}
              {(inquiry.min_budget || inquiry.max_budget) && (
                <div className="flex items-center gap-1">
                  <DollarSign className={`h-4 w-4 ${COLORS.gray.text500}`} />
                  <span className={COLORS.gray.text700}>
                    {inquiry.min_budget && `${inquiry.min_budget}`}
                    {inquiry.min_budget && inquiry.max_budget && ' - '}
                    {inquiry.max_budget && `${inquiry.max_budget}`}
                  </span>
                </div>
              )}
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
                    className={`p-4 rounded-lg border ${COLORS.gray.border200} ${COLORS.card.bg} hover:${COLORS.gray.bg50} transition-colors`}
                  >
                    {match.property && (
                      <>
                        <div className="space-y-2">
                          <div className={`font-medium ${COLORS.gray.text900}`}>
                            {match.property.address}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            {match.property.city && (
                              <div className="flex items-center gap-1">
                                <MapPin className={`h-4 w-4 ${COLORS.gray.text500}`} />
                                <span className={COLORS.gray.text700}>
                                  {match.property.city}
                                  {match.property.district && `, ${match.property.district}`}
                                </span>
                              </div>
                            )}
                            {match.property.rent_amount && (
                              <div className="flex items-center gap-1">
                                <DollarSign className={`h-4 w-4 ${COLORS.gray.text500}`} />
                                <span className={COLORS.gray.text700}>
                                  {match.property.rent_amount} {match.property.currency || 'USD'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <a
                            href={`tel:${inquiry.phone}`}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md ${COLORS.primary.bg} hover:${COLORS.primary.dark} ${COLORS.text.white} transition-colors`}
                          >
                            <Phone className="h-4 w-4" />
                            {t('matches.contact')}
                          </a>
                          {match.contacted && (
                            <Badge className={`${COLORS.success.bgGradient} ${COLORS.text.white}`}>
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
            {t('close', { ns: 'common' })}
          </Button>
          {inquiry.status !== 'contacted' && inquiry.status !== 'closed' && (
            <Button
              type="button"
              onClick={handleMarkAsContacted}
              disabled={loading}
              className={`${COLORS.success.bg} hover:${COLORS.success.dark} ${COLORS.text.white}`}
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
