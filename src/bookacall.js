// ---------------------------------------------------------------------------
//  ACE — /bookacall call scheduler.
//
//  Reuses the whole shared subpage shell (nav, motion, ambient ember field,
//  config-driven links, footer year) by importing ./page.js, then mounts the
//  booking widget on top. Same Underground-Luxury design system.
//
//  The widget shows a rolling 7-day strip (arrows page ±7 days), and under the
//  chosen day a grid of 15-minute call slots that fall in the gym's OFF hours
//  (between the morning and evening training blocks). A 10-minute gap between
//  calls is baked into the slot spacing — the visitor is never shown it; they
//  just see clean 15-minute slots that happen to sit 25 minutes apart.
//
//  Backend: a Google Apps Script Web App backed by one Google Sheet — the single
//  source of truth, with server-side double-book protection. Reads use JSONP (no
//  CORS headaches); the booking write is a simple POST. Until the endpoint is set
//  (config BOOKING_API_URL), the page runs in demo mode and hands bookings to
//  WhatsApp so a lead is never lost. See bookacall/BOOKING-SETUP.md.
// ---------------------------------------------------------------------------

import './page.js'
import './styles/bookacall.css'
import { BOOKING_API_URL, PHONE_E164 } from './data/config.js'

const $ = (s, r = document) => r.querySelector(s)

/* ------------------------------- slot model -------------------------------
   Keep these numbers identical to the ones in bookacall/Code.gs so the browser
   and the server agree on exactly which slots exist. All times are IST minutes
   from midnight. Off-hours window = the gap between the two training blocks
   (06:00–09:30 and 17:30–21:00). Calls are 15 min; slots step by 25 (15 call +
   10 buffer) so the gap is guaranteed without ever telling the visitor. */
const WINDOW_START = 9 * 60 + 30   // 09:30
const WINDOW_END = 17 * 60 + 30    // 17:30
const CALL_LEN = 15                // visible call length
const STEP = 25                    // call + hidden 10-min buffer
const LEAD_MIN = 60                // can't book a slot starting within the next hour
const DAYS_PER_PAGE = 7

// Every valid slot start (minutes from midnight), computed once.
const SLOT_MINUTES = (() => {
  const out = []
  for (let m = WINDOW_START; m + CALL_LEN <= WINDOW_END; m += STEP) out.push(m)
  return out
})()

const HHMM = (mins) => `${String((mins / 60) | 0).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
const label12 = (mins) => {
  let h = (mins / 60) | 0
  const mi = mins % 60
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${String(mi).padStart(2, '0')} ${ap}`
}

/* ------------------------------- IST helpers ------------------------------- */
// The gym is in Chennai; slots are always IST regardless of the visitor's device
// timezone. India has no DST, so we can read "now in IST" via Intl and treat the
// calendar cleanly in UTC from there.
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

/* ------------------------------ backend calls ------------------------------ */
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = '__acecb' + Math.random().toString(36).slice(2)
    const s = document.createElement('script')
    const done = (fn) => (arg) => { clearTimeout(t); delete window[cb]; s.remove(); fn(arg) }
    const t = setTimeout(done(reject), 9000, new Error('timeout'))
    window[cb] = done(resolve)
    s.onerror = () => done(reject)(new Error('network'))
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb
    document.head.appendChild(s)
  })
}

// Booked slots for a date range → Set of "YYYY-MM-DD HH:mm" keys.
async function fetchBooked(start, end) {
  if (!BOOKING_API_URL) return new Set()
  try {
    const data = await jsonp(`${BOOKING_API_URL}?action=slots&start=${start}&end=${end}`)
    return new Set(Array.isArray(data?.booked) ? data.booked : [])
  } catch {
    return new Set() // degrade gracefully: server still rejects true collisions
  }
}

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
  let selectedMin = null  // slot minutes
  let booked = new Set()

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

  async function renderWeek() {
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

    // Prefetch this week's booked slots so slots show accurate availability.
    booked = await fetchBooked(dateStrOf(first), dateStrOf(last))
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

    for (const m of SLOT_MINUTES) {
      if (isToday && m < cutoff) continue // same-day: no past / too-soon slots
      any = true
      const key = `${selectedDate} ${HHMM(m)}`
      const taken = booked.has(key)
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'cslot' + (taken ? ' is-taken' : '')
      b.textContent = label12(m)
      b.disabled = taken
      if (taken) b.setAttribute('aria-label', `${label12(m)} — already booked`)
      if (m === selectedMin) b.classList.add('is-active')
      b.addEventListener('click', () => selectSlot(m, b))
      slotsEl.appendChild(b)
    }

    if (!any) {
      const p = document.createElement('p')
      p.className = 'cslots__empty'
      p.textContent = isToday
        ? 'No more call slots today. Try tomorrow.'
        : 'No slots available on this day.'
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
      setNote('Please add your name and phone so we can call you.', 'is-err')
      return
    }
    if (selectedDate == null || selectedMin == null) {
      setNote('Please pick a day and a time first.', 'is-err')
      return
    }

    const payload = {
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
      setNote('Opening WhatsApp to confirm your call…', 'is-ok')
      return
    }

    const submit = $('#callSubmit')
    submit.disabled = true
    setNote('Booking your slot…')
    try {
      const res = await postBooking(payload)
      if (res?.ok) {
        booked.add(`${payload.date} ${payload.time}`)
        doneSlotEl.textContent = prettySlot
        root.hidden = true
        form.hidden = true
        doneEl.hidden = false
        doneEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (res?.error === 'taken') {
        setNote('Sorry, someone just grabbed that slot. Pick another time.', 'is-err')
        booked.add(`${payload.date} ${payload.time}`)
        renderSlots()
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
    const msg = `Hi Ancient Combat Evolution, I'd like to book a call.\n\n` +
      `Slot: ${prettySlot}\nName: ${p.name}\nPhone: ${p.phone}\nLooking to train: ${p.goal || '—'}`
    window.open(`https://wa.me/${PHONE_E164}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
  }

  renderWeek()
}

initWidget()
