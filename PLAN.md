# ACE — Ancient Combat Evolution · Build Plan

**Project:** High-performance, 3D-immersive one-page site for **Ancient Combat Evolution**
(MMA / Boxing / Muay Thai / BJJ gym, **Alwarpet, Chennai**), built as a spec/portfolio
piece for the Brand-Alchemy agency.

**Decided priority order (hard ranking):** `Performance → CRO → SEO → Aesthetics`.
Performance is a **gate**, not a goal: any feature that breaks the budget gets deferred,
downgraded, or cut. We maximise "wow" only inside that gate via lazy-loading, deferral,
and tiered rendering.

---

## 0. Decisions locked (from kickoff)

| Decision | Answer |
|---|---|
| Starting point | **Rebuild from scratch.** Reuse only real business facts. |
| Output location | `portfolio/ace/` (matches `scripts/copy-portfolio.mjs`). Raw inputs in `portfolio/ace/assets/`. |
| 3D scope | Push wow **as far as performance allows**. Build perf-first in layers; 3D is the top enhancement layer, fully deferred + tier-gated. |
| Data | **Hybrid** — real where known; flagged placeholders only for the genuinely unknown. |
| Palette | **Underground Luxury** — `#0a0a0a` matte black, `#161616` charcoal, `#d4af37` championship gold, off-white text. No acid green. |

---

## 1. Asset inventory & disposition

All raw inputs live in `portfolio/ace/assets/` (all video is **9:16 vertical, bright/handheld gym footage**).

| Asset | Content | Role in site |
|---|---|---|
| `logo.jpg` | Gold shield + tiger mark on black | Brand mark → **transparent cutout** (WebP/PNG) + favicon + OG image |
| `Client pic 1.jpg` | Group boxing class (gloves up) | Proof / community; testimonial-catalyst still |
| `Client pic 2.avif` | (re-encode for delivery) | Proof grid |
| `Client pic 3.jpg` | Team with competition medals + flag | Credibility / Location section |
| `Cinematic 1.mp4` (34s) | Solo rope-skipping, single subject | **Best ghost-fighter candidate** (cleanest subject separation) |
| `Cinematic 2.mp4` (55s) | Two-man mitt sparring, motion blur | Hero action loop / Programs (STRIKING) |
| `Training 1.mp4` (26s) | Heavy-bag + shadowboxing | Vault / Programs (POWER) |
| `Training 2.mp4` (70s) | Trophy + medals montage (ACE logo burned in) | **Proof / credibility** reel |
| `Training 3.mp4` (27s) | Partner conditioning | Vault (CONSISTENCY) |
| `Training 4.mp4` (38s) | Group class, agility cones | Vault / community (DISCIPLINE / EVOLUTION) |
| `ONLY TESTIMONIAL.mp4` (15s) | Member speaking to camera | **Testimonial Catalyst** payoff video |
| `details.txt` | **Empty** | — |

### Asset flags to confirm before launch
- **`ONLY TESTIMONIAL.mp4` has burned-in Instagram UI** (play button, "1:58", `@` tags) **and is filmed outside a "SLAM Lifestyle & Fitness" storefront** (third-party brand on screen). Plan: crop to remove IG chrome; if the SLAM signage can't be cropped out cleanly, we either (a) use it as a small framed "as seen on" clip, or (b) hold it pending a cleaner testimonial. **Needs your call + member consent to publish a real face.**
- **Member faces appear throughout.** For a hybrid/real build we should confirm the gym has consent to use these people's likenesses on a public marketing site.

---

## 2. Stack & architecture

- **Vanilla JS + Vite** (not React). Rationale: single page, perf is #1 — vanilla gives the
  smallest critical bundle and mirrors the main Brand-Alchemy site's proven architecture
  (tiered render + `requestIdleCallback` defer). Three.js/GSAP/Lenis are heavy and we want
  them code-split out of the critical path; a framework adds runtime we don't need here.
- **Vanilla CSS with custom-property design tokens** (`styles/tokens.css`), mirroring the
  main site. No utility framework in the critical path.
- **`base: './'`** so the bundle drops into `/portfolio/ace/` on any host.
- **Three.js** for the arena background (deferred, tier-gated). **GSAP + ScrollTrigger**
  for reveals/count-ups, **Lenis** for smooth scroll — all dynamic-imported after idle on
  the `full` tier only.

### Layered render model
```
z 0   <canvas> Three.js "Combat Arena"   ← fixed, deferred, full-tier only
z 1   .site-content                        ← semantic HTML, scrims behind all text
z 50  fixed nav + Book-Trial + WhatsApp FAB
```

### Performance architecture (the gate)
- **Critical path = text + one small poster only.** No video, no 3D, no web fonts blocking
  the LCP headline. Hero headline paints first.
- **Tiered rendering** (`none` / `lite` / `full`), decided at runtime from
  `prefers-reduced-motion`, WebGL support, `deviceMemory`, `hardwareConcurrency`, screen width:
  - `none` — static CSS gradient + posters, no JS animation, no autoplay video.
  - `lite` — posters + tap-to-play reels, CSS reveals, no Three.js, no spotlight follow.
  - `full` — Three.js arena, in-view muted autoplay reels, GSAP/Lenis.
- **Reels:** `preload="none"`, poster-first, `IntersectionObserver` → autoplay muted +
  `playsinline` only in view, **pause + release when off-view**, `decoding=async`. Multiple
  encodings (AV1/H.265 + H.264 fallback) at small bitrates; 5–8s loops, not full clips.
- **3D:** dynamic-import after `requestIdleCallback`; particles ≤5000 desktop / ≤1000 mobile;
  pause RAF on tab hide; teardown on unmount.
- **Fonts:** self-hosted, subset, **one** preloaded display face (Anton/Bebas-style) + system
  stack for body until idle. No third-party font requests.
- **Images:** AVIF/WebP, responsive `srcset`, explicit `width`/`height` (zero CLS).
- **Budgets (verified, not assumed):** LCP < 1.8s desktop / < 2.5s mobile · TBT < 200ms ·
  CLS < 0.1. Enforced with Lighthouse + a Playwright smoke test (console-error = fail).

---

## 3. Media pipeline (build-time / offline — `ffmpeg` + `hyperframes`)

Runs once, outputs committed web-ready assets into the build's `public/assets/`. Never at runtime.

1. **Logo** → remove black background → transparent WebP + PNG; generate favicon set + 1200×630 OG image.
2. **Photos** → crop/grade to Underground-Luxury (desaturated, gold-warm), export AVIF + WebP responsive sizes.
3. **Reels** → recut to **5–8s highlight loops**, muted (per directive: *no narration on
   training reels*; testimonial keeps audio), normalise to a consistent grade, export
   AV1/H.265 + H.264 at mobile/desktop bitrates + a WebP poster per reel.
4. **`hyperframes` text overlays** — synchronized words from the **approved set only**:
   `DISCIPLINE · CONSISTENCY · EVOLUTION · STRIKING · POWER`, timed to land on impact moments.
   **→ Approval gate: words + placement + timing before burn-in.**
5. **`hyperframes transcribe`** — transcribe each reel → (a) hidden indexable text, (b) the
   `transcript`/caption track for `VideoObject` schema. Turns a video-heavy page into
   indexable text for "MMA Alwarpet" authority.
6. **Ghost-Fighter `remove-background`** — attempt on `Cinematic 1` (cleanest subject).
   **Go/no-go quality gate:** bright handheld footage will produce edge artifacts; if the
   cutout isn't clean, fall back to a feathered/masked reel composited into the void (still
   reads as "fighter in the dark"). Either way it's deferred + full-tier only.
7. **Testimonial** — crop IG chrome from `ONLY TESTIMONIAL`; resolve the SLAM-signage flag (§1).

---

## 4. Page structure (single page) & asset mapping

| # | Section | Purpose (CRO/SEO) | Assets | 3D / enhancement |
|---|---|---|---|---|
| Nav | Fixed minimal bar | Persistent **Book Trial** (gold ember) + WhatsApp | logo cutout | — |
| 1 | **Hero — "The Void"** | LCP headline + primary CTA; trust strip (5/5 · Alwarpet · All ages) | poster (Cinematic 2) | Three.js void + ghost-fighter, both deferred; poster is LCP |
| 2 | **Programs / "The Why"** | Boxing · Muay Thai · BJJ · Strength & Conditioning (real) | Cinematic 2, Training 1 | bento; in-view reel loops + overlay words |
| 3 | **The Vault** | Authority: technique reels as educational content (schema) | Training 3/4, Cinematic 1 | 3D "rack" of phone-frames; lazy, click-to-expand |
| 4 | **The Proof — Testimonial Catalyst** | Conversion proof: photo → video on hover/tap; real review quotes; stat count-ups | Client pics, ONLY TESTIMONIAL, Training 2 (medals) | photo→video morph; subtle audio-reactive accent |
| 5 | **Schedule** | Reduce friction: Morning / Evening blocks (real) | — | CSS reveal |
| 6 | **Find Us** | Local SEO + trust: address, hours, map | Client pic 3 (medals team) | map embed (lazy) |
| 7 | **The Finisher** | **Primary lead capture** — high-contrast form + WhatsApp FAB | — | CSS only |
| Footer | Backlink + schema | "Crafted by Brand-Alchemy" link back to agency | logo | — |

**CRO "Finisher" form fields:** name · phone · goal/program · preferred time → posts to a
Formspree endpoint (placeholder, easy swap). WhatsApp deep-link pre-filled with the trial
message. Every section funnels toward Book Trial.

---

## 5. SEO / AEO (priority #3)

- **`LocalBusiness` + `HealthClub`/`SportsActivityLocation` schema** — name, Alwarpet address,
  geo, opening hours, rating/reviews, `sameAs` (Instagram `ancient_combat_evolution`).
- **`VideoObject` schema per reel** with `transcript` + `thumbnailUrl` — indexes the video
  content; Vault reels tagged as educational ("Technique Vault").
- **`FAQPage` schema** (trial cost, beginner-friendly, what to bring, location).
- Target queries: *MMA Alwarpet*, *boxing class Alwarpet Chennai*, *Muay Thai Chennai*,
  *BJJ Chennai*. Semantic headings, descriptive alt text, visible/hidden transcripts.
- Open Graph + Twitter cards (poster + tagline). Canonical (real domain — placeholder).
- Core Web Vitals (from §2) double as a ranking lever.

---

## 6. Design tokens (Underground Luxury)

```
--bg:            #0a0a0a   /* matte black            */
--surface:       #161616   /* charcoal panels        */
--gold:          #d4af37   /* championship gold (logo)*/
--gold-ember:    #f5c451   /* hover / glow highlight  */
--text:          #f0ede6   /* off-white (not #fff)    */
--text-dim:      #a8a29a
--scrim:         rgba(10,10,10,0.78)  /* mandatory behind text over canvas */
```
- Type: heavyweight all-caps display (Anton / Bebas Neue) for titles; clean sans for body.
- Structure: sharp geometric lines, bento grids, asymmetric frames — no soft curves.
- **All text meets WCAG AA (≥4.5:1); scrims mandatory over the canvas.**

---

## 7. Execution phases

> Each phase ends shippable. Phases 0–2 deliver a **fast, converting, indexable site with
> ZERO 3D** — that locks the performance gate before any enhancement.

- **Phase 0 — Scaffold.** Fresh Vite project in `portfolio/ace/`
  (archive old code), tokens, fonts, base HTML shell, perf/verify harness.
- **Phase 1 — Media pipeline.** §3 outputs. **Gate: overlay words/timing approval.**
- **Phase 2 — Static skeleton + content.** All sections in semantic HTML, real copy, CRO
  form, schema, SEO, posters only. *Target: pass all CWV budgets here, no 3D.*
- **Phase 3 — Progressive enhancement.** Tier loader, IntersectionObserver lazy reels,
  GSAP reveals + count-ups, Lenis (full tier).
- **Phase 4 — 3D layer.** Three.js arena (deferred), the Vault, ghost-fighter hero + fallback.
  **Gate: 3D lighting/look approval.**
- **Phase 5 — Catalyst + polish.** Photo→video morph, restrained audio-reactive accent.
- **Phase 6 — Verify.** Lighthouse + Playwright (perf, a11y/WCAG AA, console-error gate),
  cross-device screenshots. Re-verify budgets after every enhancement layer.
- **Phase 7 — Deploy wiring.** Update `scripts/copy-portfolio.mjs` (already references this
  folder), confirm agency homepage link, build `dist/`.

---

## 8. Open placeholders to collect (flagged, easy-swap)

Phone (display + E.164) · WhatsApp number · booking link (Calendly?) · Formspree endpoint ·
exact map lat/lng · real domain (canonical/OG) · founder name · Instagram handle
(`ancient_combat_evolution` — confirm) · **consent** to publish member faces + testimonial.

---

## 9. Approval gates (directive "Review Loop")

1. This plan.
2. Text-overlay words + placement + timing (Phase 1).
3. Ghost-fighter background-removal quality — go/no-go (Phase 1/4).
4. 3D lighting intensity + scene look (Phase 4).
5. Final pre-launch placeholder fill (Phase 7).
</content>
</invoke>
