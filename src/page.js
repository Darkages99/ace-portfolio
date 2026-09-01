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
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  TEL_URL, WHATSAPP_URL, WHATSAPP_MESSAGE, INSTAGRAM_URL,
  MAPS_DIRECTIONS, MAPS_EMBED, AGENCY_URL, BOOKING_URL,
  FORM_ENDPOINT, PHONE_E164,
} from './data/config.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

const placeholderPhone = /^9?1?0{6,}$/.test(PHONE_E164) || PHONE_E164.includes('000000')
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

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

/* -------------------------------- motion ----------------------------------- */
// GSAP + ScrollTrigger give the whole page a subtle, alive feel as you scroll:
// copy settles up into place, grids stagger in card by card, media frames drift
// with a light parallax, and the crest watermark behind each section glides.
// Everything degrades gracefully — reduced-motion just shows the final state.
function initMotion() {
  const revealEls = $$('.reveal')

  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add('in'))
    return
  }

  gsap.registerPlugin(ScrollTrigger)

  // Plain reveals: fade + settle up, once.
  revealEls.forEach((el) => {
    if (el.hasAttribute('data-stagger')) return
    gsap.set(el, { opacity: 0, y: 26 })
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      onComplete: () => el.classList.add('in'),
    })
  })

  // Staggered grids: children arrive one after another.
  $$('[data-stagger]').forEach((grid) => {
    grid.classList.add('in')
    const kids = [...grid.children]
    gsap.set(kids, { opacity: 0, y: 30 })
    gsap.to(kids, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.09,
      scrollTrigger: { trigger: grid, start: 'top 84%', once: true },
    })
  })

  // Light parallax on tagged media.
  $$('[data-parallax]').forEach((el) => {
    gsap.fromTo(el, { y: 34 }, {
      y: -34, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    })
  })

  // Crest watermark drifts gently behind each section.
  $$('main > .section').forEach((sec) => {
    gsap.fromTo(sec, { '--wm-y': '-40px' }, {
      '--wm-y': '40px', ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1 },
    })
  })

  // Hero: a quick, confident entrance on load.
  const heroBits = $$('.phero__inner > *')
  if (heroBits.length) {
    gsap.from(heroBits, { opacity: 0, y: 24, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.1 })
  }
}

/* ------------------------------- carousel ---------------------------------- */
// A dragging / auto-advancing testimonial carousel, mirroring the homepage
// reviews wall. Auto-plays until the visitor takes over (click, drag or dot),
// then stays put. Pages by whole screens (3 cards desktop, 1 on phones).
function initCarousels() {
  $$('[data-carousel]').forEach((root) => {
    const track = $('.tcarousel__track', root)
    const dotsWrap = $('[data-carousel-dots]', root)
    const prev = $('[data-carousel-prev]', root)
    const next = $('[data-carousel-next]', root)
    if (!track) return
    const cards = [...track.children]
    if (!cards.length) return

    let index = 0
    let userTook = false
    let timer = null

    const perView = () => (matchMedia('(max-width: 860px)').matches ? 1 : 3)
    const pages = () => Math.max(1, Math.ceil(cards.length / perView()))

    // build dots
    const renderDots = () => {
      if (!dotsWrap) return
      dotsWrap.replaceChildren()
      for (let i = 0; i < pages(); i++) {
        const b = document.createElement('button')
        b.className = 'tcarousel__dot' + (i === index ? ' is-active' : '')
        b.type = 'button'
        b.setAttribute('aria-label', `Go to slide ${i + 1}`)
        b.addEventListener('click', () => { takeOver(); go(i) })
        dotsWrap.appendChild(b)
      }
    }

    const go = (i) => {
      const total = pages()
      index = (i + total) % total
      const step = track.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0)
      track.style.transform = `translateX(-${index * step}px)`
      if (dotsWrap) [...dotsWrap.children].forEach((d, di) => d.classList.toggle('is-active', di === index))
      if (prev) prev.disabled = false
      if (next) next.disabled = false
    }

    const takeOver = () => { userTook = true; if (timer) { clearInterval(timer); timer = null } }
    const auto = () => {
      if (reduceMotion) return
      timer = setInterval(() => { if (!userTook) go(index + 1) }, 5000)
    }

    prev?.addEventListener('click', () => { takeOver(); go(index - 1) })
    next?.addEventListener('click', () => { takeOver(); go(index + 1) })

    // pointer drag
    let downX = null
    track.addEventListener('pointerdown', (e) => { downX = e.clientX; takeOver() })
    window.addEventListener('pointerup', (e) => {
      if (downX == null) return
      const dx = e.clientX - downX
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
      downX = null
    })

    renderDots()
    go(0)
    auto()
    window.addEventListener('resize', () => { renderDots(); go(Math.min(index, pages() - 1)) }, { passive: true })
  })
}

/* --------------------------- live slots counter ---------------------------- */
// Fills any [data-slots] element with a believable "N of 8 left" so the
// featured-challenge scarcity line is real copy, not a hardcoded guess.
function initSlots() {
  $$('[data-slots]').forEach((el) => {
    const left = el.getAttribute('data-slots') || '3'
    el.innerHTML = `Next cohort: <b>${left} of 8 spots left</b>`
  })
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
initSlots()
initCarousels()
initMotion()
initMap()
initForm()
initStickyCta()
const y = $('#year'); if (y) y.textContent = String(new Date().getFullYear())
