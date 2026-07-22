# Minimal UI — Design System (Canonical)

This is the **active** design system for CRM AgroSol. All UI work must follow these guidelines.

## Principles

- Clean, minimalist, light interface
- Subtle 1px borders (`#e5e7eb`), soft shadows, rounded corners
- Sentence case typography — avoid ALL CAPS except where legally required
- Neutral gray background (`#f9fafb`) with white cards
- AgroSol red (`#e31e24`) as the single strong accent

## Tokens

Defined in `src/app/globals.css` (`@theme inline`):

| Token | Value | Usage |
|-------|-------|-------|
| `--color-background` | `#f9fafb` | Page background |
| `--color-outline` | `#e5e7eb` | Borders, dividers |
| `--color-primary` | `#e31e24` | CTAs, active states |
| `--color-primary-container` | `#fef2f2` | Active nav, alert cards |
| `--radius-md` | `0.5rem` | Buttons, inputs |
| `--radius-lg` | `0.75rem` | Cards, modals |

## Utility classes

| Class | Purpose |
|-------|---------|
| `.ui-border` / `.industrial-border` | Card border (legacy name kept for compat) |
| `.ui-shadow` / `.industrial-shadow` | Soft card shadow |
| `.btn-primary` | Red filled button |
| `.btn-secondary` | White outlined button |
| `.table-header` | Light gray table `<thead>` |

**Do not** restore thick black borders, hard offset shadows, or black table headers.

## Layout

- `AppShell` → white sidebar, gray page background
- Active nav: `bg-primary-container text-primary` (soft red tint)
- Tables: light header row, no zebra striping

## Deprecated references

The following are **historical mockups only** — do not implement from them:

- `design/industrial_high_contrast/DESIGN.md`
- `design/agro_industrial_high_contrast/DESIGN.md`
- `design/*/code.html` (Stitch exports)

## CI guard

`scripts/check-ui-tokens.mjs` runs in CI to block accidental regression to the old industrial style.
