# 🚀 Organization Invitations - Quick Start

## ✅ Implementation Complete

All backend components for inviting users who haven't registered are now ready!

---

## 📦 What You Got

### 1️⃣ Database (✅ Ready)
- **Migration File:** `supabase/migrations/20260112120000_create_org_invitations_table.sql`
- New table: `org_invitations`
- Auto-linking trigger on user signup
- 3 RPC functions for invitation management
- RLS policies for security

### 2️⃣ TypeScript Types (✅ Ready)
- `OrgInvitation` interface
- `InvitationInfo` interface
- Database types updated

### 3️⃣ Service Layer (✅ Ready)
All methods in `organization.service.ts`:
```typescript
inviteMember(orgId, email, role)      // ⭐ Main invite method
getInvitations(orgId)                 // List pending invites
resendInvitation(invitationId)        // Resend with new token
revokeInvitation(invitationId)        // Delete invitation
getInvitationInfo(token)              // Get public info
acceptInvitation(token)               // Accept by token
```

---

## 🎯 Next Steps (You Need to Do)

### Step 1: Deploy Migration
```bash
supabase db push
```

### Step 2: Test Basic Flow
```typescript
// In your browser console or test file
import { organizationService } from './services/organization.service';

// Invite someone
const result = await organizationService.inviteMember(
  'your-org-id',
  'newuser@example.com',
  'member'
);

console.log(result);
// If user not registered: { type: 'invitation', data: {...} }
// If user registered: { type: 'member', data: {...} }
```

### Step 3: Build UI Components
You need to create:
1. **Invite Dialog** - Form to invite new members
2. **Pending Invitations List** - Show/resend/revoke
3. **Accept Invitation Page** - `/accept-invite?token=xxx`

### Step 4: Setup Email Sending
Choose an email service:
- Resend (recommended)
- SendGrid
- AWS SES
- Supabase Edge Functions + SMTP

---

## 🔥 Usage Example

### Inviting a User
```typescript
// In your Team Settings component
const handleInvite = async () => {
  try {
    const result = await organizationService.inviteMember(
      currentOrg.id,
      emailInput,
      roleInput
    );

    if (result.type === 'invitation') {
      // User not registered - send email with token
      const token = result.data.invitation_token;
      const inviteLink = `${window.location.origin}/accept-invite?token=${token}`;
      
      // TODO: Send email with inviteLink
      toast.success(`Invitation sent to ${emailInput}`);
    } else {
      // User already registered - added directly
      toast.success(`${emailInput} added to your team`);
    }
  } catch (error) {
    toast.error(error.message);
  }
};
```

### Viewing Pending Invitations
```typescript
const [invitations, setInvitations] = useState([]);

useEffect(() => {
  const loadInvitations = async () => {
    const invites = await organizationService.getInvitations(currentOrg.id);
    setInvitations(invites);
  };
  loadInvitations();
}, []);

// Show in UI
{invitations.map(invite => (
  <div key={invite.id}>
    <span>{invite.email}</span>
    <span>{invite.role}</span>
    <span>Expires: {new Date(invite.expires_at).toLocaleDateString()}</span>
    <button onClick={() => resend(invite.id)}>Resend</button>
    <button onClick={() => revoke(invite.id)}>Revoke</button>
  </div>
))}
```

### Accepting Invitation
```typescript
// In /accept-invite page
const token = new URLSearchParams(window.location.search).get('token');

// 1. Show invitation info
const info = await organizationService.getInvitationInfo(token);
if (!info.valid || info.expired) {
  // Show error
}

// 2. On accept button click
const result = await organizationService.acceptInvitation(token);
if (result.success) {
  navigate('/dashboard');
}
```

---

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────┐
│ Owner invites "newuser@example.com"                     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ User exists?   │
         └────┬───────┬───┘
              │       │
        NO    │       │    YES
              │       │
              ▼       ▼
    ┌──────────────┐ ┌──────────────┐
    │ Create       │ │ Add to       │
    │ invitation   │ │ org_members  │
    │ + token      │ │ immediately  │
    └──────┬───────┘ └──────────────┘
           │
           │ Email sent with token
           │
           ▼
    ┌──────────────┐
    │ User signs   │
    │ up/logs in   │
    └──────┬───────┘
           │
           │ Trigger fires
           │
           ▼
    ┌──────────────┐
    │ Auto-create  │
    │ org_members  │
    │ record       │
    └──────────────┘
```

---

## 🐛 Common Issues

### "User not found" error is gone ✅
Before: Required user to exist in auth.users  
Now: Creates invitation if user doesn't exist

### Invitation not auto-accepted?
Check trigger exists:
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created_accept_invitations';
```

### Can't create invitation?
Make sure you're an owner:
```typescript
// Check your role
const members = await organizationService.getMembers(orgId);
const me = members.find(m => m.user_id === currentUser.id);
console.log(me.role); // Should be 'owner'
```

---

## 📚 Full Documentation

For detailed info, see:
- `docs/ORG_INVITATIONS_IMPLEMENTATION.md` - Complete guide
- `supabase/migrations/20260112120000_create_org_invitations_table.sql` - SQL comments

---

## ✨ Features

- ✅ Invite unregistered users by email
- ✅ Auto-link on signup (trigger)
- ✅ Secure token-based acceptance
- ✅ 7-day expiration (configurable)
- ✅ Resend with new token
- ✅ Revoke invitations
- ✅ RLS security
- ✅ Duplicate prevention

---

**Ready to Deploy!** 🎉

Run `supabase db push` and start inviting users!
