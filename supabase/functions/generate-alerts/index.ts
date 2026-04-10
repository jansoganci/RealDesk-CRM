import { supabaseAdmin } from '../_shared/supabase-admin.ts';
import {
  corsHeaders,
  errorResponse,
  jsonResponse,
} from '../_shared/supabase-admin.ts';

type MilestoneForAlerts = {
  id: string;
  org_id: string;
  deal_id: string;
  title: string;
  status: string;
  due_date: string;
  responsible_party: string | null;
  alert_sent_7d?: boolean;
  alert_sent_3d?: boolean;
  alert_sent_1d?: boolean;
  alert_sent_today?: boolean;
  last_nudge_sent_at?: string | null;
  deals: {
    deal_name: string;
    deal_stage: string;
    projected_close_date: string | null;
  } | null;
};

const ACTIVE_STAGES = ['under_contract', 'pending', 'closing_scheduled'];
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysUntil(today: Date, dueDateIso: string): number {
  const due = startOfUtcDay(new Date(`${dueDateIso}T00:00:00.000Z`));
  return Math.floor((due.getTime() - today.getTime()) / DAY_MS);
}

async function createNotification(params: {
  orgId: string;
  userId: string;
  dealId: string;
  milestoneId: string | null;
  alertType: string;
  title: string;
  body: string;
  actionUrl?: string;
}) {
  const { error } = await supabaseAdmin.from('notifications').insert({
    org_id: params.orgId,
    user_id: params.userId,
    deal_id: params.dealId,
    milestone_id: params.milestoneId,
    alert_type: params.alertType,
    title: params.title,
    body: params.body,
    action_url: params.actionUrl ?? `/deals/${params.dealId}`,
  });
  if (error) throw error;
}

async function processDeadlineEscalationAlerts(
  milestones: MilestoneForAlerts[],
  today: Date
): Promise<number> {
  let created = 0;

  for (const row of milestones) {
    const deal = row.deals;
    if (!deal || !ACTIVE_STAGES.includes(deal.deal_stage)) continue;

    const delta = daysUntil(today, row.due_date);
    if (delta < 0) continue;

    let shouldSend = false;
    let flagKey:
      | 'alert_sent_7d'
      | 'alert_sent_3d'
      | 'alert_sent_1d'
      | 'alert_sent_today'
      | null = null;
    let alertType = '';
    let title = '';
    let body = '';

    if (delta === 7 && !row.alert_sent_7d) {
      shouldSend = true;
      flagKey = 'alert_sent_7d';
      alertType = 'due_7d';
      title = `Upcoming deadline in 7 days`;
      body = `${row.title} for ${deal.deal_name} is due on ${row.due_date}.`;
    } else if (delta === 3 && !row.alert_sent_3d) {
      shouldSend = true;
      flagKey = 'alert_sent_3d';
      alertType = 'due_3d';
      title = `Deadline in 3 days`;
      body = `${row.title} for ${deal.deal_name} is due in 3 days (${row.due_date}).`;
    } else if (delta === 1 && !row.alert_sent_1d) {
      shouldSend = true;
      flagKey = 'alert_sent_1d';
      alertType = 'due_today';
      title = `Deadline tomorrow`;
      body = `${row.title} for ${deal.deal_name} is due tomorrow (${row.due_date}).`;
    } else if (delta === 0 && !row.alert_sent_today) {
      shouldSend = true;
      flagKey = 'alert_sent_today';
      alertType = 'due_today';
      title = `Due today`;
      body = `${row.title} for ${deal.deal_name} is due today.`;
    }

    if (!shouldSend || !flagKey) continue;

    // V1 behavior: system process writes a notification per org owner.
    const { data: orgMembers, error: orgMemberError } = await supabaseAdmin
      .from('org_members')
      .select('user_id')
      .eq('org_id', row.org_id)
      .eq('status', 'active');
    if (orgMemberError) throw orgMemberError;

    for (const member of orgMembers ?? []) {
      await createNotification({
        orgId: row.org_id,
        userId: member.user_id,
        dealId: row.deal_id,
        milestoneId: row.id,
        alertType,
        title,
        body,
        actionUrl: `/deals/${row.deal_id}`,
      });
      created++;
    }

    const { error: updateError } = await supabaseAdmin
      .from('deal_milestones')
      .update({ [flagKey]: true, updated_at: new Date().toISOString() })
      .eq('id', row.id)
      .eq('org_id', row.org_id);
    if (updateError) throw updateError;
  }

  return created;
}

async function processWaitingOnOthersAlerts(nowIso: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('deal_milestones')
    .select(
      'id, org_id, deal_id, title, responsible_party, deals!inner(deal_name, deal_stage)'
    )
    .eq('status', 'in_progress')
    .neq('responsible_party', 'buyer_agent');
  if (error) throw error;

  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  let created = 0;

  for (const row of (data ?? []) as Array<{
    id: string;
    org_id: string;
    deal_id: string;
    title: string;
    responsible_party: string | null;
    deals: { deal_name: string; deal_stage: string } | null;
  }>) {
    if (!row.deals || !ACTIVE_STAGES.includes(row.deals.deal_stage)) continue;

    const { data: milestoneRow, error: fetchError } = await supabaseAdmin
      .from('deal_milestones')
      .select('last_nudge_sent_at')
      .eq('id', row.id)
      .eq('org_id', row.org_id)
      .single();
    if (fetchError) throw fetchError;

    const last = milestoneRow?.last_nudge_sent_at
      ? new Date(milestoneRow.last_nudge_sent_at).getTime()
      : null;
    if (last !== null && last > cutoff) continue;

    const { data: orgMembers, error: orgMemberError } = await supabaseAdmin
      .from('org_members')
      .select('user_id')
      .eq('org_id', row.org_id)
      .eq('status', 'active');
    if (orgMemberError) throw orgMemberError;

    for (const member of orgMembers ?? []) {
      await createNotification({
        orgId: row.org_id,
        userId: member.user_id,
        dealId: row.deal_id,
        milestoneId: row.id,
        alertType: 'waiting_on_others',
        title: 'Waiting on others',
        body: `${row.title} for ${row.deals.deal_name} is waiting on ${row.responsible_party ?? 'counterparty'} for over 48 hours.`,
        actionUrl: `/deals/${row.deal_id}`,
      });
      created++;
    }

    await supabaseAdmin
      .from('deal_milestones')
      .update({ last_nudge_sent_at: nowIso, updated_at: nowIso })
      .eq('id', row.id)
      .eq('org_id', row.org_id);
  }

  return created;
}

async function processClosingSoonAlerts(today: Date): Promise<number> {
  const { data: deals, error } = await supabaseAdmin
    .from('deals')
    .select('id, org_id, deal_name, deal_stage, projected_close_date')
    .in('deal_stage', [...ACTIVE_STAGES])
    .is('deleted_at', null);
  if (error) throw error;

  let created = 0;
  for (const deal of deals ?? []) {
    if (!deal.projected_close_date) continue;
    const delta = daysUntil(today, deal.projected_close_date);
    if (delta !== 7) continue;

    const { data: openPhase4, error: phaseError } = await supabaseAdmin
      .from('deal_milestones')
      .select('id')
      .eq('org_id', deal.org_id)
      .eq('deal_id', deal.id)
      .in('milestone_type', ['closing_disclosure_sent', 'closing_disclosure_review', 'final_walkthrough', 'closing_day'])
      .in('status', ['pending', 'in_progress', 'overdue']);
    if (phaseError) throw phaseError;
    if (!openPhase4 || openPhase4.length === 0) continue;

    const { data: orgMembers, error: orgMemberError } = await supabaseAdmin
      .from('org_members')
      .select('user_id')
      .eq('org_id', deal.org_id)
      .eq('status', 'active');
    if (orgMemberError) throw orgMemberError;

    for (const member of orgMembers ?? []) {
      await createNotification({
        orgId: deal.org_id,
        userId: member.user_id,
        dealId: deal.id,
        milestoneId: null,
        alertType: 'closing_soon',
        title: 'Closing soon prerequisites incomplete',
        body: `${deal.deal_name} is closing in 7 days and has incomplete closing prerequisites.`,
        actionUrl: `/deals/${deal.id}`,
      });
      created++;
    }
  }

  return created;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return errorResponse('Method not allowed', 405, corsHeaders);
  }

  try {
    const now = new Date();
    const nowIso = now.toISOString();
    const today = startOfUtcDay(now);

    const { data, error } = await supabaseAdmin
      .from('deal_milestones')
      .select(
        'id, org_id, deal_id, title, status, due_date, responsible_party, alert_sent_7d, alert_sent_3d, alert_sent_1d, alert_sent_today, last_nudge_sent_at, deals!inner(deal_name, deal_stage, projected_close_date)'
      )
      .eq('status', 'pending');
    if (error) throw error;

    const milestones = (data ?? []) as MilestoneForAlerts[];
    const deadlineAlertCount = await processDeadlineEscalationAlerts(milestones, today);
    const waitingCount = await processWaitingOnOthersAlerts(nowIso);
    const closingSoonCount = await processClosingSoonAlerts(today);

    return jsonResponse(
      {
        success: true,
        generated: {
          deadline: deadlineAlertCount,
          waiting_on_others: waitingCount,
          closing_soon: closingSoonCount,
          total: deadlineAlertCount + waitingCount + closingSoonCount,
        },
        run_at: nowIso,
      },
      200,
      corsHeaders
    );
  } catch (error) {
    return errorResponse(
      'Failed to generate alerts',
      500,
      corsHeaders,
      error instanceof Error ? error.message : String(error)
    );
  }
});
