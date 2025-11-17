
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { meetingsService } from '@/lib/serviceProxy';

import type { MeetingWithRelations } from '@/services/meetings.service';
import { format, addDays, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus, User, Home, Building2 } from 'lucide-react';
import { AddMeetingDialog } from '@/components/calendar/AddMeetingDialog'; // Assuming this exists
import { CalendarSkeleton } from '@/components/common/skeletons';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';

// --- MeetingCard Component ---
// As per requirement #8, this would normally be in its own file: `src/features/calendar/MeetingCard.tsx`
interface MeetingCardProps {
  meeting: MeetingWithRelations;
}

const MeetingCard = ({ meeting }: MeetingCardProps) => {
  const getRelation = () => {
    if (meeting.tenant) {
      return { icon: <User className="h-4 w-4 text-gray-500" />, name: meeting.tenant.name };
    }
    if (meeting.property) {
      return { icon: <Home className="h-4 w-4 text-gray-500" />, name: meeting.property.address };
    }
    if (meeting.owner) {
      return { icon: <Building2 className="h-4 w-4 text-gray-500" />, name: meeting.owner.name };
    }
    return null;
  };

  const relation = getRelation();

  return (
    <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-gray-800">{meeting.title}</CardTitle>
            <p className="text-sm font-medium text-blue-600 mt-1">
              {format(new Date(meeting.start_time), 'h:mm a')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {relation && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            {relation.icon}
            <span className="ml-2 truncate">{relation.name}</span>
          </div>
        )}
        {meeting.notes && (
          <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded-md">{meeting.notes}</p>
        )}
      </CardContent>
    </Card>
  );
};

// --- Main CalendarPage Component ---
export const CalendarPage = () => {
  const { t } = useTranslation(['calendar', 'common']);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState<MeetingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });
  }, [selectedDate]);

  const [initialTenantId, setInitialTenantId] = useState<string | undefined>();
  const [initialPropertyId, setInitialPropertyId] = useState<string | undefined>();
  const [initialOwnerId, setInitialOwnerId] = useState<string | undefined>();

  useEffect(() => {
    if (searchParams.get('open_add_meeting')) {
      const tenantId = searchParams.get('tenant_id') || undefined;
      const propertyId = searchParams.get('property_id') || undefined;
      const ownerId = searchParams.get('owner_id') || undefined;

      setInitialTenantId(tenantId);
      setInitialPropertyId(propertyId);
      setInitialOwnerId(ownerId);
      setFormOpen(true);

      // Clean up URL
      searchParams.delete('open_add_meeting');
      searchParams.delete('tenant_id');
      searchParams.delete('property_id');
      searchParams.delete('owner_id');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      try {
        const rangeStart = startOfDay(weekDays[0]);
        const rangeEnd = endOfDay(weekDays[weekDays.length - 1]);
        
        const data = await meetingsService.getByDateRange(rangeStart.toISOString(), rangeEnd.toISOString());
        setMeetings(data);
      } catch (error) {
        toast.error(t('errors.loadMeetings'));
        console.error('Failed to fetch meetings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [weekDays, t]);

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());
  const handleMeetingAdded = () => {
    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const rangeStart = startOfDay(weekDays[0]);
            const rangeEnd = endOfDay(weekDays[weekDays.length - 1]);
            const data = await meetingsService.getByDateRange(rangeStart.toISOString(), rangeEnd.toISOString());
            setMeetings(data);
        } catch (error) {
            toast.error(t('errors.loadMeetings'));
        } finally {
            setLoading(false);
        }
    };
    fetchMeetings();
  };

  const meetingsForSelectedDay = meetings.filter(
    (m) => format(new Date(m.start_time), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const getMeetingsForDay = (day: Date) => {
    return meetings.filter(m => format(new Date(m.start_time), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
  }

  return (
    <MainLayout title={t('calendar:title')}>
      <PageContainer>
        <div className="h-full flex flex-col bg-gray-50 p-2 sm:p-4">
          {/* Header */}
          <header className="flex items-center justify-between pb-4 px-1">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevDay} aria-label="Previous day" className="h-11 w-11">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextDay} aria-label="Next day" className="h-11 w-11">
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" onClick={handleToday} className="h-11 hidden sm:flex">{t('common:today')}</Button>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h2>
          </header>

          {/* Calendar View */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <>
                {/* Mobile: Day View Skeleton */}
                <div className="md:hidden">
                  <CalendarSkeleton view="day" meetingCount={3} />
                </div>
                {/* Desktop: Week View Skeleton */}
                <div className="hidden md:block">
                  <CalendarSkeleton view="week" meetingCount={2} />
                </div>
              </>
            ) : (
              <>
                {/* Mobile: Day View */}
                <div className="md:hidden">
                  {meetingsForSelectedDay.length > 0 ? (
                    meetingsForSelectedDay.map((meeting) => <MeetingCard key={meeting.id} meeting={meeting} />)
                  ) : (
                    <div className="text-center py-10 text-gray-500">{t('calendar:emptyState.noMeetings')}</div>
                  )}
                </div>

                {/* Desktop: Week View */}
                <div className="hidden md:grid md:grid-cols-7 md:gap-2 h-full">
                  {weekDays.map(day => (
                    <div key={day.toISOString()} className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
                      <div className={cn(
                          "text-center py-2 border-b font-semibold",
                          isToday(day) ? "text-blue-600" : "text-gray-600"
                        )}>
                        <p className="text-sm">{format(day, 'EEE')}</p>
                        <p className="text-xl">{format(day, 'd')}</p>
                      </div>
                      <div className="p-2 overflow-y-auto flex-1">
                        {getMeetingsForDay(day).length > 0 ? (
                          getMeetingsForDay(day).map(meeting => <MeetingCard key={meeting.id} meeting={meeting} />)
                        ) : (
                          <div className="text-xs text-center pt-4 text-gray-400">{t('calendar:emptyState.noMeetings')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Floating Add Button */}
          <Button
            onClick={() => setFormOpen(true)}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
            aria-label="Add Meeting"
          >
            <Plus className="h-7 w-7" />
          </Button>

          {/* Add Meeting Dialog */}
          <AddMeetingDialog
            open={isFormOpen}
            onOpenChange={setFormOpen}
            onMeetingAdded={handleMeetingAdded}
            initialTenantId={initialTenantId}
            initialPropertyId={initialPropertyId}
            initialOwnerId={initialOwnerId}
          />
        </div>
      </PageContainer>
    </MainLayout>
  );
};