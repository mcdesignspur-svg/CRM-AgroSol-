---
name: Industrial High-Contrast
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#5d3f3c'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#926f6b'
  outline-variant: '#e7bdb8'
  surface-tint: '#c00014'
  primary: '#ba0013'
  on-primary: '#ffffff'
  primary-container: '#e31e24'
  on-primary-container: '#fffafa'
  inverse-primary: '#ffb4ab'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd400'
  on-secondary-container: '#6e5c00'
  tertiary: '#006190'
  on-tertiary: '#ffffff'
  tertiary-container: '#007bb5'
  on-tertiary-container: '#fbfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
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
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Montserrat
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.01em
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
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  label-sm:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
This design system is engineered for maximum utility, impact, and clarity in industrial and agricultural contexts. The aesthetic is rooted in **High-Contrast Boldness**, drawing inspiration from safety signage and heavy machinery branding. It prioritizes immediate recognition and legibility over subtle aesthetics.

The target audience consists of operators, logistics managers, and field workers who require a UI that remains functional under varying light conditions and high-pressure environments. The emotional response is one of reliability, urgency, and precision. The style utilizes heavy strokes, vibrant signal colors, and a rigid adherence to a white-base canvas to ensure that every interactive element is unmistakably distinct.

## Colors
The palette is built on a high-visibility triad. 

- **Primary Red (#E31E24):** Used for primary actions, critical alerts, and brand identification. It signifies movement and priority.
- **Secondary Gold (#FFD700):** Employed for warnings, secondary highlights, and specialized category indicators. It provides a bright counterpoint to the primary red.
- **Neutral Black (#000000):** Applied to all core text and structural borders to guarantee a high contrast ratio against the white background.
- **Surface Strategy:** Backgrounds must remain pure White (#FFFFFF). For grouping elements without using heavy borders, a very light gray (#F2F2F2) is used to create subtle "zones" while maintaining the overall brightness of the interface.

## Typography
The system exclusively uses **Montserrat** to leverage its geometric stability and assertive presence. 

Headlines utilize Heavy (800) and Bold (700) weights to establish a clear information hierarchy. Letter spacing is slightly tightened on larger display sizes to maintain a compact, "stamped" look. Body text stays at a medium weight for maximum clarity. Functional labels and UI metadata should often utilize uppercase transformations and bold weights to mimic industrial plate engraving and labeling.

## Layout & Spacing
The design system follows a rigid **8px grid system** (with a 4px minor increment) to ensure mechanical alignment. 

- **Grid:** A 12-column fluid grid is used for desktop, transitioning to a 4-column grid for mobile.
- **Margins:** Generous outer margins (32px on desktop) keep content focused and clear of screen edges.
- **Rhythm:** Vertical spacing should be aggressive. Use `stack-lg` to separate distinct functional blocks, and `stack-sm` for related input/label pairs. The goal is to avoid visual clutter by providing enough "air" between high-contrast elements.

## Elevation & Depth
This system rejects soft shadows and ambient blurs in favor of **Structural Outlines** and **Tonal Layering**. 

Depth is communicated through:
1. **Hard Borders:** 1px or 2px solid black (#000000) borders define containers.
2. **Layered Surfaces:** The main canvas is White. Secondary containers or "well" areas use the light gray (#F2F2F2) to indicate a recessed area.
3. **High-Contrast Overlays:** Modals and menus do not use soft shadows; they use a thick 2px black border and a high-opacity (40%) black backdrop to isolate the foreground from the background.

## Shapes
The shape language is strictly **Soft-Industrial**. A consistent 4px corner radius is applied to all interactive elements, providing a hint of modern refinement while maintaining a sturdy, rectangular structural feel.

- **Standard Elements:** 4px radius (Buttons, Inputs, Cards).
- **Small Elements:** 2px radius (Checkboxes, Tags).
- **Large Containers:** 4px radius (Modals, Panels).
Avoid circles and pills; the 4px corner provides the necessary balance between "harsh" and "accessible."

## Components

- **Buttons:** Primary buttons are Solid Red (#E31E24) with White text, using Bold Uppercase Montserrat. Secondary buttons use a 2px Black border with Black text. All buttons have a 4px corner radius.
- **Input Fields:** Use a 1px Black border. Labels are placed above the field in `label-bold`. Focus states use a 2px Red border to ensure the user's position is never in doubt.
- **Cards:** White background with a 1px Black border. No shadows. Use internal padding of 24px to keep content from feeling cramped against the rigid borders.
- **Chips/Tags:** Use a Secondary Gold (#FFD700) background with Black text for status indicators (e.g., "Active", "In Progress"). For neutral tags, use a light gray background with black text.
- **Lists:** Items are separated by a 1px solid Gray (#D9D9D9) divider. Interactive list items should have a Red hover state for the text or a small Red leading indicator bar.
- **Checkboxes & Radios:** Sharp 2px Black borders. When selected, they fill with Red or contain a thick Black checkmark for maximum visibility.
- **Data Tables:** Use a heavy Black header row with White text. Alternating row colors (White and #F2F2F2) assist in horizontal scanning.