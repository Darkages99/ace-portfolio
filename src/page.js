// ---------------------------------------------------------------------------
//  ACE — lean entry for the content subpages (pricing, beginners, free-trial,
//  contact, weightlifting). Same design system as the homepage, but without the
//  heavy homepage-only layers (Three.js void, reels, GSAP, reviews wall).
//
//  Shares the tokens + main stylesheet with the homepage, plus pages.css for the
//  subpage-only components, and reuses src/data/config.js for link wiring so the
//  phone / WhatsApp / map values stay in one place.
// ---------------------------------------------------------------------------

import './styles/tokens.css'
import './styles/main.css'
import './styles/mobile.css'
import './styles/pages.css'
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
    $$('.js-whatsapp').forEach((a) => { a.removeAttribute('target'); a.removeAttribute('rel') })
  }
}

/* ----------------------------------- nav ----------------------------------- */
function initNav() {
  const nav = $('#nav')
  const toggle = $('#navtoggle')
  const links = $('#navlinks')
  if (!nav || !toggle || !links) return

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
// Free-trial form: three fields, WhatsApp-first. Feeds a real POST endpoint when
// FORM_ENDPOINT is set; otherwise hands the lead straight to WhatsApp with the
// details pre-filled so nothing is ever dropped (per the Technicals brief — a
// form that emails an unwatched inbox is worse than no form).
function initForm() {
  const form = $('#bookform')
  const note = $('#formnote')
  if (!form || !note) return

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
        setNote(`Got it, ${data.name.split(' ')[0]}! We'll ring you within a few minutes to lock in your trial.`, 'is-ok')
      } catch {
        setNote('Something went wrong. Please message us on WhatsApp and we\'ll sort it.', 'is-err')
      }
      return
    }

    if (!placeholderPhone) {
      const msg = `${WHATSAPP_MESSAGE}\n\nName: ${data.name}\nPhone: ${data.phone}\nPreferred time: ${data.time || '—'}`
      window.open(`https://wa.me/${PHONE_E164}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
      setNote('Opening WhatsApp to finish your booking…', 'is-ok')
      return
    }

    setNote('Demo mode: connect a form endpoint or phone number to start receiving bookings.', 'is-err')
  })
}

/* ------------------------ mobile sticky CTA (≤600px) ------------------------ */
function initStickyCta() {
  const cta = $('.mcta')
  const anchor = $('#book') || $('.book__form') || $('footer')
  if (!cta || !anchor || !('IntersectionObserver' in window)) return
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) cta.classList.toggle('mcta--hidden', e.isIntersecting)
  }, { threshold: 0.18 })
  io.observe(anchor)
}

/* ---------------------------------- boot ----------------------------------- */
wireLinks()
initNav()
initReveal()
initMap()
initForm()
initStickyCta()
const y = $('#year'); if (y) y.textContent = String(new Date().getFullYear())
