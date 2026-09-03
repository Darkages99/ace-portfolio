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
 */

// ---- config: keep in sync with src/bookacall.js ---------------------------
var TZ = 'Asia/Kolkata';
var WINDOW_START = 9 * 60 + 30; // 09:30
var WINDOW_END = 17 * 60 + 30;  // 17:30
var CALL_LEN = 15;              // visible call length (min)
var STEP = 25;                  // call + hidden 10-min buffer
var SHEET_NAME = 'Bookings';
var HEADERS = ['Booked at (IST)', 'Date', 'Time (IST)', 'Name', 'Phone', 'Looking to train', 'Status'];

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
  if (!isValidSlot(date, time)) return { ok: false, error: 'bad_slot' };
  if (isPast(date, time)) return { ok: false, error: 'past' };

  // Serialise concurrent bookings so two people can't grab the same slot.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet();
    if (slotTaken(sheet, date, time)) return { ok: false, error: 'taken' };
    sheet.appendRow([nowIST(), date, time, name, phone, goal, 'Booked']);
    SpreadsheetApp.flush();
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function bookedInRange(start, end) {
  var sheet = getSheet();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var rows = sheet.getRange(2, 2, last - 1, 6).getValues(); // Date, Time, Name, Phone, Goal, Status
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var date = normDate(rows[i][0]);
    var time = normTime(rows[i][1]);
    var status = String(rows[i][5] || '').toLowerCase();
    if (!date || !time || status === 'cancelled') continue;
    if (start && date < start) continue;
    if (end && date > end) continue;
    out.push(date + ' ' + time);
  }
  return out;
}

function slotTaken(sheet, date, time) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var rows = sheet.getRange(2, 2, last - 1, 6).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (normDate(rows[i][0]) === date && normTime(rows[i][1]) === time &&
        String(rows[i][5] || '').toLowerCase() !== 'cancelled') {
      return true;
    }
  }
  return false;
}

// ---- helpers ---------------------------------------------------------------

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function isValidSlot(date, time) {
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

// A cell might come back as a string or a Date (if Sheets auto-typed it) —
// normalise both to the "yyyy-MM-dd" / "HH:mm" the browser sent.
function normDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return String(v || '').trim();
}
function normTime(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'HH:mm');
  var s = String(v || '').trim();
  var m = s.match(/^(\d{1,2}):(\d{2})/);
  return m ? (('0' + m[1]).slice(-2) + ':' + m[2]) : s;
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
