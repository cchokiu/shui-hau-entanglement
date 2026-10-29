#!/usr/bin/env node
/* 檢查紙塊（.paper-chip）各底色與文字色的 WCAG 對比度（需 ≥ 4.5:1）。
   紋理以乘法疊上，會令底色略深：同時列出「純底色」與「最深紋理（底色 × 0.95，佔位噪點的最壞情況）」，兩者都要達標。
   換上正式紋理檔（assets/paper/*.webp）後須重新檢查：紋理平均明度不應低於約 95%。
   執行：node tools/check-contrast.mjs（有不合格組合時以 exit 1 結束） */
const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const darken = (c, f) => c.map(v => Math.round(v * f));

const INK_DARK = "#2f3415", INK_TEXT = "#475020", INK_LIGHT = "#fffaf0";
/* 規格建議的三種字色在翅口（沙白）與水牛底色上都不到 4.5:1，這兩款改用更深的 #1b1f0c（--ink-deep） */
const INK_DEEP = "#1b1f0c";
/* 水牛原色 #d36225 即使配最深字色也只有 4.44:1，紙塊底色改用 85% 水牛色＋15% 紙色 = #d87742（--c-buffalo-chip） */
/* 與 beta/css/tokens.css、site.css 的 .paper-chip 各款一致 */
const CHIPS = [
  ["紙色（預設／圖例）", "#f5f1e5", INK_TEXT],
  ["瀨鑊邊／黃牛 --c-cattle", "#efd375", INK_DARK],
  ["翅口（沙白） --c-clam", "#4fa096", INK_DEEP],
  ["水稻 --c-rice", "#bbc462", INK_DARK],
  ["水牛 --c-buffalo-chip", "#d87742", INK_DEEP]
];
const MULTIPLY_WORST = 0.95;
const rows = [];
let fail = false;
for (const [name, bg, ink] of CHIPS) {
  const flat = ratio(rgb(bg), rgb(ink));
  const deep = ratio(darken(rgb(bg), MULTIPLY_WORST), rgb(ink));
  const ok = flat >= 4.5 && deep >= 4.5;
  if (!ok) fail = true;
  rows.push(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(26)} 底 ${bg} 字 ${ink}  純底色 ${flat.toFixed(2)}:1  紋理 ×0.95 ${deep.toFixed(2)}:1`);
}
if (process.argv.includes("--all")) {
  for (const [name, bg] of CHIPS) for (const ink of [INK_DARK, INK_DEEP, INK_TEXT, INK_LIGHT]) {
    rows.push(`      ${name.padEnd(26)} ${bg} × ${ink}  ${ratio(rgb(bg), rgb(ink)).toFixed(2)}:1 / ${ratio(darken(rgb(bg), MULTIPLY_WORST), rgb(ink)).toFixed(2)}:1`);
  }
}
console.log(rows.join("\n"));
process.exit(fail ? 1 : 0);
