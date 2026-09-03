# zentype UI Style Guide

Design patterns for the zentype codebase. Follow these when creating or modifying components.

## Design Principles

1. **Mobile-first**: Design for mobile first, enhance for larger screens
2. **Lowercase**: All UI text uses lowercase (headings, labels, buttons, toasts)
3. **Consistency**: Use the same primitives and radius language across every surface
4. **Accessibility**: Include ARIA labels, focus-visible rings, and semantic HTML
5. **Themeable**: Colors come from CSS variables that swap per theme, never hardcoded hex

## Theme System

- 203 themes defined in `src/lib/themes.ts`, each a full palette of CSS variables
- A theme is applied by setting `data-theme` on `<html>`; appearance is set via `data-appearance="dark" | "light"` (dark is the default color-scheme)
- Components consume tokens with Tailwind utilities like `bg-primary`, `text-muted-foreground`, `border-border`, never raw colors
- Themes are grouped dark/light and shared through the theme picker, settings, and command palette

### Color Tokens

Core surface + text tokens (from each theme's `vars`):

- `--background` / `--foreground` → `bg-background`, `text-foreground`
- `--card` / `--card-foreground` → `bg-card`, `text-card-foreground` (cards, popovers)
- `--popover` / `--popover-foreground` (dialogs, dropdowns, command palette)
- `--primary` / `--primary-foreground` (accents, highlights, active items, WPM value)
- `--secondary` / `--secondary-foreground` (pill rails, badge fills, alternate accent)
- `--muted` / `--muted-foreground` (secondary text, labels, descriptions, skeletons)
- `--destructive` (danger, error text, destructive actions)
- `--border` / `--input` / `--ring` (borders, focus rings)

Special-purpose tokens (fixed in `globals.css`, same across themes):

- `--info` (freeze days, informational), `--success` (positive deltas)
- `--rank-1`, `--rank-2`, `--rank-3` (leaderboard crowns: gold / silver / bronze)
- `--chart-1` through `--chart-5` (charts; `chart-5` is reserved for error bars and matches `--destructive`)

### Color Usage

- **Active / highlighted**: `text-primary font-medium` (optionally `bg-primary/10`)
- **Inactive items**: `text-muted-foreground hover:text-foreground hover:bg-muted`
- **Disabled**: `disabled:opacity-50` (primitives handle it) or `opacity-40 pointer-events-none`
- **Card surface**: `bg-card shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10`
- **Level / XP / rank accents**: `text-primary` values, `bg-primary/10` icon chips
- **Destructive actions**: the `destructive` button/badge variants, which render as tinted fills (`bg-destructive/10 text-destructive`)

## Radius Language

Radii are fixed on a rounded scale; never mix raw `rounded` values into new code without matching these tiers:

| Tier | Class | Used by |
|---|---|---|
| Large | `rounded-4xl` | `Card`, `Button` (all variants), `Dialog` / `AlertDialog` content, dropdown & select menus |
| Medium | `rounded-3xl` | `Badge`, `Skeleton`, `PillGroup`, `SelectTrigger`, `ComboboxSelect`, toasts |
| Small | `rounded-2xl` | dropdown/select/command items, small stat cards, empty states |
| Full | `rounded-full` | avatars, tabs + pills (active chip), `Kbd`, progress track |

## Typography

### Font Families (88 fonts)

- Defined in `src/lib/fonts.ts` and registered in `globals.css` as `--font-*` theme entries
- Applied by setting `data-font` on `<html>` (the app shell does this from settings)
- Defaults: `stack-sans-text` (sans). Categories: sans (inter, dm-sans, work-sans, sora, and others), serif (lora, merriweather, and others), mono (geist-mono, jetbrains-mono, fira-code, and others), display/cursive (lobster, pacifico, caveat, and others)
- `font-mono` maps to Geist Mono; `font-heading` is used by `CardTitle` / `DialogTitle`

### Font Sizes

- **Tiny tracking labels**: `text-[9px]` / `text-[10px]` (`font-bold tracking-widest`, often uppercase) for badges, save state, rank chips
- **Secondary / hints**: `text-xs` (descriptions, muted copy, save hint)
- **Body / settings rows**: `text-sm`
- **Section titles**: `text-sm font-semibold tracking-wider`
- **Page titles**: `text-lg font-semibold`
- **Headline numbers**: `text-2xl` up to `text-5xl` (`font-bold tabular-nums`) for wpm/acc/stats
- **Hero numbers**: up to `text-7xl sm:text-8xl` (achievement count)

### Typography Patterns

- **Page titles**: `text-lg font-semibold`, inline filled icon `text-primary size-5`, lowercase
- **Card/section titles**: `text-sm font-semibold tracking-wider`, inline outline icon `size-4`, lowercase
- **Numbers**: always `tabular-nums`, usually `font-bold`; primary values get `text-primary`
- **Board labels**: `text-[10px] font-bold tracking-widest uppercase text-muted-foreground`

## Icon System

- **Package**: `@tabler/icons-react`, named imports
- **Filled variants** (`IconXxxFilled`) for page headers, nav, and the logo: `IconKeyboardFilled`, `IconTrophyFilled`, `IconUserFilled`, `IconSettingsFilled`, `IconLockFilled`, `IconFileTextFilled`
- **Outline variants** for content, card titles, menu items, buttons
- **Sizes** (via `size-*` classes): `size-5` headers/nav, `size-4` card titles/items, `size-3.5` inline with small text, `size-3` tiny badges/inline
- Inline icons in headings take `text-primary` when filled (headers) and inherit otherwise

## Layout System

### Page Container (secondary pages)

```tsx
<div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
  <header className="flex items-center justify-between">
    <h1 className="flex items-center gap-2 text-lg font-semibold">
      <IconXxxFilled className="text-primary size-5" /> page title
    </h1>
  </header>
  {/* content */}
</div>
```

### Widths

- **Main content**: `max-w-4xl` (profile, settings, leaderboard, about, terms, privacy)
- **Test page**: `max-w-5xl` while typing; the result view is `max-w-4xl`
- **Dialogs**: `max-w-md` default, `sm:max-w-2xl` command palette

### Spacing

- Page padding `px-4 py-8`; internal section gap `gap-5`
- Card internals: `gap-3`, padding `px-4`/`px-5`, section cards use `py-4`
- Between content cards: `gap-4` grids (`md:grid-cols-2`, `md:grid-cols-[1fr_auto]`, etc.)

## Component Patterns

### Card

The base `Card` supplies the surface (`bg-card rounded-4xl shadow-md ring-1 ring-foreground/5`) and its own vertical rhythm via `--card-spacing`. Compose content on top:

```tsx
<Card className="gap-3 py-4">
  <CardHeader className="px-4">
    <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider">
      <IconName className="size-4" /> section title
    </CardTitle>
  </CardHeader>
  <CardContent className="px-4">{/* content */}</CardContent>
</Card>
```

Small nested stat tiles override the radius down:

```tsx
<Card size="sm" className="rounded-2xl items-center py-3 text-center transition-all
  ring-primary/20 hover:ring-primary/40">
  <CardContent className="flex flex-col items-center gap-1 px-3">
    <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">label</span>
    <span className="text-2xl font-bold tabular-nums text-primary">value</span>
  </CardContent>
</Card>
```

### Buttons

`Button` is `rounded-4xl` in every variant; sizes `xs | sm | default | lg | icon | icon-sm | icon-lg`:

- Primary: `variant="default"` (solid primary)
- Neutral call to action: `variant="secondary"`
- Secondary: `variant="outline"` (border + background), `variant="ghost"`
- Destructive: `variant="destructive"` (tinted red fill, use for delete/reset actions)
- Text link: `variant="link"` (primary underline on hover, e.g. "back to typing")

For link-style labels ("back to typing", "sign in"): `variant="link" size="sm" asChild className="h-auto gap-1 p-0 text-xs"` wrapping a `Link`.

### Tabs and Pills (segmented controls)

Settings tabs and the config bar both use pill rails. `TabsList` is `rounded-full bg-muted p-1` with the active `TabsTrigger` lifting onto a `bg-background` chip:

```tsx
<TabsList className="w-full sm:w-fit">
  <TabsTrigger value="account" className="flex-1 gap-1.5 sm:flex-none">
    <IconUser className="size-4" /> <span className="hidden min-[480px]:inline">account</span>
  </TabsTrigger>
</TabsList>
```

`PillGroup` / `PillButton` (config bar, theme filter) use the same rail language: rail `rounded-3xl bg-muted p-[3px] gap-1`, active pill `bg-background text-foreground shadow-sm rounded-full`.

### Badges

```tsx
// Save-state / status badge
<Badge variant={variant} className="text-[9px]">{label}</Badge>

// Level / rank chip
<Badge variant="secondary" className="text-[9px] font-bold tracking-widest">#{rank}</Badge>

// Mode chip (secondary tint)
<Badge variant="outline" className="border-secondary bg-secondary text-secondary-foreground
  h-5 text-[10px] font-medium normal-case">{modeLabel(result)}</Badge>
```

### Progress / XP Bar

```tsx
<Progress
  value={progress}
  className="h-1.5 flex-1 bg-muted/80"
  indicatorClassName="bg-gradient-to-r from-primary/80 to-primary
    shadow-sm shadow-primary/30 transition-all"
/>
```

### Kbd (keyboard shortcuts)

`Kbd` is a small `rounded-lg bg-muted` chip (key caps stay small-radius even around pill/button rails). Inside a primary button it inverts: `border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground`.

### Skeletons

`Skeleton` is `rounded-3xl animate-pulse bg-muted`. Match the loaded shape: `h-7 w-4/5` text lines, `h-56 w-full` chart area, `h-28 w-full rounded-2xl` stat tiles.

### Empty States

```tsx
<div className="flex h-40 items-center justify-center rounded-2xl border
  border-dashed border-border/60 text-xs text-muted-foreground">
  empty state message
</div>
```

### Avatars

`Avatar` is always `rounded-full` with a subtle `after:border` ring; customize via className (`size-16 border-2 border-primary/30` on profile). Fallback initials: `rounded-full text-xl font-bold uppercase`.

## App Shell

### Header (all breakpoints)

- Sticky top: `bg-background/80 backdrop-blur-xl`, `h-12`, max-width `max-w-5xl` inner row, `shadow-sm`
- Nav (desktop): icon-only pill links `rounded-3xl p-1.5`, tooltips; active `text-primary`, inactive `text-muted-foreground hover:text-foreground hover:bg-muted`; `alt+1..4` shortcuts
- Right cluster: "commands" (`ctrl/cmd+k`) button and the user menu avatar/dropdown (or "sign in")

### Mobile Bottom Nav

- In normal document flow (not fixed) below `<main>`, visible only under `md`
- `shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-xl`, row `h-14`, `justify-around`
- Items: icon + `text-[10px]` label, active `text-primary`
- `main` owns the scroll (`flex-1 overflow-y-auto`) inside a `h-dvh` flex column

### Footer

- `text-[11px] text-muted-foreground`; links row centered on mobile, `sm:justify-start`
- Theme and font `ComboboxSelect`s on the right, hidden below `sm`

## Dialog Language

Overlays share primitives with `rounded-4xl` content, `ring-1 ring-foreground/5`, and lowercase text:

- **Confirm actions**: destructive actions live behind an `AlertDialog` with cancel + confirm. Irreversible ones require typing the full phrase ("yes, delete my account") before the confirm button enables. See `delete-account-dialog.tsx` for the pattern
- **Command palette**: `CommandDialog className="sm:max-w-2xl max-h-[80vh]"`; groups, `CommandItem` rows `rounded-2xl`, destructive items `text-destructive focus:text-destructive`
- **Settings rows**: label + hint on the left, control on the right (`SettingRow` pattern)

## Confirmation Dialogs

Shared pattern (settings and command palette): controlled `open` + `onOpenChange`; cancel keeps the palette open, confirm only fires the action:

```tsx
<AlertDialog open={open} onOpenChange={onOpenChange}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>title?</AlertDialogTitle>
      <AlertDialogDescription>what happens, and that it can't be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>cancel</AlertDialogCancel>
      <Button variant="destructive" onClick={handleConfirm}>confirm</Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Typing Page

- Layout: `mx-auto flex w-full flex-1 flex-col max-w-5xl px-4 py-6`
- Config bar: `PillGroup`s for mode/time/words and punct/nums toggles; while a test runs it locks with `pointer-events-none opacity-40`
- Live stats: wpm in `text-primary`, sizes `text-2xl sm:text-3xl`; hide via `opacity-0 pointer-events-none` (layout-preserving) when "hide live stats"/"hide progress" is on
- Words surface: relative container with rounded panel; an unfocused overlay shows "click here or press any key to focus"
- Progress bar under the stats row when running
- Result view: `max-w-4xl`; headline numbers `text-4xl sm:text-5xl`; meta chips row (mode, punct/nums, save state); wpm chart `h-56`; 3/6 mini stat tiles; footer row left = guest "sign in" hint, right = "next test" button

## Animation & Motion

- Theme switching transitions colors on `<html>` (`0.3s`); page enter fades via `.zt-page-enter`; result view and finish states fade via `.zt-fade-in`
- Prefer opacity + `pointer-events-none` for hiding without layout shift
- `transition-all` for pills/hover surfaces, `transition-colors` where only color changes

## Key Principles

1. **Lowercase everywhere**, including buttons and toasts
2. **Themed tokens only**: no hardcoded colors in components
3. **Filled icons for headers/nav, outline for content**
4. **Radius tiers**: `4xl` surfaces, `3xl` pills/badges, `2xl` items, `full` chips/avatars
5. **Card surfaces**: rely on `Card`, `shadow-md ring-1 ring-foreground/5`
6. **Numbers**: `tabular-nums font-bold`, primary values `text-primary`
7. **Confirmation**: destructive actions always get a dialog, and destructive ones need typed confirmation
8. **Mobile-first**, with the layout-preserving hidden pattern

## File Organization

- `src/components/ui/` reusable primitives (button, card, badge, dialog, command, charts, streak calendar, etc.)
- `src/components/layout/` app shell, command palette, help dialog
- `src/components/typing/` typing display, config bar, result view, virtual keyboard
- `src/lib/themes.ts` theme palettes, `src/lib/fonts.ts` font list, `src/lib/types.ts` shared types
- `src/app/` route pages; `src/server/` server actions; `src/stores/` Zustand stores
