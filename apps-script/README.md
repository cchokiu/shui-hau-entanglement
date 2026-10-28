# 共構水口 — 留言板 Apps Script

## 檔案

- `Code.gs`：提供 `doPost` 與 `doGet`，連結到綁定的 Google 試算表（網址不放入 repo）。

## Sheet 欄位

工作表第一列必須是標題列（程式會在第一次寫入或讀取時自動建立）：

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| time | name | message | species | approved | lat | lng |

- `approved` 欄預設為 `no`；手動改為 `yes`（大小寫不拘、前後空白無所謂）才會透過 `doGet` 公開顯示。
- `lat`、`lng`（F、G 欄）只由訪客「加入你的地點」功能寫入，可選；有值時會隨 `doGet` 一併回傳，供地圖顯示。
- 訪客送出的地點範圍：北緯 22.15–22.35、東經 113.80–114.10，超出範圍會被拒絕。

## Apps Script 部署步驟

1. 開啟 [Google Apps Script](https://script.google.com/home)（需登入可編輯該 Sheet 的 Google 帳戶）。
2. 建立新專案 → 專案名稱建議：`shui-hau-guestbook`。
3. 刪除預設 `Code.gs` 內容，貼上本檔 `Code.gs` 的全部程式碼。
4. 點選「儲存」。
5. 點選「部署」→「新增部署」→ 類型選「網頁應用程式」：
   - 執行身分：「我」
   - 可存取該應用程式的人員：「任何人」
6. 點選「部署」，依照提示授權（需要存取 Google Sheets 的權限）。
7. 部署完成後，複製「網頁應用程式 URL」。
8. 將該 URL 貼到 `beta/js/config.js` 的 `GUESTBOOK_URL`。
9. 重新整理網站，留言板即可運作。

## 重新部署

修改 `Code.gs` 後，點選「部署」→「管理部署」→ 該部署的「編輯」→「版本」選「新增」→「部署」。URL 不會改變。

## 前端設定

`beta/js/config.js`：

```js
var CONFIG = {
  GUESTBOOK_URL: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
};
```

若 `GUESTBOOK_URL` 為空字串，前端會顯示「留言功能即將開放」，不顯示表單。

## 重新部署步驟（加入 lat、lng 之後必做）

1. 在 Sheet 第一列的 F、G 欄填上 `lat`、`lng`（若第一列已有標題，直接補上這兩格）。
2. 把新的 `Code.gs` 貼到 Apps Script（取代舊內容），點選「儲存」。
3. 點選「部署」→「管理部署」→ 該部署的「編輯」→「版本」選「新版本」→「部署」。網址不會改變，`config.js` 不需要修改。

未完成以上三步之前，訪客送出的地點只會變成普通留言（舊後端忽略 `lat`、`lng`），地圖上不會出現。
