# Organization Management UI - Implementation Plan

> **Document Type:** Technical Implementation Plan
> **Created:** 2026-01-08
> **Status:** Ready for Implementation
> **Estimated Effort:** 12-16 hours

---

## Executive Summary

### Current State
The multi-tenant organization system has a solid backend foundation:
- Database tables (`organizations`, `org_members`) with full RLS security
- Type definitions (`src/types/org.ts`)
- Context provider (`src/contexts/OrgContext.tsx`) exposing `currentOrg`, `isOwner`, `isMember`
- Basic org name editing via `EditOrganizationDialog` in Profile page
- All business services support `org_id` filtering via `getActiveOrgId()` helper

### What We're Building
A complete Organization Management UI consisting of:
1. **Enhanced Organization Settings** - Edit name, logo, view metadata
2. **Team Members Management** - List, invite, role change, remove members
3. **Member Invitation Flow** - V1 manual, V2 email-based

### Why This Matters
Currently, there's no way for organization owners to:
- See who's in their organization
- Invite new team members
- Manage member roles (owner/member)
- Remove members who leave
- Upload organization logo

These are essential multi-tenant features that block team collaboration.

---

## Codebase Analysis

### Current Architecture

#### File Structure Pattern
```
src/
├── features/
│   └── profile/                    # Settings home
│       ├── Profile.tsx             # Main page with cards layout
│       ├── components/
│       │   ├── OrganizationSettingsCard.tsx  # EXISTS - basic card
│       │   └── EditOrganizationDialog.tsx    # EXISTS - name edit only
│       └── schemas/
│           └── editOrganizationSchema.ts     # NEEDS CREATION
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx          # Page wrapper with title
│   │   ├── PageContainer.tsx       # Content container
│   │   └── Sidebar.tsx             # Navigation (shows org name)
│   ├── templates/
│   │   └── ListPageTemplate.tsx    # CRUD list template
│   └── ui/                         # shadcn/ui components
├── services/
│   └── organization.service.ts     # MINIMAL - only updateName()
├── contexts/
│   └── OrgContext.tsx              # Provides currentOrg, isOwner, isMember
├── types/
│   └── org.ts                      # Organization, OrgMember types
└── lib/
    └── orgHelpers.ts               # getActiveOrgId(), softDelete()
```

#### UI Component Library
- **Framework:** shadcn/ui (built on Radix UI)
- **Key Components Used:**
  - `Dialog` / `Drawer` - Responsive modal pattern
  - `AlertDialog` - Confirmations
  - `Form` / `FormField` - react-hook-form integration
  - `Card` / `CardHeader` / `CardContent` - Section containers
  - `Table` / `TableHead` / `TableRow` - Data display
  - `Button`, `Input`, `Select` - Form controls
  - `Badge` - Status indicators
  - `Avatar` - User/org images

#### Routing Structure
- **Location:** `src/config/constants.ts`
- **Registration:** `src/App.tsx` with `<ProtectedRoute>`
- **Current Routes:** No dedicated org management route exists

#### Form Handling Pattern
```typescript
// 1. Schema with i18n
const createSchema = (t: TFunction) => z.object({
  field: z.string().min(2, { message: t('validation.min') })
});

// 2. Form hook
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});

// 3. Discard confirmation
const handleClose = () => {
  if (form.formState.isDirty) {
    setShowDiscardDialog(true);
  } else {
    onClose();
  }
};
```

#### Responsive Pattern
```typescript
const isMobile = useMediaQuery('(max-width: 768px)');

if (isMobile) {
  return <Drawer>...</Drawer>;   // Bottom sheet on mobile
}
return <Dialog>...</Dialog>;     // Centered modal on desktop
```

---

### Service Layer Status

#### Current: `organization.service.ts`
```typescript
class OrganizationService {
  async updateName(orgId: string, name: string): Promise<Organization>
  // That's it. Only 1 function.
}
```

#### Missing Functions (Must Create)
| Function | Purpose | Priority |
|----------|---------|----------|
| `getMembers(orgId)` | List all org members with user details | P0 |
| `inviteMember(orgId, email, role)` | Add new member to org | P0 |
| `updateMemberRole(memberId, role)` | Change owner ↔ member | P1 |
| `removeMember(memberId)` | Remove member from org | P1 |
| `updateLogo(orgId, logoUrl)` | Update org logo URL | P2 |
| `getById(orgId)` | Fetch single org details | P2 |

---

### State Management Review

#### OrgContext Provides
```typescript
interface OrgContextValue {
  currentOrg: Organization | null;   // Full org object
  membership: OrgMember | null;      // Current user's membership
  isOwner: boolean;                  // role === 'owner'
  isMember: boolean;                 // role === 'member'
  loading: boolean;
  error: string | null;
  refreshOrg: () => Promise<void>;   // Re-fetch org data
}
```

#### What's Available vs Needs Fetching
| Data | Available in Context | Needs API Call |
|------|---------------------|----------------|
| Current org details | Yes | No |
| User's role (owner/member) | Yes | No |
| List of org members | **No** | **Yes** |
| Other members' details | **No** | **Yes** |

#### Usage Pattern
```typescript
const { currentOrg, isOwner, refreshOrg } = useOrg();

// After mutations, refresh context
await organizationService.updateName(currentOrg.id, newName);
await refreshOrg();
```

---

## Feature Requirements

### Feature 1: Organization Settings (Enhanced)

#### Current State
- `OrganizationSettingsCard` shows org name only
- `EditOrganizationDialog` allows name editing
- No logo support, no metadata display

#### Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Edit organization name | P0 | Already implemented |
| Upload/change logo | P1 | Storage bucket needed |
| Display org ID (copyable) | P2 | For API integrations |
| Display creation date | P2 | Informational |
| Display member count | P1 | Dynamic from members list |

#### User Stories
1. As an **owner**, I can change my organization's name
2. As an **owner**, I can upload a logo for my organization
3. As an **owner**, I can see when my organization was created
4. As a **member**, I can see organization details but cannot edit

#### UI Mockup (Card Layout)
```
┌──────────────────────────────────────────────────────┐
│ [Building Icon] Organization Settings    [Edit Btn]  │
├──────────────────────────────────────────────────────┤
│ Logo:       [Avatar/Upload]                          │
│ Name:       Jans Emlak                               │
│ Members:    3 members                                │
│ Created:    January 5, 2026                          │
│ Org ID:     e8f5a9c1-3b2d... [Copy]                  │
└──────────────────────────────────────────────────────┘
```

---

### Feature 2: Team Members Management

#### Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| List all members | P0 | Table with name, email, role, status, joined date |
| Add new member | P0 | Email + role selection |
| Change member role | P1 | Owner ↔ Member toggle |
| Remove member | P1 | With confirmation dialog |
| Show current user badge | P2 | "You" indicator |
| Prevent self-removal | P0 | Owner cannot remove themselves |
| Prevent last owner removal | P0 | Must have at least 1 owner |

#### User Stories
1. As an **owner**, I can see all members in my organization
2. As an **owner**, I can add new members by email
3. As an **owner**, I can change a member's role
4. As an **owner**, I can remove members (except myself if last owner)
5. As a **member**, I can see other members (read-only)

#### Data Model
```typescript
interface OrgMemberWithUser {
  id: string;
  org_id: string;
  user_id: string;
  role: 'owner' | 'member';
  status: 'pending' | 'active' | 'suspended';
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string | null;
  // Joined from auth.users
  user: {
    email: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}
```

#### UI Mockup (Table)
```
┌──────────────────────────────────────────────────────────────────────┐
│ Team Members                              [Search] [+ Add Member]     │
├──────────────────────────────────────────────────────────────────────┤
│ Member              │ Email             │ Role   │ Joined    │ Actions│
├─────────────────────┼───────────────────┼────────┼───────────┼────────┤
│ [Avatar] John Doe   │ john@example.com  │ Owner  │ Jan 5     │ [···]  │
│ (You)               │                   │        │           │        │
├─────────────────────┼───────────────────┼────────┼───────────┼────────┤
│ [Avatar] Jane Smith │ jane@example.com  │ Member │ Jan 7     │ [···]  │
└──────────────────────────────────────────────────────────────────────┘

Actions Menu: [Change Role] [Remove Member]
```

#### Mobile View (Cards)
```
┌─────────────────────────────────┐
│ [Avatar] John Doe               │
│ john@example.com                │
│ ┌────────┐  Joined: Jan 5       │
│ │ Owner  │                      │
│ └────────┘         [···]        │
└─────────────────────────────────┘
```

---

### Feature 3: Member Invitation Flow

#### V1: Manual Invitation (MVP)
- Owner enters email address
- System creates `org_members` record with `status: 'pending'`
- User must already exist in `auth.users` (registered)
- When user logs in, they see the org

#### V2: Email Invitation (Future)
- Owner enters email address
- System sends invitation email via Supabase Edge Function
- Email contains magic link to accept invitation
- Works for non-registered users (signup + join flow)

#### V1 Flow Diagram
```
Owner clicks "Add Member"
        │
        ▼
┌─────────────────────┐
│ Add Team Member     │
│                     │
│ Email: [________]   │
│ Role:  [Owner ▼]    │
│                     │
│ [Cancel] [Add]      │
└─────────────────────┘
        │
        ▼
Check if email exists in auth.users
        │
    ┌───┴───┐
    │       │
  Yes      No
    │       │
    ▼       ▼
 Create   Show error:
 org_member "User not found.
 record    They must register first."
    │
    ▼
 Show success
 toast
```

#### V1 Requirements
| Requirement | Priority | Notes |
|-------------|----------|-------|
| Email input with validation | P0 | Must be valid email format |
| Role selection (owner/member) | P0 | Default: member |
| Check user exists | P0 | Query auth.users by email |
| Create pending membership | P0 | status: 'pending' or 'active' |
| Error handling | P0 | User not found, already member |
| Success feedback | P0 | Toast notification |

---

## Implementation Plan

### Service Layer

#### File: `src/services/organization.service.ts`

| Function | Signature | Purpose | Priority |
|----------|-----------|---------|----------|
| `getMembers` | `(orgId: string) => Promise<OrgMemberWithUser[]>` | List members with user details | P0 |
| `inviteMember` | `(orgId: string, email: string, role: OrgRole) => Promise<OrgMember>` | Add member by email | P0 |
| `updateMemberRole` | `(memberId: string, role: OrgRole) => Promise<OrgMember>` | Change role | P1 |
| `removeMember` | `(memberId: string) => Promise<void>` | Delete membership | P1 |
| `updateLogo` | `(orgId: string, logoUrl: string \| null) => Promise<Organization>` | Update logo URL | P2 |
| `getMemberCount` | `(orgId: string) => Promise<number>` | Get total members | P2 |

#### Function Implementations

```typescript
// getMembers - List all members with user data
async getMembers(orgId: string): Promise<OrgMemberWithUser[]> {
  const { data, error } = await supabase
    .from('org_members')
    .select(`
      id, org_id, user_id, role, status,
      invited_by, invited_at, joined_at,
      created_at, updated_at,
      user:user_id (
        email,
        raw_user_meta_data
      )
    `)
    .eq('org_id', orgId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return data as OrgMemberWithUser[];
}

// inviteMember - Add new member by email
async inviteMember(orgId: string, email: string, role: OrgRole): Promise<OrgMember> {
  // 1. Find user by email (requires RPC or admin API)
  const { data: users, error: userError } = await supabase
    .rpc('get_user_id_by_email', { email_input: email });

  if (userError || !users?.length) {
    throw new Error('User not found. They must register first.');
  }

  const userId = users[0].id;

  // 2. Check if already member
  const { data: existing } = await supabase
    .from('org_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    throw new Error('User is already a member of this organization.');
  }

  // 3. Get current user for invited_by
  const { data: { user } } = await supabase.auth.getUser();

  // 4. Create membership
  const { data, error } = await supabase
    .from('org_members')
    .insert({
      org_id: orgId,
      user_id: userId,
      role,
      status: 'active',
      invited_by: user?.id,
      invited_at: new Date().toISOString(),
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as OrgMember;
}

// updateMemberRole - Change owner <-> member
async updateMemberRole(memberId: string, role: OrgRole): Promise<OrgMember> {
  const { data, error } = await supabase
    .from('org_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;
  return data as OrgMember;
}

// removeMember - Delete membership record
async removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('org_members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}
```

#### Required Database Function (RPC)

```sql
-- Create RPC to lookup user by email (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input TEXT)
RETURNS TABLE (id UUID)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM auth.users
  WHERE email = email_input
  LIMIT 1;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_id_by_email TO authenticated;
```

---

### UI Components

#### New Components to Create

| Component | Type | Location | Purpose |
|-----------|------|----------|---------|
| `TeamMembersCard` | Card | `src/features/profile/components/` | Display members in profile |
| `TeamMembersList` | Page | `src/features/organization/` | Full members management |
| `AddMemberDialog` | Dialog | `src/features/organization/components/` | Invite form |
| `ChangeMemberRoleDialog` | Dialog | `src/features/organization/components/` | Role change |
| `RemoveMemberDialog` | AlertDialog | `src/features/organization/components/` | Confirm removal |
| `MemberRow` | TableRow | `src/features/organization/components/` | Single member row |
| `MemberCard` | Card | `src/features/organization/components/` | Mobile member card |
| `MemberAvatar` | Avatar | `src/features/organization/components/` | User avatar with fallback |
| `RoleBadge` | Badge | `src/features/organization/components/` | Owner/Member badge |

#### Component Hierarchy
```
Profile.tsx
├── OrganizationSettingsCard (enhanced)
│   └── EditOrganizationDialog (existing)
└── TeamMembersCard (NEW)
    └── → Link to TeamMembersList

TeamMembersList.tsx (NEW - full page)
├── AddMemberDialog
├── MemberRow / MemberCard
├── ChangeMemberRoleDialog
└── RemoveMemberDialog
```

---

### Navigation Updates

#### Option A: Add to Sidebar (Recommended)
```typescript
// src/components/layout/Sidebar.tsx
const navigationItems = [
  // ... existing items
  { key: 'profile', href: ROUTES.PROFILE, icon: UserCircle },
  { key: 'team', href: ROUTES.TEAM, icon: Users2 },  // NEW
];
```

#### Option B: Sub-navigation in Profile
Keep team management within Profile page as a card that links to full page.

**Recommendation:** Option A - Dedicated sidebar item for "Team" makes it more discoverable and follows the pattern of other features.

#### Route Addition
```typescript
// src/config/constants.ts
export const ROUTES = {
  // ... existing
  TEAM: '/team',  // NEW
} as const;

// src/App.tsx
<Route
  path={ROUTES.TEAM}
  element={
    <ProtectedRoute>
      <TeamMembersList />
    </ProtectedRoute>
  }
/>
```

---

### Implementation Steps

#### Phase 1: Service Layer (2-3 hours)

| Step | Task | File | Time |
|------|------|------|------|
| 1.1 | Create database RPC `get_user_id_by_email` | Migration file | 30m |
| 1.2 | Add `getMembers()` function | `organization.service.ts` | 30m |
| 1.3 | Add `inviteMember()` function | `organization.service.ts` | 45m |
| 1.4 | Add `updateMemberRole()` function | `organization.service.ts` | 30m |
| 1.5 | Add `removeMember()` function | `organization.service.ts` | 30m |
| 1.6 | Add TypeScript types for member with user | `types/org.ts` | 15m |

#### Phase 2: Base Components (3-4 hours)

| Step | Task | File | Time |
|------|------|------|------|
| 2.1 | Create `RoleBadge` component | `components/` | 20m |
| 2.2 | Create `MemberAvatar` component | `components/` | 20m |
| 2.3 | Create `MemberRow` table row | `organization/components/` | 45m |
| 2.4 | Create `MemberCard` mobile card | `organization/components/` | 45m |
| 2.5 | Create `AddMemberDialog` with form | `organization/components/` | 60m |
| 2.6 | Create validation schemas | `organization/schemas/` | 30m |

#### Phase 3: Page Components (3-4 hours)

| Step | Task | File | Time |
|------|------|------|------|
| 3.1 | Create `TeamMembersList` page | `organization/TeamMembersList.tsx` | 90m |
| 3.2 | Create `ChangeMemberRoleDialog` | `organization/components/` | 45m |
| 3.3 | Create `RemoveMemberDialog` | `organization/components/` | 30m |
| 3.4 | Update `OrganizationSettingsCard` | `profile/components/` | 30m |
| 3.5 | Create `TeamMembersCard` preview | `profile/components/` | 45m |

#### Phase 4: Integration (2-3 hours)

| Step | Task | File | Time |
|------|------|------|------|
| 4.1 | Add route to constants | `config/constants.ts` | 5m |
| 4.2 | Add route to App.tsx | `App.tsx` | 10m |
| 4.3 | Add sidebar navigation item | `layout/Sidebar.tsx` | 15m |
| 4.4 | Add i18n translations (EN) | `locales/en/team.json` | 45m |
| 4.5 | Add i18n translations (TR) | `locales/tr/team.json` | 45m |
| 4.6 | Add navigation translations | `locales/*/navigation.json` | 15m |

#### Phase 5: Testing & Polish (2 hours)

| Step | Task | Time |
|------|------|------|
| 5.1 | Test member listing | 15m |
| 5.2 | Test add member flow | 20m |
| 5.3 | Test role change | 15m |
| 5.4 | Test member removal | 15m |
| 5.5 | Test error cases | 20m |
| 5.6 | Test mobile responsiveness | 15m |
| 5.7 | Test owner-only restrictions | 10m |
| 5.8 | Fix bugs and polish | 30m |

---

## Technical Decisions

### Decision 1: Where to Place Team Management?

| Option | Pros | Cons |
|--------|------|------|
| **A: Dedicated Sidebar Item** | Discoverable, follows pattern | Another nav item |
| B: Sub-page under Profile | Grouped with settings | Less discoverable |
| C: User dropdown menu | Clean sidebar | Hidden, non-standard |

**Recommendation: Option A - Dedicated Sidebar Item**

Rationale:
- Team management is a first-class feature for multi-tenant apps
- Follows the existing pattern (Properties, Contracts, etc. all have sidebar items)
- Makes it easy to find and access
- Mobile users can access directly from hamburger menu

---

### Decision 2: How to Handle Member Invitation?

| Option | Pros | Cons |
|--------|------|------|
| **A: Manual (User Must Exist)** | Simple, no email infra | User must register first |
| B: Email Invitation | Full flow, professional | Needs edge function, email service |
| C: Invite Link | Shareable, flexible | Security concerns, complexity |

**Recommendation: Option A for V1, Option B for V2**

V1 Rationale:
- Gets the feature working quickly
- No additional infrastructure needed
- Acceptable UX for small teams (most common case)
- Clear error message guides users

V2 Migration Path:
- Add Supabase Edge Function for email sending
- Create invitation tokens table
- Build accept-invitation flow
- Support non-registered users

---

### Decision 3: Permission Enforcement Strategy

| Layer | Check | Purpose |
|-------|-------|---------|
| **UI** | `isOwner` from context | Hide/disable buttons for members |
| **Service** | None (trust RLS) | Keep service layer simple |
| **Database** | RLS policies | Ultimate authority |

**Pattern:**
```typescript
// UI Layer (src/features/organization/TeamMembersList.tsx)
const { isOwner } = useOrg();

<Button
  onClick={() => setShowAddDialog(true)}
  disabled={!isOwner}
  title={!isOwner ? t('team.ownerOnly') : undefined}
>
  {t('team.addMember')}
</Button>

// Service Layer - Trust RLS, don't duplicate checks
async inviteMember(orgId: string, email: string, role: OrgRole) {
  // RLS will block if user is not owner
  const { data, error } = await supabase
    .from('org_members')
    .insert({ ... });

  if (error) {
    if (error.code === 'PGRST301') {
      throw new Error('Only organization owners can add members');
    }
    throw error;
  }
}
```

---

### Decision 4: Last Owner Protection

**Problem:** If the last owner removes themselves or demotes to member, the org becomes unmanageable.

**Solution:** Check before role change or removal:

```typescript
async updateMemberRole(memberId: string, role: OrgRole): Promise<OrgMember> {
  // If demoting to member, check owner count
  if (role === 'member') {
    const member = await this.getMemberById(memberId);
    if (member.role === 'owner') {
      const ownerCount = await this.getOwnerCount(member.org_id);
      if (ownerCount <= 1) {
        throw new Error('Cannot demote the last owner. Promote another member first.');
      }
    }
  }
  // ... proceed with update
}
```

---

## Testing Strategy

### Manual Test Checklist

#### Service Layer Tests
- [ ] `getMembers()` returns all members with user details
- [ ] `inviteMember()` works for existing user
- [ ] `inviteMember()` fails for non-existent email
- [ ] `inviteMember()` fails for already-member
- [ ] `updateMemberRole()` changes role correctly
- [ ] `removeMember()` deletes membership
- [ ] RLS blocks non-owners from mutations

#### UI Tests
- [ ] Members list loads and displays correctly
- [ ] Add member dialog opens and closes
- [ ] Form validation works (invalid email, empty fields)
- [ ] Success toast shows after adding member
- [ ] Error toast shows for failures
- [ ] Role change dialog works
- [ ] Remove confirmation dialog works
- [ ] Cannot remove self as last owner
- [ ] Members see read-only view (no add/edit/delete)
- [ ] Mobile cards render correctly
- [ ] Desktop table renders correctly

#### Integration Tests
- [ ] Navigation to team page works
- [ ] Back navigation works
- [ ] Refreshing page maintains state
- [ ] Multiple rapid actions don't cause issues

---

## Risks and Mitigation

### Risk 1: Email Lookup Security
**Risk:** RPC to lookup user by email could be abused to enumerate users.

**Mitigation:**
- RPC is `SECURITY DEFINER` but only returns user ID
- Rate limit could be added at API gateway level
- Consider logging lookup attempts

### Risk 2: Concurrent Role Changes
**Risk:** Two owners simultaneously demoting each other = no owners.

**Mitigation:**
- Database-level check via trigger
- Optimistic locking with `updated_at` comparison
- For V1: Accept the edge case (very rare)

### Risk 3: Orphaned Organizations
**Risk:** What happens if all users leave an org?

**Mitigation:**
- Prevent last member from leaving (UI check + RLS)
- For V1: Not a concern if we prevent last owner removal
- For V2: Consider org deletion flow

---

## Time Estimate

| Phase | Description | Estimated Hours |
|-------|-------------|-----------------|
| Phase 1 | Service Layer | 2-3 hours |
| Phase 2 | Base Components | 3-4 hours |
| Phase 3 | Page Components | 3-4 hours |
| Phase 4 | Integration | 2-3 hours |
| Phase 5 | Testing & Polish | 2 hours |
| **Total** | | **12-16 hours** |

### Breakdown by Role
- **Backend (Service + DB):** 3-4 hours
- **Frontend (Components + Pages):** 6-8 hours
- **Integration + Testing:** 3-4 hours

---

## Appendix: Translation Keys

### English (`public/locales/en/team.json`)
```json
{
  "pageTitle": "Team Members",
  "pageDescription": "Manage your organization's team",
  "addMember": "Add Member",
  "addMemberShort": "Add",
  "searchPlaceholder": "Search members...",
  "table": {
    "member": "Member",
    "email": "Email",
    "role": "Role",
    "joined": "Joined",
    "actions": "Actions"
  },
  "roles": {
    "owner": "Owner",
    "member": "Member"
  },
  "status": {
    "active": "Active",
    "pending": "Pending",
    "suspended": "Suspended"
  },
  "you": "(You)",
  "emptyState": {
    "title": "No team members yet",
    "description": "Add team members to collaborate on your properties"
  },
  "addDialog": {
    "title": "Add Team Member",
    "description": "Invite someone to join your organization",
    "emailLabel": "Email Address",
    "emailPlaceholder": "colleague@example.com",
    "roleLabel": "Role",
    "roleHelp": "Owners can manage team and settings. Members have read-only access.",
    "submit": "Add Member",
    "submitting": "Adding..."
  },
  "changeRoleDialog": {
    "title": "Change Role",
    "description": "Change {{name}}'s role in your organization",
    "currentRole": "Current Role",
    "newRole": "New Role",
    "submit": "Save Changes",
    "submitting": "Saving..."
  },
  "removeDialog": {
    "title": "Remove Member",
    "description": "Are you sure you want to remove {{name}} from your organization? They will lose access to all organization data.",
    "confirm": "Remove",
    "cancel": "Cancel"
  },
  "validation": {
    "emailRequired": "Email is required",
    "emailInvalid": "Please enter a valid email",
    "roleRequired": "Role is required"
  },
  "errors": {
    "userNotFound": "User not found. They must register first.",
    "alreadyMember": "This user is already a member.",
    "lastOwner": "Cannot remove the last owner.",
    "cannotDemoteLastOwner": "Cannot demote the last owner. Promote another member first.",
    "addFailed": "Failed to add member",
    "updateFailed": "Failed to update role",
    "removeFailed": "Failed to remove member"
  },
  "success": {
    "memberAdded": "Member added successfully",
    "roleUpdated": "Role updated successfully",
    "memberRemoved": "Member removed successfully"
  },
  "ownerOnly": "Only organization owners can manage team members"
}
```

---

## Summary

This implementation plan provides a complete roadmap for building Organization Management UI:

1. **Service Layer:** 6 new functions in `organization.service.ts` + 1 database RPC
2. **UI Components:** 9 new components following existing patterns
3. **Pages:** 1 new page (`TeamMembersList`) + 2 enhanced cards
4. **Navigation:** 1 new sidebar item + route
5. **i18n:** Full translations for EN and TR

The estimated effort is **12-16 hours**, split across service layer, components, integration, and testing. The plan prioritizes V1 MVP (manual invitation) with a clear path to V2 (email invitations).

**Next Step:** Begin implementation starting with Phase 1 (Service Layer).
