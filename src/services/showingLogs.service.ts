/**
 * Showing Logs Service
 * Standalone facade over the showing log methods in LeadsService.
 */
import { leadsService } from './leads.service';
import type {
  ShowingLog,
  CreateShowingLogInput,
  InterestLevel,
  ShowingFeedback,
} from './leads.service';

export type { ShowingLog, CreateShowingLogInput, InterestLevel, ShowingFeedback };

class ShowingLogsService {
  /** Records a new property showing for a lead. */
  create(
    data: CreateShowingLogInput,
    userId: string,
    orgId: string
  ): Promise<ShowingLog> {
    return leadsService.createShowingLog(data, userId, orgId);
  }

  /** All showings for a lead, newest first. */
  getByLeadId(leadId: string): Promise<ShowingLog[]> {
    return leadsService.getShowingsByLeadId(leadId);
  }

  /** All showings recorded for a property, newest first. */
  getByPropertyId(propertyId: string): Promise<ShowingLog[]> {
    return leadsService.getShowingsByPropertyId(propertyId);
  }

  /** Updates the feedback on an existing showing (loved / interested / pass). */
  updateFeedback(
    showingId: string,
    feedback: ShowingFeedback
  ): Promise<ShowingLog> {
    return leadsService.updateShowingFeedback(showingId, feedback);
  }
}

export const showingLogsService = new ShowingLogsService();
