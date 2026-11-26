// Rules for the demo: hint ladder, independence, review text. No DOM code, so `node js/test.js` can check it.

const TARGETS = { words: "Words and pictures", sentence: "Building sentences", grammar: "Grammar and tenses", reading: "Reading", talk: "Joining a talk" };

// Hint ladder. The game helps at these fractions of the time limit, in this order, and never takes points away.
// Reading questions: 1 = the line with the answer is highlighted, 2 = one wrong card fades,
// 3 = the right card glows, a hand points at it and the other wrong cards fade.
// Questions with no line to point at (choose the word, fill the gap, talk) skip the highlight, so 1 and 2 are the last two steps.
// Sentence order: 1 = the next word glows, 2 = the whole sentence appears faintly, 3 = only the next word stays active.
const LADDER = [0.5, 0.7, 0.85];
const DEFAULT_LIMIT = 35; // seconds per question; the teacher can change it or switch it off (0)

const isIndependent = (r) => r.prompt === 0 && r.wrong === 0;

// Which hint level applies now: from elapsed time, from wrong taps (each wrong tap moves one level up) and from the Help button.
function hintLevel(elapsed, limit, wrong, manual = 0) {
  let t = 0;
  if (limit > 0) for (const f of LADDER) if (elapsed >= limit * f) t += 1;
  return Math.min(3, Math.max(t, wrong, manual));
}

function indepRate(history, target, window = 12) {
  const rs = [];
  for (let s = history.length - 1; s >= 0 && rs.length < window; s--) {
    for (let i = history[s].results.length - 1; i >= 0 && rs.length < window; i--) {
      if (history[s].results[i].target === target) rs.push(history[s].results[i]);
    }
  }
  return rs.length ? rs.filter(isIndependent).length / rs.length : null;
}

function shuffle(a, rng = Math.random) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

// Word cards for a sentence; never returned already in the right order.
function scramble(words, rng = Math.random) {
  if (words.length < 2) return words.slice();
  let s;
  do s = shuffle(words, rng); while (s.every((w, i) => w === words[i]));
  return s;
}

const MISSIONS = {
  words: "Point to three food words in a shop or a book and say them with your teacher.",
  sentence: 'Say a short sentence about a helper: "Sophie helps people." Then write it with your teacher.',
  reading: "Read the poster in this game again with your teacher and point to the day and the time.",
  talk: 'Practise one reply with a friend: "Yes, I do." or "Yes, please."',
  grammar: 'Say two sentences with a friend: "I played yesterday." and "I am playing now."',
};

function weakestTarget(results) {
  const by = {};
  for (const r of results) { by[r.target] = by[r.target] || { n: 0, help: 0 }; by[r.target].n += 1; by[r.target].help += isIndependent(r) ? 0 : 1; }
  const list = Object.entries(by).sort((a, b) => b[1].help / b[1].n - a[1].help / a[1].n);
  return list.length && list[0][1].help > 0 ? list[0][0] : null;
}

// Plain-language review built from the run. A real AI model can replace the wording; the teacher approves it.
function reviewTemplate(run, name, hero = "Sophie") {
  const rs = run.results;
  const clean = rs.filter(isIndependent);
  const learner = [`Great work, ${name}! You helped ${hero} with ${rs.length} questions.`];
  learner.push(clean.length ? `You answered ${clean.length} on your own. That is real progress.` : "When you needed help, you kept trying. That is a good habit.");
  const need = weakestTarget(rs);
  learner.push(need ? `Next time we will practise "${TARGETS[need]}" a little more.` : "Next time we will read a new story.");
  const friend = rs.filter((r) => r.friend).length;
  const teacher = `${clean.length} of ${rs.length} questions were answered without help; ${rs.length - clean.length} needed prompts (${friend} asked for help). ${need ? `Most support was needed for "${TARGETS[need]}".` : "No part stood out."} Suggested follow-up: ${MISSIONS[need || "sentence"]}`;
  return { learner, teacher };
}

// Anonymous prompt for a real AI model: statistics only. No name, school or free text from the learner.
function reviewPrompt(run, story = null) {
  const HELP = ["answered alone", "needed one hint", "needed two hints", "needed the game to point at the answer"];
  const rows = run.results.map((r) => `- ${TARGETS[r.target]}${r.sub ? ` (${r.sub})` : ""}: ${HELP[r.prompt]}; ${r.wrong} extra tap${r.wrong === 1 ? "" : "s"}; ${r.friend ? "asked for help" : "did not ask for help"}`).join("\n");
  return `You help a Hong Kong primary-school English teacher. A Primary 5-6 pupil with mild intellectual disability ("Student A") finished one story practice paper${story ? ` ("${story.title}", level ${story.level} of 3)` : ""} of ${run.results.length} questions (words and pictures, building sentences, grammar and tenses, reading, joining a talk). Results:\n${rows}\nReply ONLY with JSON: {"learner":["sentence 1","sentence 2","sentence 3"],"teacher":"two sentences"}. The learner sentences: warm, very simple words, under 12 words each, spoken to the pupil as "you" (never "I"), line 1 names one thing done well, line 2: if any question needed a hint, give ONE concrete suggestion for that point (name the grammar point); if none did, say the pupil is ready for a harder story; line 3 encourages. Name the part (for example "Reading") and never use question numbers, the words "hint level", or the word "wrong". If every question was answered with no hint, say so and praise the pupil; do not invent a weakness. Asking for help is a good thing; say so if it happened. The teacher text: say which parts need the most support and what to practise next. Do not invent facts that are not in the data.`;
}

// One short tip after each part of a story. Numbers only; no name.
function partTipPrompt(title, results) {
  const alone = results.filter(isIndependent).length;
  const helped = results.filter((r) => !isIndependent(r)).map((r) => r.sub || TARGETS[r.target]);
  return `You help a Hong Kong primary-school English teacher. A Primary 5-6 pupil with mild intellectual disability just finished the part "${title}" of a tap-only English story: ${alone} of ${results.length} questions answered with no hint${helped.length ? `; hints were needed for: ${[...new Set(helped)].join(", ")}` : ""}. Write ONE short, warm sentence (under 14 words) spoken to the pupil as "you": praise what went well and, if hints were needed, give one tiny tip for that point. If no hints were needed, only praise; do not invent a problem. Never use the words "wrong" or "fail". Reply ONLY with JSON: {"tip":"the sentence"}.`;
}
function parseTip(text) {
  try { const m = String(text).match(/\{[\s\S]*\}/); const t = JSON.parse(m ? m[0] : text).tip; return typeof t === "string" && t.trim() && t.length <= 160 ? t.trim() : null; } catch { return null; }
}

// Tolerant parser for the AI reply (plain JSON, or JSON inside a code fence).
function parseReview(text) {
  try {
    const m = String(text).match(/\{[\s\S]*\}/);
    const j = JSON.parse(m ? m[0] : text);
    if (Array.isArray(j.learner) && j.learner.length && typeof j.teacher === "string") return { learner: j.learner.map(String).slice(0, 4), teacher: j.teacher };
  } catch { /* fall through */ }
  return null;
}


// ---- progress page: what the records say, and advice
const FRIENDLY = { words: "words and pictures", sentence: "building sentences", grammar: "grammar and tenses", reading: "reading", talk: "talking" };

// Which grammar point a grammar question tests, from its words. Used to say "past simple needs practice", not just "grammar".
function subSkill(it) {
  if (it.target !== "grammar") return null;
  const t = `${(it.card && it.card.lines && it.card.lines[0]) || ""} ${it.before || ""} ${it.cue || ""}`.toLowerCase().trim();
  if (it.q === "Which sentence is correct?") return "verb forms (is, are, -s)";
  if ((it.type === "gap" && it.answer === "can") || /^can\b/.test(t)) return "can";
  if (/\bwill\b|tomorrow/.test(t)) return "will (future)";
  if (/\bdid\b|yesterday|last night/.test(t)) return "past simple";
  if (/^(is|are)\b/.test(t)) return "is/are questions";
  if (/^(do|does)\b/.test(t)) return "do/does questions";
  if (/\bnow\b|doing/.test(t)) return "present continuous";
  if (/every day/.test(t)) return "present simple";
  return "other grammar";
}

// The last few runs, counted by area and by grammar point. rate = share answered with no hint and no extra tap.
function summarize(runs, window = 3) {
  const per = {}, sub = {};
  const add = (map, key, r) => { const o = map[key] = map[key] || { n: 0, alone: 0 }; o.n += 1; o.alone += isIndependent(r) ? 1 : 0; };
  for (const run of runs.slice(-window)) for (const r of run.results) { add(per, r.target, r); if (r.sub) add(sub, r.sub, r); }
  const fin = (map) => Object.fromEntries(Object.entries(map).map(([k, o]) => [k, { ...o, rate: o.alone / o.n }]));
  return { runs: runs.length, window: Math.min(window, runs.length), per: fin(per), sub: fin(sub) };
}

// The area (or grammar point) with the lowest rate, among those with at least 2 answers; ties go to the one with more answers.
const lowest = (map) => Object.entries(map).filter(([, o]) => o.n >= 2).sort((a, b) => a[1].rate - b[1].rate || b[1].n - a[1].n)[0] || null;
const highest = (map) => Object.entries(map).filter(([, o]) => o.n >= 2).sort((a, b) => b[1].rate - a[1].rate || b[1].n - a[1].n)[0] || null;

// The next story to try: the first one (easiest first) that has no gold medal yet.
const nextStory = (stories, medals = {}) => stories.find((st) => medals[st.id] !== 2) || null;

function adviceTemplate(sum, name, next, again = false) {
  if (!sum.runs) return { learner: ["Play a story first.", "Then your progress shows here."], teacher: "No runs yet.", next: next ? next.id : null };
  const best = highest(sum.per), weak = lowest(sum.per), weakSub = lowest(sum.sub);
  const learner = [];
  learner.push(best && best[1].rate >= 0.6 ? `You are good at ${FRIENDLY[best[0]]}, ${name}!` : `Well done for playing, ${name}!`);
  learner.push(weak && weak[1].rate < 1 ? `Let's practise ${weakSub && weakSub[1].rate < 1 && weak[0] === "grammar" ? weakSub[0] : FRIENDLY[weak[0]]} a little more.` : "You are doing great. Keep going!");
  learner.push(next ? (again ? `Play "${next.title}" again to do even better.` : `Try "${next.title}" next.`) : "Play your favourite story again.");
  const pct = (o) => `${Math.round(o.rate * 100)}% (${o.alone}/${o.n})`;
  const parts = Object.entries(sum.per).map(([k, o]) => `${FRIENDLY[k]} ${pct(o)}`).join("; ");
  const teacher = `Last ${sum.window} run${sum.window === 1 ? "" : "s"}, answered with no hint: ${parts}. ${weak && weak[1].rate < 1 ? `Most support was needed for ${FRIENDLY[weak[0]]}${weakSub && weak[0] === "grammar" ? `, especially ${weakSub[0]}` : ""}. Suggested follow-up: ${MISSIONS[weak[0]]}` : "No area stood out; move to a harder story."}`;
  return { learner, teacher, next: next ? next.id : null };
}

// Anonymous prompt: numbers only. The AI answers with short lines for the learner and a few sentences for the teacher.
function advicePrompt(sum, stories, medals = {}, scope = null) {
  const lines = Object.entries(sum.per).map(([k, o]) => `- ${FRIENDLY[k]}: ${o.alone} of ${o.n} answered with no hint`).join("\n");
  const subs = Object.entries(sum.sub).map(([k, o]) => `- ${k}: ${o.alone} of ${o.n} with no hint`).join("\n");
  const list = stories.map((st) => `- ${st.id} (level ${st.level}): ${st.title}; ${medals[st.id] === 2 ? "gold medal" : medals[st.id] === 1 ? "silver medal" : "not played"}`).join("\n");
  return `You help a Hong Kong primary-school English teacher. A Primary 5-6 pupil with mild intellectual disability ("Student A") plays a tap-only English story game. Records from the last ${sum.window} run(s)${scope ? ` of the story "${scope.title}" only` : ""}:\nBy area:\n${lines}\nBy grammar point:\n${subs || "- none yet"}\nStories (id, level, result):\n${list}\nReply ONLY with JSON: {"learner":["line 1","line 2","line 3"],"teacher":"three sentences","next":"story id"}. The learner lines: warm, very simple words, under 12 words each, spoken to the pupil as "you"; line 1 names one thing done well, line 2 names one thing to practise (use the grammar point if it is the weak one), line 3 says which story to try next, using the story title (for example "Sophie\'s Food Bank"), never the id. The teacher text: say which areas and grammar points need the most support, and give two concrete things to practise away from the screen. "next" must be one of the story ids above${scope ? `; if the pupil did not get a gold medal for "${scope.title}", choose "${scope.id}" so the pupil plays it again, otherwise choose another story` : ""}, and it should fit the pupil: if the pupil needs a lot of help, choose a story of the same or lower level. If every area is at or near 100%, say so and praise the pupil; do not invent a weakness, and suggest a harder story. Never use the words "wrong" or "fail". Do not invent facts that are not in the data.`;
}
function parseAdvice(text, stories) {
  const j = parseReview(text);
  if (!j) return null;
  try { const m = String(text).match(/\{[\s\S]*\}/); const next = JSON.parse(m[0]).next; return { ...j, next: stories.some((st) => st.id === next) ? next : null }; } catch { return { ...j, next: null }; }
}

if (typeof module !== "undefined") {
  module.exports = { partTipPrompt, parseTip, FRIENDLY, subSkill, summarize, lowest, highest, nextStory, adviceTemplate, advicePrompt, parseAdvice, TARGETS, LADDER, DEFAULT_LIMIT, isIndependent, hintLevel, indepRate, shuffle, scramble, weakestTarget, reviewTemplate, reviewPrompt, parseReview };
}
