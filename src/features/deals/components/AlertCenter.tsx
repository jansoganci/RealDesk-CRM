import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAlertCenter } from '@/features/deals/hooks';
import { COLORS } from '@/config/colors';

const PRIORITY_ORDER: Record<string, number> = {
  overdue: 1,
  due_today: 2,
  due_3d: 3,
  closing_soon: 4,
  prerequisite_missing: 5,
  waiting_on_others: 6,
  due_7d: 7,
};

function formatCreatedAt(value: string): string {
  try {
    return format(parseISO(value), 'MMM d, HH:mm');
  } catch {
    return value;
  }
}

export function AlertCenter() {
  const { t } = useTranslation('navigation');
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    dismiss,
    snooze,
  } = useAlertCenter();

  const sorted = useMemo(
    () =>
      [...notifications].sort((a, b) => {
        const pa = PRIORITY_ORDER[a.alert_type] ?? 99;
        const pb = PRIORITY_ORDER[b.alert_type] ?? 99;
        if (pa !== pb) return pa - pb;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }),
    [notifications]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="h-11 w-11 md:h-10 md:w-10 relative flex items-center justify-center rounded-md border border-border bg-transparent text-foreground hover:bg-muted hover:border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t('alertCenter.open')}
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 ${COLORS.danger.bg} ${COLORS.text.white} text-xs border-2 border-white rounded-full`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="border-b border-border dark:border-border px-4 py-3 flex items-center justify-between">
          <p className="font-semibold text-sm">{t('alertCenter.title')}</p>
          <Button variant="ghost" size="sm" onClick={() => void markAllRead()}>
            {t('alertCenter.markAllRead')}
          </Button>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground dark:text-muted-foreground">{t('alertCenter.loading')}</div>
          ) : sorted.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground dark:text-muted-foreground">{t('alertCenter.empty')}</div>
          ) : (
            <div className="divide-y divide-border">
              {sorted.map((item) => (
                <div key={item.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground dark:text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">{item.body}</p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground/70">{formatCreatedAt(item.created_at)}</p>
                    </div>
                    {!item.is_read && <Badge variant="secondary">{t('alertCenter.unread')}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!item.is_read && (
                      <Button size="sm" variant="outline" onClick={() => void markRead(item.id)}>
                        {t('alertCenter.read')}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => void snooze(item.id, 24)}>
                      {t('alertCenter.snooze')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void dismiss(item.id)}>
                      {t('alertCenter.dismiss')}
                    </Button>
                    {item.action_url && (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (item.action_url) {
                            navigate(item.action_url);
                          }
                        }}
                      >
                        {t('alertCenter.openDeal')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
