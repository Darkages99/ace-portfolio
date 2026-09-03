# Booking backend setup — /bookacall

The call page is live and works right now in **demo mode** (picking a slot opens
WhatsApp with the details pre-filled, so no lead is ever lost). To make bookings
save to a sheet with real double-book protection, do this once. ~10 minutes, all
free, no server, no credit card.

The whole backend is **one Google Sheet + one script attached to it**. That sheet
is the single source of truth for every booked call.

---

## Step 1 — Make the sheet

1. Go to <https://sheets.google.com> and create a **blank spreadsheet**.
2. Name it something like `ACE — Call Bookings`.

You don't need to add any columns. The script creates a tab called **Bookings**
with the right headers the first time someone books.

## Step 2 — Add the script

1. In that sheet, top menu: **Extensions ▸ Apps Script**.
2. Delete whatever is in the `Code.gs` editor.
3. Open `bookacall/Code.gs` from this project, copy **all** of it, and paste it in.
4. Click the **Save** icon (💾).

## Step 3 — Deploy it as a Web App

1. Top right: **Deploy ▸ New deployment**.
2. Click the gear next to "Select type" ▸ **Web app**.
3. Set:
   - **Description:** `ACE booking` (anything)
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**  ← must be "Anyone", not "Anyone with Google account"
4. Click **Deploy**.
5. Google will ask you to **authorise** — approve it (it's your own script). If it
   warns "Google hasn't verified this app", click **Advanced ▸ Go to … (unsafe)** —
   that's expected for a personal script; it's your code.
6. Copy the **Web app URL**. It ends in `/exec`.

## Step 4 — Plug the URL into the site

1. Open `src/data/config.js`.
2. Set the booking URL:
   ```js
   export const BOOKING_API_URL = 'https://script.google.com/macros/s/AKfy…/exec'
   ```
3. Rebuild and redeploy the site (the usual push + deploy).

That's it. New bookings now land in the sheet, taken slots grey out for everyone,
and two people can't grab the same time.

---

## Good to know

- **Timezone:** everything is **IST** (Asia/Kolkata), always — a visitor in another
  timezone still books your local time.
- **The slots:** 15-minute calls in the off-training gap **9:30 AM – 5:30 PM**, every
  day. A hidden 10-minute buffer sits between calls (visitors never see it — slots
  just land 25 minutes apart). Last start is 5:00 PM.
  - Overnight (after 9:00 PM) is intentionally **not** offered — nobody books a 3 AM
    call and it looks broken. To change any of this, edit the config block at the top
    of **both** `src/bookacall.js` and `bookacall/Code.gs` (keep them identical).
- **Cancelling a booking:** open the sheet and set that row's **Status** to
  `Cancelled`. The slot frees up again automatically.
- **Changing the deployed script later:** after editing `Code.gs`, do **Deploy ▸
  Manage deployments ▸ (edit) ▸ Version: New version ▸ Deploy**. Editing the code
  alone doesn't update the live URL — you must publish a new version. The `/exec`
  URL stays the same, so you don't need to touch the site again.
- **Clearing test data:** if you ran any test bookings, open the sheet and delete
  those rows (select the row numbers ▸ right-click ▸ Delete rows). Leaving them
  just marks those slots as taken.

## Trial-class bookings (/free-trial)

The `/free-trial` page (calendar on top, info below) uses this **same** script and spreadsheet — no extra setup.
Trial bookings land in their own tab called **Trials** (created automatically on the
first trial booking), so calls and trial classes stay neatly separated in one sheet.

- Trials join scheduled **group classes**, so a session is never "full" here and two
  people booking the same class is expected — every booking is just recorded.
- The class times offered are fixed daily starts (morning + evening). To change them,
  edit the `TRIAL_SESSIONS` list in **both** `src/free-trial.js` and `bookacall/Code.gs`
  (keep them identical), then republish the script (see below).
- Because `Code.gs` changed to add trials, if your script was deployed before this,
  you must publish a new version: **Deploy ▸ Manage deployments ▸ (edit) ▸ Version:
  New version ▸ Deploy**. The `/exec` URL stays the same.

## Phase 2 (later) — SMS reminders

The sheet already captures name, phone, date and time — everything a reminder needs.
When you're ready, a **time-driven trigger** in this same Apps Script (Triggers ▸
Add trigger ▸ run every 15 min) can scan for upcoming calls and fire an SMS via a
provider (e.g. Twilio / MSG91 / Fast2SMS). No new infrastructure — it lives right
next to this code. Not built yet, per the plan.
