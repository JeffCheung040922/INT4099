// Where the AI helper is. Empty = the same server that serves this page (node server.mjs).
// The public site (GitHub Pages) has no server, so set this to the Worker address after deploying worker/, e.g.
//   window.STORY_CONFIG = { aiBase: "https://story-time-ai.your-account.workers.dev" };
window.STORY_CONFIG = { aiBase: "" };
