// Decide how much to render. Performance is the gate, so we degrade hard on
// any signal of a constrained device or an explicit motion preference.
//
//   none — reduced-motion: posters only, no autoplay, no smooth-scroll, no 3D.
//   lite — capable but mobile / low-power / save-data: lazy video reels +
//          overlay words + count-ups. No Three.js, no Lenis.
//   full — desktop, WebGL, healthy CPU/RAM: everything, incl. the 3D void.

export function detectTier() {
  if (typeof window === 'undefined') return 'none'
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'none'

  const mem = navigator.deviceMemory || 4
  const cores = navigator.hardwareConcurrency || 4
  const conn = navigator.connection || {}
  if (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')) return 'lite'
  if (mem <= 2 || cores <= 2) return 'lite'

  // Below this width, stay on 'lite' — mobile keeps the reels but skips the
  // always-rendering 3D canvas (battery + thermals).
  if (innerWidth < 900) return 'lite'

  let webgl = false
  try {
    const c = document.createElement('canvas')
    webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { /* no-op */ }
  return webgl ? 'full' : 'lite'
}
