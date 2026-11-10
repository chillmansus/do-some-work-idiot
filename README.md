# Do Some Work Idiot

A personal habit tracker that installs on Android as an app (PWA). Dark, small, offline.
Habit data stays on the phone in local storage. If reminders are turned on, the reminder server keeps
only what it needs to ring: habit names, times, days, snoozes and which habits are done today.

- `src/` is the source: plain HTML, CSS and JavaScript, no framework.
- `node build.mjs` builds the installable app into `dist/` (page shell, manifest, icons, service worker).
- Every push to `main` builds and publishes to GitHub Pages.
- Duo: phones pair with a one-time 6-letter code and see each other's progress on shared habits for today,
  with nudges and "finished everything" alerts. A phone can have up to 5 partners; each link is private to its two phones,
  so partners never see each other. Each phone proves who it is with its own secret key (the server keeps a hash).
- 12 app themes (`src/fx.js`): each changes the background colors and draws its own moving scene on one canvas
  behind the content (fish, leaves, petals, stars, rain...), capped at 30 fps and paused when the app is hidden.
- 30 habit colors live in one table (`PALETTE` in `src/app.js`); ink text reaches 4.5:1 on every gradient stop.
- `server/` is the reminder and Duo server: a Cloudflare Worker with a cron every minute, KV storage and Web Push
  (VAPID + aes128gcm on plain WebCrypto). `npm test` checks the encryption and timing; `npx wrangler deploy` ships it.
  The VAPID private key is a Worker secret and lives locally in `server/.dev.vars`, which is never committed.
