# 🎯 Organization Invitations - Implementation Guide

## Overview
This document describes the implementation of **Solution A: Separate Invitation Table** for inviting users who haven't registered yet.

**Implementation Date:** 2026-01-12  
**Status:** ✅ Complete - Ready for Testing

---

## 📋 What Was Implemented

### 1. Database Changes
- **New Table:** `org_invitations` - stores pending invitations
- **Auto-linking Trigger:** `on_auth_user_created_accept_invitations` - automatically accepts invitations when user signs up
- **RPC Functions:**
  - `generate_invitation_token()` - generates secure, unique tokens
  - `accept_org_invitation(token)` - manual invitation acceptance
  - `get_invitation_info(token)` - public endpoint for showing invitation details
- **RLS Policies:** Owner-only access to create/view/manage invitations

### 2. TypeScript Updates
- **Types Added:** `OrgInvitation`, `OrgInvitationWithOrg`, `InvitationInfo` in `src/types/org.ts`
- **Database Types:** Updated `database.types.ts` with new table and functions
- **Service Methods:** Extended `organization.service.ts` with invitation management

### 3. Service Methods Added
```typescript
// In organization.service.ts
inviteMember(orgId, email, role)      // Smart invite (registered or not)
getInvitations(orgId)                 // List pending invitations
resendInvitation(invitationId)        // Resend with new token
revokeInvitation(invitationId)        // Delete invitation
getInvitationInfo(token)              // Public info for accept page
acceptInvitation(token)               // Manual acceptance by user
```

---

## 🔄 How It Works

### Scenario 1: Inviting an Unregistered User
```
1. Owner clicks "Invite Member" → enters email@example.com
2. System checks auth.users → user NOT found
3. Creates record in org_invitations with:
   - Secure token (32 chars, URL-safe)
   - Expiration date (7 days from now)
   - Role (owner/member)
4. Email sent with invitation link:
   https://your-app.com/accept-invite?token=ABC123XYZ
5. User clicks link → prompted to register/login
6. After registration → trigger auto-accepts invitation
7. Creates org_members record → status='active'
8. Deletes invitation record (cleanup)
```

### Scenario 2: Inviting an Already Registered User
```
1. Owner clicks "Invite Member" → enters registered@example.com
2. System checks auth.users → user FOUND
3. Directly creates org_members record → status='active'
4. User immediately has access (no invitation needed)
```

### Scenario 3: User Registers Before Clicking Link
```
1. Owner invites user → invitation created
2. User registers independently (didn't click link yet)
3. Trigger fires on signup → finds pending invitation
4. Auto-creates org_members → status='active'
5. Marks invitation as accepted
6. User has immediate access to organization
```

---

## 🔒 Security Features

### Token Security
- **32-character random tokens** (base64-encoded)
- **URL-safe** (no +, /, =)
- **Unique constraint** (collision prevention)
- **Expiration** (7 days default)

### RLS Policies
- Only **owners** can create invitations
- Only **owners** of same org can view/manage invitations
- **Public read** for invitation info (by token only)
- System triggers can modify (auth.uid() IS NULL)

### Validation Checks
- Email format validation
- Duplicate invitation prevention
- Expiration enforcement
- Email match on acceptance

---

## 📁 Files Modified

### New Files
- `supabase/migrations/20260112120000_create_org_invitations_table.sql`
- `docs/ORG_INVITATIONS_IMPLEMENTATION.md` (this file)

### Modified Files
- `src/types/org.ts` - Added invitation types
- `src/types/database.types.ts` - Added table and function types
- `src/services/organization.service.ts` - Extended with invitation methods

---

## 🚀 Deployment Steps

### 1. Run Migration
```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Manual execution in Supabase Dashboard
# Go to SQL Editor → Run the migration file
```

### 2. Verify Migration
```sql
-- Check table exists
SELECT * FROM pg_tables WHERE tablename = 'org_invitations';

-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_accept_invitations';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'org_invitations';
```

### 3. Test in Development
```typescript
// Test invitation flow
const result = await organizationService.inviteMember(
  'org-id-here',
  'newuser@example.com',
  'member'
);

console.log(result);
// Expected: { type: 'invitation', data: { ... invitation record ... } }
```

---

## 🧪 Testing Checklist

### Unit Tests Needed
- [ ] `inviteMember()` - creates invitation for unregistered user
- [ ] `inviteMember()` - adds member directly if already registered
- [ ] `inviteMember()` - throws error if already invited
- [ ] `getInvitations()` - returns only pending invitations
- [ ] `resendInvitation()` - generates new token
- [ ] `revokeInvitation()` - deletes invitation
- [ ] `acceptInvitation()` - creates org_members record

### Integration Tests Needed
- [ ] Auto-accept trigger fires on user signup
- [ ] Expired invitations are rejected
- [ ] Email mismatch is rejected
- [ ] RLS prevents non-owners from inviting
- [ ] Token uniqueness is enforced

### Manual Testing Steps
1. **Invite unregistered user**
   - [ ] Invitation created in database
   - [ ] Token is unique and URL-safe
   - [ ] Expires_at is 7 days in future

2. **User registers with invited email**
   - [ ] Trigger creates org_members record
   - [ ] Invitation marked as accepted
   - [ ] User can access organization immediately

3. **Invite already registered user**
   - [ ] No invitation created
   - [ ] org_members record created directly
   - [ ] User has immediate access

4. **Expired invitation**
   - [ ] Cannot be accepted via token
   - [ ] Can be resent by owner

5. **Security checks**
   - [ ] Non-owners cannot view invitations
   - [ ] Non-owners cannot create invitations
   - [ ] Wrong email cannot accept invitation

---

## 🎨 UI Implementation (Next Steps)

### 1. Team Settings Page
Update your team management UI to show both members and pending invitations:

```typescript
// Example component structure
const TeamMembers = () => {
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    // Load active members
    const members = await organizationService.getMembers(orgId);
    setMembers(members);

    // Load pending invitations
    const invitations = await organizationService.getInvitations(orgId);
    setInvitations(invitations);
  };

  const handleInvite = async (email, role) => {
    try {
      const result = await organizationService.inviteMember(orgId, email, role);
      
      if (result.type === 'invitation') {
        // Show invitation sent message
        toast.success(`Invitation sent to ${email}`);
        // TODO: Send email with invitation link
      } else {
        // User was already registered - added directly
        toast.success(`${email} added to organization`);
      }
      
      loadTeamData(); // Refresh
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleResend = async (invitationId) => {
    await organizationService.resendInvitation(invitationId);
    toast.success('Invitation resent');
    // TODO: Send email with new invitation link
  };

  const handleRevoke = async (invitationId) => {
    await organizationService.revokeInvitation(invitationId);
    toast.success('Invitation revoked');
    loadTeamData();
  };

  return (
    <>
      <ActiveMembersList members={members} />
      <PendingInvitationsList 
        invitations={invitations}
        onResend={handleResend}
        onRevoke={handleRevoke}
      />
      <InviteDialog onInvite={handleInvite} />
    </>
  );
};
```

### 2. Accept Invitation Page
Create a new page at `/accept-invite` to handle invitation acceptance:

```typescript
// Example: src/pages/AcceptInvite.tsx
const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [invitationInfo, setInvitationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadInvitationInfo();
  }, [token]);

  const loadInvitationInfo = async () => {
    try {
      const info = await organizationService.getInvitationInfo(token);
      setInvitationInfo(info);
    } catch (error) {
      toast.error('Invalid invitation link');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Save token and redirect to signup/login
      localStorage.setItem('pending_invitation', token);
      navigate('/signup');
      return;
    }

    // User is logged in - accept invitation
    try {
      const result = await organizationService.acceptInvitation(token);
      
      if (result.success) {
        toast.success(result.message);
        navigate('/dashboard'); // Redirect to org dashboard
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to accept invitation');
    }
  };

  if (loading) return <Spinner />;
  if (!invitationInfo?.valid) return <InvalidInvitation />;
  if (invitationInfo.expired) return <ExpiredInvitation />;

  return (
    <div>
      <h1>You're invited to join {invitationInfo.org_name}</h1>
      <p>Role: {invitationInfo.role}</p>
      <p>Invited by: {invitationInfo.invited_by_name}</p>
      <button onClick={handleAccept}>Accept Invitation</button>
    </div>
  );
};
```

### 3. Email Template (TODO)
Create an email template for sending invitation links:

```html
<!-- TODO: Implement email sending -->
Subject: You're invited to join {org_name}

Hi,

{inviter_name} has invited you to join {org_name} as a {role}.

Click the link below to accept:
{invitation_link}

This invitation expires on {expires_at}.

If you don't have an account, you'll be prompted to create one.
```

---

## 🐛 Known Limitations

1. **Email Sending Not Implemented**
   - Migration creates invitations but doesn't send emails
   - You need to integrate an email service (Resend, SendGrid, etc.)
   - Invitation token must be sent to user manually for now

2. **No UI Components**
   - Backend is complete, but UI needs to be built
   - See "UI Implementation" section above for guidance

3. **No Notification System**
   - User doesn't get in-app notification when invited
   - Consider adding notification when user logs in

4. **Single Invitation Per Email**
   - One user can only have one pending invitation per org
   - If you need to change role, revoke and resend

---

## 📊 Database Schema

### org_invitations Table
```sql
Column            | Type         | Description
------------------|--------------|------------------------------------------
id                | UUID         | Primary key
org_id            | UUID         | Foreign key to organizations
email             | TEXT         | Invited user's email (lowercase)
role              | TEXT         | 'owner' or 'member'
invitation_token  | TEXT         | Unique secure token
invited_by        | UUID         | Foreign key to auth.users (inviter)
invited_at        | TIMESTAMPTZ  | When invitation was created
expires_at        | TIMESTAMPTZ  | When invitation expires (7 days default)
accepted_at       | TIMESTAMPTZ  | When invitation was accepted (NULL=pending)
created_at        | TIMESTAMPTZ  | Record creation time
updated_at        | TIMESTAMPTZ  | Record update time

UNIQUE(org_id, email) - One invitation per user per org
UNIQUE(invitation_token) - Tokens must be unique
```

---

## 🔍 Troubleshooting

### Issue: Trigger not firing on signup
**Solution:** Check if trigger exists and is enabled:
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created_accept_invitations';
```

### Issue: RLS blocking invitation creation
**Solution:** Verify user is owner:
```sql
SELECT * FROM org_members 
WHERE user_id = 'your-user-id' 
  AND org_id = 'your-org-id' 
  AND role = 'owner';
```

### Issue: Token generation fails
**Solution:** Check if function exists:
```sql
SELECT * FROM pg_proc 
WHERE proname = 'generate_invitation_token';
```

### Issue: Invitation email case sensitivity
**Solution:** Email is stored lowercase, comparison is case-insensitive (LOWER(email))

---

## 🎉 Success Criteria

Implementation is successful when:
- ✅ Migration runs without errors
- ✅ Trigger creates org_members on signup
- ✅ RLS policies prevent unauthorized access
- ✅ Tokens are unique and secure
- ✅ Expired invitations are rejected
- ✅ Service methods work as expected

---

## 📞 Support

For questions or issues:
1. Check this document first
2. Review migration file comments
3. Test with SQL queries in Supabase dashboard
4. Check Supabase logs for trigger errors

---

**Last Updated:** 2026-01-12  
**Version:** 1.0  
**Author:** System Implementation
