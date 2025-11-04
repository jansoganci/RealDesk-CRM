
import { MeetingWithRelations } from '@/services/meetings.service';
import { MeetingCard } from './MeetingCard';

interface DayViewProps {
  meetings: MeetingWithRelations[];
  day: Date;
  onEditMeeting: (meeting: MeetingWithRelations) => void;
  onDeleteMeeting: (meeting: MeetingWithRelations) => void;
}

export const DayView = ({ meetings, day, onEditMeeting, onDeleteMeeting }: DayViewProps) => {
  const filteredMeetings = meetings.filter(m => new Date(m.start_time).toDateString() === day.toDateString());

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{day.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
      {filteredMeetings.length > 0 ? (
        filteredMeetings.map(meeting => (
          <MeetingCard 
            key={meeting.id} 
            meeting={meeting} 
            onEdit={onEditMeeting}
            onDelete={onDeleteMeeting}
          />
        ))
      ) : (
        <p className="text-muted-foreground">No meetings scheduled for this day.</p>
      )}
    </div>
  );
};
