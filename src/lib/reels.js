// Lazy reels. A reel swaps its poster → a muted <video> the first time it
// enters view. Playback rules:
//   • Hero (.hero__media): loops permanently while on screen.
//   • Every other reel: plays through ONCE when scrolled into view, then stops.
//     Hovering it restarts it on loop; the loop stops when the pointer leaves.
// Off-screen reels and a hidden tab always pause, to keep decode cheap.

const isPhone = () => matchMedia('(max-width: 600px)').matches

export function initReels() {
  const reels = [...document.querySelectorAll('.reel[data-video]')]
  if (!reels.length || !('IntersectionObserver' in window)) return

  // Phones: every reel autoplays and loops while it's on screen.
  if (isPhone()) return initReelsMobile(reels)

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) enterView(e.target)
      else leaveView(e.target)
    }
  }, { rootMargin: '150px 0px', threshold: 0.25 })

  reels.forEach((fig) => {
    io.observe(fig)
    if (!isHero(fig)) {
      fig.addEventListener('mouseenter', () => hoverLoop(fig))
      fig.addEventListener('mouseleave', () => hoverStop(fig))
    }
  })

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) reels.forEach((f) => { const v = f.querySelector('video'); if (v) v.pause() })
  })
}

// Phone playback: every reel (hero + the rest) autoplays and loops, muted and
// inline, while it's on screen — and pauses the moment it scrolls out of view
// (and on a hidden tab) so we never decode a clip nobody's looking at. In the
// vault carousel roughly one card is centred at a time, so playback stays cheap.
function initReelsMobile(reels) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { const v = ensure(e.target); v.loop = true; v.preload = 'auto'; safePlay(v) }
      else { const v = e.target.querySelector('video'); if (v) v.pause() }
    }
  }, { rootMargin: '150px 0px', threshold: 0.25 })
  reels.forEach((f) => io.observe(f))

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) reels.forEach((f) => { const v = f.querySelector('video'); if (v) v.pause() })
  })
}

const isHero = (fig) => fig.classList.contains('hero__media')

function enterView(fig) {
  const v = ensure(fig)
  if (isHero(fig)) { v.loop = true; safePlay(v); return }
  if (fig.matches(':hover')) return // hover handler owns playback while hovered
  v.loop = false
  try { v.currentTime = 0 } catch { /* metadata not ready yet */ }
  safePlay(v) // one pass, then it stops on its own
}

function leaveView(fig) {
  const v = fig.querySelector('video')
  if (v) v.pause()
}

function hoverLoop(fig) {
  const v = ensure(fig)
  v.loop = true
  safePlay(v)
}

function hoverStop(fig) {
  const v = fig.querySelector('video')
  if (!v) return
  v.loop = false
  v.pause()
}

function safePlay(v) {
  const p = v.play()
  if (p && p.catch) p.catch(() => {}) // autoplay can be refused; poster remains
}

// Create the <video> over the poster the first time it's needed.
function ensure(fig) {
  let v = fig.querySelector('video')
  if (v) return v

  v = document.createElement('video')
  v.className = 'reel__video'
  v.muted = true
  v.loop = false
  v.playsInline = true
  v.preload = 'metadata'
  v.setAttribute('muted', '')
  v.setAttribute('playsinline', '')

  const poster = fig.querySelector('.reel__poster')
  if (poster) v.poster = poster.currentSrc || poster.src

  const source = document.createElement('source')
  source.src = fig.dataset.video
  source.type = 'video/mp4'
  v.appendChild(source)

  v.addEventListener('playing', () => fig.classList.add('is-playing'), { once: true })

  // insert above the poster, below the gradient/word/caption
  poster ? poster.after(v) : fig.prepend(v)
  return v
}

// Count up numeric stats when they scroll into view (e.g. 5.0, 4, 7).
export function initCountUp() {
  const nums = [...document.querySelectorAll('.stats__n')]
    .filter((el) => !isNaN(parseFloat(el.textContent)))
  if (!nums.length || !('IntersectionObserver' in window)) return

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      animate(e.target)
      io.unobserve(e.target)
    }
  }, { threshold: 0.6 })
  nums.forEach((el) => io.observe(el))
}

function animate(el) {
  const target = parseFloat(el.textContent)
  const suffix = el.textContent.replace(/[0-9.]/g, '')
  const decimals = (el.textContent.split('.')[1] || '').replace(/[^0-9]/g, '').length
  const dur = 1100
  const t0 = performance.now()
  const tick = (t) => {
    const k = Math.min(1, (t - t0) / dur)
    const eased = 1 - Math.pow(1 - k, 3)
    el.textContent = (target * eased).toFixed(decimals) + suffix
    if (k < 1) requestAnimationFrame(tick)
    else el.textContent = target.toFixed(decimals) + suffix
  }
  requestAnimationFrame(tick)
}
