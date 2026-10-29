#!/usr/bin/env node
/* 由 beta/data/catalogue-points.js（水口研究資料目錄，window.CATALOGUE_ITEMS）生成 beta/data/map-items.js。
   可選：tools/media-manifest.json，格式 { "r2": [{ "type": "photo", "src": "assets/catalogue/r2-1.webp", "alt": "…" }], … }
   執行（repo 根目錄）：node tools/build-map-items.mjs
   選項：--check  只檢查，不寫檔 */
import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const SRC = new URL("../beta/data/catalogue-points.js", import.meta.url);
const MANIFEST = new URL("./media-manifest.json", import.meta.url);
const OUT = new URL("../beta/data/map-items.js", import.meta.url);
const SOURCE_NAME = "水口研究資料目錄";

/* 類別規則（依序，第一個命中）。topic 為整串比對（例如「蟹、水鳥、蠔」是一個 topic）。 */
const ANIMAL_TOPICS = new Set(["海膽", "䗉螺", "墨魚", "鯖魚", "梅蝦", "沙白", "蟹、水鳥、蠔", "蟹", "水牛", "黃牛",
  "家畜 - 豬、雞", "害蟲", "蜜蜂", "田鳥", "蝴蝶", "蜻蜓", "昆蟲"]);
const PLANT_TOPICS = new Set(["農作物", "稻米", "番鬼荔枝", "蔥", "菠蘿", "山林草藥", "柴草"]);
const FORM_LABEL = { Audio: "錄音", Video: "影片", Photo: "相片" };

export function categoryOf(item) {
  const summary = item.summary || "";
  const topic = item.topic || "";
  if (/工具|農具/.test(summary)) return "tool";
  if (topic === "村民家" || /村民|祥叔|訪談/.test(summary)) return "villager";
  if (ANIMAL_TOPICS.has(topic)) return "animal";
  if (PLANT_TOPICS.has(topic)) return "plant";
  return "story"; // 瀨鑊邊、環境、肥料、空白
}

/* 沙白一律顯示為「翅口（沙白）」（已是此寫法的不重複替換） */
export function clam(text) {
  return String(text || "").replace(/(?<!翅口（)沙白(?!）)/g, "翅口（沙白）");
}

export function formLabel(form) {
  const f = String(form || "").trim();
  if (!f) return "";
  return f.split(/[,、/／\s]+/).filter(Boolean).map(x => FORM_LABEL[x] || x).join("／");
}

export function buildItem(src, manifest = {}) {
  const topic = (src.topic || "").trim();
  const summary = (src.summary || "").trim();
  const text = [clam(summary)];
  if (src.date) text.push("記錄：" + src.date);
  const form = formLabel(src.form);
  if (form) text.push("資料形式：" + form);
  return {
    id: src.id,
    approved: true,
    lat: src.lat,
    lng: src.lng,
    category: categoryOf(src),
    title: clam(topic ? `${topic}：${summary}` : summary),
    location: `${src.place}（參考點 ${src.base_ref}）`,
    text,
    media: (manifest[src.id] || []).map(m => ({ type: m.type, src: m.src, alt: m.alt || "" })),
    source: SOURCE_NAME,
    form,
    date: src.date || ""
  };
}

async function readJson(url) {
  try { return JSON.parse(await readFile(url, "utf8")); } catch (e) { if (e.code === "ENOENT") return {}; throw e; }
}

async function main() {
  const ctx = { window: {} };
  vm.runInNewContext(await readFile(SRC, "utf8"), ctx);
  const rows = ctx.window.CATALOGUE_ITEMS;
  if (!Array.isArray(rows) || !rows.length) throw new Error("CATALOGUE_ITEMS 為空");
  const manifest = await readJson(MANIFEST);
  const items = rows.map(r => {
    if (typeof r.lat !== "number" || typeof r.lng !== "number") throw new Error("缺少座標：" + r.id);
    return buildItem(r, manifest);
  });
  const counts = {};
  items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
  const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Hong_Kong" });
  const header = `/* 由 tools/build-map-items.mjs 生成，請勿手改。生成日期：${date}
   資料來源：beta/data/catalogue-points.js（${SOURCE_NAME}）${Object.keys(manifest).length ? "及 tools/media-manifest.json" : "（尚無媒體 manifest，media 為空）"}。
   位置為大約位置；同一地點的點經螺旋分散，點與點的距離只為方便點選。 */\n`;
  const body = "window.MAP_ITEMS = " + JSON.stringify(items, null, 2) + ";\n";
  if (process.argv.includes("--check")) {
    console.log("OK", items.length, counts);
    return;
  }
  await writeFile(OUT, header + body);
  console.log("已寫入 beta/data/map-items.js：", items.length, "項", counts);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e.message); process.exit(1); });
}
