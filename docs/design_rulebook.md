# Design Rulebook - Emlak CRM

> Comprehensive design system documentation for the Property Management CRM application.

---

## 1. Color System

### CSS Variables (HSL format)
```css
/* Light Mode */
--background: 0 0% 100%
--foreground: 222 47% 11%
--card: 0 0% 100%
--card-foreground: 222 47% 11%
--primary: 221 83% 53% (Blue)
--primary-foreground: 0 0% 100%
--secondary: 210 40% 96% (Light gray)
--secondary-foreground: 222 47% 11%
--muted: 210 40% 96%
--muted-foreground: 215 16% 47%
--accent: 210 40% 96%
--accent-foreground: 222 47% 11%
--destructive: 0 84% 60% (Red)
--destructive-foreground: 0 0% 98%
--border: 214 32% 91%
--input: 214 32% 91%
--ring: 221 83% 53% (Blue)
--radius: 0.5rem

/* Chart Colors */
--chart-1: 12 76% 61%
--chart-2: 173 58% 39%
--chart-3: 197 37% 24%
--chart-4: 43 74% 66%
--chart-5: 27 87% 67%
```

### Gradient Colors (Currently Used)

#### Primary Blue Gradients
- Button Gradient: `bg-gradient-to-r from-blue-600 to-blue-700`
- Hover State: `hover:from-blue-700 hover:to-blue-800`
- Shadow: `shadow-md shadow-blue-500/30`

#### Dashboard Card Icons
- Purple: `bg-gradient-to-br from-purple-500 to-purple-600`
- Green: `bg-gradient-to-br from-green-500 to-green-600`
- Blue: `bg-gradient-to-br from-blue-500 to-blue-600`
- Orange: `bg-gradient-to-br from-orange-500 to-orange-600`

#### Status Badges (Gradient)
- Empty: `bg-gradient-to-r from-yellow-500 to-yellow-600 text-white`
- Occupied: `bg-gradient-to-r from-green-500 to-green-600 text-white`
- Inactive: `bg-gradient-to-r from-gray-500 to-gray-600 text-white`
- Assigned: `bg-gradient-to-r from-green-500 to-green-600 text-white`
- Unassigned: `bg-gradient-to-r from-gray-500 to-gray-600 text-white`
- Active Contract: `bg-gradient-to-r from-green-500 to-green-600 text-white`
- Archived: `bg-gradient-to-r from-gray-500 to-gray-600 text-white`
- Inactive Contract: `bg-gradient-to-r from-red-500 to-red-600 text-white`

#### Status Badges (Solid)
- Urgent (≤30 days): `bg-red-600`
- Soon (≤60 days): `bg-orange-600`
- Normal: `bg-blue-600`

### Background Colors
- Main Layout: `bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50`
- Sidebar Header: `bg-gradient-to-r from-blue-600 to-blue-700`
- Cards: `bg-white/80 backdrop-blur-sm` or `bg-white`
- Login Page: `bg-gray-50`
- Sidebar: `bg-white`
- Sidebar Header Icon Container: `bg-white/20 rounded-lg backdrop-blur-sm`

### Text Colors
- Primary Text: `text-gray-900`
- Secondary Text: `text-gray-600`, `text-gray-700`
- Muted Text: `text-gray-400`, `text-gray-500`
- White Text: `text-white`
- Blue Accent: `text-blue-600`
- Orange Accent: `text-orange-600`
- Red Accent: `text-red-600`
- Green Accent: `text-green-600`
- Orange-900: `text-orange-900` (Reminder cards)
- Orange-700: `text-orange-700` (Reminder descriptions)

### Icon Colors
- Gray: `text-gray-400`, `text-gray-500`
- Blue: `text-blue-600`
- Orange: `text-orange-600`
- Red: `text-red-600`
- Green: `text-green-600`
- White: `text-white`

---

## 2. Typography

### Font Family
```css
font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
```

### Font Sizes
- Page Title (Navbar): `text-xl font-semibold`
- Section Title (Dashboard): `text-3xl font-bold`
- Card Title: `text-lg font-medium` / `font-semibold leading-none tracking-tight`
- Card Description: `text-sm text-muted-foreground`
- Table Head: `font-medium text-muted-foreground`
- Body Text: `text-sm`
- Small Text: `text-xs`
- Button Text: `text-sm font-medium`

### Font Weights
- Bold: `font-bold`
- Semibold: `font-semibold`
- Medium: `font-medium`

### Line Heights & Tracking
- Card Title: `leading-none tracking-tight`
- Normal: Default line-height

---

## 3. Spacing

### Layout Spacing
- Main Content Padding: `p-4 lg:p-8`
- Page Container Max Width: `max-w-7xl mx-auto`
- Page Vertical Spacing: `space-y-6`

### Card Spacing
- Card Header Padding: `p-6`
- Card Header Vertical Spacing: `space-y-1.5`
- Card Content Padding: `p-6 pt-0`
- Card Content Vertical Spacing: `space-y-3`, `space-y-4`
- Card Footer Padding: `p-6 pt-0`

### Component Spacing
- Button Gap: `gap-2`, `gap-3`, `gap-4`
- Icon + Text Gap: `gap-2` (small), `gap-3` (medium)
- Flex Container Gap: `gap-4` (page level), `gap-2` (component level)
- Form Fields: `space-y-2` (form containers), `space-y-4` (form sections)

### Sidebar Spacing
- Width: `w-64`
- Padding: `p-4`
- Navigation Items Vertical Gap: `space-y-1`
- Navigation Item Padding: `px-3 py-2.5`
- Logo/Header Padding: `p-4`
- Footer Border: `border-t border-gray-200`
- Footer Padding: `p-4`

### Grid Spacing
- Dashboard Cards: `gap-6`
- Reminder Grid: `gap-4`

---

## 4. Border Radius

### Standard Radius Values
- Base Radius Variable: `--radius: 0.5rem` (0.5rem = 8px)
- Large: `rounded-lg` (calculated: `var(--radius)`)
- Medium: `rounded-md` (calculated: `calc(var(--radius) - 2px)` = 6px)
- Small: `rounded-sm` (calculated: `calc(var(--radius) - 4px)` = 4px)
- Extra Large: `rounded-xl` (cards)
- Full: `rounded-full` (avatar, circular elements)

### Component-Specific
- Cards: `rounded-xl`
- Buttons: `rounded-md`
- Inputs: `rounded-md`
- Badges: `rounded-md`
- Dialogs: `sm:rounded-lg`

---

## 5. Shadows

### Shadow Types
- Card Shadow: `shadow-lg`
- Card Hover: `hover:shadow-xl`
- Sidebar: `shadow-xl`
- Button: `shadow-md shadow-blue-500/30`
- Button Default: `shadow`
- Button Small: `shadow-sm`
- Navbar: `shadow-sm`
- Active Nav Item: `shadow-md shadow-blue-500/30`
- Table Container: `shadow-lg`

### Shadow Colors
- Blue Glow: `shadow-blue-500/30` (primary buttons, active nav items)

---

## 6. Buttons

### Button Variants

#### Default (Primary)
```css
bg-primary text-primary-foreground shadow hover:bg-primary/90
```

#### Destructive
```css
bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90
```

#### Outline
```css
border border-input bg-background shadow-sm 
hover:bg-accent hover:text-accent-foreground
```

#### Secondary
```css
bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80
```

#### Ghost
```css
hover:bg-accent hover:text-accent-foreground
```

#### Link
```css
text-primary underline-offset-4 hover:underline
```

### Button Sizes
- Default: `h-9 px-4 py-2`
- Small: `h-8 rounded-md px-3 text-xs`
- Large: `h-10 rounded-md px-8`
- Icon: `h-9 w-9`

### Primary Button (Special Gradient Style)
```css
bg-gradient-to-r from-blue-600 to-blue-700 
hover:from-blue-700 hover:to-blue-800 
shadow-md shadow-blue-500/30
```

### Outline Button Hover States
- Edit/View: `hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300`
- Delete: `hover:bg-red-50 hover:text-red-600 hover:border-red-300`
- Orange Actions: `hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300`
- Green Actions: `hover:bg-green-50 hover:text-green-600 hover:border-green-400`

### Button Base Classes
```css
inline-flex items-center justify-center whitespace-nowrap rounded-md 
text-sm font-medium transition-colors 
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring 
disabled:pointer-events-none disabled:opacity-50
```

---

## 7. Cards

### Base Card Component
```css
rounded-xl border bg-card text-card-foreground shadow
```

### Enhanced Cards (Dashboard/Pages)
```css
shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm 
hover:shadow-xl transition-shadow
```

### Special Cards

#### Reminder Card
```css
shadow-lg border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 
backdrop-blur-sm
```

#### Alert/Notification Card
```css
shadow-lg border-orange-200 bg-orange-50/50 backdrop-blur-sm
```

#### Empty State Card
```css
p-8 shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm
```

### Card Components

#### CardHeader
```css
flex flex-col space-y-1.5 p-6
```

#### CardTitle
```css
font-semibold leading-none tracking-tight
```

#### CardDescription
```css
text-sm text-muted-foreground
```

#### CardContent
```css
p-6 pt-0
```

#### CardFooter
```css
flex items-center p-6 pt-0
```

---

## 8. Badges

### Base Badge Component
```css
inline-flex items-center rounded-md border px-2.5 py-0.5 
text-xs font-semibold transition-colors 
focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
```

### Badge Variants

#### Default
```css
border-transparent bg-primary text-primary-foreground shadow 
hover:bg-primary/80
```

#### Secondary
```css
border-transparent bg-secondary text-secondary-foreground 
hover:bg-secondary/80
```

#### Destructive
```css
border-transparent bg-destructive text-destructive-foreground shadow 
hover:bg-destructive/80
```

#### Outline
```css
text-foreground
```

### Status Badges (Gradient Pattern)
All status badges use: `bg-gradient-to-r from-[color]-500 to-[color]-600 text-white`

### Notification Badge
```css
absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 
bg-red-600 text-white text-xs border-2 border-white
```

---

## 9. Tables

### Table Container
```css
shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm overflow-hidden
```

### Table Base
```css
w-full caption-bottom text-sm
```

### TableHeader
```css
[&_tr]:border-b
```

### TableBody
```css
[&_tr:last-child]:border-0
```

### TableRow
```css
border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted
```
- Special: Expiring contracts `bg-orange-50/50`

### TableHead
```css
h-10 px-2 text-left align-middle font-medium text-muted-foreground 
[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]
```

### TableCell
```css
p-2 align-middle 
[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]
```

---

## 10. Forms & Inputs

### Input Field
```css
flex h-9 w-full rounded-md border border-input bg-transparent 
px-3 py-1 text-sm shadow-sm transition-colors 
file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground 
placeholder:text-muted-foreground 
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring 
disabled:cursor-not-allowed disabled:opacity-50
```

### Search Input Pattern
```tsx
<div className="relative flex-1 max-w-sm">
  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
  <Input className="pl-9" placeholder="Search..." />
</div>
```
- Icon Position: `absolute left-3 top-1/2 transform -translate-y-1/2`
- Input Padding with Icon: `pl-9`

### Select Dropdown
- Width: `w-full sm:w-[180px]` (responsive)
- Uses Radix UI Select component

### Label
- Standard label styling (via shadcn/ui Label component)

---

## 11. Dialogs

### Dialog Overlay
```css
fixed inset-0 z-50 bg-black/80 
data-[state=open]:animate-in data-[state=closed]:animate-out 
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
```

### Dialog Content
```css
fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg 
translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 
shadow-lg duration-200 
data-[state=open]:animate-in data-[state=closed]:animate-out 
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 
data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] 
data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] 
sm:rounded-lg
```

### Dialog Header
```css
flex flex-col space-y-1.5 text-center sm:text-left
```

### Dialog Title
```css
text-lg font-semibold leading-none tracking-tight
```

### Dialog Description
```css
text-sm text-muted-foreground
```

### Dialog Footer
```css
flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2
```

### Alert Dialog Actions
- Cancel Button: Default outline style
- Delete Action: `bg-red-600 hover:bg-red-700`

---

## 12. Layout Components

### MainLayout

#### Container
```css
min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50
```

#### Content Area
- Sidebar Offset: `lg:pl-64` (sidebar width)
- Main Padding: `p-4 lg:p-8`

### Sidebar

#### Container
```css
fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 
transition-transform duration-300 ease-in-out w-64 flex flex-col shadow-xl
```
- Mobile: `translate-x-0` (open) / `-translate-x-full` (closed)
- Desktop: Always visible

#### Header
```css
flex items-center justify-between p-4 border-b border-gray-200 
bg-gradient-to-r from-blue-600 to-blue-700
```

#### Header Icon Container
```css
p-2 bg-white/20 rounded-lg backdrop-blur-sm
```
- Icon: `h-5 w-5 text-white`
- Logo Text: `font-semibold text-white`

#### Navigation Items
- Container: `flex-1 p-4 space-y-1 overflow-y-auto`
- Active Item: `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30`
- Inactive Item: `text-gray-700 hover:bg-blue-50 hover:text-blue-600`
- Item Base: `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all`
- Icon: `h-5 w-5`

#### Footer
```css
p-4 border-t border-gray-200
```
- User Avatar: `h-8 w-8 rounded-full bg-gray-200`
- Sign Out Button: `w-full justify-start gap-2`

### Navbar

#### Container
```css
sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm
```

#### Content
```css
flex items-center justify-between gap-4 px-4 py-4 lg:px-6
```

#### Title
```css
text-xl font-semibold text-gray-900
```

#### Menu Button (Mobile)
```css
lg:hidden hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300
```

---

## 13. Dashboard Specific

### Welcome Section
- Title: `text-3xl font-bold text-gray-900`
- Subtitle: `text-gray-600 mt-1`

### Stat Cards Grid
- Container: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
- Card: Enhanced card style with hover
- Header: `flex flex-row items-center justify-between space-y-0 pb-2`
- Icon Container: `p-2 bg-gradient-to-br rounded-lg`
- Icon Size: `h-4 w-4 text-white`
- Number Display: `text-2xl font-bold`
- Description: `text-xs text-gray-600 mt-1`

### Reminder Card
- Border: `border-orange-200`
- Background: `bg-gradient-to-br from-orange-50 to-amber-50 backdrop-blur-sm`
- Icon Container: `p-2 bg-orange-600 rounded-lg`
- Icon: `h-5 w-5 text-white`
- Title: `text-orange-900`
- Description: `text-orange-700`
- Action Button: `border-orange-300 hover:bg-orange-100`

### Alert Card (Expiring Contracts)
```css
shadow-lg border-orange-200 bg-orange-50/50 backdrop-blur-sm
```

### Quick Actions Card
- Standard enhanced card style

---

## 14. Icons

### Icon Sizes
- Extra Small: `h-3 w-3` (inline with small text, badges)
- Small: `h-4 w-4` (buttons, lists, table cells)
- Medium: `h-5 w-5` (headers, navigation, card icons)
- Large: `h-8 w-8` (login page, prominent features)

### Icon Usage Patterns
- With Text: `flex items-center gap-2` or `gap-3`
- Button Icons: Usually `h-4 w-4` with `mr-2` or inline
- Card Icons: Usually `h-5 w-5` or `h-4 w-4`

### Icon Library
- Primary: `lucide-react`

---

## 15. Transitions & Animations

### Transition Types
- Colors: `transition-colors`
- Shadows: `transition-shadow`
- Transform: `transition-transform duration-300 ease-in-out`
- All: `transition-all`

### Dialog Animations
- Fade: `data-[state=open]:fade-in-0`, `data-[state=closed]:fade-out-0`
- Zoom: `data-[state=closed]:zoom-out-95`, `data-[state=open]:zoom-in-95`
- Slide: `data-[state=open]:slide-in-from-left-1/2`, `data-[state=open]:slide-in-from-top-[48%]`

### Sidebar Animations
- Transform: `transition-transform duration-300 ease-in-out`
- Mobile Toggle: `translate-x-0` (open) / `-translate-x-full` (closed)
- Overlay: `transition-opacity`

### Accordion Animations
- Defined in Tailwind config: `accordion-down`, `accordion-up`

---

## 16. Responsive Breakpoints

### Tailwind Breakpoints
- Mobile: Base styles (default)
- Tablet: `sm:` prefix (640px+)
- Desktop: `md:` prefix (768px+)
- Large Desktop: `lg:` prefix (1024px+)

### Common Responsive Patterns

#### Layout
- Sidebar: Hidden on mobile, visible on `lg:`
- Main Content Padding: `p-4 lg:p-8`
- Content Offset: `lg:pl-64` (sidebar width)

#### Grids
- Dashboard Cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Reminder Grid: Responsive based on content

#### Forms & Controls
- Search + Filter: `flex-col sm:flex-row`
- Select Width: `w-full sm:w-[180px]`
- Dialog Footer: `flex-col-reverse sm:flex-row`

#### Navigation
- Navbar Menu: Visible on mobile (`lg:hidden`), hidden on desktop
- Sidebar: Slide-in on mobile, fixed on desktop

---

## 17. Special Patterns

### Empty States

#### Container
```css
p-8 shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm
```

#### Structure
- Title: `text-lg font-medium text-gray-900 mb-2`
- Description: `text-gray-500 mb-4`
- Action Button: Primary gradient button style

### Loading States

#### Container
```css
p-8 shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm
```

#### Content
```css
text-center text-gray-500
```
- Text: "Loading [resource]..."

### Search Bar Pattern
```tsx
<div className="relative flex-1 max-w-sm">
  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
  <Input 
    placeholder="Search..." 
    className="pl-9" 
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
</div>
```

### Filter + Add Button Layout
```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-between">
  <div className="flex flex-col sm:flex-row gap-4 flex-1">
    {/* Search Input */}
    {/* Filter Select */}
  </div>
  <Button onClick={handleAdd}>
    <PlusIcon className="h-4 w-4 mr-2" />
    Add [Resource]
  </Button>
</div>
```

### Action Buttons (Table Row)
```tsx
<div className="flex justify-end gap-2">
  <Button variant="outline" size="icon" className="hover:bg-blue-50...">
    <EditIcon />
  </Button>
  <Button variant="outline" size="icon" className="hover:bg-red-50...">
    <DeleteIcon />
  </Button>
</div>
```

### Status Badge Pattern
```tsx
const getStatusBadge = (status: string) => {
  const config = {
    Active: { label: 'Active', className: 'bg-gradient-to-r from-green-500 to-green-600' },
    // ... other statuses
  };
  return (
    <Badge className={config[status].className + ' text-white'}>
      {config[status].label}
    </Badge>
  );
};
```

---

## 18. Status Indicators

### Property Status
- **Empty**: `bg-gradient-to-r from-yellow-500 to-yellow-600 text-white`
- **Occupied**: `bg-gradient-to-r from-green-500 to-green-600 text-white`
- **Inactive**: `bg-gradient-to-r from-gray-500 to-gray-600 text-white`

### Contract Status
- **Active**: `bg-gradient-to-r from-green-500 to-green-600 text-white`
- **Archived**: `bg-gradient-to-r from-gray-500 to-gray-600 text-white`
- **Inactive**: `bg-gradient-to-r from-red-500 to-red-600 text-white`

### Tenant Assignment Status
- **Assigned**: `bg-gradient-to-r from-green-500 to-green-600 text-white`
- **Unassigned**: `bg-gradient-to-r from-gray-500 to-gray-600 text-white`

### Reminder Urgency
- **Urgent** (≤30 days): `bg-red-600`
- **Soon** (≤60 days): `bg-orange-600`
- **Normal**: `bg-blue-600`
- **Contract Ended** (negative days): `bg-destructive` (red)

### Expiring Contract Indicator
- Row Background: `bg-orange-50/50` (when expiring within 30 days)
- Alert Icon: `h-3 w-3 text-orange-600`

---

## 19. Component Composition Examples

### Dashboard Stat Card
```tsx
<Card className="shadow-lg border-gray-100 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Title</CardTitle>
    <div className="p-2 bg-gradient-to-br from-[color]-500 to-[color]-600 rounded-lg">
      <Icon className="h-4 w-4 text-white" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-xs text-gray-600 mt-1">Description</p>
  </CardContent>
</Card>
```

### Page Header with Actions
```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-between">
  <div className="flex flex-col sm:flex-row gap-4 flex-1">
    {/* Search */}
    {/* Filter */}
  </div>
  <Button 
    onClick={handleAdd} 
    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/30"
  >
    <Plus className="h-4 w-4 mr-2" />
    Add Resource
  </Button>
</div>
```

### Table Row with Actions
```tsx
<TableRow>
  <TableCell>
    {/* Content */}
  </TableCell>
  <TableCell className="text-right">
    <div className="flex justify-end gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" className="hover:bg-blue-50...">
            <Icon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    </div>
  </TableCell>
</TableRow>
```

---

## 20. Accessibility

### Focus States
- Buttons: `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`
- Inputs: `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`
- Badges: `focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`

### Disabled States
- Buttons: `disabled:pointer-events-none disabled:opacity-50`
- Inputs: `disabled:cursor-not-allowed disabled:opacity-50`

### Screen Reader
- Dialog Close Button: `sr-only` text for "Close"
- Semantic HTML usage throughout

---

## 21. Z-Index Layers

```css
/* Layer Stack */
- Sidebar Overlay: z-40
- Sidebar: z-50
- Navbar: z-30
- Dialog Overlay: z-50
- Dialog Content: z-50
```

---

## 22. Performance Considerations

### Backdrop Blur
- Used on cards: `backdrop-blur-sm`
- Used on sidebar header icon: `backdrop-blur-sm`

### Transitions
- All interactive elements use `transition-colors`, `transition-shadow`, or `transition-all`
- Duration: Usually default (150ms) or `duration-300` for transforms

---

## Notes & Best Practices

1. **Gradient Consistency**: All status badges and primary buttons use gradient patterns for visual consistency
2. **Shadow Hierarchy**: Use `shadow-sm` for subtle, `shadow-md` for medium, `shadow-lg` for cards, `shadow-xl` for elevated elements
3. **Color Opacity**: Use `/80`, `/50`, `/30` for transparent overlays and backgrounds
4. **Responsive First**: Always consider mobile-first, then tablet, then desktop
5. **Icon Sizing**: Match icon size to text size context (small text = small icons)
6. **Spacing System**: Use consistent spacing scale (2, 4, 6, 8, etc. in Tailwind units)
7. **Hover States**: All interactive elements should have clear hover feedback
8. **Loading States**: Always provide visual feedback during async operations
9. **Empty States**: Include actionable CTAs in empty states when appropriate

---

**Last Updated**: Based on current codebase analysis  
**Design System**: shadcn/ui + Tailwind CSS  
**Version**: 1.0.0

