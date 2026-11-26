// Local server for the demo: serves the student site (/) and the teacher site (/teacher/), keeps the players' records in
// data/store.json so both sites see the same data, and, if POE_API_KEY is set, writes the AI review.
// Run:  POE_API_KEY=your-key node server.mjs      (the key stays in this process, never in the page)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const { emptyData, mergeStudent, removeStudent, cleanSettings } = createRequire(import.meta.url)("./js/sync.js");

const root = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8765);
const KEY = process.env.POE_API_KEY || "";
const MODEL = process.env.POE_MODEL || "gpt-5.4-mini";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".m4a": "audio/mp4", ".png": "image/png", ".svg": "image/svg+xml" };

const DATA_FILE = path.join(process.env.DATA_DIR || path.join(root, "data"), "store.json");
let data = emptyData();
try { data = { ...emptyData(), ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) }; } catch { /* first run: no records yet */ }
function persist() { fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true }); fs.writeFileSync(DATA_FILE + ".tmp", JSON.stringify(data)); fs.renameSync(DATA_FILE + ".tmp", DATA_FILE); }

async function readJson(req, res, limit = 1_000_000) {
  let body = "";
  for await (const chunk of req) { body += chunk; if (body.length > limit) { send(res, 413, JSON.stringify({ error: "too large" })); return null; } }
  try { return JSON.parse(body); } catch { send(res, 400, JSON.stringify({ error: "bad json" })); return null; }
}

// The sites share these records: the student site writes one player at a time; the teacher site changes settings and removes players.
async function api(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/data") return send(res, 200, JSON.stringify(data));
  const body = await readJson(req, res);
  if (!body) return;
  if (pathname === "/api/student") { if (mergeStudent(data, body.student)) persist(); return send(res, 200, "{}"); }
  if (pathname === "/api/student/delete" && typeof body.id === "string") { removeStudent(data, body.id); persist(); return send(res, 200, "{}"); }
  if (pathname === "/api/settings") { data.settings = cleanSettings(body.settings); persist(); return send(res, 200, JSON.stringify(data.settings)); }
  send(res, 404, "{}");
}

const send = (res, code, body, type = "application/json") => { res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" }); res.end(body); };

async function review(req, res) {
  if (!KEY) return send(res, 503, JSON.stringify({ error: "POE_API_KEY is not set" }));
  let body = "";
  for await (const chunk of req) { body += chunk; if (body.length > 20000) return send(res, 413, JSON.stringify({ error: "too large" })); }
  let prompt;
  try { prompt = JSON.parse(body).prompt; } catch { return send(res, 400, JSON.stringify({ error: "bad json" })); }
  if (typeof prompt !== "string" || prompt.length < 20 || prompt.length > 4000) return send(res, 400, JSON.stringify({ error: "bad prompt" }));
  try {
    const upstream = await fetch("https://api.poe.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }], max_tokens: 700, temperature: 0.5 }),
      signal: AbortSignal.timeout(25000),
    });
    if (!upstream.ok) return send(res, 502, JSON.stringify({ error: `upstream ${upstream.status}` }));
    const j = await upstream.json();
    send(res, 200, JSON.stringify({ text: j.choices?.[0]?.message?.content || "", model: MODEL }));
  } catch (err) {
    send(res, 504, JSON.stringify({ error: String(err.name) }));
  }
}

// Only pages served from this machine may talk to the server. A POST must be JSON (a web page on another site can
// send "text/plain" without asking the browser for permission) and must come from the same origin; the Host must be
// this machine, which stops a DNS-rebinding page from reading the records.
function allowed(req) {
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || "")) return 403;
  if (req.method === "POST") {
    if (!String(req.headers["content-type"] || "").startsWith("application/json")) return 415;
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return 403;
  }
  return 0;
}

http.createServer(async (req, res) => {
 try {
  const refused = allowed(req);
  if (refused) return send(res, refused, JSON.stringify({ error: "refused" }));
  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname === "/api/status") return send(res, 200, JSON.stringify({ ai: Boolean(KEY), model: MODEL }));
  if (req.method === "POST" && url.pathname === "/api/review") return review(req, res);
  if (url.pathname.startsWith("/api/")) return api(req, res, url.pathname);
  if (req.method !== "GET") return send(res, 405, "{}");
  let rel;
  try { rel = decodeURIComponent(url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname); } catch { return send(res, 400, "bad url", "text/plain"); }
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root + path.sep) || file.includes(`${path.sep}_src${path.sep}`) || file.includes(`${path.sep}data${path.sep}`) || file.endsWith("server.mjs")) return send(res, 404, "not found", "text/plain");
  fs.readFile(file, (err, data) => (err ? send(res, 404, "not found", "text/plain") : send(res, 200, data, TYPES[path.extname(file)] || "application/octet-stream")));
  } catch (err) { if (!res.headersSent) send(res, 500, JSON.stringify({ error: "server error" })); else res.end(); }
}).listen(PORT, "127.0.0.1", () => console.log(`Story Time: student site http://127.0.0.1:${PORT}/  teacher site http://127.0.0.1:${PORT}/teacher/  (AI review: ${KEY ? "on, model " + MODEL : "off"})`));
