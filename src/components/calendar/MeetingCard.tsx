
import { MeetingWithRelations } from '@/services/meetings.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Building, Home, Edit, Trash2 } from 'lucide-react';

interface MeetingCardProps {
  meeting: MeetingWithRelations;
  onEdit: (meeting: MeetingWithRelations) => void;
  onDelete: (meeting: MeetingWithRelations) => void;
}

export const MeetingCard = ({ meeting, onEdit, onDelete }: MeetingCardProps) => {
  const getRelation = () => {
    if (meeting.tenant) {
      return <><User className="h-4 w-4 mr-2" /> {meeting.tenant.name}</>;
    }
    if (meeting.property) {
      return <><Home className="h-4 w-4 mr-2" /> {meeting.property.address}</>;
    }
    if (meeting.owner) {
      return <><Building className="h-4 w-4 mr-2" /> {meeting.owner.name}</>;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{meeting.title}</CardTitle>
        <CardDescription>{new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground">
          {getRelation()}
        </div>
        {meeting.notes && <p className="text-sm mt-2">{meeting.notes}</p>}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="icon" onClick={() => onEdit(meeting)}><Edit className="h-4 w-4" /></Button>
        <Button variant="destructive" size="icon" onClick={() => onDelete(meeting)}><Trash2 className="h-4 w-4" /></Button>
      </CardFooter>
    </Card>
  );
};
