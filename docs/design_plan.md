# Design Plan - Emlak CRM UI Transformations

> This file contains all UI change prompts that will be given to Bolt.new. Each change includes detailed, step-by-step instructions.

## Progress Tracking

| Change | Status | Description |
|--------|--------|-------------|
| Change #1 | ✅ Completed | Button Component - Neon Style Update |
| Change #2 | ✅ Completed | PageContainer Component - Responsive Layout Solution |
| Change #3 | ✅ Completed | Outline Buttons - Visual Enhancement & Icon Integration |
| Change #4 | ✅ Completed | Dashboard StatCard Component - Reusable Metric Cards |
| Change #5 | ✅ Completed | Reminders Tabs - Neon Effects & Consistent Styling |
| Change #6 | ✅ Completed | Colors Standardization - Unified Color System |

**Legend:**
- ✅ Completed
- ⏳ Not Started
- 🔄 In Progress
- ⚠️ Blocked/Issues

---

## Change #1: Button Component - Neon Style Update

- [x] Completed

### Purpose
Add modern neon effects to the existing button component and improve visual quality. All existing variants and usages will be preserved.

### Method
**By editing existing code** - Instead of installing a new component via npm, we will update the existing `src/components/ui/button.tsx` file to integrate neon effects.

### Why This Method?
- We can preserve all existing variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`)
- All existing button usages will continue to work (no breaking changes)
- We can make project-specific customizations
- We can stay consistent with `design_rulebook.md`

### Prompt for Bolt.new

```
Update the Button Component with neon style effects. All existing features must be preserved.

IMPORTANT: This change integrates with Change #6 (Colors Standardization). Use COLORS system for all color values.

File: src/components/ui/button.tsx

Tasks:
1. Import COLORS at the top of the file:
   ```typescript
   import { COLORS } from '@/config/colors';
   ```

2. Add optional `neon?: boolean` prop to ButtonProps interface (default: false)

3. Add neon effect elements inside the Button component:
   - Top span: Absolute positioned, visible on hover, horizontal gradient line (top border)
   - Bottom span: Absolute positioned, opacity changes on hover, horizontal gradient line (bottom border)
   - Both spans should only be visible when `neon={true}`

4. Style details for neon effect spans (USE COLORS SYSTEM):
   - Top line: Use template literal to construct gradient with COLORS.primary.DEFAULT:
     ```tsx
     className={cn('absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 inset-y-0 bg-gradient-to-r w-3/4 mx-auto from-transparent', `via-${COLORS.primary.DEFAULT}`, 'to-transparent')}
     ```
     Or use string interpolation:
     ```tsx
     className={`absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 inset-y-0 bg-gradient-to-r w-3/4 mx-auto from-transparent via-${COLORS.primary.DEFAULT} to-transparent`}
     ```
     Note: COLORS.primary.DEFAULT = 'blue-600', so it will result in `via-blue-600`
   
   - Bottom line: Same approach with COLORS.primary.DEFAULT:
     ```tsx
     className={cn('absolute group-hover:opacity-30 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent', `via-${COLORS.primary.DEFAULT}`, 'to-transparent')}
     ```
   
   - Both should be visible with `neon && "block"`, otherwise `hidden`

5. Add these to base button className:
   - `relative group` (required for neon effects)
   - All existing classes must be preserved

6. NONE of the existing variants should be changed:
   - default, destructive, outline, secondary, ghost, link - all should remain the same
   - Only neon effects will be added

7. Sizes should not be changed:
   - default, sm, lg, icon - all should remain the same

8. Keep border-radius as `rounded-md` (do not change to rounded-full)

9. `asChild` prop should continue to work

10. All existing hover states must be preserved

Important Notes:
- Only visual effects will be added, functionality will not change
- All existing button usages should continue to work
- Neon effect should be optional (controlled via neon prop)
- Accessibility features must be preserved (focus states, disabled states, etc.)
- MUST use COLORS system for neon effect colors (via-${COLORS.primary.DEFAULT})
- This ensures consistency with Change #6 (Colors Standardization)
- COLORS.primary.DEFAULT will be 'blue-600' which matches the original design
```

### Expected Result
- Existing buttons continue to work the same way
- Neon effects are activated with `neon={true}` prop
- All variants and sizes are preserved
- Gains a modern, interactive appearance

### Testing Checklist
1. Verify all variants work (default, destructive, outline, secondary, ghost, link)
2. Verify all sizes work (default, sm, lg, icon)
3. Verify neon effects appear with `neon={true}`
4. Verify it works like before with `neon={false}` or when prop is not provided
5. Verify hover states work
6. Verify disabled states work
7. Verify asChild prop works

---

## Change #2: PageContainer Component - Responsive Layout Solution ✅

- [x] Completed

### Purpose
Create a reusable PageContainer component to manage page width constraints consistently across all pages. This will fix the issue where pages don't utilize full screen width on desktop while maintaining mobile-first responsive design.

### Method
**Create new component and refactor existing pages** - Create `PageContainer.tsx` component and update all page files to use it instead of the repeated `max-w-7xl mx-auto` pattern.

### Why This Method?
- Single source of truth for page width management
- Clean code: No repeated patterns across pages
- Responsive: Full width on mobile, smart max-width on desktop
- Easy updates: Change once, all pages update
- Fixes CSS conflicts from `App.css` and `index.css`

### Prompt for Bolt.new

```
Create a PageContainer component and fix page width issues across the application.

PART 1: Create PageContainer Component

1. Create new file: src/components/layout/PageContainer.tsx

2. Component structure:
   - Accepts children as React.ReactNode
   - Optional className prop for additional styles
   - Manages responsive width constraints

3. Component implementation:
   - Mobile (< 1024px): Full width, no max-width constraint
   - Desktop (≥ 1024px): max-w-[95%] for comfortable reading
   - Large Desktop (≥ 1280px): max-w-[1400px] for optimal layout
   - Extra Large (≥ 1920px): max-w-[1600px] for very wide screens
   - Always centered with mx-auto
   - Vertical spacing: space-y-6
   - Horizontal padding: px-4 lg:px-6 (to match MainLayout padding)

4. Export the component properly

PART 2: Fix CSS Issues

1. Fix src/App.css:
   - Remove or comment out the #root max-width restriction (currently max-width: 1280px)
   - Remove padding and margin constraints if they exist
   - Keep the file clean

2. Fix src/index.css:
   - Remove or modify body styles that center content:
     - Remove: display: flex; place-items: center;
   - Body should use normal flow layout
   - Keep @layer base styles intact

PART 3: Update All Pages

Replace the pattern `<div className="space-y-6 max-w-7xl mx-auto">` with `<PageContainer>` in:

1. src/features/dashboard/Dashboard.tsx
2. src/features/properties/Properties.tsx
3. src/features/owners/Owners.tsx
4. src/features/tenants/Tenants.tsx
5. src/features/contracts/Contracts.tsx
6. src/features/reminders/Reminders.tsx

For each file:
- Import PageContainer: `import { PageContainer } from '../../components/layout/PageContainer';`
- Replace: `<div className="space-y-6 max-w-7xl mx-auto">` → `<PageContainer>`
- Replace closing tag: `</div>` → `</PageContainer>`
- Keep all content inside PageContainer unchanged

PART 4: Update MainLayout

1. Review src/components/layout/MainLayout.tsx
2. Ensure main tag padding doesn't conflict: `p-4 lg:p-8` is fine
3. PageContainer will handle its own horizontal padding, so there might be double padding - adjust MainLayout main padding to `py-4 lg:py-8 px-0` or let PageContainer handle all padding

Important Notes:
- Mobile first approach: Full width on mobile, constraints only on desktop
- Sidebar is 256px (lg:pl-64), content area should use remaining space efficiently
- All existing functionality must be preserved
- Test on different screen sizes after changes
```

### Expected Result
- Pages use full available width on desktop (with reasonable max-width)
- Mobile layout remains full width and responsive
- Consistent width management across all pages
- No more centered narrow content on large screens
- Clean, maintainable code structure

### Testing Checklist
1. Verify Dashboard page uses full width on desktop
2. Verify all pages (Properties, Owners, Tenants, Contracts, Reminders) use new PageContainer
3. Test on mobile (< 1024px) - should be full width
4. Test on desktop (≥ 1024px) - should use max-w-[95%]
5. Test on large desktop (≥ 1280px) - should use max-w-[1400px]
6. Test on extra large (≥ 1920px) - should use max-w-[1600px]
7. Verify sidebar doesn't overlap content
8. Verify padding and spacing look correct
9. Verify all page content is accessible and readable
10. Check that no functionality is broken

---

## Change #3: Outline Buttons - Visual Enhancement & Icon Integration

- [x] Completed

### Purpose
Fix invisible outline buttons across the application by improving their visual style, adding neon effects (consistent with Change #1), and ensuring all icon buttons have proper icons. This maintains design consistency while making buttons clearly visible.

### Method
**Update button component and enhance existing usages** - Improve outline variant styling, add neon effects to outline buttons, and add/improve icons where needed without changing button sizes.

### Why This Method?
- Fixes visibility issues with outline buttons on white backgrounds
- Maintains design consistency with Change #1 (neon effects)
- Improves user experience with clear, visible buttons
- Adds icons where missing for better UX
- No breaking changes - sizes remain the same

### Current Problem
- Outline buttons have `bg-background` (white) with very light `border-input` (214 32% 91% - barely visible)
- On white backgrounds, these buttons are invisible
- Icon buttons in Navbar and action rows are hard to see
- ~19 outline buttons across the application

### Prompt for Bolt.new

```
Fix outline buttons visibility and add neon effects consistent with Change #1.

IMPORTANT: This change integrates with Change #6 (Colors Standardization). Use COLORS system for all color values.

PART 1: Import COLORS System

1. At the top of src/components/ui/button.tsx, ensure COLORS is imported:
   ```typescript
   import { COLORS } from '@/config/colors';
   ```
   (This should already be done in Change #1, but verify)

PART 2: Update Outline Variant Style (USE COLORS SYSTEM)

2. In src/components/ui/button.tsx, update the outline variant using COLORS:
   - Current: `'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'`
   - New: Use COLORS system with template literals:
     ```tsx
     outline: cn(
       'border-2 shadow-sm transition-all',
       COLORS.border.DEFAULT_class,  // border-gray-200
       COLORS.card.bg,                // bg-white
       `hover:${COLORS.primary.bgLight}`,  // hover:bg-blue-50 or hover:bg-gray-50
       'hover:text-foreground',
       `hover:${COLORS.border.dark}`  // hover:border-gray-300 or hover:border-gray-400
     )
     ```
   
   - Or if COLORS doesn't have hover:bg-gray-50, use:
     ```tsx
     outline: cn('border-2 shadow-sm transition-all', COLORS.border.DEFAULT_class, COLORS.card.bg, 'hover:bg-gray-50 hover:text-foreground hover:border-gray-400')
     ```
   
   - Make border more visible (border-2 instead of border, use COLORS.border)
   - Keep white background using COLORS.card.bg
   - Add smooth transitions

PART 3: Add Neon Effects to Outline Buttons (USE COLORS SYSTEM)

3. Modify Button component to support neon effects for outline variant:
   - When variant="outline", automatically enable subtle neon effects
   - Add neon span elements (similar to Change #1 but more subtle for outline)
   - Top line: Same as Change #1 but with lower opacity: `opacity-0 group-hover:opacity-60`
     - Use COLORS.primary.DEFAULT for gradient: `via-${COLORS.primary.DEFAULT}`
   - Bottom line: Same as Change #1
     - Use COLORS.primary.DEFAULT for gradient: `via-${COLORS.primary.DEFAULT}`
   - Neon effects use COLORS.primary color (consistent with primary color system)

4. Update base button className to include `relative group` (should already be done in Change #1, but verify)

PART 3: Add/Improve Icons

4. Navbar - Menu Button (src/components/layout/Navbar.tsx):
   - Already has Menu icon - keep it
   - Ensure icon is visible with new outline style
   - Icon should be: `<Menu className="h-5 w-5" />`

5. Navbar - Bell Button (src/components/layout/Navbar.tsx):
   - Already has Bell icon - keep it
   - Ensure icon is visible with new outline style
   - Icon should be: `<Bell className="h-5 w-5" />`

6. Dashboard - View All Button (src/features/dashboard/Dashboard.tsx, line 138):
   - Already has ArrowRight icon - keep it
   - Ensure spacing is correct: `<ArrowRight className="h-4 w-4 ml-1" />`

7. Properties Page - Action Buttons (src/features/properties/Properties.tsx):
   - Line 290-297: View button - ensure Eye icon is present and visible
   - Line 306-313: Edit button - ensure Pencil icon is present and visible
   - Line 322-329: Delete button - ensure Trash2 icon is present and visible
   - All should have proper hover states with color hints

8. Owners Page - Action Buttons (src/features/owners/Owners.tsx):
   - Line 215-222: Edit button - ensure Pencil icon is visible
   - Line 223-230: Delete button - ensure Trash2 icon is visible

9. Tenants Page - Action Buttons (src/features/tenants/Tenants.tsx):
   - Line 280-287: Edit button - ensure Pencil icon is visible
   - Line 288-295: Delete button - ensure Trash2 icon is visible

10. Contracts Page - Action Buttons (src/features/contracts/Contracts.tsx):
   - Line 345-352: Edit button - ensure Pencil icon is visible
   - Line 353-360: Delete button - ensure Trash2 icon is visible

11. For all icon buttons with variant="outline" (USE COLORS SYSTEM):
   - Ensure icons are properly sized (h-4 w-4 for small buttons, h-5 w-5 for normal)
   - Add hover color hints using COLORS system:
     * Blue for edit/view: Use `${COLORS.primary.bgLight} ${COLORS.primary.text} ${COLORS.primary.border}` (equivalent to hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300)
     * Red for delete: Use `${COLORS.danger.bgLight} ${COLORS.danger.text} ${COLORS.danger.border}` (equivalent to hover:bg-red-50 hover:text-red-600 hover:border-red-300)
     * Orange for alerts: Use `${COLORS.warning.bgLight} ${COLORS.warning.text} ${COLORS.warning.borderHover}` (equivalent to hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300)
   - Maintain consistent color usage with COLORS system

PART 4: Ensure Consistency

12. Check all outline buttons have:
   - Visible borders using COLORS.border (border-2 with COLORS.border.DEFAULT_class or border-gray-300)
   - Proper hover states using COLORS system
   - Icons where appropriate
   - Neon effects on hover using COLORS.primary (subtle, consistent with Change #1)

13. Verify button sizes remain unchanged:
   - icon size: h-9 w-9 (should not change)
   - sm size: h-8 (should not change)
   - default size: h-9 (should not change)

Important Notes:
- Do NOT change button dimensions/sizes
- Keep all existing functionality
- Neon effects should be subtle for outline variant (not as prominent as primary buttons)
- Icons should be properly visible and sized
- MUST use COLORS system for all color values:
  * Border: COLORS.border.DEFAULT_class (border-gray-200)
  * Hover backgrounds: COLORS.primary.bgLight (bg-blue-50), COLORS.danger.bgLight (bg-red-50), etc.
  * Hover text: COLORS.primary.text (text-blue-600), COLORS.danger.text (text-red-600), etc.
  * Hover borders: COLORS.primary.border (border-blue-300), COLORS.danger.border (border-red-300), etc.
  * Neon effects: COLORS.primary.DEFAULT (blue-600)
- This ensures consistency with Change #6 (Colors Standardization)
- All outline buttons should now be clearly visible on white backgrounds
- When Change #6 is applied, all colors will automatically use the unified COLORS system
```

### Expected Result
- All outline buttons are clearly visible on white backgrounds
- Outline buttons have subtle neon effects on hover (consistent with Change #1)
- All icon buttons have proper, visible icons
- Button sizes remain exactly the same
- Improved user experience with clear visual feedback
- Consistent design language across all buttons

### Testing Checklist
1. Verify all outline buttons are visible on white backgrounds
2. Verify Navbar buttons (Menu, Bell) are clearly visible
3. Verify Dashboard "View All" button is visible
4. Verify all action buttons in tables (edit/delete) are visible
5. Verify hover states show neon effects on outline buttons
6. Verify all icons are present and properly sized
7. Verify button sizes haven't changed (icon, sm, default)
8. Verify hover color hints work (blue for edit, red for delete)
9. Test on different screen sizes
10. Verify no functionality is broken

---

## Change #4: Dashboard StatCard Component - Reusable Metric Cards ✅

- [x] Completed

### Purpose
Create a reusable StatCard component to eliminate code duplication and fix icon-title overlap issues in dashboard stat cards. This will improve code maintainability and ensure consistent layout across all metric cards.

### Method
**Create new reusable component** - Create `StatCard.tsx` component with proper layout (icon on left, title next to it) to prevent overlap issues, then refactor all 4 dashboard cards to use this component.

### Why This Method?
- Fixes icon-title overlap problem (especially "Active Contracts" card)
- Eliminates code duplication (DRY principle)
- Consistent design across all stat cards
- Easy to maintain and update
- Reusable for future metrics

### Current Problem
- 4 stat cards have identical structure but duplicated code
- Icon positioned on right, title on left (`justify-between`)
- Long titles like "Active Contracts" overlap with icon
- Code duplication makes maintenance difficult

### Prompt for Bolt.new

```
Create a reusable StatCard component and refactor dashboard stat cards to use it.

PART 1: Create StatCard Component

1. Create new file: src/components/dashboard/StatCard.tsx

2. Component structure:
   - Props:
     * title: string (required)
     * value: string | number (required)
     * description: string (required)
     * icon: React.ReactNode (required - Lucide icon component)
     * iconColor: 'purple' | 'green' | 'blue' | 'orange' (required - gradient color)
     * loading?: boolean (optional - shows '-' when loading)
     * className?: string (optional - additional classes)

3. Component layout:
   - Use Card, CardHeader, CardContent from ui/card
   - Card styling: `shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow`
   - CardHeader: Icon on LEFT, title next to it (flex-row with gap, NO justify-between)
   - Layout structure:
     ```
     [Icon Container] Title
     Value
     Description
     ```

4. Icon container:
   - Position: Left side of header (NOT right)
   - Styling: Based on iconColor prop:
     * purple: `bg-gradient-to-br from-purple-500 to-purple-600`
     * green: `bg-gradient-to-br from-green-500 to-green-600`
     * blue: `bg-gradient-to-br from-blue-500 to-blue-600`
     * orange: `bg-gradient-to-br from-orange-500 to-orange-600`
   - Padding: `p-2`
   - Border radius: `rounded-lg`
   - Icon inside: White color, size `h-4 w-4`

5. Title styling:
   - Next to icon with `gap-2` or `gap-3`
   - Text: `text-sm font-medium`
   - Should NOT overlap with icon

6. Value display:
   - In CardContent
   - Large number: `text-2xl font-bold`
   - Show '-' when loading={true}, otherwise show value

7. Description:
   - Below value
   - Text: `text-xs text-gray-600 mt-1`

8. Export component properly

PART 2: Update Dashboard to Use StatCard

1. In src/features/dashboard/Dashboard.tsx:
   - Import StatCard: `import { StatCard } from '../../components/dashboard/StatCard';`
   - Remove individual Card imports if only used for stats (keep if used elsewhere)
   - Replace all 4 stat card blocks with StatCard components

2. Replace "Total Properties" card (lines 68-81):
   ```tsx
   <StatCard
     title="Total Properties"
     value={loading ? '-' : stats.totalProperties}
     description={stats.totalProperties === 0 ? 'No properties yet' : 'Total properties'}
     icon={<Building2 className="h-4 w-4 text-white" />}
     iconColor="purple"
     loading={loading}
   />
   ```

3. Replace "Occupied" card (lines 83-94):
   ```tsx
   <StatCard
     title="Occupied"
     value={loading ? '-' : stats.occupied}
     description="Currently rented"
     icon={<Home className="h-4 w-4 text-white" />}
     iconColor="green"
     loading={loading}
   />
   ```

4. Replace "Total Tenants" card (lines 96-107):
   ```tsx
   <StatCard
     title="Total Tenants"
     value={loading ? '-' : stats.totalTenants}
     description="Total tenants"
     icon={<Users className="h-4 w-4 text-white" />}
     iconColor="blue"
     loading={loading}
   />
   ```

5. Replace "Active Contracts" card (lines 109-120):
   ```tsx
   <StatCard
     title="Active Contracts"
     value={loading ? '-' : stats.activeContracts}
     description="Current leases"
     icon={<FileText className="h-4 w-4 text-white" />}
     iconColor="orange"
     loading={loading}
   />
   ```

PART 3: Ensure Proper Layout

6. Verify CardHeader layout:
   - Should use: `flex flex-row items-center gap-3` (NOT justify-between)
   - Icon container should be first child
   - Title should be second child
   - This prevents overlap

7. Verify spacing:
   - Header padding: `p-6 pb-2` (consistent with current)
   - Content padding: `p-6 pt-0` (consistent with current)
   - Gap between icon and title: `gap-3` (enough space)

8. Verify responsive behavior:
   - Cards should still use: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
   - StatCard should work in all grid sizes

Important Notes:
- Icon MUST be on left, title on right (solves overlap issue)
- All existing styling must be preserved
- Component should be fully typed with TypeScript
- Maintain all existing functionality
- Loading state should work correctly
- Icon gradient colors must match exactly
```

### Expected Result
- Single reusable StatCard component created
- All 4 dashboard cards use StatCard
- Icon positioned on left, preventing overlap with titles
- Clean, maintainable code with no duplication
- Consistent design across all metric cards
- Easy to add more stat cards in the future

### Testing Checklist
1. Verify StatCard component renders correctly
2. Verify all 4 cards display with correct data
3. Verify icon is on left, title on right (no overlap)
4. Verify "Active Contracts" card no longer has overlap issue
5. Verify icon gradients match (purple, green, blue, orange)
6. Verify loading state shows '-' correctly
7. Verify hover shadow effect works
8. Verify responsive grid layout works (1, 2, 4 columns)
9. Verify all existing functionality preserved
10. Verify TypeScript types are correct

---

## Change #5: Reminders Tabs - Neon Effects & Consistent Styling

- [x] Completed

### Purpose
Apply neon effects (consistent with Change #1) to Reminders page tab buttons and fix inconsistent badge colors. Maintain tab functionality while improving visual consistency and modern appearance.

### Method
**Update Tabs component and Reminders page** - Enhance TabsTrigger component with neon effects for active state, fix badge color inconsistencies, and ensure tab functionality remains intact.

### Why This Method?
- Maintains design consistency with Change #1 (neon effects)
- Fixes inconsistent badge colors (example: red, blue, slate, gray)
- Improves visual appeal of tab navigation
- Preserves all tab functionality
- Creates cohesive design language

### Current Problem
- TabsTrigger active state is plain white background, not visually engaging
- Badge colors are inconsistent: red-600, blue-600, slate-600, gray-600
- No modern effects on tabs (no neon effects)
- Active tab doesn't stand out enough

### Prompt for Bolt.new

```
Enhance Reminders page tabs with neon effects and fix badge color inconsistencies.

PART 1: Update Tabs Component for Neon Effects

1. In src/components/ui/tabs.tsx, update TabsTrigger component:

2. Add neon effect spans to TabsTrigger (similar to Change #1):
   - Add `relative group` classes to base className
   - Add two span elements for neon lines (top and bottom)
   - Neon effects should only show when tab is ACTIVE (data-[state=active])

3. Neon effect implementation:
   - Top line span: `absolute h-px opacity-0 group-data-[state=active]:opacity-100 transition-all duration-500 ease-in-out inset-x-0 inset-y-0 bg-gradient-to-r w-3/4 mx-auto from-transparent via-blue-600 to-transparent`
   - Bottom line span: `absolute group-data-[state=active]:opacity-30 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent via-blue-600 to-transparent`
   - Both spans should only be visible when `data-[state=active]` is true

4. Update TabsTrigger base className:
   - Current: `'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow'`
   - New: Add `relative group` at the beginning
   - Keep all existing classes
   - Add neon span elements as children (before the actual content)

5. Ensure active state styling is enhanced:
   - Keep: `data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow`
   - Neon effects should complement, not replace, active styling

PART 2: Fix Badge Color Inconsistencies

6. In src/features/reminders/Reminders.tsx, update badge colors to be consistent:

7. Standardize badge colors:
   - Overdue badge (line 232): Keep `bg-red-600` (appropriate for overdue/urgent)
   - Upcoming badge (line 238): Keep `bg-blue-600` (consistent with blue theme)
   - Scheduled badge (line 244): Change from `bg-slate-600` to `bg-blue-600` (consistent with blue theme)
   - Expired badge (line 250): Change from `bg-gray-600` to `bg-slate-600` or `bg-gray-600` (make decision: slate-600 is more visible)

8. Recommendation for badge colors:
   - Overdue: `bg-red-600` (red for urgent)
   - Upcoming: `bg-blue-600` (blue for upcoming)
   - Scheduled: `bg-blue-600` (match upcoming, or use `bg-indigo-600` for slight variation)
   - Expired: `bg-slate-600` or `bg-gray-600` (neutral gray for expired)

PART 3: Enhance TabsList Visual

9. Optional: Improve TabsList background:
   - Current: `bg-muted` (very light gray)
   - Consider: Slightly more visible background for better contrast
   - Keep: `bg-muted` is fine, or enhance to `bg-muted/80` with backdrop-blur

10. Ensure responsive behavior:
    - TabsList: `grid w-full grid-cols-4 max-w-2xl` should remain
    - Tabs should work on mobile (stack if needed, or keep horizontal scroll)

PART 4: Verify Tab Functionality

11. Ensure all tab functionality is preserved:
    - Tab switching works correctly
    - Active state detection works
    - Badges display correct counts
    - Neon effects only show on active tabs

Important Notes:
- Tab functionality MUST remain intact
- Neon effects should enhance, not interfere with tab navigation
- Active tabs should have neon effects
- Inactive tabs should NOT have neon effects
- Badge colors should be consistent and meaningful
- All existing Reminders page functionality must work
```

### Expected Result
- Tab buttons have neon effects when active (consistent with Change #1)
- Badge colors are consistent and meaningful
- Tab navigation works perfectly
- Visual hierarchy is clear (active vs inactive)
- Modern, cohesive design with other buttons

### Testing Checklist
1. Verify tab switching works (Overdue, Upcoming, Scheduled, Expired)
2. Verify neon effects appear only on active tab
3. Verify inactive tabs don't have neon effects
4. Verify badge colors are consistent
5. Verify badge counts display correctly
6. Verify tabs work on mobile
7. Verify focus states work for accessibility
8. Verify no functionality is broken
9. Test with different reminder counts
10. Verify responsive layout works

---

## Change #6: Colors Standardization - Unified Color System

- [x] Completed

### Purpose
Create a centralized color system file (`colors.ts`) and refactor all hard-coded color values across the entire application to use this unified color palette. This ensures consistency, maintainability, and makes global color changes possible from a single source.

### Method
**Create colors.ts file and systematic refactoring** - Create a TypeScript color constants file with all color definitions, then update every component, page, and layout to use these constants instead of hard-coded Tailwind classes.

### Why This Method?
- Single source of truth for all colors
- Easy to maintain and update colors globally
- Consistent color usage across entire application
- Type-safe color definitions
- Better collaboration (designers can update one file)

### Color Palette (Approved)

```typescript
// Final color palette with adjustments:
- Primary: #2563eb (blue-600)
- Secondary: #64748b (slate-500)
- Success: #16a34a (green-600)
- Danger: #dc2626 (red-600)
- Warning: #f97316 (orange-500) - Adjusted to match existing dashboard
- Info: #0ea5e9 (sky-500)
- Background: #f8fafc (slate-50)
- Card: #ffffff (white)
- Border: #e5e7eb (gray-200)
- Text: #334155 (slate-700)
- Muted: #64748b (slate-500) - Same as Secondary, or can use slate-400
- Disabled: #cbd5e1 (slate-300)
- Accent: #a21caf (purple-600)
```

### Prompt for Bolt.new

```
Create a centralized color system and refactor all hard-coded colors across the entire application.

PART 1: Create colors.ts File

1. Create new file: src/config/colors.ts

2. Export a colors object with the following structure:

```typescript
export const COLORS = {
  // Base Colors
  primary: {
    DEFAULT: 'blue-600',
    hex: '#2563eb',
    light: 'blue-500',
    dark: 'blue-700',
    darker: 'blue-800',
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-50',
    bgGradient: 'bg-gradient-to-r from-blue-600 to-blue-700',
    bgGradientHover: 'hover:from-blue-700 hover:to-blue-800',
    text: 'text-blue-600',
    textLight: 'text-blue-700',
    border: 'border-blue-300',
    borderHover: 'hover:border-blue-400',
    shadow: 'shadow-blue-500/30',
  },
  
  secondary: {
    DEFAULT: 'slate-500',
    hex: '#64748b',
    bg: 'bg-slate-500',
    bgLight: 'bg-slate-50',
    text: 'text-slate-500',
    border: 'border-slate-500',
  },
  
  success: {
    DEFAULT: 'green-600',
    hex: '#16a34a',
    light: 'green-500',
    dark: 'green-700',
    darker: 'green-800',
    bg: 'bg-green-600',
    bgLight: 'bg-green-50',
    bgGradient: 'bg-gradient-to-r from-green-500 to-green-600',
    bgGradientHover: 'hover:from-green-700 hover:to-green-800',
    text: 'text-green-600',
    border: 'border-green-400',
  },
  
  danger: {
    DEFAULT: 'red-600',
    hex: '#dc2626',
    light: 'red-500',
    dark: 'red-700',
    bg: 'bg-red-600',
    bgLight: 'bg-red-50',
    bgGradient: 'bg-gradient-to-r from-red-500 to-red-600',
    text: 'text-red-600',
    textDark: 'text-red-700',
    border: 'border-red-300',
    borderHover: 'hover:border-red-400',
  },
  
  warning: {
    DEFAULT: 'orange-500', // Adjusted to match existing dashboard
    hex: '#f97316',
    light: 'orange-500',
    dark: 'orange-600',
    bg: 'bg-orange-500',
    bgLight: 'bg-orange-50',
    bgGradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
    bgGradientBr: 'bg-gradient-to-br from-orange-50 to-amber-50',
    text: 'text-orange-600',
    textDark: 'text-orange-700',
    textDarker: 'text-orange-900',
    border: 'border-orange-200',
    borderHover: 'border-orange-300',
    hoverBg: 'hover:bg-orange-100',
  },
  
  info: {
    DEFAULT: 'sky-500',
    hex: '#0ea5e9',
    bg: 'bg-sky-500',
    bgLight: 'bg-sky-50',
    text: 'text-sky-600',
  },
  
  accent: {
    DEFAULT: 'purple-600',
    hex: '#a21caf',
    light: 'purple-500',
    dark: 'purple-600',
    bgGradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
    text: 'text-purple-600',
  },
  
  // Neutral Colors
  background: {
    DEFAULT: 'slate-50',
    hex: '#f8fafc',
    bg: 'bg-slate-50',
    bgGradient: 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50',
  },
  
  card: {
    DEFAULT: 'white',
    hex: '#ffffff',
    bg: 'bg-white',
    bgBlur: 'bg-white/80 backdrop-blur-sm',
  },
  
  border: {
    DEFAULT: 'gray-200',
    hex: '#e5e7eb',
    light: 'border-gray-100',
    DEFAULT_class: 'border-gray-200',
    dark: 'border-gray-300',
    color: 'border-gray-200',
  },
  
  text: {
    DEFAULT: 'slate-700',
    hex: '#334155',
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    disabled: 'text-gray-400',
    color: 'text-gray-700',
    light: 'text-gray-300',
  },
  
  muted: {
    DEFAULT: 'slate-500',
    hex: '#64748b',
    light: 'slate-400',
    bg: 'bg-slate-500',
    text: 'text-slate-500',
    textLight: 'text-gray-500',
  },
  
  disabled: {
    DEFAULT: 'slate-300',
    hex: '#cbd5e1',
    bg: 'bg-slate-300',
    text: 'text-slate-300',
  },
  
  // Status-specific gradients (for badges, stat cards)
  status: {
    empty: {
      gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      bg: 'bg-yellow-600',
    },
    occupied: {
      gradient: 'bg-gradient-to-r from-green-500 to-green-600',
      bg: 'bg-green-600',
    },
    active: {
      gradient: 'bg-gradient-to-r from-green-500 to-green-600',
      bg: 'bg-green-600',
    },
    inactive: {
      gradient: 'bg-gradient-to-r from-gray-500 to-gray-600',
      bg: 'bg-gray-600',
    },
    archived: {
      gradient: 'bg-gradient-to-r from-gray-500 to-gray-600',
      bg: 'bg-gray-600',
    },
    assigned: {
      gradient: 'bg-gradient-to-r from-green-500 to-green-600',
      bg: 'bg-green-600',
    },
    unassigned: {
      gradient: 'bg-gradient-to-r from-gray-500 to-gray-600',
      bg: 'bg-gray-600',
    },
  },
  
  // Dashboard stat card icon colors
  dashboard: {
    properties: {
      gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
    },
    occupied: {
      gradient: 'bg-gradient-to-br from-green-500 to-green-600',
    },
    tenants: {
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    contracts: {
      gradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
    },
  },
  
  // Reminders tab badges
  reminders: {
    overdue: 'bg-red-600',
    upcoming: 'bg-blue-600',
    scheduled: 'bg-blue-600', // Changed from slate-600 for consistency
    expired: 'bg-gray-600',
  },
} as const;

// Helper function to combine color classes
export const cnColor = (...classes: (string | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};
```

3. Export the colors object properly with TypeScript types

PART 2: Update All Components and Pages

Now systematically update EVERY file that uses hard-coded color classes:

4. Update src/components/layout/Sidebar.tsx:
   - Replace `bg-gradient-to-r from-blue-600 to-blue-700` with `${COLORS.primary.bgGradient}`
   - Replace `from-blue-500 to-blue-600` with COLORS.primary gradient variants
   - Replace `text-gray-700` with `${COLORS.text.secondary}`
   - Replace `hover:bg-blue-50` with `${COLORS.primary.bgLight}`
   - Replace `bg-red-600` with `${COLORS.danger.bg}` (for reminder badge)
   - Replace all hard-coded colors

5. Update src/components/layout/Navbar.tsx:
   - Replace `hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300` with COLORS.primary variants
   - Replace `hover:bg-orange-50 hover:text-orange-600` with COLORS.warning variants
   - Replace `bg-red-600` with `${COLORS.danger.bg}`
   - Replace `border-gray-200` with `${COLORS.border.DEFAULT_class}`
   - Replace `text-gray-900` with `${COLORS.text.primary}`

6. Update src/components/layout/MainLayout.tsx:
   - Replace `bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50` with `${COLORS.background.bgGradient}`

7. Update src/features/dashboard/Dashboard.tsx:
   - Replace dashboard stat icon gradients with `COLORS.dashboard.*.gradient`
   - Replace `border-orange-200` with `${COLORS.warning.border}`
   - Replace `text-orange-900` with `${COLORS.warning.textDarker}`
   - Replace `text-orange-700` with `${COLORS.warning.textDark}`
   - Replace `bg-orange-50/50` with `${COLORS.warning.bgLight}`
   - Replace all gray text colors with COLORS.text variants

8. Update src/features/properties/Properties.tsx:
   - Replace status badge gradients with `COLORS.status.*.gradient`
   - Replace primary button gradient with `${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover}`
   - Replace hover colors with COLORS variants
   - Replace all hard-coded colors

9. Update src/features/owners/Owners.tsx:
   - Replace primary button gradient with COLORS.primary
   - Replace property count badge gradient with COLORS.accent gradient
   - Replace hover states with COLORS variants
   - Replace all gray colors with COLORS.text variants

10. Update src/features/tenants/Tenants.tsx:
    - Replace assignment badge gradients with COLORS.status variants
    - Replace primary button gradient with COLORS.primary
    - Replace hover states with COLORS variants
    - Replace all hard-coded colors

11. Update src/features/contracts/Contracts.tsx:
    - Replace status badge gradients with COLORS.status variants
    - Replace primary button gradient with COLORS.primary
    - Replace `bg-orange-50/50` with `${COLORS.warning.bgLight}`
    - Replace hover states with COLORS variants

12. Update src/features/reminders/Reminders.tsx:
    - Replace reminder badge colors: `bg-red-600`, `bg-orange-600`, `bg-blue-600` with COLORS.reminders values
    - Replace tab badge colors with COLORS.reminders values
    - Replace `bg-slate-600` → `COLORS.reminders.scheduled` (bg-blue-600)
    - Replace `bg-gray-600` → `COLORS.reminders.expired`
    - Replace all alert box backgrounds with COLORS variants
    - Replace success button gradient with `${COLORS.success.bgGradient}`
    - Replace all hard-coded colors

13. Update src/features/auth/Login.tsx:
    - Replace `bg-gray-50` with `${COLORS.background.bg}`
    - Replace `bg-blue-100` with `${COLORS.primary.bgLight}` (or appropriate light variant)
    - Replace `text-blue-600` with `${COLORS.primary.text}`
    - Replace all hard-coded colors

14. Update src/components/properties/PhotoUpload.tsx:
    - Replace `border-orange-200 bg-orange-50` with COLORS.warning variants
    - Replace `border-red-200 bg-red-50` with COLORS.danger variants
    - Replace `bg-blue-100` with COLORS.primary light variant
    - Replace `bg-blue-50` with COLORS.primary light variant
    - Replace all hard-coded colors

15. Update src/components/properties/PhotoGallery.tsx:
    - Replace `bg-gray-50`, `bg-gray-100`, `bg-gray-200` with COLORS variants
    - Replace `bg-blue-600` with `${COLORS.primary.bg}`
    - Replace `bg-red-600` with `${COLORS.danger.bg}`
    - Replace all hard-coded colors

16. Update ALL Dialog components:
    - src/features/properties/PropertyDialog.tsx
    - src/features/owners/OwnerDialog.tsx
    - src/features/tenants/TenantDialog.tsx
    - src/features/contracts/ContractDialog.tsx
    - Replace primary button gradients with COLORS.primary
    - Replace error text colors with `${COLORS.danger.text}`
    - Replace info box colors with COLORS variants
    - Replace all hard-coded colors

17. Update ALL Alert Dialog actions:
    - Replace `bg-red-600 hover:bg-red-700` with `${COLORS.danger.bg} ${COLORS.danger.dark}` (as hover)

PART 3: Create Helper Utilities

18. Create helper functions in src/config/colors.ts for common patterns:

```typescript
// Primary button classes
export const getPrimaryButtonClasses = () => 
  `${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover} ${COLORS.primary.shadow}`;

// Status badge classes
export const getStatusBadgeClasses = (status: 'empty' | 'occupied' | 'active' | 'inactive' | 'archived' | 'assigned' | 'unassigned') => 
  `${COLORS.status[status].gradient} text-white`;

// Card classes
export const getCardClasses = () => 
  `shadow-lg ${COLORS.border.color} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow`;

// Hover states
export const getHoverClasses = (type: 'primary' | 'danger' | 'warning' | 'success') => {
  const colors = {
    primary: COLORS.primary,
    danger: COLORS.danger,
    warning: COLORS.warning,
    success: COLORS.success,
  };
  return `${colors[type].bgLight} ${colors[type].text} ${colors[type].border}`;
};
```

PART 4: Verification

19. After all updates, verify:
    - All colors are imported from colors.ts
    - No hard-coded Tailwind color classes remain (except for COLORS object definition)
    - All components render correctly
    - Colors are visually consistent
    - No functionality is broken

20. Check these specific areas:
    - Sidebar: Primary blue gradient, active nav item
    - Navbar: Borders, hover states
    - Dashboard: Stat card icon gradients, reminder cards
    - All pages: Buttons, badges, hover states
    - Reminders: Tab badges match new palette
    - All dialogs: Primary buttons, error messages

Important Notes:
- Import colors at the top: `import { COLORS } from '@/config/colors';`
- Use template literals: `className={`${COLORS.primary.bg} text-white`}`
- For complex classes, combine with cn() utility: `cn(COLORS.primary.bgGradient, COLORS.primary.shadow)`
- Keep existing functionality - only replace colors, not logic
- Warning color changed from amber-500 to orange-500 (#f97316) to match existing dashboard
- Info color is sky-500 (#0ea5e9) - different from primary blue
- Scheduled badge changed from slate-600 to blue-600 for consistency
```

### Expected Result
- `colors.ts` file created with all color definitions
- All hard-coded color classes replaced with COLORS imports
- Consistent color usage across entire application
- Easy to update colors globally from one file
- Type-safe color system

### Testing Checklist
1. Verify colors.ts exports all required color constants
2. Verify all components import from colors.ts
3. Verify Sidebar uses COLORS.primary
4. Verify Navbar uses COLORS variants
5. Verify Dashboard uses COLORS.dashboard gradients
6. Verify all pages use COLORS for buttons
7. Verify all badges use COLORS.status
8. Verify Reminders tabs use COLORS.reminders
9. Verify hover states use COLORS hover variants
10. Verify no hard-coded Tailwind colors remain
11. Test visual consistency across all pages
12. Verify no functionality is broken

---

## Notes

- Each change should be in a separate section
- Each prompt should be detailed and clear for Bolt.new to understand
- Avoid breaking changes whenever possible
- Reference `design_rulebook.md` when needed
- All changes should be reversible
