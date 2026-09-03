// ---------------------------------------------------------------------------
//  ACE — runtime config (links, contact, endpoints).
//
//  Visible COPY lives in index.html (static = best for SEO + no-JS + perf).
//  This module holds only the values JS needs to wire up interactivity:
//  phone, WhatsApp, booking, form endpoint, map, socials.
//
//  ⚠️  PLACEHOLDERS — swap before launch (see README "Before launch").
//      Anything marked PLACEHOLDER is intentionally inert.
// ---------------------------------------------------------------------------

// Real — gym's phone. Powers tel:, WhatsApp, and schema.
export const PHONE_DISPLAY = '+91 99401 40907'
export const PHONE_E164 = '919940140907'

// PLACEHOLDER — booking link (e.g. Calendly). null → the "Book" CTAs scroll to
// the on-page form instead of opening an external scheduler.
export const BOOKING_URL = null

// PLACEHOLDER — Formspree (or any POST endpoint). null → the form falls back to
// a pre-filled WhatsApp message so leads are never lost.
export const FORM_ENDPOINT = null

// PLACEHOLDER — the /bookacall call-scheduler backend (a Google Apps Script Web
// App "/exec" URL). See bookacall/BOOKING-SETUP.md. null → the call page runs in
// demo mode: slots are pickable but a booking just hands off to WhatsApp with the
// chosen time pre-filled, so no lead is lost before the sheet is wired up.
export const BOOKING_API_URL =
  'https://script.google.com/macros/s/AKfycbwvD1-DeOUXVuSLoemKDjfUhhRidwBgqk-UDQiVL7yT8qMeOYQoJ4LD3bT34ELeCePS6g/exec'

// Real — observed on the gym's reels.
export const INSTAGRAM_URL = 'https://www.instagram.com/ancient_combat_evolution/'

// Real — from public listings (verify exact unit before launch).
export const ADDRESS =
  '2, Ashoka Street, Sri Ram Colony, Abiramapuram, Alwarpet, Chennai 600018'

// Address-query Google Maps embed (no API key). Swap to a pinned embed once
// exact coordinates are confirmed.
export const MAPS_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`
export const MAPS_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS)}`

export const WHATSAPP_MESSAGE = 'Hi Ancient Combat Evolution, I want to book a trial class.'
export const WHATSAPP_URL = `https://wa.me/${PHONE_E164}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
export const TEL_URL = `tel:+${PHONE_E164}`

// Backlink to the Brand-Alchemy agency homepage (relative from the deployed sub-path).
export const AGENCY_URL = '../../'
