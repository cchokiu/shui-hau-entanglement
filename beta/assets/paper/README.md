# 紙質紋理（assets/paper）

此資料夾放紙質皮膚（B1）的紋理圖。檔案尚未到位時，網站使用 `css/tokens.css` 內嵌的 SVG 噪點作後備；檔案缺失不會出錯，檔案到位後自動套用，不需要改程式。

## 期望檔名

| 檔名 | 用途 | CSS 變數 |
|---|---|---|
| `base.webp` | 全站底紙；紙塊的預設紋理 | `--paper-base` |
| `cattle.webp` | 瀨鑊邊／黃牛 紙塊 | `--paper-cattle` |
| `clam.webp` | 翅口（沙白） 紙塊 | `--paper-clam` |
| `rice.webp` | 水稻 紙塊 | `--paper-rice` |
| `buffalo.webp` | 水牛 紙塊 | `--paper-buffalo` |
| `tape.webp` | 選中紙塊頂部的「紙膠帶」 | `--paper-tape` |

## 規格

- 尺寸 2000 × 2000 px，必須**可平鋪**（四邊接縫不可見）。
- 每張 ≤ 150 KB（webp）。
- 紋理需明亮、低對比：紙塊以「乘法」疊在物種色上，紋理平均明度建議不低於約 95%，否則文字對比度會下降。換圖後請執行 `node tools/check-contrast.mjs` 重新檢查，並肉眼確認各紙塊文字清晰。
- 底紙強度由 `--paper-opacity`（tokens.css，預設 0.5）調整。

## 目前的佔位檔

六個 `*.webp` 目前是 4 × 4 px 的純白佔位圖（各約 40 bytes），作用是避免瀏覽器對缺少的檔案回報 404（console 錯誤）；純白在「乘法」混合下不改變顏色，所以畫面上只會看到內嵌噪點。正式紋理到位後，直接用同名檔案覆蓋即可。
