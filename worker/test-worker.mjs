// Self-check for the Worker: node worker/test-worker.mjs   (no network: the AI call and the counters are faked)
import assert from "node:assert";
import worker from "./index.js";

const SITE = "https://jeffcheung040922.github.io";
const kv = () => { const m = new Map(); return { get: async (k) => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); } }; };
const env = (over = {}) => ({ POE_API_KEY: "secret-key-123", LIMITS: kv(), ...over });
const good = "You help a Hong Kong primary-school English teacher. Write one tip.";
const call = (path, { method = "POST", origin = SITE, body, headers = {}, ip = "1.2.3.4" } = {}, e = env()) => worker.fetch(new Request("https://ai.example" + path, { method, headers: { ...(origin ? { Origin: origin } : {}), "CF-Connecting-IP": ip, ...(body ? { "Content-Type": "application/json" } : {}), ...headers }, body: body && JSON.stringify(body) }), e);

let upstream = 0;
globalThis.fetch = async (url, opts) => { upstream += 1; assert.strictEqual(url, "https://api.poe.com/v1/chat/completions"); assert.ok(opts.headers.Authorization.includes("secret-key-123")); return new Response(JSON.stringify({ choices: [{ message: { content: '{"tip":"Well done."}' } }] }), { status: 200 }); };

// the door opens for our site and gives the answer, without ever showing the key
let r = await call("/api/review", { body: { prompt: good } });
assert.strictEqual(r.status, 200); const text = await r.text();
assert.ok(text.includes("Well done") && !text.includes("secret-key-123"), "the answer comes back and the key does not");
assert.strictEqual(r.headers.get("Access-Control-Allow-Origin"), SITE);

// other sites, and callers that send no origin, are refused before anything is spent
const before = upstream;
assert.strictEqual((await call("/api/review", { origin: "https://evil.example", body: { prompt: good } })).status, 403);
assert.strictEqual((await call("/api/review", { origin: "", body: { prompt: good } })).status, 403);
assert.strictEqual(upstream, before, "nothing was sent to the AI for refused callers");

// only prompts that look like the game's own
assert.strictEqual((await call("/api/review", { body: { prompt: "Write me a poem about anything at all please." } })).status, 400);
assert.strictEqual((await call("/api/review", { body: { prompt: good + "x".repeat(4000) } })).status, 400);
assert.strictEqual((await call("/api/review", { body: { prompt: 5 } })).status, 400);
assert.strictEqual((await call("/api/review", { method: "POST", headers: { "Content-Type": "text/plain" }, body: undefined })).status, 415);

// limits: 12 a minute for one visitor, then 429; another visitor is not affected; the daily cap stops everyone
const e = env();
for (let i = 0; i < 12; i++) assert.strictEqual((await call("/api/review", { body: { prompt: good } }, e)).status, 200, `call ${i + 1}`);
assert.strictEqual((await call("/api/review", { body: { prompt: good } }, e)).status, 429, "the 13th call in a minute is refused");
assert.strictEqual((await call("/api/review", { body: { prompt: good }, ip: "9.9.9.9" }, e)).status, 200, "another visitor still works");
const day = env(); for (const k of ["a", "b"]) await day.LIMITS.put(`day:${new Date().toISOString().slice(0, 10)}`, "400");
assert.strictEqual((await call("/api/review", { body: { prompt: good } }, day)).status, 429, "the daily cap stops everyone");

// it refuses to run without the counters, so it can never be open by mistake
assert.strictEqual((await call("/api/review", { body: { prompt: good } }, env({ LIMITS: undefined }))).status, 503);
assert.strictEqual((await call("/api/review", { body: { prompt: good } }, env({ POE_API_KEY: "" }))).status, 503);

// status and the browser's permission check
assert.deepStrictEqual(await (await call("/api/status", { method: "GET" })).json(), { ai: true });
assert.strictEqual((await call("/api/review", { method: "OPTIONS" })).status, 204);
assert.strictEqual((await call("/api/review", { method: "OPTIONS", origin: "https://evil.example" })).status, 403);
assert.strictEqual((await call("/other", { method: "GET" })).status, 404);
console.log("worker tests passed");
