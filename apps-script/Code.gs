const SHEET_ID = "1kTtZzgerODlb5hqlUfxhfMRlY0FbYf88IBkeZuyyQSE";

/**
 * POST endpoint for guestbook submissions.
 * Accepts: name (optional, max 40 chars), message (required, max 500 chars).
 * Honeypot fields: hp / honeypot / website — if any has a value, the request is silently discarded.
 * approved column is left empty for manual moderation.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const params = e.parameter || {};

    // Honeypot: any value means discard.
    if ((params.hp || "").toString().trim() ||
        (params.honeypot || "").toString().trim() ||
        (params.website || "").toString().trim()) {
      return jsonOut({ success: true });
    }

    const name = (params.name || "").toString().trim().slice(0, 40);
    const message = (params.message || "").toString().trim();

    if (!message) {
      return jsonOut({ success: false, error: "message is required" });
    }
    if (message.length > 500) {
      return jsonOut({ success: false, error: "message exceeds 500 characters" });
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    sheet.appendRow([new Date(), name, message, ""]);

    return jsonOut({ success: true });
  } catch (err) {
    return jsonOut({ success: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

/**
 * GET endpoint for approved guestbook entries.
 * Returns only rows where approved equals "yes" (case-insensitive, trimmed).
 * Max 50 entries, newest first.
 */
function doGet(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  const rows = sheet.getDataRange().getValues();
  const out = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const approved = String(row[3] || "").trim().toLowerCase();
    if (approved === "yes") {
      out.push({
        timestamp: row[0] ? new Date(row[0]).toISOString() : "",
        name: String(row[1] || ""),
        message: String(row[2] || "")
      });
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
