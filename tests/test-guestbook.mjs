/* 留言板合約測試：對本機 mock 端點執行 5 項驗收。
   1. 送出正常留言
   2. honeypot 會被丟棄
   3. 超過 500 字會被拒絕
   4. 只回傳 approved === "yes" 的留言
   5. XSS 字串以純文字顯示（前端 UI 檢查）

   執行：node tests/test-guestbook.mjs
   會自動啟動 mock server，測試完畢後關閉。 */
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_URL = "http://127.0.0.1:8788/";

function fetchJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = opts.body || null;
    const req = http.request(
      { hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: opts.method || "GET", headers: opts.headers },
      res => {
        let data = "";
        res.on("data", c => (data += c));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function postForm(obj) {
  const body = new URLSearchParams(obj).toString();
  return fetchJson(MOCK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
}

async function runBackendTests() {
  console.log("--- 後端合約測試 ---");

  // 1. submit
  const submit = await postForm({ name: "訪客", message: "你好，水口！" });
  console.assert(submit.body.success === true, "送出應回傳 success");
  console.log("1. 送出正常留言：PASS");

  // 4. only approved
  const list = await fetchJson(MOCK_URL);
  console.assert(Array.isArray(list.body), "GET 應回傳陣列");
  console.assert(list.body.every(r => String(r.approved || "").trim().toLowerCase() !== "no"), "不應出現未核准留言");
  console.assert(list.body.length >= 2, "至少要有 2 則已核准的初始留言");
  console.log("4. 只顯示已核准留言：PASS");

  // 2. honeypot
  const before = list.body.length;
  const honey = await postForm({ name: "bot", message: "spam", website: "spamsite" });
  console.assert(honey.body.success === true, "honeypot 回應應為 success（靜默丟棄）");
  const after = await fetchJson(MOCK_URL);
  console.assert(after.body.length === before, "honeypot 不應新增留言");
  console.log("2. honeypot 丟棄：PASS");

  // 3. over length
  const longMsg = "a".repeat(501);
  const tooLong = await postForm({ message: longMsg });
  console.assert(tooLong.body.success === false, "超長留言應失敗");
  console.log("3. 超過 500 字拒絕：PASS");

  // 5. XSS in response
  const xss = list.body.find(r => r.message.includes("<script>"));
  console.assert(xss, "回傳列表應包含 XSS 測試字串");
  console.assert(typeof xss.message === "string", "message 應為字串");
  console.log("5. 後端回傳 XSS 字串：PASS");
}

async function runUiTest() {
  console.log("\n--- 前端 UI 測試 ---");

  // Serve repo root so both beta assets and the test page come from http://127.0.0.1.
  const staticServer = spawn("python3", ["-m", "http.server", "8797"], {
    cwd: path.resolve(__dirname, "..")
  });
  await new Promise(r => setTimeout(r, 800));

  // Write a temporary test page under tests/ (served by the repo-root server).
  const testHtml = path.resolve(__dirname, "guestbook-ui-test.html");
  const fs = await import("node:fs");
  fs.writeFileSync(testHtml, `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Guestbook UI test</title>
<link rel="stylesheet" href="http://127.0.0.1:8797/beta/css/tokens.css">
<link rel="stylesheet" href="http://127.0.0.1:8797/beta/css/site.css">
</head>
<body>
<section class="guestbook" id="guestbook"></section>
<script>
var CONFIG = { GUESTBOOK_URL: "${MOCK_URL}" };
</script>
<script src="http://127.0.0.1:8797/beta/js/guestbook.js"></script>
</body>
</html>`);

  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--remote-debugging-port=9224",
    "--remote-allow-origins=*",
    "--user-data-dir=/tmp/opencode-guestbook-test",
    "about:blank"
  ], { stdio: "ignore" });

  await new Promise(r => setTimeout(r, 1200));

  let ws;
  try {
    const targets = await (await fetch("http://127.0.0.1:9224/json/list")).json();
    const target = targets.find(t => t.type === "page");
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

    let seq = 0;
    const pending = new Map();
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++seq;
      ws.send(JSON.stringify({ id, method, params }));
      pending.set(id, { resolve, reject });
    });
    const evaluate = expr => send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Log.enable");
    await send("Page.navigate", { url: "http://127.0.0.1:8797/tests/guestbook-ui-test.html" });
    await new Promise(r => setTimeout(r, 3000));

    const result = await evaluate(`(() => {
      const msg = document.querySelector('.guestbook-message');
      return {
        hasXss: !!msg && msg.textContent.includes("<script>"),
        scriptInside: !!document.querySelector('.guestbook-message script'),
        textContent: msg ? msg.textContent : null,
        html: msg ? msg.innerHTML : null,
        listItems: document.querySelectorAll('.guestbook-item').length
      };
    })()`);

    if (result.exceptionDetails) {
      throw new Error("page eval exception: " + JSON.stringify(result.exceptionDetails));
    }
    const v = result.result.value;
    console.assert(v.listItems >= 2, "應顯示至少兩則已核准留言");
    console.assert(v.hasXss, "UI 應顯示含有 <script> 的文字");
    console.assert(!v.scriptInside, "UI 內不應有真正的 <script> 元素");
    console.assert(v.textContent.includes("<script>"), "textContent 應保留標籤字元");
    console.log("5. 前端 XSS 以純文字顯示：PASS");
  } finally {
    try { ws?.close(); } catch {}
    chrome.kill("SIGTERM");
    staticServer.kill("SIGTERM");
    try { fs.unlinkSync(testHtml); } catch {}
  }
}

const mock = spawn("node", [path.resolve(__dirname, "mock-guestbook.mjs")], { stdio: "inherit" });
await new Promise(r => setTimeout(r, 500));

try {
  await runBackendTests();
  await runUiTest();
  console.log("\n全部測試通過");
} catch (err) {
  console.error("\n測試失敗：", err.message);
  process.exitCode = 1;
} finally {
  mock.kill("SIGTERM");
}
