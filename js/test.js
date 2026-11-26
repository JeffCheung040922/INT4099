// Self-check: node js/test.js
const assert = require("assert");
const fs = require("fs");
const { MODES } = require("./story.js");
const E = require("./engine.js");
const pic = (w) => fs.existsSync(`${__dirname}/../assets/pics/${w}.png`);

// story data
const { STORIES, KIND_ORDER, buildParts, wordSlots, itemWords } = require("./story.js");
assert.strictEqual(STORIES.length, 6);
assert.strictEqual(new Set(STORIES.map((st) => st.id)).size, 6, "story ids differ");
assert.strictEqual(new Set(STORIES.map((st) => st.scene)).size, 6, "each story has its own place");
assert.strictEqual(new Set(STORIES.map((st) => st.guide)).size, 6, "each story has its own hero");
assert.deepStrictEqual(STORIES.map((st) => st.level), [1, 1, 2, 2, 3, 3], "two stories at each level, easiest first");
const types = new Set();
for (const st of STORIES) {
  assert.ok(Number.isInteger(st.scene) && st.scene >= 0 && st.scene <= 5, `${st.id}: scene`);
  assert.ok(st.goal && pic(st.goal.pic) && st.goal.label, `${st.id}: goal`);
  assert.ok(Array.isArray(st.ending) && st.ending.length >= 1, `${st.id}: ending`);
  const parts = buildParts(st);
  assert.strictEqual(parts.length, 4, `${st.id}: four parts`);
  let tenses = 0;
  for (const p of parts) {
    assert.ok(E.TARGETS[p.target], `${st.id}/${p.id}: target`);
    assert.ok(Array.isArray(p.beats) && p.beats.length >= 1, `${st.id}/${p.id}: dialogue`);
    assert.ok(Array.isArray(p.after), `${st.id}/${p.id}: link to the next part`);
    if (p.id !== "talk") assert.ok(p.after.length >= 1, `${st.id}/${p.id}: the story goes on`);
    assert.strictEqual(p.items.length, 5, `${st.id}/${p.id}: five questions`);
    for (const key of [...MODES.normal[p.id], ...MODES.quick[p.id]]) assert.ok(p.items[key], `${st.id}/${p.id}: mode index ${key}`);
    if (p.id === "words" || p.id === "sentence") assert.ok(new Set(p.items.map((it) => it.type + (it.pics ? "P" : "") + (it.cue ? "T" : ""))).size >= 3, `${st.id}/${p.id}: three different question types`);
    for (const it of p.items) {
      types.add(it.type + (it.pics ? "-pics" : "") + (it.cue ? "-tense" : ""));
      assert.ok(it.card && it.card.kind, `${st.id}/${p.id}: card`);
      assert.ok(E.TARGETS[it.target || p.target], `${st.id}/${p.id}: item target`);
      if (it.target === "grammar") tenses += 1;
      if (it.cue) { assert.ok(it.before.includes(it.cue), `${it.before}: the time word is in the sentence`); assert.strictEqual(it.target, "grammar"); }
      if (it.type === "mc") {
        assert.ok(it.answer >= 0 && it.answer < it.options.length, `${st.id}/${p.id}: answer`);
        assert.strictEqual(new Set(it.options).size, it.options.length, `${st.id}/${p.id}: options differ`);
        if (it.evidence !== undefined) assert.ok(it.card.lines[it.evidence], `${st.id}/${p.id}: evidence line exists`);
        if (it.card.kind === "label") { assert.ok(pic(it.card.pic), `picture ${it.card.pic}`); assert.strictEqual(it.options[it.answer], it.card.pic, "the picture is the answer"); }
        if (it.pics) { for (const w of it.options) assert.ok(pic(w), `picture ${w}`); assert.strictEqual(it.options[it.answer], it.card.text, "the word names the right picture"); }
      }
      if (it.type === "gap") { assert.ok(it.options.includes(it.answer)); if (it.pics) for (const w of it.options) assert.ok(pic(w), `picture ${w}`); }
      if (it.type === "match") { assert.strictEqual(it.pairs.length, 3); assert.strictEqual(new Set(it.pairs).size, 3); for (const w of it.pairs) assert.ok(pic(w), `picture ${w}`); }
      if (it.type === "order") {
        assert.ok(/^[A-Z].*\.$/.test(it.sentence), "sentence starts with a capital and ends with a full stop");
        const ws = it.sentence.replace(".", "").split(" ");
        assert.strictEqual(new Set(ws).size, ws.length, `${it.sentence}: every word once`);
      }
    }
  }
  assert.ok(tenses >= [0, 2, 5, 6][st.level], `${st.id}: ${tenses} grammar and tense questions for level ${st.level}`);
}
for (const t of ["mc", "order", "gap-pics", "gap-tense", "match", "mc-pics"]) assert.ok(types.has(t), `question type ${t} is used`);
for (const w of wordSlots()) assert.ok(pic(w), `picture ${w}`);
assert.ok(wordSlots().length >= 22, "word cards across the stories");

// every grammar question is classified into a grammar point
const { subSkill, summarize, adviceTemplate, advicePrompt, parseAdvice, nextStory } = E;
const seenSubs = new Set();
for (const st of STORIES) for (const k of KIND_ORDER) for (const it of st[k].items) {
  const sub = subSkill({ ...it, target: it.target || (k === "words" ? "words" : k) });
  if ((it.target || "") === "grammar") { assert.ok(sub && sub !== "other grammar", `${st.id}: ${it.before || (it.card.lines || [it.q])[0]}`); seenSubs.add(sub); }
  else assert.strictEqual(sub, null);
}
for (const want of ["past simple", "present continuous", "will (future)", "present simple", "can", "verb forms (is, are, -s)", "do/does questions", "is/are questions"]) assert.ok(seenSubs.has(want), `grammar point ${want} is tested`);

// progress summary and advice
const mkRun = (rs) => ({ results: rs.map(([target, alone, sub]) => ({ target, prompt: alone ? 0 : 1, wrong: 0, sub })) });
const runs = [mkRun([["grammar", false, "past simple"], ["grammar", false, "past simple"], ["grammar", true, "can"], ["reading", true], ["reading", true], ["words", true], ["words", true]])];
const sum = summarize(runs);
assert.strictEqual(sum.per.grammar.rate, 1 / 3);
assert.strictEqual(sum.sub["past simple"].rate, 0);
assert.strictEqual(E.lowest(sum.per)[0], "grammar");
assert.strictEqual(E.lowest(sum.sub)[0], "past simple");
assert.strictEqual(E.highest(sum.per)[1].rate, 1);
assert.strictEqual(nextStory(STORIES, {}).id, "cat-pantry");
assert.strictEqual(nextStory(STORIES, { "cat-pantry": 2, "food-bank": 1 }).id, "food-bank", "silver medal: try again before moving on");
assert.strictEqual(nextStory(STORIES, Object.fromEntries(STORIES.map((x) => [x.id, 2]))), null);
const adv = adviceTemplate(sum, "Kiki", nextStory(STORIES, {}));
assert.ok(adv.learner.length === 3 && adv.learner[1].includes("past simple") && adv.teacher.includes("past simple") && adv.next === "cat-pantry");
assert.ok(!advicePrompt(sum, STORIES, {}).includes("Kiki"), "the prompt is anonymous");
assert.strictEqual(parseAdvice('{"learner":["a"],"teacher":"b","next":"zoo"}', STORIES).next, "zoo");
assert.strictEqual(parseAdvice('{"learner":["a"],"teacher":"b","next":"nonsense"}', STORIES).next, null, "an unknown story id is dropped");
assert.strictEqual(adviceTemplate(summarize([]), "Kiki", null).teacher, "No runs yet.");
assert.ok(adviceTemplate(sum, "Kiki", STORIES[0], true).learner[2].includes("again"), "a story without gold is suggested again");
assert.ok(advicePrompt(sum, STORIES, {}, STORIES[0]).includes("of the story \"Mimi the Cat's Pantry\" only"));

// word cards are never already in order
for (const st of STORIES) for (const it of st.sentence.items.filter((i) => i.type === "order")) {
  const words = it.sentence.replace(".", "").split(" ");
  for (let i = 0; i < 50; i++) assert.notDeepStrictEqual(E.scramble(words), words);
}

// hint level: time, wrong taps and the Help button all raise it, never above 3
assert.strictEqual(E.hintLevel(0, 35, 0), 0);
assert.strictEqual(E.hintLevel(18, 35, 0), 1);
assert.strictEqual(E.hintLevel(34, 35, 0), 3);
assert.strictEqual(E.hintLevel(999, 0, 0), 0, "limit 0 = timer off");
assert.strictEqual(E.hintLevel(0, 0, 2), 2);
assert.strictEqual(E.hintLevel(0, 35, 0, 1), 1, "Help button");
assert.strictEqual(E.hintLevel(0, 35, 9, 9), 3);

// review: anonymous prompt has no name; teacher text finds the weakest part; parser accepts fenced JSON
const run = { results: [{ qid: "a", target: "reading", prompt: 0, wrong: 0, friend: false }, { qid: "b", target: "sentence", prompt: 2, wrong: 1, friend: true }] };
assert.ok(!E.reviewPrompt(run).includes("Kiki"));
assert.ok(E.reviewTemplate(run, "Kiki").teacher.includes("Building sentences"));
assert.strictEqual(E.indepRate([run], "reading"), 1);
assert.strictEqual(E.indepRate([run], "sentence"), 0);
assert.strictEqual(E.indepRate([run], "talk"), null);
assert.deepStrictEqual(E.parseReview('```json\n{"learner":["a"],"teacher":"b"}\n```'), { learner: ["a"], teacher: "b" });
assert.strictEqual(E.parseReview("nonsense"), null);
// sync: the newer copy wins, a removed player stays removed, names are cleaned, settings are limited to known values
const sync = require("./sync.js");
const d = sync.emptyData();
const fakeRun = { ts: 1, story: "zoo", results: [{ target: "words" }], review: { learner: ["x"], teacher: "y" } };
const mk = (id, name, updated, n) => ({ id, name, color: "Cat", runs: Array.from({ length: n }, () => fakeRun), updated });
assert.ok(sync.mergeStudent(d, mk("a", "Mei", 10, 1)));
assert.ok(!sync.mergeStudent(d, mk("a", "Mei", 5, 9)), "an older copy is ignored");
assert.strictEqual(d.students[0].runs.length, 1);
assert.ok(sync.mergeStudent(d, mk("a", "Mei", 20, 3)));
assert.strictEqual(d.students[0].runs.length, 3, "a newer copy replaces it");
assert.ok(sync.mergeStudent(d, mk("b", "Tom <b>", 1, 0)));
assert.strictEqual(d.students[1].name, "Tom b", "special characters are removed from names");
assert.ok(!sync.mergeStudent(d, mk("c", "<>", 1, 0)), "a name with nothing left is refused");
assert.ok(!sync.mergeStudent(d, { id: "x", name: "X" }), "a broken record is refused");
sync.removeStudent(d, "a");
assert.deepStrictEqual(d.students.map((x) => x.id), ["b"]);
assert.ok(!sync.mergeStudent(d, mk("a", "Mei", 99, 5)), "a removed player does not come back from an old copy");
assert.deepStrictEqual(sync.cleanSettings({ limit: 20, sfx: false }), { limit: 20, sfx: false });
assert.deepStrictEqual(sync.cleanSettings({ limit: 7 }), { limit: 35, sfx: true });
assert.strictEqual(sync.cleanName("  A very long nickname here "), "A very long");
// records from outside are checked: an unknown colour or a run without a proper review is refused; stored text is escaped
const okRun = { ts: 1, story: "zoo", results: [{ target: "words" }], review: { learner: ["x"], teacher: "y" } };
assert.ok(sync.mergeStudent(sync.emptyData(), { id: "k", name: "Kay", color: "Cat", runs: [okRun] }));
assert.ok(!sync.mergeStudent(sync.emptyData(), { id: "k", name: "Kay", color: "NotAColor", runs: [] }), "unknown colour");
assert.ok(!sync.mergeStudent(sync.emptyData(), { id: "k", name: "Kay", color: "Cat", runs: [{ results: "x", review: {} }] }), "a run without answers or a review");
assert.ok(!sync.mergeStudent(sync.emptyData(), { id: "k", name: "Kay", color: "Cat", runs: [{ ...okRun, review: { learner: "x", teacher: "y" } }] }), "a review whose lines are not a list");
assert.strictEqual(sync.esc('<img src=x onerror="a">&\''), "&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;");
console.log("all tests passed");
