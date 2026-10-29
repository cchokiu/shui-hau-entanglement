/**
 * 共構水口 — 留言板 / 訪客地圖標記 後端（Google Apps Script，綁定 Google 試算表）。
 *
 * Sheet 第一列（A–F 為既有表頭，G–I 由本程式補上）：
 *   A 時間｜B 段落｜C 名字｜D 留言｜E 回覆｜F 已核准公開 y/n｜G 物種｜H 緯度｜I 經度
 * 程式以「欄名」找欄位（讀第一列），找不到才用上面的預設位置。
 */

const LAT_MIN = 22.15, LAT_MAX = 22.35;
const LNG_MIN = 113.80, LNG_MAX = 114.10;
const MAX_ROWS = 100;
const SECTIONS = ["general", "map"];

// 欄位鍵 → 第一列欄名中必須包含的字樣、預設欄號（1 起算）
const COLUMNS = {
  time:     { label: "時間",   fallback: 1 },
  section:  { label: "段落",   fallback: 2 },
  name:     { label: "名字",   fallback: 3 },
  message:  { label: "留言",   fallback: 4 },
  reply:    { label: "回覆",   fallback: 5 },
  approved: { label: "已核准", fallback: 6 },
  species:  { label: "物種",   fallback: 7 },
  lat:      { label: "緯度",   fallback: 8 },
  lng:      { label: "經度",   fallback: 9 }
};
const FULL_HEADERS = ["時間", "段落", "名字", "留言", "回覆", "已核准公開 y/n", "物種", "緯度", "經度"];
const EXTRA_HEADERS = ["物種", "緯度", "經度"]; // G1:I1

/**
 * 補表頭。只在 G1 空白時寫入 G–I 的表頭（物種、緯度、經度）；不改 A–F 表頭。
 * 只有整張表是空的（A1 也空白）時，才一併寫入 A–F 表頭。
 */
function ensureHeaders(sheet) {
  if (sheet.getRange(1, 1).getValue() === "") {
    sheet.getRange(1, 1, 1, FULL_HEADERS.length).setValues([FULL_HEADERS]);
    return;
  }
  if (sheet.getRange(1, 7).getValue() === "") {
    sheet.getRange(1, 7, 1, EXTRA_HEADERS.length).setValues([EXTRA_HEADERS]);
  }
}

/** 讀第一列，回傳 { time: 欄號, section: 欄號, ... }（1 起算）；找不到欄名就用預設位置。 */
function findColumns(headerRow) {
  const cols = {};
  Object.keys(COLUMNS).forEach(function (key) {
    let found = 0;
    for (let i = 0; i < headerRow.length; i++) {
      if (String(headerRow[i]).indexOf(COLUMNS[key].label) !== -1) { found = i + 1; break; }
    }
    cols[key] = found || COLUMNS[key].fallback;
  });
  return cols;
}

/** 是否有提供某個參數（空白視為沒有提供）。 */
function provided(v) {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

/** 只接受 general / map；其他值（或沒有）一律視為 general。 */
function parseSection(v) {
  const s = String(v === undefined || v === null ? "" : v).trim().toLowerCase();
  return SECTIONS.indexOf(s) !== -1 ? s : "general";
}

/**
 * 解析 lat、lng：兩者都必須是數字，並在水口範圍內，否則回傳 null（invalid location）。
 */
function parseLocation(params) {
  if (!provided(params.lat) || !provided(params.lng)) return null;
  const lat = Number(String(params.lat).trim());
  const lng = Number(String(params.lng).trim());
  if (!isFinite(lat) || !isFinite(lng)) return null;
  if (lat < LAT_MIN || lat > LAT_MAX || lng < LNG_MIN || lng > LNG_MAX) return null;
  return { lat: lat, lng: lng };
}

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

/**
 * POST：留言板留言（section=general）或訪客地圖標記（section=map）。
 * 參數：section（general / map，預設 general）、name（選填，≤40）、message（必填，≤500）、
 *       species（選填，≤20）、lat / lng（section=map 時必填且須在範圍內；general 時忽略）。
 * Honeypot：hp / honeypot / website 任一有值 → 靜默丟棄（回報成功）。
 * 新資料一律寫入「已核准公開」= n，需在 Sheet 手動改為 y 才會公開。
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    lock.waitLock(10000);
    locked = true;

    const params = (e && e.parameter) || {};

    if ((params.hp || "").toString().trim() ||
        (params.honeypot || "").toString().trim() ||
        (params.website || "").toString().trim()) {
      return jsonOut({ success: true });
    }

    const section = parseSection(params.section);
    const name = (params.name || "").toString().trim().slice(0, 40);
    const message = (params.message || "").toString().trim();
    const species = (params.species || "").toString().trim().slice(0, 20);

    if (!message) {
      return jsonOut({ success: false, error: "message is required" });
    }
    if (message.length > 500) {
      return jsonOut({ success: false, error: "message exceeds 500 characters" });
    }

    let lat = "", lng = "";
    if (section === "map") {
      const loc = parseLocation(params);
      if (loc === null) {
        return jsonOut({ success: false, error: "invalid location" });
      }
      lat = loc.lat;
      lng = loc.lng;
    }

    const sheet = getSheet();
    ensureHeaders(sheet);
    const cols = findColumns(sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), FULL_HEADERS.length)).getValues()[0]);
    const values = { time: new Date(), section: section, name: name, message: message,
                     reply: "", approved: "n", species: species, lat: lat, lng: lng };
    const width = Math.max.apply(null, Object.keys(cols).map(function (k) { return cols[k]; }));
    const row = [];
    for (let i = 0; i < width; i++) row.push("");
    Object.keys(cols).forEach(function (k) { row[cols[k] - 1] = values[k]; });
    sheet.appendRow(row);

    return jsonOut({ success: true });
  } catch (err) {
    return jsonOut({ success: false, error: err.message });
  } finally {
    if (locked) lock.releaseLock();
  }
}

/**
 * GET：只回傳「已核准公開」欄（去空白、不分大小寫）為 y 或 yes 的列。
 * 參數 section（可選）：只回傳該段落。最新在前，最多 100 筆。
 * 欄位：{ timestamp, section, name, message, reply, species, lat?, lng? }
 */
function doGet(e) {
  const params = (e && e.parameter) || {};
  const wanted = provided(params.section) ? String(params.section).trim().toLowerCase() : "";
  const sheet = getSheet();
  ensureHeaders(sheet);
  const rows = sheet.getDataRange().getValues();
  if (!rows.length) return jsonOut([]);
  const cols = findColumns(rows[0]);
  const out = [];

  function cell(row, key) {
    const v = row[cols[key] - 1];
    return v === undefined || v === null ? "" : v;
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const approved = String(cell(row, "approved")).trim().toLowerCase();
    if (approved !== "y" && approved !== "yes") continue;

    const section = String(cell(row, "section")).trim().toLowerCase() || "general";
    if (wanted && section !== wanted) continue;

    const item = {
      timestamp: toIso(cell(row, "time")),
      section: section,
      name: String(cell(row, "name")),
      message: String(cell(row, "message")),
      reply: String(cell(row, "reply")),
      species: String(cell(row, "species"))
    };
    const rawLat = cell(row, "lat"), rawLng = cell(row, "lng");
    if (String(rawLat).trim() !== "" && String(rawLng).trim() !== "") {
      const lat = Number(rawLat), lng = Number(rawLng);
      if (isFinite(lat) && isFinite(lng)) {
        item.lat = lat;
        item.lng = lng;
      }
    }
    out.push(item);
  }

  out.reverse();
  return jsonOut(out.slice(0, MAX_ROWS));
}

function toIso(v) {
  if (v === "" || v === null || v === undefined) return "";
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toISOString();
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
