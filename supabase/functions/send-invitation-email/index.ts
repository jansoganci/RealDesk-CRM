/**
 * Supabase Edge Function: Send Invitation Email
 *
 * This function sends organization invitation emails via Resend.
 * It validates the user's JWT, fetches invitation details, and sends the email.
 *
 * Setup:
 * 1. Deploy: supabase functions deploy send-invitation-email
 * 2. Set secret: supabase secrets set RESEND_API_KEY="re_xxx"
 *
 * Usage:
 * POST /functions/v1/send-invitation-email
 * Headers: { Authorization: "Bearer <user_jwt>" }
 * Body: { invitationId: "uuid" }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import {
  jsonResponse,
  errorResponse,
  corsHeaders,
} from '../_shared/supabase-admin.ts';
import { sendEmail, PRODUCTION_FROM_EMAIL, DEFAULT_FROM_EMAIL } from '../_shared/resend-client.ts';
import { getInvitationEmailTemplate } from '../_shared/email-templates.ts';

Deno.serve(async (req) => {
  console.log('📧 [EdgeFunction] send-invitation-email invoked');
  console.log('📥 [EdgeFunction] Request method:', req.method);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ [EdgeFunction] CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify user is authenticated
    console.log('🔍 [EdgeFunction] STEP 1: Verifying user authentication...');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing Authorization header', 401, corsHeaders);
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ [EdgeFunction] Authentication failed:', authError);
      return errorResponse('Unauthorized', 401, corsHeaders);
    }

    console.log('✅ [EdgeFunction] User authenticated:', {
      userId: user.id,
      email: user.email,
    });

    // 2. Parse request body
    console.log('📦 [EdgeFunction] STEP 2: Parsing request body...');
    const body = await req.json();
    const { invitationId } = body;

    if (!invitationId) {
      return errorResponse('Missing required field: invitationId', 400, corsHeaders);
    }

    console.log('📋 [EdgeFunction] Invitation ID:', invitationId);

    // 3. Fetch invitation details with organization and inviter info via RPC
    console.log('🔍 [EdgeFunction] STEP 3: Fetching invitation details via RPC...');

    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_invitation_with_inviter', { p_invitation_id: invitationId });

    if (rpcError || !rpcResult) {
      console.error('❌ [EdgeFunction] Failed to fetch invitation:', rpcError);
      return errorResponse('Invitation not found', 404, corsHeaders);
    }

    // Extract data from RPC result
    const invitationData = rpcResult as any;
    const invitation = invitationData.invitation;
    const org = invitationData.organization;
    const inviter = invitationData.inviter;

    if (!invitation) {
      console.error('❌ [EdgeFunction] Invitation data not found in RPC result');
      return errorResponse('Invitation not found', 404, corsHeaders);
    }

    // Check if invitation is already accepted
    if (invitation.accepted_at) {
      console.warn('⚠️ [EdgeFunction] Invitation already accepted');
      return errorResponse('Invitation has already been accepted', 400, corsHeaders);
    }

    // Check if invitation is expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt <= new Date()) {
      console.warn('⚠️ [EdgeFunction] Invitation expired');
      return errorResponse('Invitation has expired', 400, corsHeaders);
    }

    console.log('✅ [EdgeFunction] Invitation found:', {
      email: invitation.email,
      orgId: invitation.org_id,
      role: invitation.role,
    });

    // 4. Get organization details
    const orgName = org?.name || 'Organization';
    const orgLogo = org?.logo_url || null;

    // 5. Get inviter details
    const inviterName = inviter?.full_name || 
                       inviter?.email?.split('@')[0] || 
                       'Someone';

    // 6. Generate invitation link
    // Use FRONTEND_URL from environment if set, otherwise construct from Supabase URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 
                       (supabaseUrl.includes('localhost') 
                         ? 'http://localhost:5173' 
                         : 'https://closewell.app'); // Default production URL
    
    const invitationLink = `${frontendUrl}/accept-invite?token=${invitation.invitation_token}`;

    console.log('🔗 [EdgeFunction] Invitation link generated:', invitationLink);

    // 7. Generate email HTML
    console.log('📝 [EdgeFunction] STEP 4: Generating email template...');
    const emailHtml = getInvitationEmailTemplate({
      orgName,
      orgLogo,
      inviterName,
      role: invitation.role as 'owner' | 'member',
      invitationLink,
      expiresAt: invitation.expires_at,
    });

    // 8. Determine sender email
    // Use verified production domain with display name format (required by Resend API)
    // Format: "Display Name <email@domain.com>"
    // Domain mail.closewell.app is verified in Resend
    const fromEmail = `Closewell <${PRODUCTION_FROM_EMAIL}>`;

    // 9. Send email via Resend
    console.log('📧 [EdgeFunction] STEP 5: Sending email via Resend...');
    console.log('📧 [EdgeFunction] Email details:', {
      from: fromEmail,
      to: invitation.email,
      orgName,
      inviterName,
    });

    const emailResult = await sendEmail({
      from: fromEmail,
      to: invitation.email,
      subject: `${orgName} organizasyonuna davet edildiniz / You're invited to join ${orgName}`,
      html: emailHtml,
      replyTo: 'support@mail.closewell.app',
    });

    console.log('✅ [EdgeFunction] Email sent successfully:', {
      emailId: emailResult.id,
      to: invitation.email,
    });

    // 10. Return success response
    return jsonResponse(
      {
        success: true,
        message: 'Invitation email sent successfully',
        emailId: emailResult.id,
        invitationId: invitation.id,
      },
      200,
      corsHeaders
    );

  } catch (error) {
    console.error('❌ [EdgeFunction] Error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';

    return errorResponse(
      `Failed to send invitation email: ${errorMessage}`,
      500,
      corsHeaders,
      { error: errorMessage }
    );
  }
});
