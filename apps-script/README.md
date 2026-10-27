# 共構水口 — 留言板 Apps Script

## 檔案

- `Code.gs`：提供 `doPost` 與 `doGet`，連結到 Google Sheet `1kTtZzgerODlb5hqlUfxhfMRlY0FbYf88IBkeZuyyQSE`。

## Sheet 欄位

工作表第一列必須是標題列：

| A | B | C | D |
|---|---|---|---|
| timestamp | name | message | approved |

`approved` 欄手動填入 `yes`（大小寫不拘、前後空白無所謂）才會透過 `doGet` 公開顯示。

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
