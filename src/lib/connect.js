// ---------------------------------------------------------------------------
//  ACE — "how do you want to start?" chooser + a Swiggy-style success toast.
//  Shared by the homepage (main.js) and the content subpages (page.js).
//
//  The chooser gives every WhatsApp call-to-action a fork: book a call on the
//  /bookacall scheduler, or chat on WhatsApp. Any element with `.js-connect`
//  opens it (its href is kept as the no-JS fallback). The green round FAB and
//  footer text links stay pure WhatsApp on purpose — quick one-tap access.
// ---------------------------------------------------------------------------

import { WHATSAPP_URL } from '../data/config.js'

const BOOKACALL_URL = '/bookacall/'
const WA_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.737-.981a9.86 9.86 0 002.741.274z"/></svg>'
const PHONE_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'

let dialog = null
let lastTrigger = null

function buildDialog() {
  const el = document.createElement('div')
  el.className = 'chooser'
  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-modal', 'true')
  el.setAttribute('aria-labelledby', 'chooser-title')
  el.hidden = true
  el.innerHTML = `
    <div class="chooser__backdrop" data-close></div>
    <div class="chooser__panel" role="document">
      <button class="chooser__x" type="button" data-close aria-label="Close">&times;</button>
      <p class="chooser__eyebrow">Get started</p>
      <h2 class="chooser__title" id="chooser-title">How do you want to <span class="g">start?</span></h2>
      <a class="chooser__opt chooser__opt--gold" href="${BOOKACALL_URL}">
        <span class="chooser__ico">${PHONE_SVG}</span>
        <span class="chooser__txt"><b>Book a call</b><small>Pick a time, a coach rings you</small></span>
        <span class="chooser__arrow" aria-hidden="true">&rsaquo;</span>
      </a>
      <a class="chooser__opt chooser__opt--wa" href="${WHATSAPP_URL}" target="_blank" rel="noopener">
        <span class="chooser__ico">${WA_SVG}</span>
        <span class="chooser__txt"><b>Chat on WhatsApp</b><small>Message a coach right now</small></span>
        <span class="chooser__arrow" aria-hidden="true">&rsaquo;</span>
      </a>
    </div>`
  el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeChooser() })
  el.addEventListener('keydown', onKeydown)
  document.body.appendChild(el)
  return el
}

function focusables() {
  return [...dialog.querySelectorAll('a[href], button:not([disabled])')]
}

function onKeydown(e) {
  if (e.key === 'Escape') { closeChooser(); return }
  if (e.key !== 'Tab') return
  const f = focusables()
  if (!f.length) return
  const first = f[0]
  const last = f[f.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

export function openChooser(trigger) {
  if (!dialog) dialog = buildDialog()
  lastTrigger = trigger || document.activeElement
  dialog.hidden = false
  document.body.classList.add('no-scroll')
  requestAnimationFrame(() => {
    dialog.classList.add('is-open')
    focusables()[0]?.focus()
  })
}

export function closeChooser() {
  if (!dialog || dialog.hidden) return
  dialog.classList.remove('is-open')
  document.body.classList.remove('no-scroll')
  const done = () => { dialog.hidden = true; dialog.removeEventListener('transitionend', done) }
  dialog.addEventListener('transitionend', done)
  // fallback if transitions are off
  setTimeout(() => { if (dialog.classList.contains('is-open') === false) dialog.hidden = true }, 350)
  lastTrigger?.focus?.()
}

export function initConnect() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.js-connect')
    if (!trigger) return
    e.preventDefault()
    openChooser(trigger)
  })
}

/* ------------------------------ success toast ------------------------------ */
// A Swiggy-style celebration: a card rises from the bottom with a green tick
// that pops and draws in. Auto-dismisses; announced to screen readers.
export function showToast({ title = 'Done!', sub = '' } = {}) {
  const el = document.createElement('div')
  el.className = 'toast'
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', 'polite')
  el.innerHTML = `
    <span class="toast__check" aria-hidden="true">
      <svg viewBox="0 0 52 52" width="30" height="30"><circle class="toast__circle" cx="26" cy="26" r="24" fill="none"/><path class="toast__tick" fill="none" d="M14 27l8 8 16-18"/></svg>
    </span>
    <span class="toast__body"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>`
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('in'))
  const dismiss = () => {
    el.classList.remove('in')
    el.addEventListener('transitionend', () => el.remove(), { once: true })
    setTimeout(() => el.remove(), 600)
  }
  setTimeout(dismiss, 4200)
  el.addEventListener('click', dismiss)
}
