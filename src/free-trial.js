// ---------------------------------------------------------------------------
//  ACE — /free-trial trial-class scheduler (calendar on top, info below).
//
//  Reuses the whole shared subpage shell (nav, motion, ambient ember field,
//  config-driven links, footer year) by importing ./page.js, then mounts the
//  booking widget on top of the page. Same Underground-Luxury design system and
//  the same widget as /bookacall, so the two calendars look identical.
//
//  Unlike calls, trials join scheduled GROUP classes, so:
//    - the times shown are fixed daily class start-times (morning + evening),
//      inside the actual training blocks (06:00–09:30 and 17:30–21:00), and
//    - a session holds many people, so slots never "sell out" / grey out and
//      there is no double-book collision — every booking is simply recorded.
//
//  Backend: the same Google Apps Script Web App + Google Sheet as /bookacall
//  (config BOOKING_API_URL). Trial bookings carry type:'trial' and land in a
//  separate "Trials" tab of that same spreadsheet. Until the endpoint is set the
//  page runs in demo mode and hands the booking to WhatsApp so no lead is lost.
//  See bookacall/BOOKING-SETUP.md.
// ---------------------------------------------------------------------------

import './page.js'
import './styles/bookacall.css'
import { BOOKING_API_URL, PHONE_E164 } from './data/config.js'

const $ = (s, r = document) => r.querySelector(s)

/* ------------------------------- session model -----------------------------
   Keep these identical to bookacall/Code.gs (the TRIAL_SESSIONS list) so the
   browser and server agree on which class times exist. All times are IST minutes
   from midnight. These are the fixed daily class starts a trial can join — a
   couple in the morning block, a few in the evening. */
const TRIAL_SESSIONS = [
  6 * 60,        // 06:00 — morning class
  7 * 60 + 30,   // 07:30 — morning class
  17 * 60 + 30,  // 17:30 — evening class
  19 * 60,       // 19:00 — evening class
  20 * 60 + 30,  // 20:30 — evening class
]
const LEAD_MIN = 120       // can't book a class starting within the next 2 hours
const DAYS_PER_PAGE = 7

const HHMM = (mins) => `${String((mins / 60) | 0).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
const label12 = (mins) => {
  let h = (mins / 60) | 0
  const mi = mins % 60
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${String(mi).padStart(2, '0')} ${ap}`
}

/* ------------------------------- IST helpers ------------------------------- */
// The gym is in Chennai; class times are always IST regardless of the visitor's
// device timezone. India has no DST, so we read "now in IST" via Intl and treat
// the calendar cleanly in UTC from there.
function istNow() {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date()).reduce((o, x) => (o[x.type] = x.value, o), {})
  const hour = p.hour === '24' ? 0 : +p.hour
  return {
    dateStr: `${p.year}-${p.month}-${p.day}`,
    minutes: hour * 60 + +p.minute,
    base: new Date(Date.UTC(+p.year, +p.month - 1, +p.day)), // IST "today" as UTC midnight
  }
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad2 = (n) => String(n).padStart(2, '0')
const dateStrOf = (dt) => `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`

/* ------------------------------ backend call ------------------------------- */
async function postBooking(payload) {
  // A string body defaults to text/plain, which is a "simple" request — no CORS
  // preflight, which Apps Script can't answer anyway.
  const res = await fetch(BOOKING_API_URL, { method: 'POST', body: JSON.stringify(payload) })
  return res.json()
}

/* --------------------------------- widget ---------------------------------- */
function initWidget() {
  const root = $('#cal')
  if (!root) return

  const now = istNow()
  const daysEl = $('#calDays')
  const slotsEl = $('#calSlots')
  const rangeEl = $('#calRange')
  const prevBtn = $('#calPrev')
  const nextBtn = $('#calNext')
  const form = $('#callform')
  const formSlotEl = $('#callSlot')
  const noteEl = $('#callnote')
  const doneEl = $('#callDone')
  const doneSlotEl = $('#callDoneSlot')

  let page = 0            // which 7-day block (0 = starts today)
  let selectedDate = null // "YYYY-MM-DD"
  let selectedMin = null  // session minutes

  const dayFromIndex = (i) => new Date(now.base.getTime() + i * 864e5)

  const setNote = (msg, kind) => {
    noteEl.textContent = msg || ''
    noteEl.classList.remove('is-ok', 'is-err')
    if (kind) noteEl.classList.add(kind)
  }

  function resetForm() {
    form.hidden = true
    selectedMin = null
    setNote('')
  }

  function renderWeek() {
    prevBtn.disabled = page === 0
    const first = dayFromIndex(page * DAYS_PER_PAGE)
    const last = dayFromIndex(page * DAYS_PER_PAGE + DAYS_PER_PAGE - 1)
    rangeEl.textContent = first.getUTCMonth() === last.getUTCMonth()
      ? `${MONTH[first.getUTCMonth()]} ${first.getUTCDate()} – ${last.getUTCDate()}`
      : `${MONTH[first.getUTCMonth()]} ${first.getUTCDate()} – ${MONTH[last.getUTCMonth()]} ${last.getUTCDate()}`

    daysEl.replaceChildren()
    for (let i = 0; i < DAYS_PER_PAGE; i++) {
      const dt = dayFromIndex(page * DAYS_PER_PAGE + i)
      const ds = dateStrOf(dt)
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'cday'
      b.setAttribute('role', 'tab')
      b.dataset.date = ds
      b.innerHTML = `<span class="cday__dow">${WEEKDAY[dt.getUTCDay()]}</span>` +
        `<span class="cday__num">${dt.getUTCDate()}</span>` +
        `<span class="cday__mon">${MONTH[dt.getUTCMonth()]}</span>`
      if (ds === now.dateStr) b.classList.add('is-today')
      if (ds === selectedDate) b.classList.add('is-active')
      b.addEventListener('click', () => selectDay(ds, b))
      daysEl.appendChild(b)
    }

    if (selectedDate) renderSlots()
  }

  function selectDay(ds, btn) {
    selectedDate = ds
    ;[...daysEl.children].forEach((c) => c.classList.toggle('is-active', c === btn))
    resetForm()
    renderSlots()
  }

  function renderSlots() {
    slotsEl.replaceChildren()
    const isToday = selectedDate === now.dateStr
    const cutoff = now.minutes + LEAD_MIN
    let any = false

    for (const m of TRIAL_SESSIONS) {
      if (isToday && m < cutoff) continue // same-day: no past / too-soon classes
      any = true
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'cslot'
      b.textContent = label12(m)
      if (m === selectedMin) b.classList.add('is-active')
      b.addEventListener('click', () => selectSlot(m, b))
      slotsEl.appendChild(b)
    }

    if (!any) {
      const p = document.createElement('p')
      p.className = 'cslots__empty'
      p.textContent = isToday
        ? 'No more classes today. Try tomorrow.'
        : 'No classes available on this day.'
      slotsEl.appendChild(p)
    }
  }

  function selectSlot(m, btn) {
    selectedMin = m
    ;[...slotsEl.querySelectorAll('.cslot')].forEach((c) => c.classList.toggle('is-active', c === btn))
    const dt = new Date(selectedDate + 'T00:00:00Z')
    const pretty = `${WEEKDAY[dt.getUTCDay()]}, ${MONTH[dt.getUTCMonth()]} ${dt.getUTCDate()} · ${label12(m)} IST`
    formSlotEl.textContent = pretty
    form.hidden = false
    setNote('')
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  prevBtn.addEventListener('click', () => { if (page > 0) { page--; renderWeek() } })
  nextBtn.addEventListener('click', () => { page++; renderWeek() })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(form).entries())
    if (!data.name?.trim() || !data.phone?.trim()) {
      setNote('Please add your name and phone so we can confirm your trial.', 'is-err')
      return
    }
    if (selectedDate == null || selectedMin == null) {
      setNote('Please pick a day and a class time first.', 'is-err')
      return
    }

    const payload = {
      type: 'trial',
      date: selectedDate,
      time: HHMM(selectedMin),
      name: data.name.trim(),
      phone: data.phone.trim(),
      goal: data.goal || '',
    }
    const prettySlot = formSlotEl.textContent

    // Demo mode (no backend yet): hand off to WhatsApp so the lead is never lost.
    if (!BOOKING_API_URL) {
      handoffWhatsApp(payload, prettySlot)
      setNote('Opening WhatsApp to confirm your trial…', 'is-ok')
      return
    }

    const submit = $('#callSubmit')
    submit.disabled = true
    setNote('Saving your spot…')
    try {
      const res = await postBooking(payload)
      if (res?.ok) {
        doneSlotEl.textContent = prettySlot
        root.hidden = true
        form.hidden = true
        doneEl.hidden = false
        doneEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        throw new Error(res?.error || 'unknown')
      }
    } catch {
      handoffWhatsApp(payload, prettySlot)
      setNote('Couldn\'t reach the scheduler — opening WhatsApp so you can confirm directly.', 'is-err')
    } finally {
      submit.disabled = false
    }
  })

  function handoffWhatsApp(p, prettySlot) {
    const msg = `Hi Ancient Combat Evolution, I'd like to book a trial class.\n\n` +
      `Session: ${prettySlot}\nName: ${p.name}\nPhone: ${p.phone}\nLooking to train: ${p.goal || '—'}`
    window.open(`https://wa.me/${PHONE_E164}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
  }

  renderWeek()
}

initWidget()
