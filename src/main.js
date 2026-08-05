// ---------------------------------------------------------------------------
//  ACE — entry. Phase 2 baseline: nav, reveal, link wiring, CRO form, lazy map.
//  Performance-first: no 3D, no GSAP/Lenis here. Heavy enhancements (reels,
//  Three.js void, smooth scroll) are dynamic-imported later, tier-gated.
// ---------------------------------------------------------------------------

import './styles/tokens.css'
import './styles/main.css'
import { detectTier } from './lib/tiers.js'
import {
  TEL_URL, WHATSAPP_URL, WHATSAPP_MESSAGE, INSTAGRAM_URL,
  MAPS_DIRECTIONS, MAPS_EMBED, AGENCY_URL, BOOKING_URL,
  FORM_ENDPOINT, PHONE_E164,
} from './data/config.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

const placeholderPhone = /^9?1?0{6,}$/.test(PHONE_E164) || PHONE_E164.includes('000000')

/* -------------------------- wire config-driven links -------------------------- */
function wireLinks() {
  // If the real number isn't set yet, route call/chat CTAs to the on-page form
  // so a lead is never dropped on the demo.
  const chatHref = placeholderPhone ? '#book' : WHATSAPP_URL
  const telHref = placeholderPhone ? '#book' : TEL_URL

  $$('.js-whatsapp').forEach((a) => { a.href = chatHref })
  $$('.js-tel').forEach((a) => { a.href = telHref })
  $$('.js-instagram').forEach((a) => { a.href = INSTAGRAM_URL })
  $$('.js-directions').forEach((a) => { a.href = MAPS_DIRECTIONS })
  $$('.js-agency').forEach((a) => { a.href = AGENCY_URL })

  if (BOOKING_URL) {
    $$('.js-book').forEach((a) => { a.href = BOOKING_URL; a.target = '_blank'; a.rel = 'noopener' })
  }
  if (placeholderPhone) {
    // keep the chat CTAs as in-page scrolls (no target=_blank)
    $$('.js-whatsapp').forEach((a) => { a.removeAttribute('target'); a.removeAttribute('rel') })
  }
}

/* ----------------------------------- nav ----------------------------------- */
function initNav() {
  const nav = $('#nav')
  const toggle = $('#navtoggle')
  const links = $('#navlinks')

  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open')
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
  })
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      nav.classList.remove('is-open')
      toggle.setAttribute('aria-expanded', 'false')
    }
  })
}

/* --------------------------------- reveal ---------------------------------- */
function initReveal() {
  const els = $$('.reveal')
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => el.classList.add('in'))
    return
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 })
  els.forEach((el) => io.observe(el))
}

/* -------------------------------- lazy map --------------------------------- */
function initMap() {
  const slot = $('[data-map]')
  if (!slot) return
  const load = () => {
    const iframe = document.createElement('iframe')
    iframe.src = MAPS_EMBED
    iframe.title = 'Map to Ancient Combat Evolution, Alwarpet'
    iframe.loading = 'lazy'
    iframe.referrerPolicy = 'no-referrer-when-downgrade'
    iframe.allowFullscreen = true
    slot.replaceChildren(iframe)
  }
  if (!('IntersectionObserver' in window)) { load(); return }
  const io = new IntersectionObserver((entries, obs) => {
    if (entries.some((e) => e.isIntersecting)) { load(); obs.disconnect() }
  }, { rootMargin: '200px' })
  io.observe(slot)
}

/* ---------------------------------- form ----------------------------------- */
function initForm() {
  const form = $('#bookform')
  const note = $('#formnote')
  if (!form) return

  const setNote = (msg, kind) => {
    note.textContent = msg
    note.classList.remove('is-ok', 'is-err')
    if (kind) note.classList.add(kind)
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(form).entries())
    if (!data.name?.trim() || !data.phone?.trim()) {
      setNote('Please add your name and phone so we can reach you.', 'is-err')
      return
    }

    // 1) Real endpoint configured → POST it.
    if (FORM_ENDPOINT) {
      setNote('Sending…')
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        })
        if (!res.ok) throw new Error('bad status')
        form.reset()
        setNote(`Got it, ${data.name.split(' ')[0]}! A coach will reach out to lock in your first class.`, 'is-ok')
      } catch {
        setNote('Something went wrong. Please message us on WhatsApp and we\'ll sort it.', 'is-err')
      }
      return
    }

    // 2) No endpoint but a real number → hand the lead to WhatsApp.
    if (!placeholderPhone) {
      const msg = `${WHATSAPP_MESSAGE}\n\nName: ${data.name}\nPhone: ${data.phone}\nTrain: ${data.goal}\nTime: ${data.time}`
      window.open(`https://wa.me/${PHONE_E164}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
      setNote('Opening WhatsApp to finish your booking…', 'is-ok')
      return
    }

    // 3) Demo mode (no endpoint, no number yet).
    setNote('Demo mode: connect a form endpoint or phone number to start receiving bookings.', 'is-err')
  })
}

/* ---------------------------------- boot ----------------------------------- */
wireLinks()
initNav()
initReveal()
initMap()
initForm()
const y = $('#year'); if (y) y.textContent = String(new Date().getFullYear())

// Defer all heavy enhancement (reels, 3D void, smooth scroll) past first paint,
// tier-gated. The site is fully usable before any of this loads.
const tier = detectTier()
document.documentElement.classList.add('tier-' + tier)
if (tier !== 'none') {
  const start = () => import('./enhance.js').then((m) => m.initEnhance(tier)).catch(() => {})
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2500 })
  else setTimeout(start, 1200)
}
