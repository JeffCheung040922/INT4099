// Teacher site: shows how each player is doing and sets the game's settings. The records come from the server (server.mjs).
// With no server (for example on GitHub Pages) it reads the same browser's records instead, so both sites still work on one device.
const $ = (s) => document.querySelector(s);
let data = emptyData(), sel = null, aiOn = false, local = false;
const levelStars = (n) => [1, 2, 3].map((i) => `<svg viewBox="0 0 24 24" class="star ${i <= n ? "on" : ""}" aria-hidden="true"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.5 5.8 21l1.4-7L2 9.3l7-.8z"/></svg>`).join("");
const pct = (o) => (o ? Math.round(o.rate * 100) + "%" : "–");
const post = (url, body) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

// Reading and writing records: on the server, or in this browser when there is no server.
const readLocal = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch { return {}; } };
const writeLocal = (change) => { const st = { students: [], settings: {}, ...readLocal() }; change(st); localStorage.setItem(STORE_KEY, JSON.stringify(st)); };
async function setSettings(settings) {
  if (local) { writeLocal((st) => { st.settings = { ...st.settings, ...cleanSettings(settings) }; }); data.settings = { ...data.settings, ...cleanSettings(settings) }; }
  else data.settings = await (await post("../api/settings", { settings })).json();
}
async function saveStudent(s) { s.updated = Date.now(); if (local) writeLocal((st) => { st.students = st.students.map((x) => (x.id === s.id ? s : x)); }); else await post("../api/student", { student: s }); }
async function removePlayer(id) { if (local) writeLocal((st) => { st.students = st.students.filter((x) => x.id !== id); }); else await post("../api/student/delete", { id }); }

async function load() {
  try {
    const [d, st] = await Promise.all([fetch("../api/data").then((r) => r.json()), fetch("../api/status").then((r) => r.json())]);
    data = { ...emptyData(), ...d }; aiOn = !!st.ai; local = false;
    $("#status").textContent = `Updated ${new Date().toLocaleTimeString()} · AI helper ${aiOn ? "on" : "off"}`;
  } catch {
    const st = readLocal(); local = true; aiOn = false;
    data = { ...emptyData(), students: (st.students || []).filter((x) => x && Array.isArray(x.runs) && COLOR_NAMES.includes(x.color)), settings: cleanSettings(st.settings) };
    $("#status").textContent = "No server: showing this browser's records (open the student site in this same browser). No AI.";
  }
  if (!sel || !data.students.some((s) => s.id === sel)) sel = data.students[0] ? data.students[0].id : null;
  const snapshot = JSON.stringify([data, sel]);
  if (snapshot !== lastShown) { lastShown = snapshot; render(); } // only redraw when something changed, so a summary being read stays
}
let lastShown = "";

function render() {
  lastShown = JSON.stringify([data, sel]);
  $("#players").innerHTML = data.students.map((s) => `<button class="prow ${s.id === sel ? "sel" : ""}" data-sel="${s.id}">${avatar(s.color)}<span><b>${esc(s.name)}</b><small>${s.runs.length} run${s.runs.length === 1 ? "" : "s"}</small></span></button>`).join("") || '<p class="note">No players yet.</p>';
  const s = data.students.find((x) => x.id === sel);
  $("#detail").innerHTML = (s ? player(s) : '<div class="empty">No players yet. A player appears here after typing a name on the student site.</div>') + settingsCard();
}

function player(s) {
  const sum = summarize(s.runs), medals = s.medals || {};
  const meters = Object.keys(TARGETS).map((t) => { const o = sum.per[t]; return `<div class="meter"><span>${TARGETS[t]}</span><div><i class="${o && o.rate < 0.5 ? "low" : ""}" style="width:${o ? Math.round(o.rate * 100) : 0}%"></i></div><b>${pct(o)}</b></div>`; }).join("");
  const subs = Object.entries(sum.sub).sort((a, b) => a[1].rate - b[1].rate).map(([k, o]) => `<span class="tag ${o.rate < 0.5 ? "warn" : ""}">${k} ${o.alone}/${o.n}</span>`).join("") || '<span class="note">None yet.</span>';
  const rows = STORIES.map((st) => { const runs = s.runs.filter((r) => r.story === st.id); const best = runs.length ? Math.max(...runs.map((r) => Math.round(100 * r.results.filter(isIndependent).length / r.results.length))) : null; return `<tr><td>${st.title}</td><td>${levelStars(st.level)}</td><td>${runs.length}</td><td>${best === null ? "–" : best + "%"}</td><td>${medals[st.id] === 2 ? "Gold" : medals[st.id] === 1 ? "Silver" : "–"}</td></tr>`; }).join("");
  const last = s.runs[s.runs.length - 1];
  const lastCard = last ? `<p><span class="tag">${(STORIES.find((x) => x.id === last.story) || {}).title || "story"}</span><span class="tag">${last.mode === "quick" ? "short run" : "full story"}</span><span class="tag">${last.review.source === "ai" ? "AI draft" : "game text"}</span> <span class="note">${new Date(last.ts).toLocaleString()}</span></p>
    <p><b>The player saw:</b> ${last.review.learner.map(esc).join(" ")}</p><p><b>For you:</b> ${esc(last.review.teacher)}</p>` : '<p class="note">No runs yet.</p>';
  return `<div class="head">${avatar(s.color)}<h1>${esc(s.name)}</h1></div>
  <div class="card"><h3>On their own, last ${sum.window || 3} run${sum.window === 1 ? "" : "s"}</h3><p class="note">Answered with no hint and no extra tap. Orange = under 50%.</p>${meters}</div>
  <div class="card"><h3>Grammar points</h3>${subs}</div>
  <div class="card"><h3>Stories</h3><table><tr><th>Story</th><th>Level</th><th>Played</th><th>Best on own</th><th>Medal</th></tr>${rows}</table></div>
  <div class="card"><h3>Latest run</h3>${lastCard}</div>
  <div class="card"><h3>Summary for you</h3><div id="summary" class="note">${aiOn ? "Ask the AI helper to write a short summary from the numbers above." : "The AI helper is off. Start the server with POE_API_KEY to use it."}</div><p><button class="primary" data-act="summary" ${aiOn && s.runs.length ? "" : "disabled"}>Write summary</button></p></div>
  <div class="card"><h3>This player</h3><div class="row"><button data-act="csv" ${s.runs.length ? "" : "disabled"}>Download answers (CSV)</button><button data-act="sample">Add sample runs</button><button class="danger" data-act="remove">Remove ${esc(s.name)}</button></div></div>`;
}

const settingsCard = () => `<div class="card"><h3>Game settings (all players)</h3>
  <div class="row"><span>Time per question</span>${[20, 35, 60, 0].map((n) => `<button class="${data.settings.limit === n ? "sel" : ""}" data-limit="${n}">${n ? n + " s" : "Off"}</button>`).join("")}</div>
  <div class="row" style="margin-top:10px"><span>Sound effects</span><button class="${data.settings.sfx ? "sel" : ""}" data-sfx="1">${data.settings.sfx ? "On" : "Off"}</button><span class="note">No speech. The timer only brings hints; nothing is taken away. Settings apply the next time the student site is opened.</span></div></div>
  <div class="card"><h3>Support built into the game <span class="note">(design assumptions, not tested with learners)</span></h3><ul>
  <li><b>Visual schedule:</b> four pictures at the top show what is first, next and done.</li>
  <li><b>One thing at a time:</b> one question on screen, large text, a picture beside every word that has one.</li>
  <li><b>No penalty:</b> a wrong tap fades that card and gives a hint; the picture of the tapped word is shown so the player sees what it means.</li>
  <li><b>Prompt fading:</b> hints start small (highlight, fade) and end with a pointing hand; asking for Help is recorded as asking, not as failing.</li>
  <li><b>Modelled answer:</b> after every correct answer the character says the right sentence back.</li>
  <li><b>Repetition with variety:</b> the same words come back in different question types; each word becomes a card, gold on their own and silver with help.</li>
  <li><b>Visible result and goal:</b> each story has a goal that fills as they answer, and a medal at the end.</li>
  <li><b>Level:</b> 1 star = simple present and "can"; 2 stars add now, yesterday and Do/Did questions (P1-3 in the EDB curriculum); 3 stars add "will" (P4-6).</li></ul></div>`;

// ---- sample runs, answers file, AI summary
function sampleRuns(s) {
  for (let r = 0; r < 4; r++) {
    const story = STORIES[r % STORIES.length], results = [];
    for (const p of buildParts(story)) for (const i of MODES.normal[p.id]) {
      const it = p.items[i], target = it.target || p.target, help = Math.random() < (target === "sentence" || target === "grammar" ? 0.5 : 0.2) ? 1 + Math.floor(Math.random() * 2) : 0;
      results.push({ qid: `${story.id}-${p.id}-${i}`, target, sub: subSkill({ ...it, target }), prompt: help, wrong: help ? 1 : 0, friend: help > 1 });
    }
    const run = { ts: Date.now() - (4 - r) * 86400000, story: story.id, mode: "normal", results };
    run.review = { ...reviewTemplate(run, s.name, story.hero), source: "template" };
    s.runs.push(run);
    const alone = results.filter(isIndependent).length;
    s.medals = { ...(s.medals || {}), [story.id]: Math.max((s.medals || {})[story.id] || 0, alone >= 0.8 * results.length ? 2 : 1) };
  }
}
function csv(s) {
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["date", "story", "question", "area", "grammar point", "hint level", "extra taps", "asked for help"].map(q).join(",")];
  for (const run of s.runs) for (const r of run.results) lines.push([new Date(run.ts).toISOString(), run.story, r.qid, TARGETS[r.target] || r.target, r.sub || "", r.prompt, r.wrong, r.friend ? "yes" : "no"].map(q).join(","));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" })); a.download = `${s.name}-answers.csv`; a.click();
}
async function summary(s) {
  const box = $("#summary"); box.textContent = "Asking the AI helper...";
  try {
    const res = await fetch("../api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: advicePrompt(summarize(s.runs), STORIES, s.medals || {}) }) });
    const j = parseAdvice((await res.json()).text, STORIES);
    box.textContent = j ? j.teacher : "The AI helper gave no usable answer. Try again.";
    if (j) box.insertAdjacentHTML("afterend", '<p class="note">AI draft from anonymous numbers. Check it before you use it.</p>');
  } catch { box.textContent = "The AI helper could not be reached."; }
}

document.addEventListener("click", async (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  const s = data.students.find((x) => x.id === sel);
  if (t.dataset.sel) { sel = t.dataset.sel; return render(); }
  if (t.dataset.limit !== undefined) { await setSettings({ ...data.settings, limit: Number(t.dataset.limit) }); return render(); }
  if (t.dataset.sfx) { await setSettings({ ...data.settings, sfx: !data.settings.sfx }); return render(); }
  if (!s) return;
  if (t.dataset.act === "csv") return csv(s);
  if (t.dataset.act === "summary") return summary(s);
  if (t.dataset.act === "sample") { sampleRuns(s); await saveStudent(s); return load(); }
  if (t.dataset.act === "remove" && confirm(`Remove ${s.name} and all their runs?`)) { await removePlayer(s.id); sel = null; return load(); }
});

load();
setInterval(load, 15000);
