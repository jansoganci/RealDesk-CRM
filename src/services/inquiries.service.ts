// Backward compatibility: inquiries.service.ts now proxies to leads.service.ts
export { leadsService as inquiriesService, LeadsService as InquiriesService } from './leads.service';
export type * from './leads.service';
