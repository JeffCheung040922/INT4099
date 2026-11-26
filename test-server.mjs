// Self-check for the server: node test-server.mjs  (starts the server on port 18765 with a temporary data folder)
import assert from "node:assert";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const PORT = 18765, dir = fs.mkdtempSync(path.join(os.tmpdir(), "story-"));
const server = spawn("node", ["server.mjs"], { env: { ...process.env, PORT: String(PORT), DATA_DIR: dir, POE_API_KEY: "" }, stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A raw request, so the URL, the headers and the body are sent exactly as written.
const call = (method, url, { headers = {}, body } = {}) => new Promise((resolve, reject) => {
  const req = http.request({ host: "127.0.0.1", port: PORT, method, path: url, headers: { Host: `127.0.0.1:${PORT}`, ...headers } }, (res) => {
    let text = ""; res.on("data", (c) => (text += c)); res.on("end", () => resolve({ status: res.statusCode, text }));
  });
  req.on("error", reject); if (body) req.write(body); req.end();
});
const json = { "Content-Type": "application/json" };
const student = (over = {}) => ({ id: "a1", name: "Mei", color: "Cat", updated: 1, runs: [{ ts: 1, story: "zoo", mode: "quick", results: [{ target: "words", prompt: 0, wrong: 0 }], review: { learner: ["ok"], teacher: "ok", source: "template" } }], ...over });

try {
  for (let i = 0; i < 30; i++) { try { await call("GET", "/api/status"); break; } catch { await sleep(100); } }

  assert.strictEqual((await call("GET", "/%E0%A4%A")).status, 400, "a broken URL gets an error, not a crash");
  assert.strictEqual((await call("GET", "/api/status")).status, 200, "the server is still running after a broken URL");
  assert.strictEqual((await call("GET", "/data/store.json")).status, 404, "the records file is not served as a page");
  assert.strictEqual((await call("GET", "/js/../server.mjs")).status, 404, "the server code is not served");

  const settings = JSON.stringify({ settings: { limit: 20, sfx: false } });
  assert.strictEqual((await call("POST", "/api/settings", { headers: { "Content-Type": "text/plain" }, body: settings })).status, 415, "text/plain is refused");
  assert.strictEqual((await call("POST", "/api/settings", { headers: { ...json, Origin: "https://evil.example" }, body: settings })).status, 403, "another site is refused");
  assert.strictEqual((await call("GET", "/api/data", { headers: { Host: "evil.example" } })).status, 403, "a different Host name is refused");
  assert.deepStrictEqual(JSON.parse((await call("GET", "/api/data")).text).settings, { limit: 35, sfx: true }, "nothing changed");

  assert.strictEqual((await call("POST", "/api/settings", { headers: json, body: settings })).status, 200);
  assert.strictEqual((await call("POST", "/api/settings", { headers: json, body: JSON.stringify({ settings: { limit: 7 } }) })).status, 200);
  assert.strictEqual(JSON.parse((await call("GET", "/api/data")).text).settings.limit, 35, "a time limit the game does not know becomes 35");

  await call("POST", "/api/student", { headers: json, body: JSON.stringify({ student: student({ color: "NotAColor" }) }) });
  assert.strictEqual(JSON.parse((await call("GET", "/api/data")).text).students.length, 0, "a player with an unknown colour is not saved");
  await call("POST", "/api/student", { headers: json, body: JSON.stringify({ student: student() }) });
  assert.strictEqual(JSON.parse((await call("GET", "/api/data")).text).students.length, 1);
  assert.ok(JSON.parse(fs.readFileSync(path.join(dir, "store.json"), "utf8")).students[0].name === "Mei", "records are written to disk");
  await call("POST", "/api/student/delete", { headers: json, body: JSON.stringify({ id: "a1" }) });
  await call("POST", "/api/student", { headers: json, body: JSON.stringify({ student: student({ updated: 99 }) }) });
  assert.strictEqual(JSON.parse((await call("GET", "/api/data")).text).students.length, 0, "a removed player does not come back");
  assert.strictEqual((await call("POST", "/api/student", { headers: json, body: "{not json" })).status, 400, "broken JSON gets an error");
  console.log("server tests passed");
} finally { server.kill(); fs.rmSync(dir, { recursive: true, force: true }); }
