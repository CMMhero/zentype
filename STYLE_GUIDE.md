# zentype UI Style Guide

Design patterns for the zentype codebase. Follow these when creating or modifying components.

## Design Principles

1. **Mobile-first**: Design for mobile first, enhance for larger screens
2. **Lowercase**: All UI text uses lowercase (headings, labels, buttons)
3. **Consistency**: Use the same patterns across all components
4. **Accessibility**: Include proper ARIA labels and semantic HTML
5. **Clean**: Minimal borders, subtle gradients, clear hierarchy

## Color System

### Theme Colors (80+ themes)
- **Primary**: `text-primary` / `bg-primary` — Main actions, highlights, important values
- **Muted**: `text-muted-foreground` / `bg-muted` — Secondary text, labels, descriptions
- **Destructive**: `text-destructive` — Error states, incorrect inputs
- **Chart colors**: `text-chart-1` through `text-chart-5` — Data visualization
- **Card**: `bg-card` — Card backgrounds
- **Border**: `border-border` — Subtle borders

### Color Usage
- **Active/highlighted items**: `text-primary font-medium`
- **Inactive items**: `text-muted-foreground hover:text-foreground hover:bg-muted`
- **Disabled/muted state**: `opacity-50 pointer-events-none`
- **Cards**: `bg-card` with `border border-border/30` or gradient `bg-gradient-to-br from-card to-muted/30`
- **Badges**: `bg-primary/10 text-primary` for level/XP indicators
- **Success states**: `text-chart-3` (green)
- **Error states**: `text-destructive`

## Typography

### Font Families (50+ fonts)
- Default: `geist-mono` (monospace)
- Sans options: inter, dm-sans, space-grotesk, work-sans, etc.
- Serif options: lora, merriweather, crimson-pro, etc.
- Mono options: jetbrains-mono, fira-code, cascadia-code, etc.
- Applied via `data-font` attribute on `<html>`

### Font Sizes (Tailwind classes)
- **Extra small labels**: `text-[10px]` or `text-[9px]` — Tracking badges, stats labels
- **Small text**: `text-xs` — Secondary info, descriptions
- **Body text**: `text-sm` — Normal content, card titles
- **Large headings**: `text-lg` — Page titles with icons
- **Section headings**: `text-base` — Subsection titles
- **Extra large numbers**: `text-2xl` to `text-5xl` — Stats, WPM displays

### Typography Patterns
- **Page titles**: `text-lg font-semibold` with icon, lowercase
- **Card titles**: `text-sm font-semibold tracking-wider` with icon, lowercase
- **Section headings**: `text-base font-semibold` lowercase
- **Stats values**: `text-xl font-bold tabular-nums text-primary`
- **Stat card labels**: `text-sm font-semibold tracking-wider` lowercase
- **Badges/labels**: `text-[10px] font-bold tracking-widest`
- **Small labels**: `text-[10px] tracking-wider text-muted-foreground`

### Lowercase Convention
All user-facing text uses lowercase:
- Page titles: "settings", "profile", "leaderboard", "about zentype"
- Card titles: "personal bests", "achievements", "activity"
- Section headings: "community stats", "features", "credits"
- Button labels: "restore defaults", "view public profile"
- Tab labels: "gameplay", "appearance", "account", "keybinds"

## Icon System

### Library
- **Package**: `@tabler/icons-react`
- **Usage**: Named imports from the package

### Icon Sizes
- **Page header icons**: `size-5` (20px) — Filled variant
- **Card/section icons**: `size-4` (16px) — Outline variant
- **Small inline icons**: `size-3.5` (14px) — Inline with text
- **Tiny icons**: `size-3` (12px) — Very compact spaces

### Filled vs Outline Icons
**Filled icons** (use for primary/emphasis):
- Page headers: `IconKeyboardFilled`, `IconTrophyFilled`, `IconUserFilled`, `IconSettingsFilled`, `IconInfoCircleFilled`, `IconFileTextFilled`, `IconLockFilled`
- Logo: `IconKeyboardFilled`
- Navigation: All nav icons are filled
- User dropdown menu items: `IconUserFilled`, `IconSettingsFilled`
- Inline zentype mentions: `IconKeyboardFilled` with `size-3.5`

**Outline icons** (use for secondary/content):
- Feature cards: `IconKeyboard`, `IconTrophy`, `IconAward`, `IconChartBar`, `IconPalette`, `IconBrandGithub`
- Stat card icons: `IconTrendingUp`, `IconGauge`, `IconTarget`, `IconStopwatch`
- Card section icons: `IconClock`, `IconAward`, `IconTrophy`
- Settings tabs: `IconDeviceGamepad2`, `IconPalette`, `IconUser`, `IconKeyboard`
- Settings section icons: `IconVolume`, `IconEye`, `IconDownload`
- Command palette items: Various outline icons

### Icon + Text Patterns
```tsx
// Page header (filled, size-5)
<IconNameFilled className="text-primary size-5" /> page title

// Card/section title (outline, size-4)
<IconName className="size-4" /> section title

// Inline with text (size-3.5)
<IconKeyboardFilled className="text-primary size-3.5 inline" /> zentype

// Stat card (outline, size-4)
<IconName className="size-4" /> stat label
```

## Layout System

### Page Container
```tsx
<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
  <header className="flex items-center justify-between">
    <h1 className="flex items-center gap-2 text-lg font-semibold">
      <IconFilled className="text-primary size-5" /> page title
    </h1>
  </header>
  {/* content */}
</div>
```

### Standard Widths
- **Main content**: `max-w-4xl` (profile, settings, leaderboard, about, terms, privacy)
- **Test page**: `max-w-5xl` (during test), full width (idle/results)
- **Dialogs**: `sm:max-w-xl` or `sm:max-w-2xl`

### Spacing
- **Page padding**: `px-4 py-8`
- **Section gap**: `gap-6`
- **Card gap**: `gap-3` or `gap-4`
- **Internal card padding**: `px-4` or `px-5`

## Component Patterns

### Cards
```tsx
<Card className="gap-3 py-4">
  <CardHeader className="px-4">
    <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
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
        <span className="flex items-center gap-1.5 text-sm font-semibold tracking-wider">
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

### Buttons
- **Primary action**: `variant="default"` or `variant="secondary"`
- **Outline action**: `variant="outline"`
- **Ghost action**: `variant="ghost"`
- **Link action**: `variant="link"` with `className="h-auto p-0"`
- **Small buttons**: `size="sm"`

### Badges
```tsx
// Level/XP badge
<Badge variant="secondary" className="text-[10px]">Lv. {level}</Badge>

// Rank badge
<span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-primary">
  #{rank}
</span>

// Status badge
<Badge variant={variant} className="text-[9px]">{label}</Badge>
```

### Progress Bars
```tsx
<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
  <div className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all shadow-sm shadow-primary/30" 
       style={{ width: `${progress}%` }} />
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
// Skeleton with gradient background
<Skeleton className="h-4 w-20" />

// Card skeleton
<Skeleton className="h-28 w-full rounded-lg" />
```

## Navigation

### Desktop Header
- **Height**: `h-12`
- **Background**: `bg-background/80` with `backdrop-blur-xl`
- **Border**: none (clean look)
- **Max width**: `max-w-5xl`
- **Logo**: `IconKeyboardFilled` + "zentype" text
- **Nav**: Icon-only with tooltips, `gap-2.5`

### Mobile Bottom Nav
- **Fixed**: `fixed inset-x-0 bottom-0 z-50`
- **Height**: `h-14`
- **Background**: `bg-background/95` with `backdrop-blur-xl`
- **Border**: `border-t border-border/40`
- **Items**: Icon + label in column layout
- **Active**: `text-primary`
- **Inactive**: `text-muted-foreground`

### Footer
- **Text size**: `text-[11px]`
- **Centered on mobile**: `justify-center sm:justify-start`
- **Theme/font pickers**: hidden on mobile (`hidden sm:flex`)

### Navigation Links (Desktop)
```tsx
<Link
  href={item.to}
  aria-label={item.label}
  className={`rounded p-1.5 transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
>
  <item.icon className="size-5" stroke={1} />
</Link>
```

## Dialogs & Modals

### Dialog Structure
```tsx
<DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
  <DialogHeader>
    <DialogTitle className="flex items-center gap-2">
      <IconName className="size-4" /> title
    </DialogTitle>
  </DialogHeader>
  {/* content */}
</DialogContent>
```

### Command Palette
- Uses `CommandDialog` with `className="sm:max-w-2xl max-h-[80vh]"`
- Icons: Outline variants with `size-4`
- Keyboard shortcuts: `<Kbd>` component

## Responsive Design

### Breakpoints
- **Mobile first**: Default styles
- **min-[480px]**: Show tab labels on settings
- **sm** (640px): Show/hide elements, footer pickers
- **md** (768px): Grid layouts, hide mobile nav

### Common Patterns
- **Hide on mobile**: `hidden sm:inline`
- **Show on mobile only**: `sm:hidden`
- **Mobile full width**: `w-full sm:w-auto`
- **Equal width on mobile**: `grid grid-cols-2 sm:grid-cols-none sm:flex`

### Config Bar (Mobile)
- Uses CSS grid for equal-width selectors
- Mode and amount selectors always same width on mobile

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
      </div>
    </div>
    {/* Row 2: Level/XP bar — compact single row */}
    <div className="mt-4 flex items-center gap-3">
      <span className="text-lg font-bold tabular-nums text-primary">Lv. {points.level}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/80">
        <div className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all" style={{ width: `${points.progress}%` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{points.totalXP.toLocaleString()} XP</span>
    </div>
  </CardContent>
</Card>
```

## Achievement Grid

### Grid Layout
- **Desktop**: 4 columns (`grid-cols-4`)
- **Mobile**: 2 columns (`grid-cols-2`)
- **Gap**: `gap-2` (sm) or `gap-3` (default)

### Achievement Badge Sizes
- **xs**: `h-20 w-20`
- **sm**: `h-28 w-full` (used in profile grids)
- **default**: `h-32 w-full`

## Charts

### WPM Chart
- Height: `h-56` (default) or `h-40 sm:h-56` (compact)
- Uses `ComposedChart` with Area + Bar
- Tooltip: `<ChartTooltipContent indicator="dot" />`

### Chart Tooltip
- Shows colored dot matching legend
- Label formatter for time: `labelFormatter={(l) => \`${l}s\`}`

## Key Principles

1. **Lowercase everywhere**: All UI text is lowercase
2. **Filled icons for headers**: Page headers and navigation get filled variants
3. **Outline icons for content**: Cards, sections, features get outline variants
4. **Mobile-first**: Design for mobile, enhance for desktop
5. **Consistent spacing**: Standard gap and padding values
6. **Subtle gradients**: Cards use `bg-gradient-to-br from-card to-muted/30`
7. **Tabular nums**: Always use `tabular-nums` for numbers
8. **Truncation**: Use `truncate` for overflow text

## File Organization

- **Components**: `src/components/ui/` for reusable UI primitives
- **Layout**: `src/components/layout/` for app shell, nav, footer
- **Pages**: `src/app/` for route-based pages
- **Types**: `src/lib/types.ts` for shared TypeScript types
- **Utils**: `src/lib/utils.ts` for helper functions
- **Themes**: `src/lib/themes.ts` for 80+ color palettes
