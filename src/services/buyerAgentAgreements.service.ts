/**
 * Buyer-Agent Agreements Service
 * Standalone facade over the agreement methods in LeadsService.
 */
import { leadsService } from './leads.service';
import type {
  BuyerAgentAgreement,
  CreateAgreementInput,
  AgreementStatus,
} from './leads.service';

export type { BuyerAgentAgreement, CreateAgreementInput, AgreementStatus };

class BuyerAgentAgreementsService {
  /** Creates a buyer-agent agreement for a lead. */
  createAgreement(
    data: CreateAgreementInput,
    userId: string,
    orgId: string
  ): Promise<BuyerAgentAgreement> {
    return leadsService.createBuyerAgentAgreement(data, userId, orgId);
  }

  /** Returns the latest agreement for a lead, or null if none exists. */
  getByLeadId(leadId: string): Promise<BuyerAgentAgreement | null> {
    return leadsService.getAgreementByLeadId(leadId);
  }

  /**
   * Active agreements expiring within `daysThreshold` days (default 14).
   * Used for expiration-warning reminders.
   */
  getExpiringSoon(daysThreshold?: number): Promise<BuyerAgentAgreement[]> {
    return leadsService.getExpiringSoon(daysThreshold);
  }

  /** Updates the status of an agreement (draft/sent/signed/active/expired/terminated). */
  updateStatus(
    agreementId: string,
    status: AgreementStatus
  ): Promise<BuyerAgentAgreement> {
    return leadsService.updateAgreementStatus(agreementId, status);
  }
}

export const buyerAgentAgreementsService = new BuyerAgentAgreementsService();
