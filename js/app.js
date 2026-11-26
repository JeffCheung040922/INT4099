// A Day with Aunt Sophie: story practice paper. Needs art.js, story.js and engine.js loaded first.
const W = 1024, H = 640;
const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const dock = $("#dock"), obj = $("#obj");

// ---------- storage
const COLORS = COLOR_NAMES;
const defaults = () => ({ students: [], current: null, settings: { limit: DEFAULT_LIMIT, sfx: true } });
let store;
try { store = { ...defaults(), ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") }; } catch { store = defaults(); }
let serverOn = false, pushTimer = null;
const save = () => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* private mode: keep in memory */ }
  if (!serverOn || !student) return;
  student.updated = Date.now();
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => fetch("/api/student", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student }) }).catch(() => {}), 300);
};
// With the server running, the players' records live there too, so the teacher site can read them. The newer copy of a player wins.
async function pull() {
  try {
    const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 1500); // (AbortSignal.timeout is missing on older iPads)
    const d = await (await fetch("/api/data", { signal: ctrl.signal })).json();
    serverOn = true;
    const merged = { students: d.students, deleted: d.deleted || [] };
    for (const s of store.students) mergeStudent(merged, s);
    store.students = merged.students;
    store.settings = { ...store.settings, ...cleanSettings(d.settings) };
    for (const s of store.students) fetch("/api/student", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student: s }) }).catch(() => {});
  } catch { /* no server: the records stay in this browser */ }
}
const stu = (id) => store.students.find((s) => s.id === id);

// ---------- icons: inline SVG, so the look is the same on every device
const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON = {
  pause: ic('<path d="M8 5v14M16 5v14"/>'),
  back: ic('<path d="M15 5l-7 7 7 7"/>'),
  edit: ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  help: ic('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01"/>'),
  hand: '<svg class="hand" viewBox="0 0 46 60"><path d="M23 56L5 30h11V4h14v26h11z" fill="#0071e3" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></svg>',
};
$("#btn-pause").innerHTML = ICON.pause;

// ---------- sound: tiny synthesised effects, no speech
let AC;
function tone(f, d, type = "sine", v = 0.12, delay = 0, slide = 0) {
  if (!store.settings.sfx) return;
  AC = AC || new (window.AudioContext || window.webkitAudioContext)();
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.linearRampToValueAtTime(f + slide, t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + 0.05);
}
const SFX = {
  pop: () => tone(560, 0.07, "triangle", 0.1),
  ok: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "sine", 0.12, i * 0.07)),
  no: () => tone(240, 0.2, "sine", 0.09, 0, -70),
  hint: () => tone(700, 0.1, "sine", 0.07),
  heart: () => { tone(1175, 0.09, "square", 0.04); tone(1568, 0.14, "square", 0.04, 0.07); },
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, "triangle", 0.1, i * 0.1)),
};

// ---------- stage helpers
function fit() { const s = Math.min(innerWidth / W, innerHeight / H); $("#stage").style.transform = `translate(${-W * s / 2}px, ${-H * s / 2}px) scale(${s})`; }
addEventListener("resize", fit); fit();

let layer = 0;
function setScene(i) {
  const bgs = document.querySelectorAll("#scene .bg");
  layer = 1 - layer;
  bgs[layer].innerHTML = sceneSvg(i);
  bgs[layer].classList.add("on"); bgs[1 - layer].classList.remove("on");
}
const CLEAR = new Set(["s-stories", "s-end", "s-name", "s-players"]);
function show(id) { for (const s of document.querySelectorAll(".screen")) { s.classList.toggle("show", s.id === id); s.classList.toggle("clear", CLEAR.has(s.id)); } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SPEAKER = { sophie: "Sophie", sam: "Sam", mimi: "Mimi", bolt: "Captain Bolt", zog: "Zog", lily: "Lily" };
let guideName = "sophie";
function setGuide(name) { guideName = name; const g = $("#guide"); g.hidden = false; g.innerHTML = CAST[name]("smile"); }
// Face changes: happy after a right answer, worried after a wrong tap, then back to normal.
function setMood(mood) {
  const g = $("#guide"), svg = g.querySelector("svg");
  if (g.hidden || !svg) return;
  svg.outerHTML = CAST[guideName](mood);
  if (mood !== "smile") setTimeout(() => setMood("smile"), 1500);
}
function react(el, cls) {
  el.classList.remove("cheer", "shrug"); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 900);
  if (el.id === "guide") setMood(cls === "cheer" ? "happy" : "worry");
}

// Dialogue window: the speaker's line is typed out. A tap finishes the line, a second tap goes on (tap=false goes on by itself).
let advance = null, endNow = null;
function speak(text, { tap = true, label = "" } = {}) {
  return new Promise((resolve) => {
    dock.innerHTML = `<div class="nametag">${SPEAKER[guideName]}${label ? ` · ${label}` : ""}</div><div class="line" id="line"></div>${tap ? '<button class="skip">Skip ▸▸</button><div class="next"></div>' : ""}`;
    dock.classList.add("up");
    const el = $("#line");
    let i = 0, done = false;
    const end = () => { advance = null; endNow = null; resolve(); };
    endNow = end;
    const finish = () => { done = true; clearInterval(timer); el.textContent = text; if (!tap) setTimeout(end, 1300); };
    const timer = setInterval(() => { i += 1; el.textContent = text.slice(0, i); if (i >= text.length) finish(); }, 24);
    advance = () => { if (!done) finish(); else if (tap) end(); };
  });
}

// ---------- my words: every word answered in the story becomes a card (gold = on your own, silver = with help)
const WORD_SLOTS = wordSlots();
function collectWord(word, independent) {
  student.words = student.words || {};
  const was = student.words[word] || 0, now = independent ? 2 : 1;
  if (now > was) student.words[word] = now;
  S.newWords = S.newWords || {};
  S.newWords[word] = { level: Math.max(now, was), isNew: !was };
}
const wordCard = (w, level, extra = "") => `<div class="wordcard ${level === 2 ? "gold" : level === 1 ? "silver" : "empty"} ${extra}"><img src="assets/pics/${w}.png" alt="">${level ? w : "?"}</div>`;

// ---------- people who come to the food bank: one for every answer
function addPerson(instant = false) {
  const c = $("#crowd"), i = c.children.length, st = S.story;
  const d = document.createElement("div");
  d.className = st.arrive ? "pp gift" : "pp"; d.style.left = `${i * Math.min(c.classList.contains("end") ? 58 : 52, 560 / Math.max(1, c.classList.contains("end") ? S.results.length : S.total))}px`; if (instant) d.style.animation = "none";
  // Some stories bring a picture instead of a person: fish for the cat, stars for the rocket.
  const who = st.arrive ? `<img src="assets/pics/${st.arrive}.png" alt="">` : walker(S.seed + i);
  d.innerHTML = `${who}${instant ? "" : `<div class="thx">${st.cheer || "Thanks!"}</div>`}`;
  c.appendChild(d);
}

// Medal for a finished story: gold if every question was answered on your own, silver if there were hints.
const MEDAL_TEXT = { 2: "Gold medal! Nearly all on your own!", 1: "Silver medal! You finished with help." };
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#ff6b6b", "#ffd166", "#6bffb0", "#7fd4ff", "#c79bff"];
  for (let i = 0; i < 36; i++) {
    const d = document.createElement("i"), x = Math.random() * 1024;
    d.className = "conf"; d.style.cssText = `left:${x}px;top:-20px;background:${colors[i % 5]}`;
    $("#stage").appendChild(d);
    d.animate([{ transform: "translateY(0) rotate(0)", opacity: 1 }, { transform: `translate(${(Math.random() - 0.5) * 200}px, 700px) rotate(${Math.random() * 720}deg)`, opacity: 0.9 }], { duration: 1800 + Math.random() * 1400, delay: Math.random() * 500, easing: "cubic-bezier(.3,.6,.4,1)" }).onfinish = () => d.remove();
  }
}
const medalSvg = (lvl) => `<svg viewBox="0 0 100 120" class="medalsvg"><path d="M28 0h16l12 34H40zM72 0H56L44 34h16z" fill="${lvl === 2 ? "#e5534b" : "#4aa3ff"}"/><circle cx="50" cy="76" r="38" fill="${lvl === 2 ? "#f6c445" : "#c7ced9"}" stroke="${lvl === 2 ? "#d99a1a" : "#98a2b3"}" stroke-width="6"/><path d="M50 52l7 15 16 2-12 11 4 16-15-9-15 9 4-16-12-11 16-2z" fill="#fff" opacity=".9"/></svg>`;
function addCrate(word) {
  const k = $("#props").children.length, d = document.createElement("div");
  d.className = "crate"; d.style.left = `${600 + k * 76}px`; d.style.top = "332px";
  d.innerHTML = `<img src="assets/pics/${word}.png" alt="">`;
  $("#props").appendChild(d);
}
function echo(it) {
  if (it.type === "order") return `Yes! ${it.sentence}`;
  if (it.type === "gap") return `Yes! ${it.before.split(". ").pop()} ${it.answer}${it.after}`;
  if (it.type === "match") return "Yes! They all match.";
  const right = it.options[it.answer];
  if (it.pics) return `Yes! This is ${right}.`;
  if (it.q === "Which sentence is correct?") return `Yes! ${right}`;
  if (it.evidence !== undefined) return `Yes! "${it.card.lines[it.evidence]}"`;
  if (it.card.kind === "label") return `Yes! This is ${right}.`;
  return `Nice! "${right}"`;
}

// ---------- start screens
let student = null, S = null;

const levelStars = (n) => [1, 2, 3].map((i) => `<svg viewBox="0 0 24 24" class="${i <= n ? "on" : ""}"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.5 5.8 21l1.4-7L2 9.3l7-.8z"/></svg>`).join("");
function screenName(canGoBack = false) {
  hidePlay(); setScene(3);
  $("#s-name").innerHTML = `${canGoBack ? `<button class="round corner l" id="players-close" aria-label="Back">${ICON.back}</button>` : ""}<h1>What is your name?</h1><p class="sub">Type a nickname, then pick your picture.</p>
    <input id="name-input" class="name-input" maxlength="12" autocomplete="off" autocapitalize="words" placeholder="Your name" aria-label="Your name">
    <div class="picks">${COLORS.map((c, i) => `<button class="pick ${i === 0 ? "sel" : ""}" data-pick="${c}" aria-label="${c}">${avatar(c)}</button>`).join("")}</div>
    <button class="btn primary" id="name-go">Let's go!</button><p class="note2" style="margin-top:10px">A nickname is enough. It stays on this device.</p>`;
  show("s-name");
  setTimeout(() => $("#name-input").focus(), 150);
}
function screenPlayers(editId = null) {
  hidePlay(); setScene(3);
  $("#s-players").innerHTML = `<button class="round corner l" id="players-close" aria-label="Back">${ICON.back}</button><h1>Who is playing?</h1>
    <div class="plist">${store.students.map((st) => `<div class="prow ${st.id === student.id ? "cur" : ""}">${editId === st.id
      ? `<input id="rename-input" class="name-input small" maxlength="12" value="${st.name}" aria-label="New name"><button class="btn small primary" data-save="${st.id}">Save</button>`
      : `<button class="pswitch" data-switch="${st.id}">${avatar(st.color)}<b>${st.name}</b></button><button class="round small" data-rename="${st.id}" aria-label="Change name">${ICON.edit}</button>`}</div>`).join("")}</div>
    <button class="btn" id="player-new">+ New player</button>`;
  show("s-players");
  if (editId) setTimeout(() => $("#rename-input").focus(), 150);
}

function screenStories() {
  S = null;
  hidePlay(); setScene(3);
  const mode = store.settings.mode || "normal";
  const played = (id) => student.runs.filter((r) => r.story === id).length;
  $("#s-stories").innerHTML = `<button class="who" id="who-chip" aria-label="Change player: tap to switch to the next player">${avatar(student.color)}<span><small>Player</small>${student.name}</span><svg viewBox="0 0 24 24" class="swap" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l-3 3 3 3M4 7h12M17 20l3-3-3-3M20 17H8"/></svg></button>
    <h1>Pick a story</h1>
    <div class="stories">${STORIES.map((st) => `<button class="story" data-story="${st.id}"><div class="thumb">${sceneSvg(st.scene)}<div class="hero">${CAST[st.guide]("smile")}</div>${played(st.id) ? `<i class="played">Played ${played(st.id)}</i>` : ""}${(student.medals || {})[st.id] ? `<div class="cardmedal">${medalSvg(student.medals[st.id])}</div>` : ""}</div><b>${st.title}</b><small>${st.blurb}</small><span class="lv" aria-label="Level ${st.level}">${levelStars(st.level)}</span></button>`).join("")}</div>
    <div class="actions"><button class="btn small" id="mode-btn">${mode === "quick" ? "Short run (4 questions)" : "Full story (20 questions)"}</button><button class="btn small" id="words-btn">My words ${Object.keys(student.words || {}).length}/${WORD_SLOTS.length}</button><button class="btn small" id="progress-btn">My progress</button></div>`;
  show("s-stories");
}

function hidePlay() {
  for (const e of [$("#guide"), $("#player"), obj, $("#hud")]) e.hidden = true;
  dock.classList.remove("up"); $("#title").hidden = true;
  $("#crowd").innerHTML = ""; $("#crowd").classList.remove("end"); $("#props").innerHTML = "";
}

// ---------- run
function startRun(storyId, mode) {
  const story = STORIES.find((st) => st.id === storyId);
  guideName = story.guide;
  S = { story, parts: buildParts(story), mode, pick: MODES[mode], part: -1, results: [], shown: 0, Q: null, paused: false, seed: Math.floor(Math.random() * 5), newWords: {} };
  S.total = S.parts.reduce((n, p) => n + S.pick[p.id].length, 0);
  $("#helped").innerHTML = `<span class="glabel">${story.goal.label}</span><img src="assets/pics/${story.goal.pic}.png" alt=""><b id="helped-n">0</b><small>/${S.total}</small>`;
  const STEP_PIC = { words: "apple", sentence: "pencil", reading: "book", talk: "mouth" };
  $("#steps").innerHTML = S.parts.map((p, i) => `<span data-i="${i}"><img src="assets/pics/${STEP_PIC[p.id]}.png" alt="">${p.tag}</span>`).join("");
  $("#hud").hidden = false;
  show("");
  nextPart();
}

async function nextPart() {
  const run = S; // after every wait: if the player quit or started another story, this old run stops
  S.part += 1;
  document.querySelectorAll("#steps span").forEach((s, i) => { s.className = i < S.part ? "done" : i === S.part ? "on" : ""; });
  if (S.part >= S.parts.length) return endRun();
  const P = S.parts[S.part];
  dock.classList.remove("up"); obj.hidden = true; $("#guide").hidden = true;
  $("#props").innerHTML = "";
  setScene(P.scene);
  const t = $("#title");
  t.innerHTML = `<small>${S.story.title} · Part ${S.part + 1} of ${S.parts.length}</small><b>${P.title}</b><span>${P.how}</span>`;
  t.hidden = false; await sleep(1700); t.hidden = true;
  if (S !== run) return;
  setGuide(P.guide);
  S.skip = false;
  for (const line of P.beats) { if (S !== run || S.skip) break; await speak(line); }
  if (S !== run) return;
  S.items = S.pick[P.id].map((i) => ({ ...P.items[i], target: P.items[i].target || P.target, id: `${P.id}-${i}` }));
  S.item = 0; S.card = null;
  startItem();
}

// The object on the wall: poster, article, sign, picture label, or one line of talk.
function buildCard(c) {
  S.card = c;
  const lines = (c.lines || []).map((l, i) => `<span class="ln" data-i="${i}">${l}</span>`).join(c.kind === "article" ? " " : "");
  obj.className = c.kind;
  obj.innerHTML = c.kind === "word" ? `<h2>Find the picture</h2><div class="bigword">${c.text}</div>` : c.kind === "banner" ? `<h2>${c.title}</h2>` : c.kind === "sign" ? `<h2>${c.title || "Our sign"}</h2><div class="slots" id="slots"></div>` : c.kind === "label" ? `<h2>${c.title || "Food box"}</h2><img src="assets/pics/${c.pic}.png" alt="A picture">` : `<h2>${c.title}</h2>${lines}`;
  obj.hidden = false; obj.style.animation = "none"; void obj.offsetWidth; obj.style.animation = "";
}

function startItem() {
  const it = S.items[S.item];
  if (it.card !== S.card) buildCard(it.card);
  const Q = S.Q = { it, elapsed: 0, hint: 0, manual: 0, wrong: 0, friend: false, active: false, faded: new Set(), placed: [], matched: 0, sel: null };
  const optRow = (cls, inner) => `<div class="row">${Q.opts.map((o, i) => `<button class="opt ${cls}" data-i="${i}">${inner(o)}</button>`).join("")}</div>`;
  let body;
  if (it.type === "order") {
    it.words = it.sentence.replace(".", "").split(" ");
    Q.tiles = scramble(it.words);
    $("#slots").innerHTML = `${it.words.map(() => `<div class="slot"></div>`).join("")}<div class="ghost" id="ghost" hidden>${it.sentence}</div>`;
    body = `<div class="qtext">Put the words in order.</div><div class="tiles">${Q.tiles.map((w, i) => `<button class="tile" data-i="${i}">${w}</button>`).join("")}</div>`;
  } else if (it.type === "gap") {
    Q.opts = shuffle(it.options.map((w) => ({ w, correct: w === it.answer })));
    const before = it.cue ? it.before.replace(it.cue, `<span class="cue">${it.cue}</span>`) : it.before;
    $("#slots").innerHTML = `<div class="gapline">${before} <span class="blank now"></span>${it.after}</div>`;
    body = `<div class="qtext">${it.cue ? "Choose the right verb." : "Tap the word that fits the gap."}</div>${it.pics ? optRow("chip2", (o) => `<img src="assets/pics/${o.w}.png" alt="">${o.w}`) : optRow("", (o) => o.w)}`;
  } else if (it.type === "match") {
    const pw = shuffle(it.pairs), pp = shuffle(it.pairs);
    body = `<div class="qtext">Tap a word, then tap its picture.</div><div class="mrow">${pw.map((w) => `<button class="mt mw" data-k="w" data-w="${w}">${w}</button>`).join("")}</div><div class="mrow pr">${pp.map((w) => `<button class="mt mp" data-k="p" data-w="${w}" aria-label="${w} picture"><img src="assets/pics/${w}.png" alt=""></button>`).join("")}</div>`;
  } else {
    Q.opts = shuffle(it.options.map((t, i) => ({ t, correct: i === it.answer })));
    body = `<div class="qtext">${it.q}</div>${it.pics ? optRow("picopt", (o) => `<img src="assets/pics/${o.t}.png" alt="${o.t}">`) : optRow("", (o) => o.t)}`;
  }
  dock.innerHTML = `<div class="nametag">${SPEAKER[guideName]}</div>${store.settings.limit ? `<div class="bar"><i id="timer"></i></div>` : ""}<button class="help" id="help">${ICON.help}Help</button>${body}`;
  dock.classList.add("up");
  if (it.type === "order" || it.type === "match") applyHints();
  setTimeout(() => { Q.active = true; }, 600);
}

// ---------- hints
function setHint(lvl) {
  const Q = S.Q;
  if (lvl <= Q.hint) return;
  Q.hint = lvl; SFX.hint(); applyHints();
}

function applyHints() {
  const Q = S.Q, lvl = Q.hint, it = Q.it;
  dock.querySelectorAll(".hand").forEach((h) => h.remove());
  if (it.type === "order") {
    const next = it.words[Q.placed.length];
    const tiles = [...dock.querySelectorAll(".tile")];
    tiles.forEach((t) => { const isNext = Q.tiles[t.dataset.i] === next && !t.classList.contains("used"); t.classList.toggle("glow", lvl >= 1 && isNext); t.classList.toggle("faded", lvl >= 3 && !isNext && !t.classList.contains("used")); });
    const g = $("#ghost"); if (g) g.hidden = lvl < 2;
    obj.querySelectorAll(".slot").forEach((sl, k) => {
      const now = k === Q.placed.length;
      sl.classList.toggle("now", now);
      if (now && lvl >= 1) sl.dataset.cue = lvl >= 2 ? next : next[0]; else delete sl.dataset.cue;
    });
    if (lvl >= 3) tiles.find((t) => Q.tiles[t.dataset.i] === next && !t.classList.contains("used"))?.insertAdjacentHTML("beforeend", ICON.hand);
    return;
  }
  if (it.type === "match") {
    const left = [...dock.querySelectorAll(".mw:not(.done)")];
    const next = left.length ? left[0].dataset.w : null;
    dock.querySelectorAll(".mw").forEach((m) => m.classList.toggle("glow", lvl >= 1 && m.dataset.w === next));
    dock.querySelectorAll(".mp").forEach((m) => {
      const isNext = m.dataset.w === next && !m.classList.contains("done");
      m.classList.toggle("glow", lvl >= 2 && isNext);
      m.classList.toggle("faded", lvl >= 3 && !isNext && !m.classList.contains("done"));
      if (lvl >= 3 && isNext) m.insertAdjacentHTML("beforeend", ICON.hand);
    });
    return;
  }
  obj.querySelectorAll(".ln").forEach((l) => l.classList.toggle("ev", lvl >= 1 && Number(l.dataset.i) === it.evidence));
  obj.querySelectorAll(".cue").forEach((c) => c.classList.toggle("ev", lvl >= 1));
  const opts = [...dock.querySelectorAll(".opt")];
  const wrongs = opts.filter((_, i) => !Q.opts[i].correct);
  const eff = lvl + (it.evidence === undefined && !it.cue ? 1 : 0); // no line to highlight: the other steps come one level earlier
  const want = eff >= 3 ? wrongs.length : eff >= 2 ? 1 : 0;
  for (const w of wrongs) { if (Q.faded.size >= want) break; Q.faded.add(w.dataset.i); }
  opts.forEach((o) => o.classList.toggle("faded", Q.faded.has(o.dataset.i)));
  const right = opts.find((_, i) => Q.opts[i].correct);
  right.classList.toggle("glow", eff >= 3);
  if (eff >= 3) right.insertAdjacentHTML("beforeend", ICON.hand);
}

function wrongTap(el) {
  const Q = S.Q;
  Q.wrong += 1; SFX.no();
  el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
  if (Q.opts && el.classList.contains("opt")) { Q.faded.add(el.dataset.i); setTimeout(() => el.classList.add("faded"), 380); }
  react($("#guide"), "shrug");
  const qt = dock.querySelector(".qtext"), old = qt && qt.textContent;
  const say = (text) => { if (qt) { qt.textContent = text; setTimeout(() => { if (qt.isConnected) qt.textContent = old; }, 2600); } };
  say("Let's try together.");
  const o = Q.opts && el.classList.contains("opt") && Q.opts[el.dataset.i];
  const wrongWord = o ? (o.t || o.w).toLowerCase() : el.classList.contains("mp") ? el.dataset.w : null;
  if (wrongWord) showWrongPicture(wrongWord, el, () => say(`That is "${wrongWord}". Try again!`));
  Q.hint = Math.max(Q.hint, Math.min(3, Q.wrong));
  setTimeout(applyHints, 380);
}

// Contrast feedback: if the wrong card is a word that has a picture, show that picture so the learner sees what it means.
function showWrongPicture(word, el, found) {
  const img = new Image();
  img.onload = () => {
    found();
    const pop = document.createElement("div");
    pop.className = "wrongpop";
    pop.style.left = "790px"; // beside the target picture, so both can be compared
    pop.innerHTML = `<img src="${img.src}" alt=""><b>${word}</b>`;
    dock.appendChild(pop);
    setTimeout(() => pop.remove(), 2600);
  };
  img.src = `assets/pics/${word}.png`;
}

dock.addEventListener("click", (e) => {
  if (e.target.closest(".skip")) { S.skip = true; if (endNow) endNow(); return; }
  if (advance) { advance(); return; }
  const Q = S && S.Q;
  if (!Q || !Q.active || S.paused) return;
  if (e.target.closest("#help")) { Q.friend = true; Q.manual = Math.min(3, Q.manual + 1); SFX.pop(); setHint(hintLevel(Q.elapsed, store.settings.limit, Q.wrong, Q.manual)); return; }
  const mt = e.target.closest(".mt");
  if (mt && Q.it.type === "match") return matchTap(mt);
  const el = e.target.closest(".opt, .tile");
  if (!el) return;
  SFX.pop();
  if (el.classList.contains("opt")) {
    if (!Q.opts[el.dataset.i].correct) return wrongTap(el);
    dock.querySelectorAll(".opt").forEach((o) => { o.classList.remove("glow"); o.classList.toggle("faded", o !== el); });
    el.classList.add("ok"); el.querySelector(".hand")?.remove();
    if (Q.it.type === "gap") { const b = obj.querySelector(".blank"); b.textContent = Q.it.answer; b.classList.remove("now"); b.classList.add("fill"); }
    return success();
  }
  const word = Q.tiles[el.dataset.i];
  if (word !== Q.it.words[Q.placed.length]) return wrongTap(el);
  const slot = obj.querySelectorAll(".slot")[Q.placed.length];
  slot.textContent = word; slot.classList.add("filled"); slot.classList.remove("now"); delete slot.dataset.cue;
  Q.placed.push(word); el.classList.add("used"); el.querySelector(".hand")?.remove();
  if (Q.placed.length === Q.it.words.length) { $("#ghost").hidden = true; success(); } else applyHints();
});

// Matching: tap a word then its picture (or the other way round). A right pair locks; a wrong one shakes and gives a hint.
function matchTap(el) {
  const Q = S.Q;
  if (el.classList.contains("done")) return;
  SFX.pop();
  if (!Q.sel || Q.sel.dataset.k === el.dataset.k) { if (Q.sel) Q.sel.classList.remove("sel"); Q.sel = el; el.classList.add("sel"); return; }
  const a = Q.sel;
  Q.sel = null; a.classList.remove("sel");
  if (a.dataset.w !== el.dataset.w) return wrongTap(el);
  a.classList.add("done"); el.classList.add("done"); a.classList.remove("glow"); el.classList.remove("glow"); el.querySelector(".hand")?.remove();
  Q.matched += 1;
  if (Q.matched === Q.it.pairs.length) success(); else applyHints();
}

// ---------- success: Sophie and the learner cheer, a heart flies to the "people helped" counter
async function success() {
  const run = S, Q = S.Q, it = Q.it;
  Q.active = false;
  S.results.push({ qid: it.id, part: S.parts[S.part].id, target: it.target, sub: subSkill(it), prompt: Q.hint, wrong: Q.wrong, friend: Q.friend });
  const alone = Q.hint === 0 && Q.wrong === 0;
  for (const w of itemWords(it)) collectWord(w, alone);
  if (it.card.kind === "label") addCrate(it.card.pic);
  SFX.ok(); react($("#guide"), "cheer");
  addPerson();
  flyHeart();
  await sleep(800);
  if (S !== run) return;
  await speak(echo(it), { tap: false });
  if (S !== run) return;
  S.item += 1;
  if (S.item < S.items.length) { obj.querySelectorAll(".ln.ev").forEach((l) => l.classList.remove("ev")); startItem(); return; }
  S.skip = false;
  const P = S.parts[S.part], tipP = aiAvailable ? partTip(P) : null;
  for (const line of P.after || []) { if (S !== run || S.skip) break; await speak(line); }
  if (S !== run) return;
  // one sentence from the AI helper about this part (it starts while the pupil reads the lines above); wait at most 5 seconds
  const tip = tipP && !S.skip ? await Promise.race([tipP, sleep(5000).then(() => null)]) : null;
  if (tip && S === run) await speak(tip, { label: "AI tip" });
  if (S !== run) return;
  nextPart();
}

function flyHeart() {
  const f = document.createElement("div");
  f.className = "flyer"; f.innerHTML = `<img src="assets/pics/${S.story.goal.pic}.png" alt="" style="width:34px;height:34px;object-fit:contain">`; $("#stage").appendChild(f);
  const x0 = 900, y0 = 250, x1 = 940, y1 = 36;
  f.animate([{ transform: `translate(${x0}px,${y0}px) scale(.3)`, opacity: 0 }, { transform: `translate(${x0 + 30}px,${y0 - 90}px) scale(1.3)`, opacity: 1, offset: 0.4 }, { transform: `translate(${x1}px,${y1}px) scale(.8)`, opacity: 1 }], { duration: 950, easing: "cubic-bezier(.3,.7,.3,1)", fill: "forwards" }).onfinish = () => {
    f.remove(); if (!S) return; S.shown += 1; $("#helped-n").textContent = S.shown; SFX.heart();
    const c = $("#helped"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
  };
}

setInterval(() => {
  const Q = S && S.Q;
  if (!Q || !Q.active || S.paused) return;
  Q.elapsed += 0.1;
  const limit = store.settings.limit;
  if (limit) { const f = Math.max(0, 1 - Q.elapsed / limit), t = $("#timer"); if (t) { t.style.width = f * 100 + "%"; t.parentElement.classList.toggle("late", f < 0.3); } }
  setHint(hintLevel(Q.elapsed, limit, Q.wrong, Q.manual));
}, 100);

// ---------- ending
async function endRun() {
  const run0 = S;
  S.skip = false;
  react($("#guide"), "cheer");
  for (const line of S.story.ending || []) { if (S !== run0 || S.skip) break; await speak(line); }
  if (S !== run0) return;
  hidePlay(); setScene(S.story.scene);
  const run = { ts: Date.now(), story: S.story.id, mode: S.mode, results: S.results, review: null };
  run.review = { ...reviewTemplate(run, student.name, S.story.hero), source: "template" };
  const medal = S.results.filter(isIndependent).length >= 0.8 * S.results.length ? 2 : 1;
  student.medals = student.medals || {};
  student.medals[S.story.id] = Math.max(student.medals[S.story.id] || 0, medal);
  student.runs.push(run); S.run = run; save();
  if (aiAvailable) askAi(run);
  SFX.win();
  const crowd = $("#crowd"); crowd.classList.add("end");
  S.results.forEach(() => addPerson(true));
  setGuide(S.story.guide); react($("#guide"), "cheer");
  const words = Object.entries(S.newWords).map(([w, v]) => wordCard(w, v.level, v.isNew ? "new" : "")).join("");
  $("#s-end").innerHTML = `<h1>Story complete!</h1><p class="sub endsub">Thank you, ${student.name}! You helped ${S.results.length} times in "${S.story.title}".</p>
    <div class="endcard"><div class="endrow"><b style="font-size:17px">Your words today</b>${words || '<span class="note2">No new words this time.</span>'}</div>
    <div class="say" id="say"></div>
    <div class="actions"><button class="btn primary" id="again">Play again</button><button class="btn" id="progress-story-btn">My progress</button><button class="btn" id="to-who2">More stories</button></div></div>`;
  show("s-end"); renderSay(aiAvailable);
  const m = document.createElement("div");
  m.className = "bigmedal"; m.innerHTML = `${medalSvg(medal)}<b>${MEDAL_TEXT[medal]}</b>`;
  $("#s-end").appendChild(m);
  confetti();
}

function screenWords() {
  hidePlay(); setScene(2);
  const have = student.words || {};
  $("#s-words").innerHTML = `<button class="round corner l" id="to-intro" aria-label="Back">${ICON.back}</button>
    <h1>${student.name}'s words</h1><p class="sub">Gold = on your own. Silver = with help. More words come in the next episodes.</p>
    <div class="grid5">${WORD_SLOTS.map((w) => wordCard(w, have[w] || 0)).join("")}</div>`;
  show("s-words");
}

// ---------- progress page: the records, and advice from the AI helper (or from the game when there is no AI)
function screenProgress(storyId = null) {
  hidePlay(); setScene(3);
  const story = STORIES.find((st) => st.id === storyId) || null;
  const runs = story ? student.runs.filter((r) => r.story === story.id) : student.runs, sum = summarize(runs);
  progressScope = story;
  const meters = Object.entries(TARGETS).map(([t]) => { const o = sum.per[t]; const r = o ? o.rate : null; return `<div class="meter"><span>${TARGETS[t]}</span><div><i class="${r !== null && r < 0.5 ? "low" : ""}" style="width:${r === null ? 0 : Math.round(r * 100)}%"></i></div><b>${r === null ? "–" : Math.round(r * 100) + "%"}</b></div>`; }).join("");
  $("#s-progress").innerHTML = `<button class="round corner l" id="${story ? "to-who2" : "to-intro"}" aria-label="Back">${ICON.back}</button>
    <h1>${story ? story.title : `${student.name}'s progress`}</h1>
    <p class="sub">${story ? `${student.name}'s feedback for this story` : `${student.name}'s feedback for all stories`}${runs.length ? "" : ". Play first, then your feedback shows here."}</p>
    <div class="prog"><div class="panel"><h3>On your own</h3>${meters}</div>
    <div class="panel adv"><h3>Feedback</h3><div id="advice"></div><div id="advbtn"></div><p class="note" id="advsrc"></p></div></div>`;
  show("s-progress");
  if (runs.length) askAdvice(false);
  else $("#s-progress .adv").innerHTML = '<h3>Feedback</h3><p class="note">After you play, feedback from the AI helper shows here.</p>';
}
let progressScope = null;

function renderAdvice(adv, source) {
  const next = STORIES.find((st) => st.id === adv.next);
  $("#advice").innerHTML = adv.learner.map((l) => `<p class="aline">${esc(l)}</p>`).join("");
  $("#advsrc").textContent = source === "ai" ? "Written by an AI helper from your results." : "Made by the game from your results.";
  $("#advbtn").innerHTML = `${next ? `<button class="btn primary small" data-story="${next.id}">Play: ${next.title}</button>` : ""}${aiAvailable ? '<button class="btn small" id="ask-again">Ask the AI again</button>' : ""}`;
}

// Show the game's own advice at once; if the AI helper is there, replace it with the AI's advice. Kept per player until a new run is played.
async function askAdvice(force) {
  const scope = progressScope, key = scope ? scope.id : "all";
  const runs = scope ? student.runs.filter((r) => r.story === scope.id) : student.runs;
  const sum = summarize(runs), medals = student.medals || {};
  const again = !!scope && medals[scope.id] !== 2;
  const next = again ? scope : nextStory(STORIES, medals);
  const base = adviceTemplate(sum, student.name, next, again);
  if (!student.advice || student.advice.learner) student.advice = {};
  const kept = student.advice[key];
  if (!force && kept && kept.runs === runs.length) return renderAdvice(kept, kept.source);
  renderAdvice(base, "template");
  if (!aiAvailable) return;
  $("#advsrc").textContent = "Asking the AI helper...";
  try {
    const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 22000);
    const res = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: advicePrompt(sum, STORIES, medals, scope) }), signal: ctrl.signal });
    const j = parseAdvice((await res.json()).text, STORIES);
    if (!j) { renderAdvice(base, "template"); return; }
    // The AI must not send a pupil back to a story that already has a gold medal: use the game's own line instead.
    if (scope && medals[scope.id] === 2 && j.next === scope.id) { j.next = base.next; j.learner[2] = base.learner[2]; }
    student.advice[key] = { ...j, next: j.next || base.next, source: "ai", runs: runs.length }; save();
    if ($("#s-progress").classList.contains("show") && progressScope === scope) renderAdvice(student.advice[key], "ai");
  } catch { renderAdvice(base, "template"); }
}

// One sentence from the AI helper about the part that was just finished. null if the AI is not there or gives no usable answer.
async function partTip(P) {
  try {
    const mine = S.results.filter((r) => r.part === P.id);
    const res = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: partTipPrompt(P.title, mine) }) });
    return parseTip((await res.json()).text);
  } catch { return null; }
}

async function askAi(run) {
  try {
    const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 22000);
    const res = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: reviewPrompt(run, S && S.story) }), signal: ctrl.signal });
    const j = parseReview((await res.json()).text);
    if (j) { run.review = { ...j, source: "ai" }; save(); }
  } catch { /* the game's own text stays */ }
  if ($("#s-end").classList.contains("show") && S && S.run === run) renderSay(false);
}

function renderSay(waiting = false) {
  const r = S.run.review;
  if (waiting) { $("#say").innerHTML = `The AI helper is writing your feedback...<small>One moment.</small>`; return; }
  $("#say").innerHTML = `${r.learner.map(esc).join(" ")}<small>${r.source === "ai" ? "Written by an AI helper. Your teacher checks it before it is shared." : "Made by the game."}</small>`;
}

// ---------- clicks
document.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.story) { SFX.pop(); return startRun(t.dataset.story, store.settings.mode || "normal"); }
  switch (t.id) {
    case "to-who2": return screenStories();
    case "mode-btn": store.settings.mode = (store.settings.mode || "normal") === "quick" ? "normal" : "quick"; save(); return screenStories();
    case "who-chip": SFX.pop(); return screenPlayers();
    case "players-close": return screenStories();
    case "player-new": return screenName(true);
    case "name-go": { const n = cleanName($("#name-input").value); if (!n) { $("#name-input").classList.add("shake"); setTimeout(() => $("#name-input").classList.remove("shake"), 400); return; } student = { id: "s" + Date.now(), name: n, color: document.querySelector(".pick.sel").dataset.pick, runs: [] }; store.students.push(student); store.current = student.id; save(); SFX.pop(); return screenStories(); }
    case "again": return startRun(S.story.id, S.mode);
    case "words-btn": return screenWords();
    case "progress-btn": return screenProgress();
    case "progress-story-btn": return screenProgress(S.story.id);
    case "ask-again": return askAdvice(true);
    case "to-intro": return screenStories();
    case "btn-pause": S.paused = true; $("#s-pause").innerHTML = `<h1>Paused</h1><p class="sub">Take your time.</p><div class="actions"><button class="btn primary" id="resume">Keep going</button><button class="btn" id="quit">Stop</button></div>`; return show("s-pause");
    case "resume": S.paused = false; return show("");
    case "quit": S = null; advance = null; endNow = null; return screenStories();
  }
  if (t.dataset.pick) { document.querySelectorAll(".pick").forEach((b) => b.classList.toggle("sel", b === t)); SFX.pop(); return; }
  if (t.dataset.switch) { student = stu(t.dataset.switch); store.current = student.id; save(); SFX.pop(); return screenStories(); }
  if (t.dataset.rename) return screenPlayers(t.dataset.rename);
  if (t.dataset.save) { const n = cleanName($("#rename-input").value); if (n) { stu(t.dataset.save).name = n; save(); } return screenPlayers(); }
});

// ---------- start
let aiAvailable = false;
fetch("/api/status").then((r) => r.json()).then((j) => { aiAvailable = !!j.ai; }).catch(() => {});
document.addEventListener("keydown", (e) => {
  // the dialogue can be moved on from the keyboard, too (Space, Enter or the right arrow)
  if (advance && !/^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || "") && [" ", "Enter", "ArrowRight"].includes(e.key) && !(document.activeElement && document.activeElement.closest(".skip"))) { e.preventDefault(); advance(); return; }
  if (e.key === "Enter" && document.activeElement && document.activeElement.id === "name-input") $("#name-go").click(); if (e.key === "Enter" && document.activeElement && document.activeElement.id === "rename-input") document.querySelector("[data-save]").click(); });
(async () => {
await pull();
student = stu(store.current) || store.students[0] || null;
if (!student && params.get("debug")) { student = { id: "s" + Date.now(), name: "Sunny", color: "Yellow", runs: [] }; store.students.push(student); }
if (!student) screenName();
else if (params.get("debug")) startRun(params.get("story") || STORIES[0].id, params.get("mode") === "normal" ? "normal" : "quick"); else screenStories();
})();
