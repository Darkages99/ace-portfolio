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

  // Phones: poster-first, tap-to-play, one clip at a time. The ~50MB of video
  // never auto-downloads — it loads only when a visitor taps a clip.
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

// Phone playback: the hero stays a still (no autoplay video), every other reel
// gets a play badge and plays on tap. Starting one pauses the current one, so a
// single <video> is ever active — cheap on data, battery and decode.
function initReelsMobile(reels) {
  const playable = reels.filter((f) => !isHero(f))
  let current = null

  const stopCurrent = () => {
    if (!current) return
    const v = current.querySelector('video')
    if (v) v.pause()
    current.classList.remove('is-playing')
    current = null
    document.body.classList.remove('reel-playing')
  }

  playable.forEach((fig) => {
    fig.classList.add('is-tappable')
    fig.addEventListener('click', () => {
      if (current === fig) { stopCurrent(); return }  // tap again → pause
      stopCurrent()
      const v = ensure(fig)
      v.loop = true
      v.preload = 'auto'
      current = fig
      document.body.classList.add('reel-playing')
      try { v.currentTime = 0 } catch { /* metadata not ready yet */ }
      safePlay(v)
    })
  })

  // Pause the active clip once it scrolls out of view (battery + data).
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (!e.isIntersecting && e.target === current) stopCurrent()
  }, { threshold: 0.2 })
  playable.forEach((f) => io.observe(f))

  document.addEventListener('visibilitychange', () => { if (document.hidden) stopCurrent() })
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
