# zentype UI Style Guide

This document defines the consistent design patterns used across the zentype codebase. Follow these conventions when creating or modifying components.

## Color System

### Primary Colors
- **Primary**: `text-primary` / `bg-primary` — Used for main actions, highlights, and important values (WPM, level numbers)
- **Muted**: `text-muted-foreground` / `bg-muted` — Secondary text, labels, descriptions
- **Destructive**: `text-destructive` — Error states, incorrect inputs
- **Chart colors**: `text-chart-1` through `text-chart-5` — Data visualization

### Color Usage
- **Active/highlighted items**: `text-primary font-medium`
- **Inactive items**: `text-muted-foreground hover:text-foreground hover:bg-muted`
- **Disabled/muted state**: `opacity-50 pointer-events-none`
- **Cards**: `bg-card` with `border border-border/30` or `border-primary/20` for highlighted
- **Badges**: `bg-primary/10 text-primary` for level/XP indicators
- **Success states**: `text-chart-3` (green)
- **Warning states**: `text-foreground` (neutral)
- **Error states**: `text-destructive`

## Typography

### Font Sizes (Tailwind classes)
- **Extra small labels**: `text-[10px]` or `text-[9px]` — Tracking badges, stats labels
- **Small text**: `text-xs` — Secondary info, descriptions
- **Body text**: `text-sm` — Normal content
- **Large headings**: `text-lg` — Page titles
- **Extra large numbers**: `text-2xl` to `text-7xl` — Stats, WPM displays

### Font Weights
- **Bold for values**: `font-bold` — Numbers, important text
- **Medium for labels**: `font-medium` — Section headers
- **Normal for descriptions**: `font-normal` — Secondary info

### Typography Patterns
- **Card titles**: `text-sm font-semibold tracking-wider` (lowercase)
- **Section headers**: `text-sm font-semibold tracking-wider` (lowercase)
- **Stats values**: `text-xl font-bold tabular-nums text-primary`
- **Stat card labels**: `text-sm font-semibold tracking-wider` (lowercase)
- **Badges/labels**: `text-[10px] font-bold tracking-widest`
- **Small labels**: `text-[10px] tracking-wider text-muted-foreground`

## Spacing & Layout

### Page Layout
- **Max width**: `max-w-4xl` (profile, settings) or `max-w-5xl` (test page)
- **Horizontal padding**: `px-4`
- **Vertical padding**: `py-6` to `py-8`
- **Gap between sections**: `gap-5` or `gap-6`

### Card Layout
- **Card padding**: `py-4` (vertical), `px-4` or `px-6` (horizontal)
- **Gap inside cards**: `gap-3` (between header/content)
- **Card header padding**: `px-4`
- **Card content padding**: `px-4`

### Grid Systems
- **2-column stat grid**: `grid grid-cols-2 gap-3`
- **3-column grid**: `grid grid-cols-3 gap-3`
- **Responsive grid**: `md:grid-cols-2` or `md:grid-cols-[1fr_auto]`

## Component Patterns

### Cards
```tsx
<Card className="gap-3 py-4">
  <CardHeader className="px-4">
    <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
      <IconName className="size-4" /> section title
    </CardTitle>
  </CardHeader>
  <CardContent className="px-4">
    {/* content */}
  </CardContent>
</Card>
```

### Stat Cards
```tsx
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <Card className="gap-1 py-3 bg-gradient-to-br from-card to-muted/30 hover:to-muted/50 transition-colors">
      <CardContent className="flex flex-col gap-1 px-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase">
          {icon} {label}
        </span>
        {value === null ? (
          <div className="flex h-7 items-center">
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <span className="text-xl font-bold tabular-nums text-primary">{value}</span>
        )}
      </CardContent>
    </Card>
  );
}
```

### Badges
```tsx
// Level/XP badge
<Badge variant="secondary" className="text-[10px]">Lv. {level}</Badge>

// Rank badge
<span className="ml-1 rounded bg-primary/10 px-1 py-0 text-[10px] font-bold tracking-widest text-primary">
  #{rank}
</span>

// Status badge
<Badge variant={saveState === "cloud" ? "default" : "secondary"} className="text-[10px]">
  {statusText}
</Badge>
```

### Buttons
- **Primary action**: `variant="default"` or `variant="secondary"`
- **Outline action**: `variant="outline"`
- **Link action**: `variant="link"` or `className="text-xs text-primary hover:underline"`
- **Small buttons**: `size="sm"`
- **Icon buttons**: `size="icon"`

### Icons
- **Library**: `@tabler/icons-react`
- **Standard size**: `className="size-4"` (16px)
- **Small icons**: `className="size-3"` (12px)
- **Icon + text gap**: `gap-2` or `gap-1.5`

### Progress Bars
```tsx
<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
</div>
```

### Empty States
```tsx
<div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground">
  <IconName className="mr-2 size-4" /> empty state message
</div>
```

### Loading States
```tsx
<Skeleton className="h-7 w-4/5" />
<Skeleton className="h-40 w-full" />
```

## Navigation & Layout

### Header
- **Height**: `h-12`
- **Background**: `bg-background/80` with `backdrop-blur-xl`
- **Border**: none (removed for cleaner look)
- **Max width**: `max-w-5xl`

### Mobile Bottom Nav
- **Fixed**: `fixed inset-x-0 bottom-0 z-50`
- **Height**: `h-14`
- **Background**: `bg-background/95` with `backdrop-blur-xl`
- **Border**: `border-t border-border/40`
- **Items**: Icon + label, `flex-col items-center gap-0.5`
- **Active**: `text-primary`

### Footer
- **Background**: `bg-background`
- **Text size**: `text-[11px]`
- **Centered on mobile**: `justify-center sm:justify-start`
- **Theme/font pickers**: hidden on mobile

### Navigation Links (Desktop)
- **Active**: `text-primary`
- **Inactive**: `text-muted-foreground hover:text-foreground hover:bg-muted`
- **Padding**: `p-1.5`
- **Style**: Icon-only with filled Tabler icons (`size-5 stroke-1`), tooltip shows label + keyboard shortcut
- **Gap**: `gap-2.5` between nav items

## Dialogs & Modals

### Dialog Structure
```tsx
<DialogContent className="sm:max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
  <DialogHeader className="pr-8">
    <DialogTitle className="flex items-center gap-2">
      <IconName className="size-4" /> title
      <Badge variant="secondary" className="text-[10px]">count</Badge>
    </DialogTitle>
  </DialogHeader>
  {/* content */}
</DialogContent>
```

**Note**: Add `pr-8` to DialogHeader to prevent overlap with close button.

## Tables

### Table Structure
```tsx
<Table>
  <TableHeader>
    <TableRow className="hover:bg-transparent">
      <TableHead>column</TableHead>
      <TableHead className="text-right">right-aligned</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="cursor-pointer">
      <TableCell className="text-xs text-muted-foreground">data</TableCell>
      <TableCell className="text-right font-bold tabular-nums text-primary">value</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Responsive Design

### Breakpoints
- **Mobile first**: Default styles
- **sm**: `640px` — Hide/show elements
- **md**: `768px` — Grid layouts, navigation
- **lg**: `1024px` — Larger grids

### Common Patterns
- **Hide on mobile**: `hidden sm:inline`
- **Show on mobile only**: `sm:hidden`
- **Responsive grid**: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`

## Animation & Transitions

### Standard Transitions
- **Color transitions**: `transition-colors`
- **Opacity transitions**: `transition-opacity duration-200` or `duration-300`
- **Layout shifts**: Use opacity instead of removing elements from DOM

### Muted/Disabled State
```tsx
// Instead of removing elements, use:
className="pointer-events-none opacity-50"

// For hidden but layout-preserving:
className="pointer-events-none opacity-0"
```

## Profile Card Layout

### Standard Structure (2-row layout)
```tsx
<Card className="row-span-2 gap-3 py-3">
  <CardContent className="px-5 pt-2">
    {/* Row 1: Avatar + Username */}
    <div className="flex items-center gap-4">
      <Avatar className="size-16 shrink-0 border-2 border-primary/30">
        <AvatarImage src={avatarUrl} alt="" />
        <AvatarFallback className="rounded text-xl font-bold uppercase">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold truncate">{username}</h1>
        <p className="text-xs text-muted-foreground truncate">{email}</p>
        {joinedAt && (
          <p className="text-[10px] text-muted-foreground/70">
            Joined {new Date(joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </p>
        )}
      </div>
    </div>
    {/* Row 2: Level/XP bar — compact single row */}
    {points && points.totalXP > 0 ? (
      <div className="mt-4 flex items-center gap-3">
        <span className="text-lg font-bold tabular-nums text-primary">Lv. {points.level}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/80">
          <div className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all shadow-sm shadow-primary/30" style={{ width: `${points.progress}%` }} />
        </div>
        <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{points.totalXP.toLocaleString()} XP</span>
      </div>
    ) : (
      <p className="mt-4 text-[10px] text-muted-foreground">finish tests to earn xp</p>
    )}
  </CardContent>
</Card>
```

## Level Pill (Navbar)

```tsx
<span className="hidden sm:inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-primary">
  Lv. {level}
</span>
```

## Achievement Grid Tooltips

```tsx
<Tooltip key={achievement.id}>
  <TooltipTrigger asChild>
    <div>
      <AchievementBadge ... />
    </div>
  </TooltipTrigger>
  <TooltipContent side="top" className="max-w-[200px] text-center">
    <p className="font-medium">{achievement.name}</p>
    <p className="text-muted-foreground">{description}</p>
    {rarity != null && (
      <p className="text-muted-foreground">{rarity}% of users</p>
    )}
  </TooltipContent>
</Tooltip>
```

## Chart Tooltip Indicator

Charts use `ChartTooltipContent` with `indicator="dot"` to show colored dots matching the legend:

```tsx
<ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
```

The dot uses `h-2.5 w-2.5` with background color from the chart config.

## Key Principles

1. **Consistency**: Use the same patterns across all components
2. **Accessibility**: Include proper ARIA labels and semantic HTML
3. **Responsiveness**: Design mobile-first, enhance for larger screens
4. **Performance**: Use opacity transitions instead of DOM removal for layout stability
5. **Clarity**: Use clear labels and consistent terminology

## File Organization

- **Components**: `src/components/ui/` for reusable UI primitives
- **Layout**: `src/components/layout/` for app shell, nav, footer
- **Pages**: `src/app/` for route-based pages
- **Types**: `src/lib/types.ts` for shared TypeScript types
- **Utils**: `src/lib/utils.ts` for helper functions
