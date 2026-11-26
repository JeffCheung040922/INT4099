# AI helper for the public site (Cloudflare Worker)

GitHub Pages has no server, and the AI key must never be put in a web page. This small Worker holds the key and answers the
game's AI requests. It only answers our own site, only for prompts that look like the game's, and only a limited number of
times (12 a minute per visitor, 400 a day in total), so a stranger cannot spend the credits.

## Set it up once (about 10 minutes, free Cloudflare account)

Use a NEW Poe key for this (create it in your Poe account); do not reuse a key that has been pasted anywhere.

```
cd worker
npx wrangler login                              # opens the browser; click Allow
npx wrangler kv namespace create LIMITS         # prints an id: paste it into wrangler.toml
npx wrangler secret put POE_API_KEY             # paste the new key when asked; it is stored at Cloudflare, not in this folder
npx wrangler deploy                             # prints https://story-time-ai.<your-account>.workers.dev
```

Then put that address in `config.js` (`aiBase`), commit and push. The student site and the teacher site on GitHub Pages
will show AI feedback.

If your Pages address is not `https://jeffcheung040922.github.io`, set `ALLOWED_ORIGINS` (see `wrangler.toml`).

## Check it

```
node worker/test-worker.mjs     # refuses other sites, odd prompts and too many calls; never shows the key
```

## Know the limits

- The limits are a cap on spending, not a lock: a determined person could still use up the day's 400 calls.
- Watch the usage in the Poe account. To stop the AI at any time: `npx wrangler delete`, or remove the secret.
- Each story uses about 5 AI calls (4 tips and 1 feedback), plus one for My progress.
