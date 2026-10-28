/* 留言板合約測試：直接呼叫 Apps Script 程式，不需本機網路伺服器。
   執行：node tests/test-guestbook.mjs */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const code = await readFile(new URL("../apps-script/Code.gs", import.meta.url), "utf8");
const frontend = await readFile(new URL("../beta/js/guestbook.js", import.meta.url), "utf8");

function createSheet(initialRows = []) {
  const rows = initialRows.map(row => [...row]);
  return {
    rows,
    getRange(row, column, rowCount, columnCount) {
      return {
        getValue() { return rows[row - 1]?.[column - 1] ?? ""; },
        setValues(values) {
          for (let i = 0; i < values.length; i++) rows[row - 1 + i] = [...values[i]];
        }
      };
    },
    appendRow(row) { rows.push([...row]); },
    getDataRange() { return { getValues: () => rows.map(row => [...row]) }; }
  };
}

function createApp(sheet) {
  const context = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheets: () => [sheet] }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput(text) {
        return { getContent: () => text, setMimeType() { return this; } };
      }
    },
    Date
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context;
}

function jsonResponse(response) {
  return JSON.parse(response.getContent());
}

console.log("--- 後端合約測試 ---");

// 1. An empty bound sheet gets the required header and a pending entry.
const postSheet = createSheet();
const postApp = createApp(postSheet);
const submitted = jsonResponse(postApp.doPost({ parameter: {
  name: "訪客", message: "你好，水口！", species: ""
} }));
assert.equal(submitted.success, true);
assert.deepEqual(postSheet.rows[0], ["time", "name", "message", "species", "approved"]);
assert.equal(postSheet.rows[1][1], "訪客");
assert.equal(postSheet.rows[1][2], "你好，水口！");
assert.equal(postSheet.rows[1][3], "");
assert.equal(postSheet.rows[1][4], "no");
console.log("1. 初始化標題列並寫入 approved=no：PASS");

// 2. GET creates headers on first read and only returns approved=yes rows.
const getSheet = createSheet([
  ["time", "name", "message", "species", "approved"],
  [new Date("2026-01-01T00:00:00Z"), "核准者", "公開留言", "", " Yes "],
  [new Date("2026-01-02T00:00:00Z"), "待審者", "TEST-DELETE-ME", "", "no"]
]);
const getApp = createApp(getSheet);
const listed = jsonResponse(getApp.doGet({}));
assert.equal(listed.length, 1);
assert.equal(listed[0].message, "公開留言");
assert.equal(listed.some(row => row.message === "TEST-DELETE-ME"), false);
console.log("2. GET 只回傳 approved=yes：PASS");

// 3. Honeypot submissions are silently discarded.
const beforeHoneypot = postSheet.rows.length;
const honeypot = jsonResponse(postApp.doPost({ parameter: {
  name: "bot", message: "spam", website: "spamsite"
} }));
assert.equal(honeypot.success, true);
assert.equal(postSheet.rows.length, beforeHoneypot);
console.log("3. honeypot 靜默丟棄：PASS");

// 4. Message length is enforced and names are limited to 40 characters.
const tooLong = jsonResponse(postApp.doPost({ parameter: { message: "a".repeat(501) } }));
assert.equal(tooLong.success, false);
const longName = jsonResponse(postApp.doPost({ parameter: {
  name: "n".repeat(45), message: "長度測試"
} }));
assert.equal(longName.success, true);
assert.equal(postSheet.rows.at(-1)[1].length, 40);
assert.equal(postSheet.rows.at(-1)[4], "no");
console.log("4. 姓名限制 40 字、留言限制 500 字：PASS");

// 5. Frontend renders user content through textContent, never HTML injection.
assert.match(frontend, /msg\s*=\s*el\("span",\s*"guestbook-message"/);
assert.match(frontend, /node\.textContent\s*=\s*text/);
assert.doesNotMatch(frontend, /\.innerHTML\s*=/);
console.log("5. 前端留言以純文字呈現：PASS");

console.log("\n全部測試通過（5 項）");
