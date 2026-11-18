# Kano Design System

Guidelines for building the Kano UI (a Trello-like task management app). **This file is the source of truth for AI agents and humans writing frontend code.** A visual reference lives in `design-system.html`; open it to see every component below rendered.

Stack: Next.js (App Router), React, TypeScript, Tailwind CSS v4.

---

## 0. Rules for AI agents (read first)

1. **Flat means flat.** No gradients, no drop shadows, no glassmorphism, no inner shadows. Separate surfaces with a 1px border or a background-color step. The single exception is `shadow-overlay` (see §2.6).
2. **Use tokens, never raw values.** Do not write hex codes, arbitrary Tailwind values (`bg-[#fff]`, `p-[13px]`), or default palette colors (`bg-gray-100`, `text-blue-600`). Only use the token classes defined in §3.
3. **One primary action per view.** Exactly one `primary` button should be visible in a given region. Everything else is `secondary` or `ghost`.
4. **Friendly, not decorative.** Rounded corners (8px default), generous spacing, plain-language copy. No ornamental elements.
5. **4px spacing grid.** Only Tailwind spacing steps that map to the scale in §2.3.
6. **Every interactive element needs all states:** default, hover, active, focus-visible, disabled. Use the recipes in §4.
7. **Never rely on color alone** to convey meaning. Pair status colors with text or an icon.
8. **Reuse before creating.** Check `components/ui/` first. New UI primitives go there; feature-specific components go in `components/<feature>/`.
9. **Desktop-first board, responsive shell.** The board scrolls horizontally; the page does not. Columns stay a fixed width.
10. **No dark mode yet.** Do not add `dark:` variants until a dark theme is added to this document.

---

## 1. Principles

| Principle | What it means in practice |
|---|---|
| **Simple** | Few colors, few type sizes, few component variants. If a new variant is needed, justify it in this file first. |
| **Flat** | Depth comes from borders and tone, not shadows. |
| **Friendly** | Soft 8px corners, a warm-neutral gray scale, a bright but not harsh blue, short human copy ("Add a card", not "Create new task entity"). |
| **Calm** | The board is the content. Chrome (nav, toolbars) stays quiet; color is reserved for primary actions, labels, and status. |
| **Consistent** | Same radius, same spacing rhythm, same hover behavior everywhere. |

---

## 2. Design tokens

### 2.1 Color

#### Brand / primary (blue)

| Token | Hex | Usage |
|---|---|---|
| `primary-50` | `#EEF3FF` | Selected row/tab background, soft highlight |
| `primary-100` | `#DCE6FF` | Soft badge background, selected-card tint |
| `primary-200` | `#B9CCFF` | Focus halo on inputs, drag-over outline |
| `primary-500` | `#3D6BF2` | **Primary button default**, focus ring, progress fill |
| `primary-600` | `#2F57D6` | Primary hover, text links |
| `primary-700` | `#2547AD` | Primary active/pressed, text on `primary-50/100` |

#### Neutrals

| Token | Hex | Usage |
|---|---|---|
| `canvas` | `#F6F7F9` | App/page background (behind the board) |
| `surface` | `#FFFFFF` | Cards, modals, inputs, nav bar |
| `sunken` | `#EEF0F3` | Board columns, hover fill for ghost/secondary controls, disabled fill |
| `line` | `#E1E4EA` | Default 1px border and dividers |
| `line-strong` | `#CBD0DA` | Secondary button border, card hover border |
| `field` | `#848DA0` | **Form control borders** (input, textarea, select, checkbox, radio), switch "off" track. Meets 3:1 on `surface` |
| `ink` | `#1F2430` | Primary text, headings |
| `ink-muted` | `#4F586A` | Secondary text, descriptions, icons |
| `ink-subtle` | `#6B7385` | Placeholder, captions, disabled text. Never for essential info |

#### Semantic

| Token | Hex | Usage |
|---|---|---|
| `success` | `#0F7A55` | Success text/icons, "Done" accents |
| `success-soft` | `#E6F6EF` | Success banner/badge background |
| `warning` | `#F5B63D` | Warning indicator fill (use `warning-ink` for text on it) |
| `warning-soft` | `#FFF4DB` | Warning banner/badge background |
| `warning-ink` | `#7A5200` | Warning text |
| `danger` | `#D13438` | Destructive button, error border/icon |
| `danger-hover` | `#B52B2F` | Destructive hover |
| `danger-ink` | `#A6262A` | Error text on `danger-soft` |
| `danger-soft` | `#FDECEC` | Error banner/badge background |

#### Card label colors

Eight fixed pairs for task labels/tags. Each is a soft background with a dark foreground of the same hue. Assign by user choice, not by meaning.

| Name | `label-*-bg` | `label-*-fg` |
|---|---|---|
| green | `#DDF4E8` | `#0F6B49` |
| yellow | `#FFF1C2` | `#7A5200` |
| orange | `#FFE3CC` | `#8F4300` |
| red | `#FDE0E0` | `#A6262A` |
| purple | `#EBE3FB` | `#5B3BA8` |
| blue | `#DCE8FF` | `#2547AD` |
| teal | `#D5F3F1` | `#0B6B66` |
| pink | `#FCE1EF` | `#9C2A66` |

#### Color rules

- Page: `bg-canvas`. Cards/inputs/nav/modals: `bg-surface`. Columns: `bg-sunken`.
- Text on light surfaces is always `text-ink`, `text-ink-muted`, or `text-ink-subtle`. Text on `primary-500/600/700` and `danger` is `text-white`.
- Links are `text-primary-600 hover:text-primary-700 hover:underline`.
- Color usage budget per screen: neutrals first, one blue primary action, labels/status only where data requires.

### 2.2 Typography

Font: **Inter** (via `next/font/google`), fallback `ui-sans-serif, system-ui, sans-serif`. Weights used: 400, 500, 600. Do not use 700+.

| Role | Tailwind | Size / line-height | Weight | Color |
|---|---|---|---|---|
| Display (page hero, empty states) | `text-2xl font-semibold` | 30 / 36 | 600 | `ink` |
| H1 (page / board title) | `text-xl font-semibold` | 24 / 32 | 600 | `ink` |
| H2 (modal title, section) | `text-lg font-semibold` | 20 / 28 | 600 | `ink` |
| H3 (column title, card detail section) | `text-base font-semibold` | 16 / 24 | 600 | `ink` |
| Body (default everywhere) | `text-sm` | 14 / 20 | 400 | `ink` |
| Body strong / button / label | `text-sm font-medium` | 14 / 20 | 500 | `ink` |
| Secondary text | `text-sm text-ink-muted` | 14 / 20 | 400 | `ink-muted` |
| Caption / meta (due date, counts) | `text-xs` | 12 / 16 | 400–500 | `ink-muted` |

Rules: sentence case everywhere ("Add a card", never "ADD A CARD" or "Add A Card"). No underline except links on hover. Max line length for prose: `max-w-prose`. Truncate card titles at 3 lines (`line-clamp-3`).

### 2.3 Spacing (4px base)

| Step | px | Tailwind | Typical use |
|---|---|---|---|
| 1 | 4 | `1` | Icon-to-text gap in tight chips |
| 2 | 8 | `2` | Gap between cards, between buttons in a group |
| 3 | 12 | `3` | Card padding, input padding-x |
| 4 | 16 | `4` | Column padding, section gaps, modal body gaps |
| 6 | 24 | `6` | Panel padding, page gutters |
| 8 | 32 | `8` | Between major sections |
| 12 | 48 | `12` | Page top/bottom padding, empty states |

Do not use other steps (5, 7, 9, 10…) unless matching an existing element height.

### 2.4 Radius

| Token | px | Use |
|---|---|---|
| `rounded-sm` | 6 | Chips, labels, small badges, checkboxes |
| `rounded-md` | 8 | **Default**: buttons, inputs, cards |
| `rounded-lg` | 12 | Columns, modals, panels, toasts |
| `rounded-full` | 9999 | Avatars, pills, switches, progress bars |

### 2.5 Borders

- Default: `border border-line` (1px). Form controls: `border-field`. Secondary buttons: `border-line-strong`.
- Focus: **2px outline**, `outline-primary-500`, offset 2px (see §4). Never remove focus outlines.
- No borders thicker than 1px except focus and the "drag-over" indicator (2px dashed `primary-500`).

### 2.6 Elevation

Flat UI. Surfaces sit on the same plane.

| Level | Treatment |
|---|---|
| Base | `bg-canvas` |
| Raised (card, input, nav) | `bg-surface border border-line` |
| Inset (column, hover fill) | `bg-sunken` |
| Overlay (modal, dropdown, popover, toast, dragged card) | `bg-surface border border-line shadow-overlay` |

`shadow-overlay` (`0 8px 24px rgb(31 36 48 / 0.12)`) is the **only** shadow in the product, and only for things that float above the page.

### 2.7 Motion

- Hover/focus color transitions: `transition-colors duration-150 ease-out`.
- Overlay enter: fade + 4px translate, `duration-200`. Exit `duration-150`.
- Drag-and-drop: dragged card gets `rotate-2` and `shadow-overlay`; the placeholder in the list is a `border-2 border-dashed border-primary-200 bg-primary-50 rounded-md`.
- Respect `prefers-reduced-motion`: remove translate/rotate, keep opacity fades.
- No bounces, springs, or looping animations except a loading spinner.

### 2.8 Layout

- Top nav: 56px tall, `bg-surface border-b border-line`.
- Board: horizontal scroll, `p-6`, columns `gap-4`.
- Column: **fixed 288px** wide (`w-72`), `bg-sunken rounded-lg p-2`, cards `gap-2`.
- Card detail modal: `max-w-2xl` (672px), `rounded-lg`, `p-6`.
- Settings/forms pages: `max-w-xl` centered.
- Breakpoints: Tailwind defaults. Below `md`, the board shows one column at a time with a horizontal snap scroller.

---

## 3. Tailwind v4 theme (`app/globals.css`)

Paste this once. The `initial` resets remove Tailwind's default palette, radii, and shadows so off-system classes simply do not exist.

```css
@import "tailwindcss";

@theme {
  /* Reset defaults so only Kano tokens are available */
  --color-*: initial;
  --radius-*: initial;
  --shadow-*: initial;

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;

  /* Base */
  --color-white: #ffffff;
  --color-transparent: transparent;
  --color-current: currentColor;

  /* Primary */
  --color-primary-50: #eef3ff;
  --color-primary-100: #dce6ff;
  --color-primary-200: #b9ccff;
  --color-primary-500: #3d6bf2;
  --color-primary-600: #2f57d6;
  --color-primary-700: #2547ad;

  /* Neutrals */
  --color-canvas: #f6f7f9;
  --color-surface: #ffffff;
  --color-sunken: #eef0f3;
  --color-line: #e1e4ea;
  --color-line-strong: #cbd0da;
  --color-field: #848da0;
  --color-ink: #1f2430;
  --color-ink-muted: #4f586a;
  --color-ink-subtle: #6b7385;

  /* Semantic */
  --color-success: #0f7a55;
  --color-success-soft: #e6f6ef;
  --color-warning: #f5b63d;
  --color-warning-soft: #fff4db;
  --color-warning-ink: #7a5200;
  --color-danger: #d13438;
  --color-danger-hover: #b52b2f;
  --color-danger-ink: #a6262a;
  --color-danger-soft: #fdecec;

  /* Card labels */
  --color-label-green-bg: #ddf4e8;   --color-label-green-fg: #0f6b49;
  --color-label-yellow-bg: #fff1c2;  --color-label-yellow-fg: #7a5200;
  --color-label-orange-bg: #ffe3cc;  --color-label-orange-fg: #8f4300;
  --color-label-red-bg: #fde0e0;     --color-label-red-fg: #a6262a;
  --color-label-purple-bg: #ebe3fb;  --color-label-purple-fg: #5b3ba8;
  --color-label-blue-bg: #dce8ff;    --color-label-blue-fg: #2547ad;
  --color-label-teal-bg: #d5f3f1;    --color-label-teal-fg: #0b6b66;
  --color-label-pink-bg: #fce1ef;    --color-label-pink-fg: #9c2a66;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* The only shadow */
  --shadow-overlay: 0 8px 24px rgb(31 36 48 / 0.12);

  /* Type scale (Tailwind names, Kano sizes) */
  --text-xs: 0.75rem;   --text-xs--line-height: 1rem;
  --text-sm: 0.875rem;  --text-sm--line-height: 1.25rem;
  --text-base: 1rem;    --text-base--line-height: 1.5rem;
  --text-lg: 1.25rem;   --text-lg--line-height: 1.75rem;
  --text-xl: 1.5rem;    --text-xl--line-height: 2rem;
  --text-2xl: 1.875rem; --text-2xl--line-height: 2.25rem;
}

@layer base {
  html { background: var(--color-canvas); }
  body {
    font-family: var(--font-sans);
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: var(--color-ink);
    -webkit-font-smoothing: antialiased;
  }
  :focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
}
```

`app/layout.tsx` font setup:

```tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// <html lang="en" className={inter.variable}>
```

Tailwind v3 fallback: put the same values under `theme.colors`, `theme.borderRadius`, and `theme.boxShadow` in `tailwind.config.ts` (replace, don't `extend`) using the same key names.

---

## 4. Components

Recipes below use Tailwind classes. Copy them as-is; compose them with a small `cn()` helper (clsx + tailwind-merge).

### 4.1 Button

Shared base:
```
inline-flex items-center justify-center gap-2 rounded-md font-medium text-sm
transition-colors duration-150
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500
disabled:cursor-not-allowed
```

| Variant | Classes |
|---|---|
| **primary** | `bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:bg-sunken disabled:text-ink-subtle` |
| **secondary** | `bg-surface text-ink border border-line-strong hover:bg-sunken active:bg-line disabled:bg-sunken disabled:text-ink-subtle disabled:border-line` |
| **ghost** | `bg-transparent text-ink-muted hover:bg-sunken hover:text-ink active:bg-line disabled:text-ink-subtle disabled:hover:bg-transparent` |
| **danger** | `bg-danger text-white hover:bg-danger-hover active:bg-danger-ink disabled:bg-sunken disabled:text-ink-subtle` |

| Size | Classes | Height |
|---|---|---|
| sm | `h-8 px-3` | 32px |
| md (default) | `h-9 px-4` | 36px |
| lg | `h-11 px-5 text-base` | 44px (touch targets, auth pages) |
| icon | `size-9 p-0` (sm: `size-8`) | square; **must** have `aria-label` |

Rules: label is a verb or verb phrase ("Add card", "Save changes"). Loading state: replace the icon with a 16px spinner, keep label, set `aria-busy` and disable. Destructive actions use `danger` only in the final confirmation, not as the trigger button (trigger is `secondary` or a menu item).

Reference implementation:

```tsx
// components/ui/button.tsx
import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium text-sm transition-colors duration-150 disabled:cursor-not-allowed";
const variants = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:bg-sunken disabled:text-ink-subtle",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-sunken active:bg-line disabled:bg-sunken disabled:text-ink-subtle disabled:border-line",
  ghost: "bg-transparent text-ink-muted hover:bg-sunken hover:text-ink active:bg-line disabled:text-ink-subtle disabled:hover:bg-transparent",
  danger: "bg-danger text-white hover:bg-danger-hover active:bg-danger-ink disabled:bg-sunken disabled:text-ink-subtle",
} as const;
const sizes = { sm: "h-8 px-3", md: "h-9 px-4", lg: "h-11 px-5 text-base" } as const;

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ variant = "primary", size = "md", className, ...props }: Props) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
```

### 4.2 Text input, textarea, select

```
w-full rounded-md border border-field bg-surface px-3 text-sm text-ink
placeholder:text-ink-subtle
hover:border-ink-subtle
focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-500 focus-visible:border-primary-500
disabled:bg-sunken disabled:text-ink-subtle disabled:cursor-not-allowed
```
- Input height `h-9` (md) or `h-11` (lg). Textarea: `py-2 min-h-20`.
- **Label**: above the field, `text-sm font-medium text-ink mb-1`. Never use placeholder as the label.
- **Helper text**: `text-xs text-ink-muted mt-1`.
- **Error**: `border-danger focus-visible:outline-danger` + message `text-xs text-danger-ink mt-1` with an icon. Set `aria-invalid` and link the message with `aria-describedby`.
- Inline-edit fields (card title, list title) look like text until focused: `bg-transparent border-transparent hover:bg-sunken focus-visible:bg-surface focus-visible:border-primary-500`.

### 4.3 Checkbox, radio, switch

- Checkbox/radio: 16px, `rounded-sm` (radio `rounded-full`), `border border-field bg-surface`; checked `bg-primary-500 border-primary-500` with a white check. Label sits 8px to the right, `text-sm`.
- Switch: 36×20 pill. Off `bg-field`, on `bg-primary-500`, thumb is a 16px white circle. No shadow on the thumb.

### 4.4 Badge / label chip

Card label (colored, user-chosen):
```
inline-flex items-center h-5 px-2 rounded-sm text-xs font-medium
bg-label-{color}-bg text-label-{color}-fg
```
Status badge (system):

| Status | Classes |
|---|---|
| neutral | `bg-sunken text-ink-muted` |
| info | `bg-primary-100 text-primary-700` |
| success | `bg-success-soft text-success` |
| warning | `bg-warning-soft text-warning-ink` |
| danger | `bg-danger-soft text-danger-ink` |

Same shape as label chips but `rounded-full px-2.5`. Always include text; an optional 6px dot may precede it.

### 4.5 Avatar

Circle, `rounded-full`, initials `font-medium`, background a soft `label-*-bg` with matching `label-*-fg` (derive the color from a hash of the user id so it is stable). Sizes: 24 (`size-6 text-xs`), 32 (`size-8 text-xs`), 40 (`size-10 text-sm`). Stacks overlap by 6px (4px for the 24px size) with a 2px ring matching the parent surface (`ring-2 ring-surface -ml-1.5`; `-ml-1` for 24px) so initials are never clipped. If more than 4, show a `+N` avatar in `bg-sunken text-ink-muted`.

### 4.6 Task card

```
rounded-md border border-line bg-surface p-3
hover:border-line-strong
focus-visible:outline-2 focus-visible:outline-primary-500
cursor-pointer transition-colors duration-150
```
Anatomy, top to bottom, `gap-2`:
1. Labels row (optional): up to 3 chips, then `+N`.
2. Title: `text-sm font-medium text-ink`, `line-clamp-3`.
3. Meta row (optional): `text-xs text-ink-muted`, icon + count items (comments, checklist `2/5`, attachments), due date chip on the left, avatar stack on the right.

Due date chip: neutral by default; `bg-warning-soft text-warning-ink` when due within 24h; `bg-danger-soft text-danger-ink` when overdue; `bg-success-soft text-success` when completed. Always show the date text.

States: **selected** `border-primary-500 bg-primary-50`; **dragging** `rotate-2 shadow-overlay border-primary-200`; **placeholder** (where it will land) `border-2 border-dashed border-primary-200 bg-primary-50`.

### 4.7 Column (list)

```
w-72 shrink-0 rounded-lg bg-sunken p-2 flex flex-col gap-2
```
- Header: `px-2 py-1`, title `text-base font-semibold`, count `text-xs text-ink-muted` in a `bg-surface rounded-full px-2` pill, and a ghost icon button (more).
- Body: scrollable (`overflow-y-auto`), cards `gap-2`.
- Footer: full-width ghost button "＋ Add a card" (`justify-start text-ink-muted`). Clicking it swaps for an inline textarea + `primary sm` "Add card" and `ghost sm` "Cancel".
- Drag-over column: add `outline-2 outline-dashed outline-primary-200`.

### 4.8 Navbar

`h-14 bg-surface border-b border-line px-4 flex items-center gap-4`. Left: logo mark (24px, `bg-primary-500 rounded-md` with white "K") + product name `text-base font-semibold`. Center/left: board switcher (`ghost`). Right: search input (`sm`), primary "Create" button, avatar. No shadow under the nav.

### 4.9 Modal / dialog

- Overlay: `fixed inset-0 bg-ink/40` (solid tint, no blur).
- Panel: `bg-surface rounded-lg border border-line shadow-overlay p-6 max-w-2xl w-full`.
- Header: H2 title + ghost icon close button (top-right, `aria-label="Close"`).
- Footer: right-aligned, `gap-2`; secondary "Cancel" then primary action.
- Trap focus, close on `Esc` and overlay click (except when there are unsaved changes), return focus to the trigger.

### 4.10 Dropdown / popover menu

`bg-surface rounded-lg border border-line shadow-overlay p-1 min-w-48`. Items: `h-8 px-2 rounded-md text-sm text-ink hover:bg-sunken flex items-center gap-2`. Destructive item: `text-danger-ink hover:bg-danger-soft`. Divider: `my-1 h-px bg-line`.

### 4.11 Toast

`bg-surface border border-line shadow-overlay rounded-lg p-3 flex gap-3 items-start w-80`. Leading 16px icon colored by type (`success`, `danger`, `primary-500`), title `text-sm font-medium`, optional description `text-sm text-ink-muted`. Auto-dismiss after 5s (errors persist until dismissed). Bottom-right, stacked with `gap-2`.

### 4.12 Alert / inline banner

`rounded-md px-3 py-2 text-sm flex gap-2` with `bg-{type}-soft` and matching text (`text-success`, `text-warning-ink`, `text-danger-ink`, `text-primary-700` on `bg-primary-50`). Include an icon and text.

### 4.13 Tabs

Underline style: container `border-b border-line flex gap-4`; tab `h-10 text-sm font-medium text-ink-muted hover:text-ink`; active `text-ink border-b-2 border-primary-500 -mb-px`. Use `role="tablist"`.

### 4.14 Progress bar (checklists)

Track `h-2 rounded-full bg-sunken`, fill `bg-primary-500 rounded-full`; at 100% fill becomes `bg-success`. Show the numeric value (`3/5` or `60%`) next to it.

### 4.15 Tooltip

`bg-ink text-white text-xs rounded-md px-2 py-1`, no arrow shadow, appear after 400ms. Use only to label icon buttons or truncated text.

### 4.16 Empty state

Centered, `py-12`, simple 48px outline icon in `text-ink-subtle`, H3 title, one line of `text-ink-muted` explaining the next step, one primary button. Example: "No cards yet" / "Add your first card to start planning." / **Add a card**.

### 4.17 Skeleton / loading

`bg-sunken rounded-md animate-pulse`; match the shape of the real content. Buttons show a spinner; pages show skeleton columns and cards.

---

## 5. Iconography

- Library: **lucide-react**. Stroke 1.5–2px, `size-4` (16px) inline with text, `size-5` (20px) in icon buttons, `size-12` in empty states.
- Icons inherit `currentColor`; default `text-ink-muted`.
- Icon-only buttons need `aria-label` and a tooltip.

---

## 6. Accessibility checklist

- Text contrast ≥ 4.5:1 and form-control borders ≥ 3:1. The documented text/background pairs were checked with a WCAG contrast script and pass (lowest: white on `primary-500` at 4.58:1, `success` on `success-soft` at 4.78:1, `field` border on `surface` at 3.33:1). Do not combine tokens outside the documented pairs. `text-ink-subtle` is for placeholders, captions on `surface`, and disabled text only (disabled text is exempt from the ratio, but never put essential info in it).
- Visible `:focus-visible` outline on everything interactive. Never `outline-none` without a replacement.
- Hit areas ≥ 32px (`sm`) on desktop, ≥ 44px on touch contexts.
- Drag and drop must have a keyboard alternative (a card menu with "Move to…" and arrow-key reordering).
- Announce async results with `aria-live="polite"` (toasts).
- Use semantic elements: `button`, `a`, `ul/li` for lists of cards, `dialog` or `role="dialog"` + `aria-modal` for modals.

---

## 7. Voice and copy

- Plain, warm, short. Use "you" and "your". Sentence case.
- Buttons: verbs ("Create board", "Save", "Archive"). Avoid "OK" and "Submit".
- Errors: say what happened and what to do. "We couldn't save your changes. Check your connection and try again."
- Empty states: encourage, don't scold.
- Confirmations for destructive actions name the thing: "Delete 'Launch plan'? This can't be undone."

---

## 8. File and code conventions

```
components/
  ui/            # primitives: button, input, badge, avatar, modal, toast, tabs…
  board/         # board, column, task-card, add-card-form
  layout/        # navbar, shell
lib/cn.ts        # clsx + tailwind-merge
app/globals.css  # tokens (§3)
```

- Primitives accept `className` and forward refs; they never hard-code margins.
- Compose variants with a `variants` object (see §4.1). Do not introduce `class-variance-authority` unless asked.
- Colors, radii, and shadows in components must resolve to tokens in §3. A PR or agent output containing `#hex`, `rgb(`, `bg-gray-*`, `shadow-md`, or `rounded-xl` is wrong.

---

## 9. Quick do / don't

| Do | Don't |
|---|---|
| Separate surfaces with a border or `bg-sunken` | Add `shadow-sm` to cards |
| One primary button per region | Two blue buttons side by side |
| `rounded-md` on buttons, inputs, cards | Mix `rounded-xl`, `rounded-none`, and `rounded-md` in one view |
| Soft label chips with dark text | Saturated solid-color tags with white text |
| Pair status color with text/icon | Show overdue as just a red dot |
| Use `text-sm` for most UI text | Introduce 13px, 15px, or other off-scale sizes |
| Keep copy short and human | Use ALL CAPS or jargon |

---

## 10. Changelog

- **v1.0**: initial system: tokens, Tailwind v4 theme, 17 component specs, accessibility and copy rules.
