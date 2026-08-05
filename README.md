# ACE — Ancient Combat Evolution portfolio site

Performance-first, 3D-immersive one-page site for **Ancient Combat Evolution**, a real
MMA / Boxing / Muay Thai / BJJ gym in **Alwarpet, Chennai**. A Brand-Alchemy spec build.

Priority order, treated as a hard gate: **Performance → CRO → SEO → Aesthetics.**

## Stack
- **Vanilla JS + Vite 8** — `base: './'` so the bundle drops into any sub-path.
- **Vanilla CSS** with design tokens (`src/styles/tokens.css`). No utility framework.
- **Three.js** (hero hologram void) + **Lenis** (smooth scroll) — both code-split and
  dynamic-imported *after idle, on the `full` tier only*. They never touch the critical path.
- Self-hosted **Anton** display font (`font-display: swap`).

## Run
```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # → dist/
npm run preview   # serve the production build
npm run media     # rebuild web assets from ./assets (needs ffmpeg)
npm run verify    # Playwright: screenshots + fails on console errors (preview must be up)
```

## Architecture
- `src/main.js` — critical path only: nav, reveal-on-scroll, lazy map, CRO form, link wiring.
  Then detects a render **tier** and dynamic-imports the enhancement layer after idle.
- `src/lib/tiers.js` — `none | lite | full` from motion preference, deviceMemory, CPU,
  save-data, screen width, WebGL.
- `src/enhance.js` — deferred orchestrator (reels, count-ups; +void/Lenis on full).
- `src/three/void.js` — hologram fighter (sprite-sheet animation, no VideoTexture),
  volumetric embers, god-rays, reflective floor; camera orbit parallax; stall watchdog
  restores the CSS fallback if WebGL stops rendering.
- `src/data/config.js` — placeholders (phone, form endpoint, etc.).

## Media pipeline (`scripts/process-media.mjs`)
ffmpeg recuts gym reels to 5–8s muted loops + WebP posters, cuts the logo background,
and emits `ghost-fighter-sprites.webp` (6×6 grid @ 6fps) + `ghost-fighter.webp` still for the hero hologram.
Raw inputs: `assets/`. Outputs: `public/assets/` (committed).

## Deploy
```bash
npm run build   # → dist/, a self-contained static site deployable to any static host
```
