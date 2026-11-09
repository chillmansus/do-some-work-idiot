# Do Some Work Idiot

A personal habit tracker that installs on Android as an app (PWA). Dark, small, offline.
Habit data stays on the phone in local storage. If reminders are turned on, the reminder server keeps
only what it needs to ring: habit names, times, days, snoozes and which habits are done today.

- `src/` is the source: plain HTML, CSS and JavaScript, no framework.
- `node build.mjs` builds the installable app into `dist/` (page shell, manifest, icons, service worker).
- Every push to `main` builds and publishes to GitHub Pages.
- `server/` is the reminder server: a Cloudflare Worker with a cron every minute, KV storage and Web Push
  (VAPID + aes128gcm on plain WebCrypto). `npm test` checks the encryption and timing; `npx wrangler deploy` ships it.
  The VAPID private key is a Worker secret and lives locally in `server/.dev.vars`, which is never committed.
