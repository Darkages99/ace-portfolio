// Deferred enhancement layer. main.js dynamic-imports this after idle, only when
// tier !== 'none'. Everything heavy (Three.js, Lenis) is imported here so it
// never touches the critical path.
//
// Note on GSAP: intentionally NOT used. Section reveals are pure-CSS (gated by
// IntersectionObserver in main.js) and count-ups are vanilla rAF — so the only
// libraries on the 'full' tier are Three.js (the void) and Lenis (smooth scroll).

import { initReels, initCountUp } from './lib/reels.js'

export async function initEnhance(tier) {
  // lite + full
  initReels()
  initCountUp()

  if (tier !== 'full') return

  // full only — void owns fighter placement + camera orbit parallax
  import('./three/void.js')
    .then((m) => m.initVoid())
    .catch(() => {})

  import('lenis')
    .then(({ default: Lenis }) => {
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf) }
      requestAnimationFrame(raf)
    })
    .catch(() => {})
}
