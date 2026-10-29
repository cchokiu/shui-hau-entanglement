/* 留言板／訪客標記合約測試：直接呼叫 Apps Script 程式，不需本機網路伺服器。
   Sheet 欄位：時間｜段落｜名字｜留言｜回覆｜已核准公開 y/n｜物種｜緯度｜經度
   執行：node tests/test-guestbook.mjs */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const code = await readFile(new URL("../apps-script/Code.gs", import.meta.url), "utf8");
const frontend = await readFile(new URL("../beta/js/guestbook.js", import.meta.url), "utf8");
const contribute = await readFile(new URL("../beta/js/map-contribute.js", import.meta.url), "utf8");

const REAL_HEADER = ["時間", "段落", "名字", "留言", "回覆", "已核准公開 y/n"];

function createSheet(initialRows = []) {
  const rows = initialRows.map(row => [...row]);
  const width = () => rows.reduce((m, r) => Math.max(m, r.length), 0);
  return {
    rows,
    getLastColumn() { return width(); },
    getRange(row, column, rowCount = 1, columnCount = 1) {
      return {
        getValue() { return rows[row - 1]?.[column - 1] ?? ""; },
        getValues() {
          const out = [];
          for (let i = 0; i < rowCount; i++) {
            const line = [];
            for (let j = 0; j < columnCount; j++) line.push(rows[row - 1 + i]?.[column - 1 + j] ?? "");
            out.push(line);
          }
          return out;
        },
        setValues(values) {
          for (let i = 0; i < values.length; i++) {
            rows[row - 1 + i] = rows[row - 1 + i] || [];
            for (let j = 0; j < values[i].length; j++) rows[row - 1 + i][column - 1 + j] = values[i][j];
          }
        }
      };
    },
    appendRow(row) { rows.push([...row]); },
    getDataRange() { return { getValues: () => rows.map(row => { const r = [...row]; while (r.length < width()) r.push(""); return r; }) }; }
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

const json = response => JSON.parse(response.getContent());
let n = 0;
const pass = msg => console.log(`${++n}. ${msg}：PASS`);

console.log("--- 後端合約測試 ---");

// 1. 真實 Sheet（A–F 表頭已存在）：只補 G–I 表頭，不改 A–F。
const sheet = createSheet([REAL_HEADER]);
const app = createApp(sheet);
let res = json(app.doPost({ parameter: { name: "訪客", message: "你好，水口！" } }));
assert.equal(res.success, true);
assert.deepEqual(sheet.rows[0], [...REAL_HEADER, "物種", "緯度", "經度"]);
assert.equal(sheet.rows[1][1], "general");
assert.equal(sheet.rows[1][2], "訪客");
assert.equal(sheet.rows[1][3], "你好，水口！");
assert.equal(sheet.rows[1][4], "");
assert.equal(sheet.rows[1][5], "n");
assert.equal(sheet.rows[1][7], "");
assert.equal(sheet.rows[1][8], "");
pass("只補 G–I 表頭；一般留言 section=general、已核准=n");

// 2. G1 已有內容時，不再改動表頭。
const sheet2 = createSheet([[...REAL_HEADER, "物種", "緯度", "經度"]]);
createApp(sheet2).doPost({ parameter: { message: "x" } });
assert.deepEqual(sheet2.rows[0], [...REAL_HEADER, "物種", "緯度", "經度"]);
pass("G1 非空白時不改表頭");

// 3. section=map：必填且須在範圍內的 lat/lng；寫入 G–I。
res = json(app.doPost({ parameter: { section: "map", name: "阿明", message: "見到水牛", species: "水牛", lat: "22.2205", lng: "113.9165" } }));
assert.equal(res.success, true);
assert.deepEqual(sheet.rows.at(-1).slice(1), ["map", "阿明", "見到水牛", "", "n", "水牛", 22.2205, 113.9165]);
for (const bad of [{}, { lat: "22.22" }, { lat: "abc", lng: "113.9" }, { lat: "10", lng: "113.9" }, { lat: "22.22", lng: "120" }]) {
  res = json(app.doPost({ parameter: { section: "map", message: "壞座標", ...bad } }));
  assert.equal(res.success, false);
  assert.equal(res.error, "invalid location");
}
pass("section=map 必填 lat/lng 並檢查範圍");

// 4. section=general 忽略 lat/lng；未知 section 視為 general。
const before = sheet.rows.length;
app.doPost({ parameter: { section: "general", message: "一般", lat: "22.22", lng: "113.9" } });
assert.equal(sheet.rows.at(-1)[7], "");
assert.equal(sheet.rows.at(-1)[8], "");
app.doPost({ parameter: { section: "bogus", message: "未知段落" } });
assert.equal(sheet.rows.at(-1)[1], "general");
assert.equal(sheet.rows.length, before + 2);
pass("general 忽略座標；未知 section 當 general");

// 5. honeypot 靜默丟棄；長度限制。
const beforeHp = sheet.rows.length;
for (const key of ["hp", "honeypot", "website"]) {
  res = json(app.doPost({ parameter: { message: "spam", [key]: "bot" } }));
  assert.equal(res.success, true);
}
assert.equal(sheet.rows.length, beforeHp);
assert.equal(json(app.doPost({ parameter: { message: "a".repeat(501) } })).success, false);
assert.equal(json(app.doPost({ parameter: { message: "" } })).success, false);
app.doPost({ parameter: { name: "n".repeat(45), species: "s".repeat(30), message: "長度測試", section: "map", lat: "22.22", lng: "113.9" } });
assert.equal(sheet.rows.at(-1)[2].length, 40);
assert.equal(sheet.rows.at(-1)[6].length, 20);
pass("honeypot、留言 ≤500、名字 ≤40、物種 ≤20");

// 6. GET：只回 F 欄 y／yes；section 篩選；欄位；最新在前。
const t = s => new Date(s);
const getSheet = createSheet([
  [...REAL_HEADER, "物種", "緯度", "經度"],
  [t("2026-01-01T00:00:00Z"), "general", "甲", "公開留言 1", "回覆甲", " Y ", "", "", ""],
  [t("2026-01-02T00:00:00Z"), "general", "乙", "待審", "", "n", "", "", ""],
  [t("2026-01-03T00:00:00Z"), "map", "", "稻田", "", "yes", "水稻", 22.22, 113.91],
  [t("2026-01-04T00:00:00Z"), "map", "丙", "待審標記", "", "no", "水牛", 22.22, 113.91],
  [t("2026-01-05T00:00:00Z"), "general", "丁", "公開留言 2", "", "YES", "", "", ""],
  [t("2026-01-06T00:00:00Z"), "general", "戊", "舊值 yes 之外", "", "approved", "", "", ""]
]);
const gApp = createApp(getSheet);
let all = json(gApp.doGet({ parameter: {} }));
assert.deepEqual(all.map(r => r.message), ["公開留言 2", "稻田", "公開留言 1"]);
assert.deepEqual(Object.keys(all[2]), ["timestamp", "section", "name", "message", "reply", "species"]);
assert.equal(all[2].reply, "回覆甲");
assert.equal(all[1].lat, 22.22);
assert.equal(all[1].lng, 113.91);
assert.equal("lat" in all[0], false);
assert.deepEqual(json(gApp.doGet({ parameter: { section: "map" } })).map(r => r.message), ["稻田"]);
assert.deepEqual(json(gApp.doGet({ parameter: { section: "general" } })).map(r => r.message), ["公開留言 2", "公開留言 1"]);
assert.equal(all.some(r => r.message.includes("待審")), false);
pass("GET 只回 y／yes、section 篩選、欄位與排序");

// 7. 以欄名找欄位：欄位順序被改動時仍正確。
const shuffled = createSheet([
  ["留言", "已核准公開 y/n", "時間", "名字", "段落"],
  ["亂序留言", "y", t("2026-02-01T00:00:00Z"), "己", "general"]
]);
const sApp = createApp(shuffled);
const listed = json(sApp.doGet({ parameter: {} }));
assert.equal(listed.length, 1);
assert.equal(listed[0].message, "亂序留言");
assert.equal(listed[0].name, "己");
pass("以欄名（非欄號）找欄位");

// 8. 最多 100 筆。
const big = createSheet([REAL_HEADER, ...Array.from({ length: 130 }, (_, i) => [new Date(2026, 0, 1), "general", "n" + i, "m" + i, "", "y"])]);
assert.equal(json(createApp(big).doGet({ parameter: {} })).length, 100);
pass("GET 最多 100 筆");

// 9. 前端：留言以純文字呈現、帶 section、顯示回覆。
assert.match(frontend, /node\.textContent\s*=\s*text/);
assert.doesNotMatch(frontend, /\.innerHTML\s*=/);
assert.doesNotMatch(contribute, /\.innerHTML\s*=/);
assert.match(frontend, /section=general|"section",\s*"general"/);
assert.match(frontend, /回覆：/);
assert.match(contribute, /"section",\s*"map"/);
pass("前端純文字呈現、section 參數、回覆顯示");

console.log(`\n全部測試通過（${n} 項）`);
