# Closewell design system — build conventions

Closewell is a mobile-first CRM for US solo real-estate agents. Target feel: calm,
trustworthy, professional ("QuickBooks meets Calendly") — never flashy-startup,
never glassmorphism/neon gradients, never generic real-estate clichés (house icons,
"for sale" sign imagery).

## Wrapping and setup

No app-wide provider is required for this component set. **Exception: `Tooltip`** —
it must be wrapped in its own `TooltipProvider` at the point of use (not once at an
app root), e.g. `<TooltipProvider><Tooltip>...</Tooltip></TooltipProvider>`. Without
it, `Tooltip` throws at render.

Font is Inter (loaded by the host page, not shipped in this bundle) — use it as-is,
no font-family overrides needed.

## Styling idiom: semantic Tailwind tokens only

This system has **no raw color utilities** (no `bg-blue-600`, `text-slate-400`, etc.)
— every surface, text, and border uses a semantic token class. Use these, never a raw
Tailwind color:

| Purpose | Classes |
|---|---|
| Primary action / brand | `bg-primary` `text-primary-foreground` `border-primary` |
| Secondary / accent (gold) | `bg-secondary` `text-secondary-foreground` |
| Destructive / error | `bg-destructive` `text-destructive-foreground` `text-destructive` |
| Success | `bg-success` `text-success` (`/15` alpha for tinted surfaces, e.g. `bg-success/15`) |
| Warning | `bg-warning` `text-warning` |
| Info | `bg-info` `text-info` |
| Neutral surface | `bg-muted` `text-muted-foreground` |
| Card surface | `bg-card` `text-card-foreground` |
| Borders | `border-border` |
| Page background | `bg-background` `text-foreground` |
| Charts (categorical) | `chart-1` … `chart-5` (CSS vars, for data viz only) |

Alpha-tinted variants (`bg-primary/10`, `border-destructive/40`, `bg-warning/15`) are
the standard way to get a soft/tinted surface for badges, alert boxes, and status
pills — don't invent new colors, tint an existing token instead. Border radius:
`rounded-md` is the dominant convention; `rounded-lg`/`rounded-xl` for cards/dialogs,
`rounded-full` for pills and icon buttons.

## Where the truth lives

All component styles are reachable from `styles.css`'s import closure (which pulls in
`_ds_bundle.css`, containing every semantic token and Tailwind utility class this
system uses) — read it before styling anything new. Token values themselves are CSS
custom properties defined inline there (`--primary`, `--success`, etc., as HSL
triples) — there is no separate token file for this system. Each component's
`<Name>.prompt.md` documents its real props and composition patterns; read it before
using a component you haven't used yet.

## Idiomatic composition example

```tsx
<Card className="max-w-sm">
  <CardHeader>
    <div className="flex items-start justify-between">
      <div className="rounded-xl bg-primary/10 p-3">
        <Home className="h-6 w-6 text-primary" />
      </div>
      <Badge className="bg-primary/15 text-xs text-primary">New</Badge>
    </div>
    <CardTitle className="mt-4 text-lg">Lease Agreement</CardTitle>
    <CardDescription>Draft a US-state-compliant lease in minutes</CardDescription>
  </CardHeader>
  <CardContent className="pt-0">
    <Button className="w-full">Start Lease</Button>
  </CardContent>
</Card>
```
