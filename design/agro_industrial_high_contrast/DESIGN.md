> **DEPRECATED — do not implement.** This document describes an alternate dark industrial UI that was never shipped. The canonical design system is [`design/minimal_ui/DESIGN.md`](../minimal_ui/DESIGN.md).

---
name: Agro-Industrial High-Contrast
colors:
  surface: '#161311'
  surface-dim: '#161311'
  surface-bright: '#3d3836'
  surface-container-lowest: '#110d0c'
  surface-container-low: '#1f1b19'
  surface-container: '#231f1d'
  surface-container-high: '#2e2927'
  surface-container-highest: '#393431'
  on-surface: '#eae1dd'
  on-surface-variant: '#e7bdb8'
  inverse-surface: '#eae1dd'
  inverse-on-surface: '#342f2d'
  outline: '#ae8883'
  outline-variant: '#5d3f3c'
  surface-tint: '#ffb4ab'
  primary: '#ffb4ab'
  on-primary: '#690006'
  primary-container: '#e31e24'
  on-primary-container: '#fffafa'
  inverse-primary: '#c00014'
  secondary: '#fff9ef'
  on-secondary: '#3a3000'
  secondary-container: '#ffdb3c'
  on-secondary-container: '#725f00'
  tertiary: '#8ecdff'
  on-tertiary: '#00344f'
  tertiary-container: '#007bb5'
  on-tertiary-container: '#fbfcff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000d'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#cbe6ff'
  tertiary-fixed-dim: '#8ecdff'
  on-tertiary-fixed: '#001e30'
  on-tertiary-fixed-variant: '#004b71'
  background: '#161311'
  on-background: '#eae1dd'
  surface-variant: '#393431'
typography:
  display:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-table:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style
This design system establishes a rugged, professional, and high-performance environment tailored for agricultural logistics. It balances a "rustic" heritage with the precision required for modern CRM data management. 

The aesthetic is characterized by a **dark-mode-first** philosophy, utilizing deep, earthy tones that mimic the dark wood grain of the brand's identity. Visual hierarchy is achieved through **high-contrast** accents—using primary red and golden yellow to pull critical information and actions out of the dark background. The result is an interface that feels dependable, utilitarian, and authoritative.

## Colors
The palette is rooted in the dark, organic tones of the agricultural landscape.
- **Backgrounds:** Use a "Deep Bark" charcoal-brown (#1A1614) for the base canvas to ensure high legibility of data.
- **Surfaces:** Use "Mocha Charcoal" (#261F1C) for cards and containers to create a subtle layered effect against the background.
- **Accents:** 
    - **Primary Red (#E31E24):** Reserved for primary actions, critical alerts, and branding headers.
    - **Golden Yellow (#FFD700):** Used for warnings, highlighting "Delivery" statuses, and secondary interactive elements to provide a warm, high-visibility contrast.
- **Text:** Pure white for headers; a warm, desaturated tan (#A89F94) for secondary metadata and labels to reduce eye strain in data-heavy views.

## Typography
The typography system uses a tri-font approach to manage branding, utility, and data density.
- **Headers (Montserrat):** Bold, geometric, and impactful. For top-level branding and section headers, use uppercase to echo the logo's "AGROCENTRO" presence.
- **Body & CRM Data (Inter):** A neutral, highly legible sans-serif chosen for its clarity in complex tables and logistics lists.
- **Metadata (JetBrains Mono):** A monospaced font used for IDs, SKU numbers, and status labels to provide a technical, "industrial" feel that aids in quick scanning of alphanumeric data.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for desktop dashboards and a single-column layout for mobile field use.
- **Rhythm:** An 8px linear scale ensures consistent alignment across data tables and forms.
- **Density:** The CRM views should favor a "Compact" density to maximize information density for logistics operators, using 12px vertical padding for list items.
- **Breakpoints:**
    - Mobile: < 600px (Full-width cards, hidden sidebars).
    - Tablet: 600px - 1024px (2-column grids for cards).
    - Desktop: > 1024px (Fixed sidebar navigation, 12-column data grid).

## Elevation & Depth
In this dark, rustic environment, depth is achieved through **Low-contrast Outlines** rather than heavy shadows.
- **Containers:** Cards use a 1px border colored at #3D3530 (a lighter shade of the background) to define boundaries without breaking the "dark wood" immersion.
- **Active State:** When a card or row is selected, it receives a subtle "inner glow" or a primary red left-edge border (4px) to denote focus.
- **Modals:** Use a heavy backdrop blur (20px) over the dark background to maintain the sense of a singular, solid workspace.

## Shapes
The shape language is **Soft (Level 1)**. This uses a 0.25rem (4px) radius for buttons and input fields, and 0.5rem (8px) for cards. 
The minimal rounding maintains a "heavy machinery" and industrial feel—avoiding overly bubbly or "consumer-tech" shapes in favor of something that feels constructed and sturdy.

## Components
- **Buttons:** 
    - *Primary:* Solid #E31E24 background with White bold text. 
    - *Secondary:* Outline #FFD700 with Yellow text for high-visibility secondary actions.
- **Status Badges:** 
    - *Pickup:* Primary Red background with white uppercase text.
    - *Delivery:* Golden Yellow background with dark charcoal text for maximum contrast.
- **Data Tables:**
    - Alternate row stripping is not used; instead, use 1px horizontal dividers (#3D3530). 
    - Headers should be sticky, using the `label-caps` typography style.
- **Input Fields:**
    - Dark fill (#1A1614) with a subtle 1px border. On focus, the border transitions to Primary Red.
- **Cards:**
    - Background: #261F1C.
    - Border: 1px solid #3D3530.
    - Padding: 24px (md) for general content, 16px (sm) for data-dense widgets.