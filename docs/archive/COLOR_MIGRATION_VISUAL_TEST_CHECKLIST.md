# Color Migration Visual Testing Checklist

**Migration Date:** [Date]  
**Tester:** [Name]  
**Browser:** [Browser/Version]  
**Screen Resolution:** [Resolution]

---

## Pre-Testing Setup

- [ ] Clear browser cache
- [ ] Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- [ ] Check in both light mode (dark mode if applicable)
- [ ] Test on different screen sizes (mobile, tablet, desktop)

---

## 1. Dashboard Page (`/dashboard`)

### Layout & Navigation
- [ ] Sidebar header background is solid blue-600 (no gradient)
- [ ] Sidebar logo icon background is solid orange-500
- [ ] Active navigation item is solid blue-600 (not amber gradient)
- [ ] Navigation hover states work correctly
- [ ] Badge colors in sidebar are solid (blue-600 for inquiries, red-600 for reminders)
- [ ] User avatar background is solid blue-600

### Stat Cards
- [ ] All stat card icon backgrounds are solid colors (no gradients)
  - [ ] Properties card: blue-600
  - [ ] Occupied card: emerald-600
  - [ ] Tenants card: blue-600
  - [ ] Contracts card: orange-500
  - [ ] Empty properties: orange-500
  - [ ] Unassigned tenants: purple-600
- [ ] Stat card text is readable (gray-900, good contrast)
- [ ] Stat card hover effects work correctly

### Properties Summary Section
- [ ] Rental empty badge: amber-600 (solid)
- [ ] Rental occupied badge: emerald-600 (solid)
- [ ] Rental inactive badge: gray-600 (solid)
- [ ] Sale available badge: emerald-600 (solid)
- [ ] Sale under offer badge: amber-600 (solid)
- [ ] Sale sold badge: emerald-600 (solid, not gradient)
- [ ] Background cards are solid colors (amber-50, emerald-50, gray-50)

### Reminders Card
- [ ] Reminder card background is solid amber-50 (no gradient)
- [ ] Reminder icon background is solid orange-500
- [ ] Urgency badges are solid colors:
  - [ ] Urgent: red-600
  - [ ] Soon: orange-500
  - [ ] Default: blue-600

### Action Items Card
- [ ] Card background is solid blue-50
- [ ] Icon background is solid blue-600
- [ ] Text is readable with good contrast

---

## 2. Properties List Page (`/properties`)

### Page Header
- [ ] Property type tabs are visible and functional
- [ ] Active tab (rental) is solid blue-600
- [ ] Active tab (sale) is solid orange-500 (not amber gradient)
- [ ] Inactive tabs have proper hover states

### Property Cards/Table
- [ ] Property status badges are solid colors:
  - [ ] Empty: amber-600
  - [ ] Occupied: emerald-600
  - [ ] Available: emerald-600
  - [ ] Under Offer: orange-500
  - [ ] Sold: purple-600
  - [ ] Inactive: gray-600
- [ ] Property card backgrounds are solid (no gradients)
- [ ] Icon backgrounds in cards are solid colors
- [ ] Contract expiry badges are solid red-600 (not gradient)
- [ ] "Mark as Sold" button is solid amber-50 background

### Property Type Selector
- [ ] Rental button when active: solid blue-600
- [ ] Sale button when active: solid orange-500 (not amber gradient)

### Action Buttons
- [ ] "Add Property" button is solid blue-600
- [ ] Edit/Delete buttons have proper hover states
- [ ] All buttons have readable text contrast

---

## 3. Property Dialog (Create/Edit)

### Form Elements
- [ ] Property type selector buttons are solid colors
- [ ] Form inputs have proper borders and focus states
- [ ] Form labels are readable (gray-900)

### Submit Button
- [ ] Submit button is solid blue-600 (not gradient)
- [ ] Submit button hover state is blue-700
- [ ] Button text is white and readable
- [ ] Button has proper shadow

### Status Indicators
- [ ] Any status indicators are solid colors
- [ ] No gradient backgrounds visible

---

## 4. Tenants List Page (`/tenants`)

### Page Elements
- [ ] Tenant cards/table rows are properly styled
- [ ] Assignment badges are solid colors:
  - [ ] Assigned: emerald-600
  - [ ] Unassigned: gray-600
- [ ] Property links are blue-600
- [ ] Contact icons are properly colored

### Action Buttons
- [ ] "Add Tenant" button is solid blue-600
- [ ] Edit/Delete buttons have proper hover states
- [ ] Schedule meeting button is properly styled

---

## 5. Tenant Dialog (Create/Edit)

### Form Elements
- [ ] Form inputs have proper styling
- [ ] Labels are readable

### Submit Button
- [ ] Submit button is solid blue-600 (not gradient)
- [ ] Submit button hover state works correctly
- [ ] Button text is white and readable

### Enhanced Tenant Dialog
- [ ] Final step submit button is solid emerald-600
- [ ] Navigation buttons are properly styled
- [ ] Step indicators are readable

---

## 6. Contracts List Page (`/contracts`)

### Status Badges
- [ ] Active badge: emerald-600 (solid)
- [ ] Inactive badge: gray-600 (solid)
- [ ] Archived badge: gray-600 (solid)
- [ ] All badges use `getStatusBadgeClasses()` helper

### Contract Cards
- [ ] Contract cards have solid backgrounds
- [ ] Expiring soon indicators are properly colored
- [ ] Reminder icons are amber-600

### Action Buttons
- [ ] "Add Contract" button is solid blue-600
- [ ] Edit/Delete buttons have proper hover states

---

## 7. Finance Dashboard (`/finance`)

### Financial Summary Cards
- [ ] Total Income card icon: emerald-600 (solid)
- [ ] Total Expenses card icon: red-600 (solid)
- [ ] Net Profit card icon: blue-600 or orange-500 (solid)
- [ ] Pending card icon: gray-600 (solid)
- [ ] All card backgrounds are solid (no gradients)
- [ ] Trend indicators are properly colored:
  - [ ] Positive trends: emerald-600
  - [ ] Negative trends: red-600

### Budget Comparison Chart
- [ ] Chart bars are solid colors:
  - [ ] Under budget: emerald-600
  - [ ] On track: blue-600
  - [ ] Over budget: red-600
- [ ] Budgeted bar is gray-500
- [ ] Status badges are solid colors:
  - [ ] Under budget: emerald-50 background
  - [ ] On track: blue-50 background
  - [ ] Over budget: red-50 background

### Financial Trends Chart
- [ ] Revenue area: emerald-600 (solid fill)
- [ ] Expenses area: red-600 (solid fill)
- [ ] Profit line: blue-600 (solid stroke)
- [ ] Chart gradients are minimal and approved
- [ ] Profit margin text: emerald-600 (positive) or red-600 (negative)

### Top Categories Charts
- [ ] Income chart icon: emerald-600 (solid)
- [ ] Expense chart icon: red-600 (solid)
- [ ] Pie chart colors use new palette:
  - [ ] Primary: emerald-600
  - [ ] Secondary: blue-600
  - [ ] Tertiary: orange-500
- [ ] Chart legend colors match chart segments

### Financial Ratios Cards
- [ ] All KPI icon backgrounds are solid colors (no gradients)
- [ ] Profit margin icon: emerald-600, blue-600, or orange-500
- [ ] Expense ratio icon: emerald-600, orange-500, or red-600
- [ ] Budget efficiency icon: emerald-600, blue-600, or red-600
- [ ] Cash flow icon: emerald-600 or red-600
- [ ] Trend arrows are properly colored

### Upcoming Bills
- [ ] Bill icons are solid colors
- [ ] Status badges are solid
- [ ] Action buttons are properly styled

---

## 8. All Finance Components

### General Checks
- [ ] No gradient backgrounds visible (except approved minimal gradients)
- [ ] All icons use solid color backgrounds
- [ ] Chart colors match new palette:
  - [ ] Primary: blue-600 (#2563EB)
  - [ ] Secondary: emerald-600 (#059669)
  - [ ] Accent: orange-500 (#F97316)
- [ ] Text contrast is readable on all backgrounds
- [ ] Hover states work correctly on interactive elements

### Component-Specific
- [ ] **FinancialSummaryCards**: All icon backgrounds solid
- [ ] **BudgetComparison**: Chart bars solid colors
- [ ] **FinancialTrends**: Chart areas use new palette
- [ ] **TopCategories**: Pie charts use new color palette
- [ ] **FinancialRatios**: All KPI icons solid colors
- [ ] **UpcomingBills**: Icons and badges solid colors
- [ ] **TransactionsTable**: Status indicators solid colors

---

## 9. Reminders Page (`/reminders`)

### Reminder Cards
- [ ] Reminder cards have solid backgrounds
- [ ] Urgency badges are solid colors:
  - [ ] Overdue: red-600
  - [ ] Upcoming: blue-600
  - [ ] Scheduled: blue-600
  - [ ] Expired: gray-600
- [ ] Property links are blue-600
- [ ] Owner contact links are blue-600

### Action Buttons
- [ ] "Contact Owner" button is solid emerald-600 (not gradient)
- [ ] Button hover state is emerald-700
- [ ] Button text is white and readable
- [ ] Other action buttons are properly styled

### Filter/Sort Controls
- [ ] Filter buttons are properly styled
- [ ] Active filters are blue-600
- [ ] Hover states work correctly

---

## 10. Sidebar Navigation

### Header Section
- [ ] Sidebar header background is solid blue-600 (no gradient)
- [ ] Logo icon background is solid orange-500 (no gradient)
- [ ] App name text is white and readable
- [ ] Close button (mobile) is properly styled

### Navigation Items
- [ ] Active nav item is solid blue-600 (not amber gradient)
- [ ] Active nav item text is white
- [ ] Inactive nav items are gray-700
- [ ] Hover state on inactive items is gray-50 background
- [ ] Navigation icons are properly colored
- [ ] Badge backgrounds are solid:
  - [ ] Inquiries badge (inactive): blue-600
  - [ ] Reminders badge (inactive): red-600
  - [ ] Badges on active items: white background with colored text

### Footer Section
- [ ] Footer background is solid gray-50 (no gradient)
- [ ] User avatar background is solid blue-600 (no gradient)
- [ ] User email text is readable
- [ ] Sign out button is properly styled with hover state

---

## 11. Other Pages/Components

### Inquiries Page
- [ ] Status badges are solid colors:
  - [ ] Active: emerald-600
  - [ ] Matched: blue-600
  - [ ] Contacted: amber-600
  - [ ] Closed: gray-600
- [ ] Inquiry type selector buttons are solid colors
- [ ] Action buttons are properly styled

### Owners Page
- [ ] Property count badges are solid blue-600 (not gradient)
- [ ] Owner cards are properly styled
- [ ] Action buttons are properly styled

### Calendar Page
- [ ] Calendar events are properly colored
- [ ] Event badges are solid colors
- [ ] Navigation buttons are properly styled

### Profile Page
- [ ] Profile sections are properly styled
- [ ] Action buttons are solid colors
- [ ] Form elements are properly styled

---

## 12. Global Components

### Buttons
- [ ] Primary buttons: solid blue-600 background
- [ ] Primary button hover: blue-700
- [ ] Secondary buttons: solid emerald-600 background
- [ ] Secondary button hover: emerald-700
- [ ] Accent buttons: solid orange-500 background
- [ ] All button text is white and readable
- [ ] No gradient backgrounds on buttons

### Badges
- [ ] All status badges use solid colors
- [ ] Badge text is white and readable
- [ ] No gradient backgrounds on badges

### Cards
- [ ] Card backgrounds are solid (white or gray-50)
- [ ] Card borders are gray-200
- [ ] Card shadows are properly applied
- [ ] No gradient backgrounds on cards

### Forms
- [ ] Input borders are gray-200
- [ ] Input focus states are blue-600
- [ ] Labels are readable (gray-900)
- [ ] Error states are red-600
- [ ] Success states are emerald-600

### Modals/Dialogs
- [ ] Dialog backgrounds are solid
- [ ] Dialog headers are properly styled
- [ ] Close buttons are properly styled
- [ ] Action buttons are solid colors

---

## 13. Accessibility Checks

### Color Contrast
- [ ] White text on blue-600: WCAG AA compliant
- [ ] White text on emerald-600: WCAG AA compliant
- [ ] White text on orange-500: WCAG AA compliant
- [ ] Gray-900 text on white: WCAG AA compliant
- [ ] Gray-600 text on white: WCAG AA compliant
- [ ] All interactive elements have sufficient contrast

### Focus States
- [ ] All buttons have visible focus indicators
- [ ] Focus indicators are blue-600
- [ ] Keyboard navigation works correctly
- [ ] Focus states are clearly visible

### Visual Indicators
- [ ] Status colors are distinguishable
- [ ] Error states are clearly red
- [ ] Success states are clearly emerald
- [ ] Warning states are clearly amber/orange

---

## 14. Responsive Design

### Mobile (< 768px)
- [ ] All colors render correctly on mobile
- [ ] Touch targets are properly sized
- [ ] Text is readable on small screens
- [ ] Sidebar colors work in mobile menu

### Tablet (768px - 1024px)
- [ ] Colors render correctly
- [ ] Layout adapts properly
- [ ] Interactive elements are accessible

### Desktop (> 1024px)
- [ ] All colors render correctly
- [ ] Hover states work correctly
- [ ] Layout is properly spaced

---

## 15. Browser Compatibility

- [ ] Chrome/Edge: All colors render correctly
- [ ] Firefox: All colors render correctly
- [ ] Safari: All colors render correctly
- [ ] Mobile Safari: All colors render correctly
- [ ] Mobile Chrome: All colors render correctly

---

## 16. Performance Checks

- [ ] No visual glitches during page load
- [ ] Color transitions are smooth
- [ ] Hover effects are responsive
- [ ] No layout shifts when colors load

---

## Issues Found

### Critical Issues
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

### Minor Issues
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

### Suggestions
- [ ] Suggestion 1: [Description]
- [ ] Suggestion 2: [Description]

---

## Testing Notes

**Date:** [Date]  
**Tester:** [Name]  
**Browser:** [Browser/Version]  
**Screen Resolution:** [Resolution]  
**Notes:** [Any additional notes]

---

## Sign-off

- [ ] All critical checks passed
- [ ] All minor issues documented
- [ ] Ready for production deployment

**Approved by:** [Name]  
**Date:** [Date]

