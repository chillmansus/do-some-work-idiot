# Do Some Work Idiot

A personal habit tracker that installs on Android as an app (PWA). Dark, small, offline.
Habit data stays on the phone in local storage. Nothing is sent anywhere.

- `src/` is the source: plain HTML, CSS and JavaScript, no framework.
- `node build.mjs` builds the installable app into `dist/` (page shell, manifest, icons, service worker).
- Every push to `main` builds and publishes to GitHub Pages.
