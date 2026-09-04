# Ancient Combat Evolution — Assets Needed

Every video slot on the site now plays a **stand-in clip** pulled from footage already on
hand (raw ACE session footage + Wolfpack Weightlifting's own reels), so the site feels alive
instead of showing empty gray/gold-hatched boxes while we wait on final production. None of
these are final — swap the file at the same path once the real shoot is in. Testimonial
member-portrait slots are untouched and still show a **clearly-marked placeholder box**
(gold-hatched, labelled "Placeholder · photo") since those need a real, consented headshot,
not b-roll. This file lists exactly what real asset each slot expects, where it lives, and
the spec to shoot/export it at.

Drop finished files into `public/assets/` using the **target filename** below, then replace
the placeholder markup on the page with the matching `<video>`/`<img>` tag (ask me and I'll
wire them in in one pass). Nothing here is live yet — all slots are placeholders on purpose.

**General guidance**
- Videos: **muted, no captions burned in, seamless 6–8s loops.** Export vertical **9:16**
  (portrait) unless noted. `.mp4` (H.264) + a `.webp` poster frame, same base name.
- Photos: shoot **landscape and portrait** where possible; deliver `.webp` (or `.jpg`) at
  2× the display size. Portraits **4:5**, wide shots **16:9**.
- Get **written consent** for any recognisable member or coach before it goes live.
- Keep files small: aim < 1.5 MB per clip, < 300 KB per photo (I can compress on import).

Priority: **P0** = needed before this page looks credible · **P1** = strongly wanted ·
**P2** = nice to have.

---

## Homepage (`/`)
The homepage already uses the gym's real reels (hero-spar, boxing, bag-power, group-class,
conditioning, skip, proof-medals, proof-trophy, ceremony). Those are fine as-is. Only swap
if you have sharper footage.

| Priority | Slot | Suggested filename | Spec / notes |
|---|---|---|---|
| P2 | Reviews wall member photos | `review-01.webp` … | Real member portraits to replace the reused stills in the reviews carousel |

---

## Fees (`/pricing/`)
| Priority | Section | What the slot needs | Current stand-in | Target filename | Spec |
|---|---|---|---|---|---|
| P0 | Hero (right) | Live sparring / pad work on the ACE floor | `hero-spar.mp4` (homepage reel, reused) | `pricing-hero.mp4` + `.webp` poster | Vertical 9:16, 6–8s, muted, seamless |
| P1 | "What you get" feature | A coached group of 8 mid-session, coach correcting form | `group-class.mp4` (homepage reel, reused) | `groups-of-8.mp4` + `.webp` | Vertical 9:16, 6–8s, muted |
| P0 | Testimonials ×3 | Real member portrait **+ real name + which plan + written consent + quote** | still a gold-hatched placeholder | `member-fees-1.webp`, `-2`, `-3` | Portrait 4:5. Replace the placeholder quotes too |

## Beginners (`/beginners/`)
| Priority | Section | What the slot needs | Current stand-in | Target filename | Spec |
|---|---|---|---|---|---|
| P0 | Hero (right) | A real beginner class warming up — friendly, un-intimidating | `beginners-hero.mp4` (raw "Training 3" footage, high-knees warm-up) | `beginners-hero.mp4` + `.webp` | Vertical 9:16, 6–8s, muted |
| P1 | Winding timeline — node 1 (0–5 min) | A coach greeting a nervous first-timer, wrapping their hands | `ceremony.mp4` (homepage reel, reused — 1:1 coach spotting a member, closest available to hands-on welcome) | `session-welcome.mp4` + `.webp` | Landscape 4:3, 6–8s, muted |
| P1 | Winding timeline — node 2 (5–15 min) | Skipping and footwork warm-up, relaxed pace | `skip.mp4` (homepage reel, reused — exact match) | `session-footwork.mp4` + `.webp` | Landscape 4:3, 6–8s, muted |
| P1 | Winding timeline — node 3 (15–35 min) | Technique drilled slow: a jab or guard on the pads | `boxing.mp4` (homepage reel, reused — exact match) | `session-technique.mp4` + `.webp` | Landscape 4:3, 6–8s, muted |
| P1 | Winding timeline — node 4 (35–50 min) | A beginner landing clean rounds on the heavy bag | `bag-power.mp4` (homepage reel, reused — exact match) | `session-bag.mp4` + `.webp` | Landscape 4:3, 6–8s, muted |
| P1 | Winding timeline — node 5 (50–60 min) | Cool-down stretch + coach talking through next steps | `conditioning.mp4` (homepage reel, reused — closest available, not a real cooldown) | `session-cooldown.mp4` + `.webp` | Landscape 4:3, 6–8s, muted |
| P0 | Testimonials carousel ×6 | Real **beginner** member portrait + name + consent + quote | still a gold-hatched placeholder | `member-beg-1.webp` … `-6` | Portrait 4:5. First-timer / over-40 / desk-job / Fight-Camp / returner stories (carousel shows 3 at a time) |

## Free Trial (`/free-trial/`)
| Priority | Section | What the slot needs | Current stand-in | Target filename | Spec |
|---|---|---|---|---|---|
| P1 | "A real floor" feature | The floor mid-session: bags swinging, mitts cracking, room moving as one | `trial-floor.mp4` (raw "Cinematic 2" footage, live pad work) | `trial-floor.mp4` + `.webp` | Vertical 9:16, 6–8s, muted |

## Contact (`/contact/`)
| Priority | Section | What the slot needs | Current stand-in | Target filename | Spec |
|---|---|---|---|---|---|
| P1 | Hero (right) | Gym exterior / entrance on Ashoka Street (or a clean floor shot) | `bag-power.mp4` (homepage reel, reused — floor shot, not the exterior) | `gym-exterior.webp` | Portrait 4:5, well-lit. Helps people find the door |

## Weightlifting (`/weightlifting/`)
| Priority | Section | What the slot needs | Current stand-in | Target filename | Spec |
|---|---|---|---|---|---|
| P0 | Hero (right) | Wolfpack lifter mid-snatch or clean & jerk on the platform | `wolfpack-hero.mp4` (real Wolfpack footage — Achyuth's 85kg snatch, from `D:\Wolfpack Weightlifting\dist\reels\`) | `wolfpack-hero.mp4` + `.webp` | Vertical 9:16, 6–8s, muted |
| ~~P0~~ | ~~Coach section~~ | ~~Portrait of **Coach Vignesh** at the barbell~~ | done | `coach-vignesh.webp` | Done |

---

## Raw footage already on hand (not yet web-ready)
These sit in the local `assets/` folder (not served). Already used as a stand-in above:
`Training 3.mp4` → `beginners-hero.mp4`, `Cinematic 2.mp4` → `trial-floor.mp4`
(7s clip, compressed, muted, in `public/assets/`). Still spare, not yet used anywhere:

- `Cinematic 1.mp4` — solo skipping-rope clip, near-duplicate of the `skip.mp4` reel already live
- `Training 1.mp4` — turns out to be the same bag-work session/room as the `bag-power.mp4`
  reel already live, not distinct footage
- `Training 2.mp4` — trophy/medal close-up montage, not session footage (misleading filename)
- `Training 4.mp4` — group cone-drill workout, near-duplicate of the `group-class.mp4` reel already live
- `ONLY TESTIMONIAL.mp4` — candidate for a real video testimonial
- `Client pic 1.jpg`, `Client pic 2.avif`, `Client pic 3.jpg`, `IMG-20260824-WA0004.jpg` —
  candidate member portraits (need name + consent to attach as a named testimonial)

---

## Also confirm (not images, but blocks launch)
- **Phone number**: `src/data/config.js` uses `+91 99401 40907`; `assets/details.txt` says
  `9941234529`. Which is correct?
- **Exact class timings** and whether the ₹ prices, the ₹4,000 dietician value, and the
  6-Week Fight Camp guarantee terms are final.
- **Instagram / booking / form endpoint** — see the PLACEHOLDER notes in `src/data/config.js`.
