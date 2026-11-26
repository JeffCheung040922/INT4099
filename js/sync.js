// Shared by the student site, the teacher site, the server and the tests: how player records from different
// places are merged. Each player has `updated` (ms since 1970); the newer copy wins. A removed player stays
// removed (kept in `deleted`) so an old copy on another device cannot bring them back.

// A name goes into the page, so only letters, numbers, spaces, "_" and "-" are kept, at most 12 characters.
const cleanName = (n) => String(n).replace(/[^\p{L}\p{N} _-]/gu, "").trim().slice(0, 12).trim();

const COLOR_NAMES = ["Yellow", "Pink", "Blue", "Green", "Beige", "Cat"];
// Text that came from outside (the AI, a saved record) is shown as text, never as page code.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// A run the pages can safely read: a list of answers and a review made of text.
const validRun = (r) => r && Array.isArray(r.results) && r.results.every((x) => x && typeof x.target === "string") && r.review && Array.isArray(r.review.learner) && typeof r.review.teacher === "string";

const emptyData = () => ({ students: [], deleted: [], settings: { limit: 35, sfx: true } });

function mergeStudent(data, incoming) {
  if (!incoming || typeof incoming.id !== "string" || !COLOR_NAMES.includes(incoming.color) || !Array.isArray(incoming.runs) || !incoming.runs.every(validRun)) return false;
  const name = cleanName(incoming.name || "");
  if (!name || data.deleted.includes(incoming.id)) return false;
  const copy = { ...incoming, name };
  const i = data.students.findIndex((s) => s.id === copy.id);
  if (i < 0) { data.students.push(copy); return true; }
  if ((copy.updated || 0) >= (data.students[i].updated || 0)) { data.students[i] = copy; return true; }
  return false;
}

function removeStudent(data, id) {
  data.students = data.students.filter((s) => s.id !== id);
  if (!data.deleted.includes(id)) data.deleted.push(id);
}

// Only values the game knows how to use: time per question and sound.
const cleanSettings = (s) => ({ limit: [0, 20, 35, 60].includes(Number(s && s.limit)) ? Number(s.limit) : 35, sfx: !(s && s.sfx === false) });

if (typeof module !== "undefined") module.exports = { COLOR_NAMES, esc, validRun, cleanName, emptyData, mergeStudent, removeStudent, cleanSettings };
