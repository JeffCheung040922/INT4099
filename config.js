// Where the AI helper is. Empty = the same server that serves this page (node server.mjs, the local version).
// The public site (GitHub Pages) has no server, so there it uses the Worker in worker/ (deployed to Cloudflare).
window.STORY_CONFIG = { version: "17", aiBase: location.hostname.endsWith(".github.io") ? "https://story-time-ai.story-time-jeff.workers.dev" : "" };
