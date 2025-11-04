# 📅 Calendar System - Simple Plan

## 🎯 Goal
Build a simple calendar system with notifications for meeting with tenants. Keep it iPhone-simple - zero friction, no complexity.

---

## ✅ What We're Building

### 1. Calendar View
- **Day View** (default on mobile)
  - Shows meetings for selected day
  - Tap empty slot = add meeting
  - Tap meeting = see/edit/delete
  - Swipe left/right to change days

- **Week View** (tablet+)
  - Compact week overview
  - Tap day to see details

### 2. Add Meeting Form
**Maximum 3-4 fields:**
- Date (picker)
- Time (picker)
- With Who (select tenant/property/owner)
- Notes (optional, one line)

**That's it.** No complex forms.

### 3. Notification System
- Agent chooses: 30, 40, or 60 minutes before
- Popup notification on phone and website
- One-time setup in settings
- Works automatically after setup

---

## 🚫 What We're NOT Building

- ❌ Analytics or reports
- ❌ Travel time calculations
- ❌ Availability checker
- ❌ Calendar export (.ics)
- ❌ Recurring meetings
- ❌ Multi-day events
- ❌ Revenue tracking
- ❌ Complex workflows
- ❌ Any over-engineered features

---

## 📱 Design Principles

### iPhone-First Simplicity
- **Zero learning curve** - Should be obvious what to do
- **One tap to add** - No menus or hidden options
- **See everything at a glance** - Clear visual hierarchy
- **Big buttons** - 44px+ touch targets (mobile)
- **No friction** - Agents shouldn't need to think

### Mobile-First
- 80% of users are on mobile
- Day view is default on mobile
- Swipe gestures for navigation
- Bottom sheet for quick actions
- Large, readable text

---

## 🗄️ Database

### Meetings Table
```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT, -- Auto-generated: "Meeting with [Name]" or "Property: [Address]"
  start_time TIMESTAMP NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES property_owners(id) ON DELETE SET NULL,
  notes TEXT,
  reminder_minutes INTEGER DEFAULT 30, -- 30, 40, or 60
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Preferences (for notification settings)
Add to existing user preferences or create simple settings:
- `meeting_reminder_minutes` (default: 30)

---

## 🔄 User Flows

### Flow 1: Add Meeting from Calendar
1. Open Calendar page
2. Tap empty time slot OR tap [+ Add Meeting] button
3. Pick date (default: today)
4. Pick time
5. Select "With Who" (tenant/property/owner)
6. Optional: Add notes
7. Tap [Save]
8. Done ✅

### Flow 2: Add Meeting from Context
1. From Tenant page → Tap "Schedule Meeting"
2. Form pre-fills: tenant selected
3. Pick date/time
4. Optional: Add notes
5. Tap [Save]
6. Done ✅

### Flow 3: Set Notification Time
1. Go to Settings (once)
2. Select: 30, 40, or 60 minutes
3. Tap [Save]
4. Done ✅ (works automatically forever)

### Flow 4: Get Notification
1. Meeting scheduled for 14:00
2. If reminder set to 30 minutes → notification at 13:30
3. Popup appears on phone/website
4. Shows: Meeting time, who it's with, quick action buttons

---

## 🎨 UI Components Needed

### 1. Calendar Page
- Day view component
- Week view component (optional)
- Meeting card component
- Empty slot (tap to add)

### 2. Meeting Form Dialog
- Date picker
- Time picker
- "With Who" selector (dropdown)
- Notes input (optional)
- Save/Cancel buttons

### 3. Meeting Details View
- Show meeting info
- Edit button
- Delete button
- Quick actions (call, WhatsApp if phone available)

### 4. Notification Settings
- Radio buttons: 30/40/60 minutes
- Save button

---

## 🔗 Integration Points

### Quick Actions (Optional - Makes life easier)
- **From Tenant page**: "Schedule Meeting" button → pre-fills tenant
- **From Property page**: "Schedule Viewing" button → pre-fills property
- **From Reminders page**: "Schedule Meeting" button → pre-fills tenant/property

These are **optional** - if they add friction, skip them.

---

## 📋 Implementation Checklist

### Phase 1: Database
- [ ] Create `meetings` table migration
- [ ] Add RLS policies
- [ ] Add indexes for date queries

### Phase 2: Service Layer
- [ ] Create `meetings.service.ts`
- [ ] CRUD operations (create, read, update, delete)
- [ ] Get meetings by date range
- [ ] Get upcoming meetings (for notifications)

### Phase 3: Calendar UI
- [ ] Calendar page component
- [ ] Day view component
- [ ] Meeting card component
- [ ] Add meeting form dialog
- [ ] Edit/delete functionality

### Phase 4: Notifications
- [ ] Notification settings component
- [ ] Background check for upcoming meetings
- [ ] Browser notification API integration
- [ ] Mobile notification support (PWA)

### Phase 5: Integration
- [ ] Add "Calendar" to sidebar navigation
- [ ] Add route in App.tsx
- [ ] Optional: Quick action buttons from other pages

---

## 🎯 Success Criteria

✅ Agent can add meeting in under 10 seconds
✅ Agent can see today's meetings at a glance
✅ Agent gets notification X minutes before meeting
✅ Zero confusion - obvious what to do
✅ Works perfectly on mobile phone
✅ No complex features that confuse agents

---

## 💡 Key Decisions

1. **Keep it simple** - No over-engineering
2. **Mobile-first** - 80% mobile users
3. **iPhone-simple** - Zero learning curve
4. **No friction** - Minimal taps, clear actions
5. **Context-aware** - Pre-fill when possible, but don't require it

---

**This is the plan. Simple, clear, focused.**


