/* 本機 mock，模擬 Apps Script 留言板端點。
   啟動：node tests/mock-guestbook.mjs
   預設連接埠：8788 */
import http from "node:http";
import { parse } from "node:url";

const PORT = 8788;

const store = [
  {
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    name: "測試員",
    message: "這是一則已核准的測試留言。",
    approved: "yes"
  },
  {
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    name: "未審核者",
    message: "這則留言還沒被核准，不應該出現在列表。",
    approved: ""
  },
  {
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    name: "XSS 測試",
    message: "<script>alert('xss')</script>",
    approved: "yes"
  }
];

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function parseBody(req, cb) {
  let raw = "";
  req.on("data", chunk => (raw += chunk));
  req.on("end", () => cb(raw));
}

function parseFormData(raw) {
  const out = {};
  const params = new URLSearchParams(raw);
  for (const [k, v] of params) out[k] = v;
  return out;
}

const server = http.createServer((req, res) => {
  const { pathname } = parse(req.url, true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === "/" && req.method === "GET") {
    const approved = store
      .filter(r => String(r.approved || "").trim().toLowerCase() === "yes")
      .map(r => ({ timestamp: r.timestamp, name: r.name, message: r.message }))
      .reverse()
      .slice(0, 50);
    return sendJson(res, 200, approved);
  }

  if (pathname === "/" && req.method === "POST") {
    return parseBody(req, raw => {
      const params = parseFormData(raw);

      if ((params.hp || "").trim() || (params.honeypot || "").trim() || (params.website || "").trim()) {
        return sendJson(res, 200, { success: true });
      }

      const name = (params.name || "").trim().slice(0, 40);
      const message = (params.message || "").trim();

      if (!message) {
        return sendJson(res, 200, { success: false, error: "message is required" });
      }
      if (message.length > 500) {
        return sendJson(res, 200, { success: false, error: "message exceeds 500 characters" });
      }

      store.push({
        timestamp: new Date().toISOString(),
        name,
        message,
        approved: ""
      });
      return sendJson(res, 200, { success: true });
    });
  }

  sendJson(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log("Mock guestbook listening on http://localhost:" + PORT + "/");
});
