/**
 * ACE — /bookacall backend. One Google Sheet = the single source of truth for
 * every booked call, with server-side double-book protection.
 *
 * Deploy this as a Web App (Deploy ▸ New deployment ▸ Web app):
 *   - Execute as: Me
 *   - Who has access: Anyone
 * Copy the resulting /exec URL into src/data/config.js → BOOKING_API_URL.
 * Full walkthrough: bookacall/BOOKING-SETUP.md
 *
 * IMPORTANT: keep the slot numbers below identical to src/bookacall.js.
 *
 * Note on the "Key" column: Google Sheets silently auto-converts a cell that
 * looks like a date/time into a typed Date value, which broke naive string
 * comparisons. So every booking also writes a forced-TEXT "Key" column
 * ("YYYY-MM-DD HH:mm") that Sheets leaves alone — and ALL collision / lookup
 * logic runs off that key, never off the pretty Date/Time columns.
 */

// ---- config: keep in sync with src/bookacall.js ---------------------------
var TZ = 'Asia/Kolkata';
var WINDOW_START = 9 * 60 + 30; // 09:30
var WINDOW_END = 17 * 60 + 30;  // 17:30
var CALL_LEN = 15;              // visible call length (min)
var STEP = 25;                  // call + hidden 10-min buffer
var SHEET_NAME = 'Bookings';
var HEADERS = ['Booked at (IST)', 'Date', 'Time (IST)', 'Name', 'Phone', 'Looking to train', 'Status', 'Key'];
// Column positions (1-indexed) that must stay plain text so Sheets can't retype them.
var TEXT_COLS = [2, 3, 8]; // Date, Time, Key

// ---- HTTP entry points -----------------------------------------------------

function doGet(e) {
  var params = (e && e.parameter) || {};
  var payload;
  try {
    if (params.action === 'slots' || !params.action) {
      payload = { ok: true, booked: bookedInRange(params.start, params.end) };
    } else {
      payload = { ok: false, error: 'unknown_action' };
    }
  } catch (err) {
    payload = { ok: false, error: String(err) };
  }
  return reply(payload, params.callback);
}

function doPost(e) {
  var payload;
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    payload = createBooking(body);
  } catch (err) {
    payload = { ok: false, error: String(err) };
  }
  return reply(payload, null);
}

// ---- core ------------------------------------------------------------------

function createBooking(b) {
  var date = String(b.date || '').trim();
  var time = String(b.time || '').trim();
  var name = String(b.name || '').trim();
  var phone = String(b.phone || '').trim();
  var goal = String(b.goal || '').trim();

  if (!name || !phone) return { ok: false, error: 'missing_contact' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return { ok: false, error: 'bad_slot' };
  if (!isValidSlot(time)) return { ok: false, error: 'bad_slot' };
  if (isPast(date, time)) return { ok: false, error: 'past' };

  var key = date + ' ' + time;

  // Serialise concurrent bookings so two people can't grab the same slot.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet();
    if (keyExists(sheet, key)) return { ok: false, error: 'taken' };
    sheet.appendRow([nowIST(), date, time, name, phone, goal, 'Booked', key]);
    SpreadsheetApp.flush();
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// Returns ["YYYY-MM-DD HH:mm", ...] for non-cancelled bookings in [start, end].
function bookedInRange(start, end) {
  var rows = dataRows();
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (isCancelled(r)) continue;
    var key = keyOf(r);
    if (!key) continue;
    var date = key.slice(0, 10);
    if (start && date < start) continue;
    if (end && date > end) continue;
    out.push(key);
  }
  return out;
}

function keyExists(sheet, key) {
  var rows = dataRows(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (!isCancelled(rows[i]) && keyOf(rows[i]) === key) return true;
  }
  return false;
}

// ---- sheet access ----------------------------------------------------------

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  // Force the date/time/key columns to plain text so Sheets never auto-types
  // a "2026-12-25" string into a Date value (idempotent, cheap at this volume).
  for (var c = 0; c < TEXT_COLS.length; c++) {
    sheet.getRange(1, TEXT_COLS[c], sheet.getMaxRows(), 1).setNumberFormat('@');
  }
  return sheet;
}

// Returns the data rows (below the header) as arrays covering columns B..H:
// [0]Date [1]Time [2]Name [3]Phone [4]Train [5]Status [6]Key
function dataRows(sheet) {
  sheet = sheet || getSheet();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 2, last - 1, 7).getValues();
}

function keyOf(r) {
  var k = String(r[6] || '').trim();
  if (k) return k;
  // Legacy fallback for any pre-Key rows: rebuild from Date/Time cells.
  var d = fmt(r[0], 'yyyy-MM-dd');
  var t = fmt(r[1], 'HH:mm');
  return d && t ? d + ' ' + t : '';
}

function isCancelled(r) {
  return String(r[5] || '').toLowerCase() === 'cancelled';
}

// ---- helpers ---------------------------------------------------------------

function isValidSlot(time) {
  var mins = toMinutes(time);
  for (var m = WINDOW_START; m + CALL_LEN <= WINDOW_END; m += STEP) {
    if (m === mins) return true;
  }
  return false;
}

function isPast(date, time) {
  var nowStr = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
  return (date + ' ' + time) <= nowStr;
}

function toMinutes(hhmm) {
  var p = hhmm.split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
}

// Format a cell that might be a Date (auto-typed by Sheets) or already a string.
// Uses getTime detection rather than instanceof, which is unreliable here.
function fmt(v, pattern) {
  if (v && typeof v.getTime === 'function') return Utilities.formatDate(v, TZ, pattern);
  var s = String(v || '').trim();
  if (pattern === 'HH:mm') {
    var m = s.match(/^(\d{1,2}):(\d{2})/);
    return m ? (('0' + m[1]).slice(-2) + ':' + m[2]) : s;
  }
  return s;
}

function nowIST() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');
}

// JSON, or JSONP when the browser passes a ?callback= (used for cross-origin reads).
function reply(obj, callback) {
  var json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
