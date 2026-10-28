const HEADERS = ["time", "name", "message", "species", "approved", "lat", "lng"];
const LAT_MIN = 22.15, LAT_MAX = 22.35;
const LNG_MIN = 113.80, LNG_MAX = 114.10;

/** Ensure the bound spreadsheet is ready for the first entry or read. */
function ensureHeaders(sheet) {
  if (sheet.getRange(1, 1).getValue() === "") {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

/** 是否有提供某個參數（空白視為沒有提供）。 */
function provided(v) {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

/**
 * 解析可選的 lat、lng。兩者都沒有提供 → 回傳 {lat: "", lng: ""}（一般留言）。
 * 有提供就必須是數字，並在水口範圍內，否則回傳 null（invalid location）。
 */
function parseLocation(params) {
  const hasLat = provided(params.lat);
  const hasLng = provided(params.lng);
  if (!hasLat && !hasLng) return { lat: "", lng: "" };
  const lat = Number(String(params.lat).trim());
  const lng = Number(String(params.lng).trim());
  if (!hasLat || !hasLng) return null;
  if (!isFinite(lat) || !isFinite(lng)) return null;
  if (lat < LAT_MIN || lat > LAT_MAX || lng < LNG_MIN || lng > LNG_MAX) return null;
  return { lat: lat, lng: lng };
}

/**
 * POST endpoint for guestbook submissions and visitor map points.
 * Accepts: name (optional, max 40 chars), message (required, max 500 chars), species (optional),
 *          lat and lng (optional; if given, both must be numbers inside the Shui Hau bounds).
 * Honeypot fields: hp / honeypot / website — if any has a value, the request is silently discarded.
 * New entries are not public until approved is changed to "yes" in the sheet.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    lock.waitLock(10000);
    locked = true;

    const params = e.parameter || {};

    // Honeypot: any value means discard (silently report success).
    if ((params.hp || "").toString().trim() ||
        (params.honeypot || "").toString().trim() ||
        (params.website || "").toString().trim()) {
      return jsonOut({ success: true });
    }

    const name = (params.name || "").toString().trim().slice(0, 40);
    const message = (params.message || "").toString().trim();
    const species = (params.species || "").toString().trim().slice(0, 20);

    if (!message) {
      return jsonOut({ success: false, error: "message is required" });
    }
    if (message.length > 500) {
      return jsonOut({ success: false, error: "message exceeds 500 characters" });
    }

    const loc = parseLocation(params);
    if (loc === null) {
      return jsonOut({ success: false, error: "invalid location" });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    ensureHeaders(sheet);
    sheet.appendRow([new Date(), name, message, species, "no", loc.lat, loc.lng]);

    return jsonOut({ success: true });
  } catch (err) {
    return jsonOut({ success: false, error: err.message });
  } finally {
    if (locked) lock.releaseLock();
  }
}

/**
 * GET endpoint for approved entries.
 * Returns only rows where approved equals "yes" (case-insensitive, trimmed).
 * Max 50 entries, newest first. lat and lng are included as numbers when present.
 */
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  ensureHeaders(sheet);
  const rows = sheet.getDataRange().getValues();
  const out = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const approved = String(row[4] || "").trim().toLowerCase();
    if (approved === "yes") {
      const item = {
        timestamp: row[0] ? new Date(row[0]).toISOString() : "",
        name: String(row[1] || ""),
        message: String(row[2] || ""),
        species: String(row[3] || "")
      };
      const lat = Number(row[5]), lng = Number(row[6]);
      if (row[5] !== "" && row[6] !== "" && isFinite(lat) && isFinite(lng)) {
        item.lat = lat;
        item.lng = lng;
      }
      out.push(item);
    }
  }

  out.reverse();
  return jsonOut(out.slice(0, 50));
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
