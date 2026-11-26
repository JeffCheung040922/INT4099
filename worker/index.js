// Cloudflare Worker: a small, guarded door to the AI for the public student site (GitHub Pages).
// The Poe key lives here as a secret and is never sent to the page. The door only opens for our own site,
// only for prompts that look like ours, and only a limited number of times, so a stranger cannot spend the credits.
const DEFAULT_ORIGINS = ["https://jeffcheung040922.github.io"];
const PER_IP_PER_MINUTE = 12;   // one pupil taps a few answers a minute; a script would go much faster
const PER_DAY = 400;            // all visitors together; about 80 stories
const PROMPT_START = "You help a Hong Kong primary-school English teacher."; // every prompt the game sends begins like this

const json = (body, status, cors) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors } });

// Count one use in KV. Not exact under heavy parallel use, which is fine for a cap.
async function bump(kv, key, ttl) {
  const n = Number(await kv.get(key)) + 1 || 1;
  await kv.put(key, String(n), { expirationTtl: ttl });
  return n;
}

export default {
  async fetch(req, env) {
    const origins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()) : DEFAULT_ORIGINS;
    const origin = req.headers.get("Origin") || "";
    const cors = origins.includes(origin) ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", Vary: "Origin" } : {};
    const path = new URL(req.url).pathname;

    if (req.method === "OPTIONS") return new Response(null, { status: cors["Access-Control-Allow-Origin"] ? 204 : 403, headers: cors });
    if (req.method === "GET" && path === "/api/status") return json({ ai: Boolean(env.POE_API_KEY) }, 200, cors);
    if (req.method !== "POST" || path !== "/api/review") return json({ error: "not found" }, 404, cors);

    if (!cors["Access-Control-Allow-Origin"]) return json({ error: "origin not allowed" }, 403, {});
    if (!env.POE_API_KEY || !env.LIMITS) return json({ error: "not configured" }, 503, cors);
    if (!String(req.headers.get("Content-Type") || "").startsWith("application/json")) return json({ error: "json only" }, 415, cors);

    let prompt;
    try { prompt = (await req.json()).prompt; } catch { return json({ error: "bad json" }, 400, cors); }
    if (typeof prompt !== "string" || prompt.length < 20 || prompt.length > 4000 || !prompt.startsWith(PROMPT_START)) return json({ error: "bad prompt" }, 400, cors);

    const ip = req.headers.get("CF-Connecting-IP") || "unknown", now = new Date();
    if ((await bump(env.LIMITS, `ip:${ip}:${now.toISOString().slice(0, 16)}`, 120)) > PER_IP_PER_MINUTE) return json({ error: "too many requests, wait a minute" }, 429, cors);
    if ((await bump(env.LIMITS, `day:${now.toISOString().slice(0, 10)}`, 90000)) > PER_DAY) return json({ error: "daily limit reached" }, 429, cors);

    try {
      const model = env.POE_MODEL || "gpt-5.4-mini";
      const up = await fetch("https://api.poe.com/v1/chat/completions", {
        method: "POST", headers: { Authorization: `Bearer ${env.POE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 800, temperature: 0.5 }),
        signal: AbortSignal.timeout(25000),
      });
      if (!up.ok) return json({ error: `upstream ${up.status}` }, 502, cors);
      const j = await up.json();
      return json({ text: j.choices?.[0]?.message?.content || "", model }, 200, cors);
    } catch (err) { return json({ error: String(err && err.name) }, 504, cors); }
  },
};
