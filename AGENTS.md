<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ui-design-rules -->
# CRM UI — Minimalist (canonical)

The active UI is **clean and minimalist**. Before changing styles, read `design/minimal_ui/DESIGN.md`.

**Do:**
- Use tokens and utilities from `src/app/globals.css`
- Keep borders subtle (1px `#e5e7eb`), soft shadows, rounded corners
- Use sentence case for labels and headings

**Do not:**
- Restore thick black borders, hard offset shadows, or black table headers
- Follow `design/industrial_high_contrast/` or `design/agro_industrial_high_contrast/` (deprecated)
- Copy styles from `design/*/code.html` Stitch mockups

CI runs `scripts/check-ui-tokens.mjs` to block UI regressions.
<!-- END:ui-design-rules -->
