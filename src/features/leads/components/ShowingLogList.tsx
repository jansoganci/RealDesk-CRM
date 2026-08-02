import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Home, Plus, Clock, MessageSquare, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { ShowingLogDialog } from './ShowingLogDialog';
import type { ShowingLog } from '@/services/leads.service';
import { COLORS } from '@/config/colors';
import { useOrg } from '@/contexts/OrgContext';

interface ShowingLogListProps {
  showings: ShowingLog[];
  leadId: string;
  onRefresh: () => void;
}

export function ShowingLogList({ showings, leadId, onRefresh }: ShowingLogListProps) {
  const { t } = useTranslation('leads');
  const { isMember } = useOrg();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShowing, setSelectedShowing] = useState<ShowingLog | undefined>();

  const sortedShowings = [...showings].sort(
    (a, b) => new Date(b.showing_date).getTime() - new Date(a.showing_date).getTime()
  );

  const getFeedbackBadge = (feedback?: string | null) => {
    switch (feedback) {
      case 'loved':
        return (
          <Badge variant="success" className="gap-1">
            <Heart className="h-3 w-3" />
            {t('showings.loved', 'Loved')}
          </Badge>
        );
      case 'interested':
        return (
          <Badge className="bg-primary hover:bg-primary text-white">
            {t('showings.interested', 'Interested')}
          </Badge>
        );
      case 'pass':
        return <Badge variant="secondary">{t('showings.pass', 'Pass')}</Badge>;
      default:
        return null;
    }
  };

  const handleEdit = (showing: ShowingLog) => {
    setSelectedShowing(showing);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedShowing(undefined);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-base font-semibold ${COLORS.gray.text900}`}>
          {t('showings.title', 'Property Showings')}
        </h3>
        {!isMember && (
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('showings.logShowing', 'Log Showing')}
          </Button>
        )}
      </div>

      {sortedShowings.length > 0 ? (
        <div className="space-y-3">
          {sortedShowings.map((showing) => (
            <Card
              key={showing.id}
              className="p-4 space-y-3 hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => !isMember && handleEdit(showing)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className={`h-4 w-4 ${COLORS.muted.text}`} />
                  {format(new Date(showing.showing_date), 'MMM d, yyyy · h:mm a')}
                </div>
                {showing.feedback_enum && getFeedbackBadge(showing.feedback_enum)}
              </div>

              <div className={`flex items-center gap-2 text-sm ${COLORS.muted.text}`}>
                <Home className="h-4 w-4" />
                <span>
                  {t('detail.showings.property', 'Property')}: {showing.property_id.slice(0, 8)}...
                </span>
              </div>

              {showing.duration_minutes && (
                <div className={`flex items-center gap-2 text-sm ${COLORS.muted.text}`}>
                  <Clock className="h-4 w-4" />
                  <span>
                    {showing.duration_minutes}{' '}
                    {t('showings.minutes', { count: showing.duration_minutes, defaultValue: 'minutes' })}
                  </span>
                </div>
              )}

              {showing.feedback && (
                <div className="flex items-start gap-2 text-sm">
                  <MessageSquare className={`h-4 w-4 ${COLORS.muted.text} mt-0.5`} />
                  <p className={`${COLORS.muted.text} line-clamp-2`}>{showing.feedback}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Home className={`mx-auto h-12 w-12 ${COLORS.muted.text} mb-3`} />
          <p className={`${COLORS.muted.text} mb-4`}>
            {t('showings.noShowings', 'No property showings logged yet for this lead.')}
          </p>
          {!isMember && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('showings.logFirstShowing', 'Log First Showing')}
            </Button>
          )}
        </Card>
      )}

      <ShowingLogDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        leadId={leadId}
        existingShowing={selectedShowing}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
