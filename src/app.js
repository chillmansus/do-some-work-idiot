'use strict';
/* Do Some Work Idiot — prototype. Vanilla JS, one data object saved to localStorage. */

/* ---------- utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
const today = () => ymd(new Date());
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = n => String(Math.round(n * 100) / 100);
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW1 = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Habit colors: id (kept in saved data, max 10 letters), top and bottom of the gradient, badge text (w = white, i = ink).
// Ink text on both stops reaches 4.5:1. The first six are the originals; their order and values never change.
const PALETTE = [
  ['ember', '#ffb45e', '#ff5a1f', 'w'],
  ['orchid', '#f59be6', '#a64df2', 'w'],
  ['honey', '#ffe38a', '#f7a428', 'i'],
  ['lagoon', '#86ecfb', '#1c98e0', 'w'],
  ['moss', '#d3f58a', '#36b85b', 'i'],
  ['coral', '#ffb0a8', '#f03e5c', 'w'],
  ['sunset', '#ffc371', '#ff5f6d', 'i'],
  ['crimson', '#ff9a9a', '#ea4a5f', 'w'],
  ['rose', '#ffb3c7', '#f0709a', 'i'],
  ['blush', '#ffd6c7', '#ff9a8b', 'i'],
  ['berry', '#ff9fc9', '#d9558f', 'w'],
  ['plum', '#e8b0ff', '#bb6fe0', 'w'],
  ['violet', '#cbbcff', '#8f7df2', 'w'],
  ['indigo', '#b3bdff', '#7484f0', 'w'],
  ['cobalt', '#9cc0ff', '#4f8af0', 'w'],
  ['ocean', '#86d6ff', '#3a9de6', 'i'],
  ['sky', '#bde9ff', '#62b8f0', 'i'],
  ['aqua', '#95f2e8', '#2fc4c9', 'i'],
  ['teal', '#85e3d2', '#22ad9e', 'i'],
  ['mint', '#bdf6da', '#5fd6a0', 'i'],
  ['jade', '#85e6aa', '#2bb56f', 'i'],
  ['forest', '#b2df96', '#63a853', 'i'],
  ['lime', '#e6f78f', '#a9d84a', 'i'],
  ['citrus', '#fff28f', '#f2c42b', 'i'],
  ['gold', '#ffe39a', '#efaa2e', 'i'],
  ['tangerine', '#ffb873', '#f46e1f', 'i'],
  ['clay', '#f3bea3', '#d07b55', 'w'],
  ['mocha', '#e0c2a6', '#b0835e', 'w'],
  ['sand', '#f4e3c3', '#d6bb88', 'i'],
  ['slate', '#c3cddd', '#8796ae', 'i'],
];
const COLORS = PALETTE.map(p => p[0]);
// Picker order: by hue, neutrals last.
const PICK = 'crimson coral sunset ember tangerine clay honey gold citrus lime moss forest jade mint teal aqua lagoon sky ocean cobalt indigo violet plum orchid berry rose blush sand mocha slate'.split(' ');
const colorCls = c => 'c-' + (COLORS.includes(c) ? c : 'ember');
const colorName = c => cap(c);
const UNITS = ['times', 'reps', 'pages', 'steps', 'glasses', 'minutes', 'hours', 'seconds', 'km', 'meters', 'miles', 'feet', 'calories', 'ml', 'cups', 'grams', 'kg', 'pounds'];
const COUNTABLE = new Set(['times', 'reps', 'pages', 'glasses', 'cups']);
const MILESTONES = [1, 3, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 750, 1000, 1500];
const MTITLE = { 1: 'First step to greatness!', 3: 'Three votes cast!', 5: 'Five and climbing!', 10: 'Double digits!', 25: 'Twenty-five strong!', 50: 'Fifty. Not luck anymore.', 100: 'One hundred. This is who you are.' };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const STANDALONE = (() => { try { return window.top === window; } catch { return false; } })();
const haptic = p => { try { navigator.vibrate && navigator.vibrate(p); } catch { } };
const fmtDate = s => { const d = parse(s); return `${MON[d.getMonth()]} ${d.getDate()}${d.getFullYear() !== new Date().getFullYear() ? ', ' + d.getFullYear() : ''}`; };
const unitLbl = (n, u) => (u === 'times' && Number(n) === 1 ? 'time' : u);

/* ---------- icons ---------- */
const ic = (d, s = 22, w = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  plus: ic('<path d="M12 5v14M5 12h14"/>', 20, 2.2),
  minus: ic('<path d="M5 12h14"/>', 20, 2.2),
  bolt: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 2 4 14h7l-1.5 8L19 10h-7l1.5-8z" fill="currentColor"/></svg>',
  boltBig: '<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 2 4 14h7l-1.5 8L19 10h-7l1.5-8z" fill="currentColor"/></svg>',
  dots: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>',
  keypad: ic('<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M7 10h.01M10.5 10h.01M14 10h.01M17 10h.01M8 14h8"/>', 20),
  undo: ic('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>', 20, 2),
  close: ic('<path d="M6 6l12 12M18 6 6 18"/>', 20, 2),
  down: ic('<path d="m6 9 6 6 6-6"/>', 20, 2),
  left: ic('<path d="m15 18-6-6 6-6"/>', 20, 2.2),
  right: ic('<path d="m9 18 6-6-6-6"/>', 20, 2.2),
  eye: ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
  snooze: ic('<circle cx="12" cy="13" r="8"/><path d="M5 3 2 6M22 6l-3-3M9.5 10.5h5l-5 5h5"/>'),
  star: ic('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
  edit: ic('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>'),
  trash: ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  home: ic('<path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z"/>'),
  chart: ic('<path d="M5 20V11M12 20V4M19 20v-6"/>', 22, 2.2),
  timer: ic('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>'),
  play: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>',
  pause: ic('<path d="M8 5v14M16 5v14"/>', 20, 3),
  reset: ic('<path d="M4 4v6h6"/><path d="M4.6 15a8 8 0 1 0 1.9-8.4L4 10"/>', 20, 2),
  help: ic('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4M12 17h.01"/>', 18, 2),
  check: ic('<path d="M5 12.5 10 17l9-10"/>', 18, 2.6),
  chain: ic('<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>', 18, 2),
  swap: ic('<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>', 18, 2),
  copy: ic('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', 20),
  clock: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 18, 2),
  duo: ic('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="16.5" cy="9" r="2.6"/><path d="M15.6 14.1c2.5-.2 4.5 1.4 4.9 4.4"/>', 30, 1.8),
};
const flameSVG = c => `<svg class="flame" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 6 6.5 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6.5.5 2 1.5 3 2.5 3.5C11 8 10.5 5 12 2z" fill="url(#g-${c})"/></svg>`;
const HEXPTS = '86,50 68,18.8 32,18.8 14,50 32,81.2 68,81.2';
const hexSVG = (n, on) => `<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="${HEXPTS}" fill="${on ? 'url(#g-gold)' : 'none'}" stroke="${on ? 'url(#g-gold)' : 'rgba(255,236,214,.16)'}" stroke-width="9" stroke-linejoin="round"/><text x="50" y="${n >= 1000 ? 58 : 61}" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="${n >= 1000 ? 22 : n >= 100 ? 26 : 32}" fill="${on ? '#3a2205' : 'rgba(255,236,214,.3)'}">${n}</text></svg>`;

/* ---------- data ---------- */
const KEY = 'dswi.v1';
const blank = () => ({ v: 1, name: '', habits: [], logs: {}, stacks: [], focus: { mins: 25, logOn: false, hid: null } });
function load() { try { const raw = localStorage.getItem(KEY); if (raw) return Object.assign(blank(), JSON.parse(raw)); } catch { } return blank(); }
let persistAsked = false;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(D)); } catch { }
  // Ask the browser not to clear our data when the phone runs low on space.
  if (!persistAsked && D.habits.length) { persistAsked = true; try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => { }); } catch { } }
  schedSync(); schedShare();
}

/* ---------- reminders (web push) ---------- */
// The server only gets what it needs to ring: habit names, times, days, snoozes and what's done today.
const PUSH_API = 'https://dswi-reminders.dswi-reminders.workers.dev';
const VAPID_PUBLIC = 'BMAJ-PRh54PvfXIWVaErHc6nsz2wFk5W3tlwmlbjJ-ePGiSgG-fYhsVFi7WEvtBjuZblZOihmPUMsqUneMVOjQY';
const BEFORE = [0, 5, 10, 15, 30];
const PK = { on: 'dswi.push', last: 'dswi.push.last', dev: 'dswi.dev', key: 'dswi.key' };
const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { } };
const pushSupported = () => STANDALONE && location.protocol === 'https:' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const pushOn = () => pushSupported() && lsGet(PK.on) === '1' && Notification.permission === 'granted';
function devId() {
  let id = lsGet(PK.dev);
  if (!id || !/^[a-z0-9]{8,40}$/.test(id)) { id = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join(''); lsSet(PK.dev, id); }
  return id;
}
// A secret only this phone knows. The server keeps a hash of it, so nobody else can act as this phone.
function devKey() {
  let k = lsGet(PK.key);
  if (!k || !/^[A-Za-z0-9_-]{22,64}$/.test(k)) {
    k = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    lsSet(PK.key, k);
  }
  return k;
}
const keyBytes =s => { const b = atob((s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
async function pushSub(create) {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub && create) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) });
  return sub;
}
const remindable = () => live().filter(h => h.reminder && h.times.length && h.days.length);
async function api(path, body) {
  const r = await fetch(PUSH_API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, id: devId(), key: devKey() }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
  return j;
}
let syncT = null, syncing = null;
function schedSync() { if (!pushOn()) return; clearTimeout(syncT); syncT = setTimeout(() => syncPush().catch(() => { }), 1500); }
async function syncPush(force = false) {
  if (!pushOn()) return null;
  if (syncing) await syncing.catch(() => { });
  syncing = (async () => {
    const sub = await pushSub(true);
    const t = today();
    const body = {
      v: 2, id: devId(), sub: sub.toJSON(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      items: remindable().map(h => ({ id: h.id, name: h.name, identity: h.identity, days: h.days, times: h.times, before: h.before || 0, start: h.start, snooze: h.snooze, snoozeFrom: h.snoozeFrom })),
      done: { date: t, ids: live().filter(h => isDone(h, t)).map(h => h.id) },
    };
    const s = JSON.stringify(body);
    if (!force && lsGet(PK.last) === s) return null;
    const res = await api('/sync', body);
    lsSet(PK.last, s);
    return res;
  })();
  try { return await syncing; } finally { syncing = null; }
}
// Must be called straight from a tap: Android only shows the permission prompt after a user gesture.
async function enablePush({ quiet = false } = {}) {
  if (!pushSupported()) { toast('Open the installed app to turn on reminders'); return false; }
  if (Notification.permission === 'denied') { toast('Notifications are blocked. Allow them in Android settings for this app.'); return false; }
  const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (perm !== 'granted') { toast('No notifications, no reminders. Your call.'); return false; }
  lsSet(PK.on, '1');
  try {
    await syncPush(true);
    if (!quiet) toast('Reminders are on for this phone');
    return true;
  } catch (err) {
    lsSet(PK.on, null);
    toast("Couldn't reach the reminder server. Check your internet and try again.");
    return false;
  }
}
async function disablePush() {
  lsSet(PK.on, null); lsSet(PK.last, null);
  try { const sub = await pushSub(false); if (sub) await sub.unsubscribe(); } catch { }
  try { await api('/remove', { id: devId() }); } catch { }
  toast('Reminders are off');
}
async function testPush() {
  try {
    await syncPush(true);
    const r = await api('/test', { id: devId() });
    toast(r.ok ? 'Sent. It should pop up in a few seconds.' : 'The push service said no (' + r.status + '). Try turning reminders off and on.');
  } catch { toast("Couldn't reach the reminder server"); }
}
function reminderNote(d) {
  if (!d.reminder) return 'No reminder for this habit.';
  if (!d.times.length) return 'Add a habit time above so the reminder knows when to ring.';
  if (!pushSupported()) return 'Reminders work in the installed app.';
  if (Notification.permission === 'denied') return 'Notifications are blocked for this app in Android settings.';
  if (!pushOn()) return 'Reminders are off on this phone. Saving will ask to turn them on.';
  return 'A notification will ring on this phone.';
}

/* ---------- duo: see your partners' progress ---------- */
// Only today's progress on shared habits leaves the phone. Everything else stays here.
// Each link is private to two phones: if you pair with two people, you see both, and each of them sees only you.
const DK = { on: 'dswi.duo', last: 'dswi.duo.last', cache: 'dswi.duo.cache', prefs: 'dswi.duo.prefs', code: 'dswi.duo.code' };
const duoOn = () => lsGet(DK.on) === '1';
const lsJSON = (k, d) => { try { return JSON.parse(lsGet(k) || 'null') ?? d; } catch { return d; } };
const duoPrefs = () => Object.assign({ nudge: true, fin: true }, lsJSON(DK.prefs, {}));
let PARTNERS = (c => Array.isArray(c) ? c : [])(lsJSON(DK.cache, [])), maxPartners = 5;
let joining = false, partnerErr = false, fetchingPartner = false, pollT = null, shareT = null;
function pendingCode() {
  const c = lsJSON(DK.code, null);
  if (!c || !c.code || c.exp < Date.now()) { if (c) lsSet(DK.code, null); return null; }
  return c.code;
}
const fmtCode = c => `${c.slice(0, 3)}-${c.slice(3)}`;
const realName = n => (n && n !== 'Your partner' ? n : '');
const pairedMsg = list => {
  const n = (list || []).map(p => realName(p.name)).filter(Boolean);
  return n.length ? `Paired with ${n.join(' and ')}. Now do some work.` : 'Paired. Now do some work.';
};
function myRows(day = today()) {
  return dayLists(day).sched.filter(h => h.share !== false)
    .map(h => ({ id: h.id, name: h.name, color: h.color, v: val(h, day), goal: h.goal, unit: h.unit, streak: streak(h), done: isDone(h, day) }));
}
function schedShare() { if (!duoOn()) return; clearTimeout(shareT); shareT = setTimeout(() => shareNow().catch(() => { }), 1200); }
async function shareNow(force = false) {
  if (!duoOn()) return null;
  const body = { name: (D.name || '').trim(), date: today(), rows: myRows(), prefs: duoPrefs() };
  const s = JSON.stringify(body);
  if (!force && lsGet(DK.last) === s) return null;
  const r = await api('/share', body);
  lsSet(DK.last, s);
  if (r.linked === false) duoEnded(true);
  return r;
}
function duoEnded(byPartner) {
  const was = duoOn();
  [DK.on, DK.last, DK.cache].forEach(k => lsSet(k, null));
  PARTNERS = [];
  if (was && byPartner) toast('Your Duo ended. Your partner left.');
}
async function fetchPartner() {
  if (fetchingPartner) return;
  fetchingPartner = true;
  try {
    const r = await api('/partner', {});
    partnerErr = false;
    if (r.max) maxPartners = r.max;
    if (r.linked) {
      const list = (Array.isArray(r.partners) ? r.partners : [{ ...r, ref: '' }]).map(p => ({
        ref: p.ref, name: p.name, date: p.date, rows: p.rows || [], updated: p.updated,
        canNudge: p.canNudge, nudgeOff: p.nudgeOff, noPush: p.noPush, at: Date.now(),
      }));
      const first = !duoOn(), before = PARTNERS.map(p => p.ref);
      const added = first ? list : list.filter(p => !before.includes(p.ref));
      const gone = first ? [] : PARTNERS.filter(p => !list.some(q => q.ref === p.ref));
      lsSet(DK.on, '1');
      if (added.length && !joining) lsSet(DK.code, null);
      PARTNERS = list;
      lsSet(DK.cache, JSON.stringify(PARTNERS));
      if (added.length) { toast(pairedMsg(added)); haptic([20, 40, 20]); shareNow(true).catch(() => { }); }
      else if (gone.length) toast(`${realName(gone[0].name) || 'A partner'} left your Duo`);
    } else if (duoOn()) duoEnded(true);
  } catch { partnerErr = true; }
  finally { fetchingPartner = false; }
  paintDuo();
}
function paintDuo() {
  if (UI.tab !== 'duo') return;
  const v = $('#view'), y = v.scrollTop;
  v.innerHTML = duoHTML(true); v.scrollTop = y;
}
// Poll only while the Duo tab is on screen.
function duoPoll() {
  const want = UI.tab === 'duo' && !document.hidden;
  if (want && !pollT) { fetchPartner(); pollT = setInterval(fetchPartner, 8000); }
  else if (!want && pollT) { clearInterval(pollT); pollT = null; }
}
function agoText(ms) {
  if (!ms) return 'not yet';
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}
function duoRowsHTML(rows) {
  return rows.map(r => `<div class="row ${colorCls(r.color)} ${r.done ? 'done' : ''}"><span class="dot"></span>
    <div class="grow"><span class="nm">${esc(r.name)}</span><small>${r.done ? 'Done' : `${fmt(r.v)} / ${fmt(r.goal)} ${esc(unitLbl(r.goal, r.unit))}`}</small></div>
    <span class="dstreak" aria-label="Streak ${r.streak}">${I.bolt}${r.streak}</span>
    <span class="dcheck ${r.done ? 'on' : ''}" aria-label="${r.done ? 'Done' : 'Not done yet'}">${r.done ? I.check : ''}</span></div>`).join('');
}
function duoTile(label, rows, sub, i) {
  const n = rows.length, d = rows.filter(r => r.done).length;
  return `<div class="duo-tile ${n && d === n ? 'all' : ''}" style="--i:${i}">
    <p class="eyebrow">${esc(label)}</p>
    <p class="duo-num">${d}<span>/${n}</span></p>
    <p class="duo-lbl">${n ? (d === n ? 'All done today' : 'done today') : 'Nothing shared today'}</p>
    <div class="segs">${rows.map(r => `<i class="${r.done ? 'on' : ''} ${colorCls(r.color)}"></i>`).join('') || '<i></i>'}</div>
    ${sub ? `<p class="duo-sub">${sub}</p>` : ''}
  </div>`;
}
function inviteCard(code, i) {
  return `<div class="habit norise" style="--i:${i}"><div class="blob duo-blob">
    <div class="duo-mark">${I.duo}</div>
    <p class="eyebrow">Your invite code</p>
    <button class="duo-code" data-act="duoCopy" aria-label="Copy invite code ${fmtCode(code)}">${fmtCode(code)}</button>
    <p class="duo-note">Send this to the person you want to pair with. In their app they open Duo, tap <b>Join with a code</b> and type it in. It works once, for 24 hours.</p>
    <p class="duo-wait"><i></i>Waiting for them to join</p>
  </div></div>`;
}
function duoHTML(still = false) {
  const head = `${topHTML(false)}<div class="pad"><h1 class="page-title">Duo</h1>`;
  const code = pendingCode();
  if (!duoOn()) {
    return `${head}<p class="sub">Pair with up to ${maxPartners} people, one code each. You see how far each of them got today, and each of them sees only you.</p></div>
      <div class="list ${still ? 'still' : ''}" style="gap:18px">
        ${code ? inviteCard(code, 0) : `<div class="habit norise" style="--i:0"><div class="blob duo-blob">
          <div class="duo-mark">${I.duo}</div>
          <h2 class="duo-h">Do the work together.</h2>
          <p class="duo-note">Your habits stay on your phone. A partner only sees today's progress on habits you share, and you see theirs. Partners never see each other.</p>
        </div></div>`}
        <div class="stackbtns duo-btns">
          ${code ? `<button class="btn" data-act="duoCopy">${I.copy}Copy code</button><button class="btn ghost" data-act="duoInvite">Make a new code</button>`
                 : `<button class="btn" data-act="duoInvite">${I.plus}Invite partner</button>`}
          <button class="btn ghost" data-act="duoJoin">Join with a code</button>
        </div>
      </div>`;
  }
  const list = PARTNERS.length ? PARTNERS : [{ ref: '', name: 'Your partner', rows: [], updated: null }];
  const mine = myRows();
  const room = PARTNERS.length < maxPartners;
  const sections = list.map((P, i) => {
    const sub = partnerErr ? `Offline. Last seen ${agoText(P.at)}` : `Updated ${agoText(P.updated)}`;
    const stale = P.date && P.date < addDays(today(), -1) ? `<p class="sec-note">${esc(P.name)} hasn't opened the app since ${fmtDate(P.date)}.</p>` : '';
    const note = P.nudgeOff ? `${esc(P.name)} turned nudges off.` : P.noPush ? `${esc(P.name)} hasn't turned on reminders, so nudges can't reach their phone yet.` : '';
    return `<section class="section" style="--i:${i + 2}"><div class="sec-head">${esc(P.name)}<span class="n">${P.rows.filter(r => r.done).length}/${P.rows.length}</span></div>
      ${stale}${P.rows.length ? duoRowsHTML(P.rows) : `<p class="sec-note">Nothing shared for today yet.</p>`}
      <p class="duo-sub" style="margin:8px 0 0">${sub}</p>
      <button class="btn duo-nudge" data-act="duoNudge" data-v="${esc(P.ref || '')}" ${P.canNudge === false ? 'disabled' : ''}>${I.bolt}Nudge ${esc(P.name)}</button>
      ${note ? `<p class="small-note" style="text-align:center">${note}</p>` : ''}</section>`;
  }).join('');
  const n = list.length;
  return `${head}${n > 1 ? `<p class="sub">${n} partners. Each of them sees only you.</p>` : ''}</div>
    <div class="duo-sum ${n > 1 ? 'many' : ''} ${n % 2 === 0 ? 'odd' : ''} ${still ? 'still' : ''}">${duoTile('You', mine, '', 0)}${list.map((P, i) => duoTile(P.name, P.rows, '', i + 1)).join('')}</div>
    <div class="list ${still ? 'still' : ''}" style="gap:14px;padding-top:18px">
      ${sections}
      <section class="section" style="--i:${n + 2}"><div class="sec-head">You<span class="n">${mine.filter(r => r.done).length}/${mine.length}</span></div>
        ${mine.length ? duoRowsHTML(mine) : `<p class="sec-note">No shared habits scheduled today. Turn on <b>Share with partner</b> in a habit's settings.</p>`}</section>
      ${room && code ? inviteCard(code, n + 3) : ''}
      ${room ? `<div class="stackbtns duo-btns">
        ${code ? `<button class="btn" data-act="duoCopy">${I.copy}Copy code</button><button class="btn ghost" data-act="duoInvite">Make a new code</button>`
               : `<button class="btn ghost" data-act="duoInvite">${I.plus}Invite another partner</button>`}
        <button class="btn ghost" data-act="duoJoin">Join with a code</button></div>`
        : `<p class="small-note" style="text-align:center">You have ${maxPartners} partners, the most allowed.</p>`}
      <button class="link" data-act="duoSettings">Duo settings</button>
    </div>`;
}
async function duoInvite() {
  try {
    const r = await api('/invite', {});
    lsSet(DK.code, JSON.stringify({ code: r.code, exp: Date.now() + r.expiresIn * 1000 }));
    haptic(8); paintDuo();
  } catch (e) { toast(e.message && !/^HTTP/.test(e.message) ? cap(e.message) : "Couldn't reach the server. Check your internet."); fetchPartner(); }
}
function duoCopy() {
  const c = pendingCode(); if (!c) return;
  const txt = fmtCode(c);
  try { navigator.clipboard.writeText(txt).then(() => toast('Code copied. Send it to your partner.'), () => toast(`Your code is ${txt}`)); } catch { toast(`Your code is ${txt}`); }
}
function duoJoin() {
  sheet({
    title: 'Join a Duo',
    body: `<p class="muted" style="margin:0 0 14px">Type the 6-letter code the other person sent you.</p>
      <input class="field duo-input" id="dcode" maxlength="7" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC-DEF" aria-label="Invite code">
      ${D.name ? '' : `<input class="field" id="dname" maxlength="40" placeholder="Your name (your partners see this)" aria-label="Your name" style="margin-top:10px">`}`,
    foot: `<button class="btn" data-a="go">Join</button>`,
    mount: L => setTimeout(() => { try { L.el.querySelector('#dcode').focus(); } catch { } }, 350),
    acts: {
      go: async (a, e, L) => {
        const code = L.el.querySelector('#dcode').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (code.length !== 6) { toast('The code has 6 letters and numbers'); return; }
        const nm = L.el.querySelector('#dname');
        if (nm && nm.value.trim()) { D.name = nm.value.trim().slice(0, 40); save(); }
        a.disabled = true;
        try {
          await api('/join', { code, name: (D.name || '').trim() });
          lsSet(DK.on, '1'); closeLayer(L);
          await shareNow(true).catch(() => { });
          joining = true; await fetchPartner().finally(() => { joining = false; }); // toasts "Paired with ..." for the new partner
        } catch (err) { a.disabled = false; toast(err.message && !/^HTTP/.test(err.message) ? cap(err.message) : "Couldn't reach the server"); }
      },
    },
  });
}
async function duoNudge(a) {
  const P = PARTNERS.find(p => (p.ref || '') === (a.dataset.v || '')) || PARTNERS[0];
  if (!P) return;
  a.disabled = true;
  try {
    const r = await api('/nudge', P.ref ? { partner: P.ref } : {});
    if (r.sent) { toast(`Nudged ${P.name}`); haptic([10, 30, 10]); }
    else toast(r.reason === 'off' ? `${P.name} turned nudges off` : r.reason === 'no-push' ? `${P.name} hasn't turned on reminders yet` : "The nudge didn't go through. Try again.");
  } catch { toast("Couldn't reach the server"); }
  a.disabled = false;
}
function duoSettings() {
  const p = duoPrefs(), many = PARTNERS.length > 1, nm = PARTNERS.length === 1 ? esc(PARTNERS[0].name) : 'a partner';
  const armed = new Set();
  const sw = (k, on, t, s) => `<div class="row" style="padding:14px 0"><div class="grow"><span style="font-weight:600">${t}</span><small>${s}</small></div><button class="switch ${on ? 'on' : ''}" data-a="pref" data-v="${k}" role="switch" aria-checked="${on}" aria-label="${t}"></button></div>`;
  const leaveRows = PARTNERS.map(P => `<div class="row" style="padding:10px 0"><div class="grow"><span style="font-weight:600">${esc(P.name)}</span></div>
    <button class="btn danger-ghost duo-leave" data-a="leave" data-v="${esc(P.ref || '')}" data-n="${esc(P.name)}">Leave</button></div>`).join('');
  sheet({
    title: 'Duo settings',
    body: `${sw('nudge', p.nudge, 'Nudges', `Let ${many ? 'your partners' : nm} nudge you with a notification.`)}
      ${sw('fin', p.fin, 'Finished alerts', `Tell you when ${nm} finishes everything for the day.`)}
      <p class="small-note">Both need reminders turned on in your profile to reach this phone.</p>
      <p class="sec-label">Leave</p>
      <p class="muted" style="margin:0 0 6px">Leaving ends the Duo with that person and wipes what you shared with each other from the server. Your own habits are not touched.</p>
      ${leaveRows || `<button class="btn danger-ghost" data-a="leave" data-v="">Leave Duo</button>`}
      ${many ? `<button class="btn danger-ghost" data-a="leave" data-v="*" style="margin-top:12px">Leave all</button>` : ''}`,
    acts: {
      pref: a => {
        const k = a.dataset.v, cur = duoPrefs(); cur[k] = !cur[k];
        lsSet(DK.prefs, JSON.stringify(cur));
        a.classList.toggle('on', cur[k]); a.setAttribute('aria-checked', cur[k]); haptic(4);
        shareNow(true).catch(() => toast("Couldn't reach the server. It'll update next time."));
      },
      leave: async (a, e, L) => {
        const ref = a.dataset.v, all = ref === '*' || !ref || PARTNERS.length <= 1;
        if (!armed.has(ref)) { armed.add(ref); a.textContent = ref === '*' ? 'Tap again to leave everyone' : 'Tap again'; a.classList.replace('danger-ghost', 'danger'); return; }
        a.disabled = true;
        try {
          await api('/leave', all ? {} : { partner: ref });
          closeLayer(L);
          if (all) { duoEnded(false); toast('You left the Duo'); paintDuo(); }
          else {
            PARTNERS = PARTNERS.filter(x => x.ref !== ref); lsSet(DK.cache, JSON.stringify(PARTNERS));
            toast(`You left the Duo with ${a.dataset.n}`); paintDuo(); fetchPartner();
          }
        } catch { a.disabled = false; toast("Couldn't reach the server. Try again."); }
      },
    },
  });
}
// One place for the colors: CSS variables and the SVG gradients for the flame icon are made from PALETTE.
(function installPalette() {
  const css = PALETTE.map(([id, a, b, on]) => `.c-${id}{--c1:${a};--c2:${b};--on:${on === 'w' ? '#fff' : 'var(--ink)'}}`).join('');
  const st = document.createElement('style'); st.id = 'palette'; st.textContent = css; document.head.appendChild(st);
  const defs = document.querySelector('#app svg defs');
  if (defs) defs.insertAdjacentHTML('beforeend', PALETTE.map(([id, a, b]) => `<linearGradient id="g-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join(''));
})();
function nextColor() {
  const used = new Set(D.habits.filter(h => !h.fame).map(h => h.color));
  return COLORS.find(c => !used.has(c)) || COLORS[D.habits.length % COLORS.length];
}
let D = load();
const UI = { tab: 'home', day: today(), seg: 'progress' };

const H = id => D.habits.find(h => h.id === id);
const live = () => D.habits.filter(h => !h.fame);
const val = (h, d) => (D.logs[h.id] || {})[d] || 0;
const isDone = (h, d) => val(h, d) >= h.goal;
const scheduled = (h, d) => h.days.includes(parse(d).getDay());
const snoozed = (h, d) => !!h.snooze && d >= (h.snoozeFrom || '0000') && (h.snooze === 'forever' || d < h.snooze);
function setVal(h, d, v) {
  D.logs[h.id] = D.logs[h.id] || {};
  if (v <= 0) delete D.logs[h.id][d]; else D.logs[h.id][d] = Math.round(v * 100) / 100;
  save();
}
const reps = h => { const L = D.logs[h.id] || {}; return Object.keys(L).filter(k => L[k] >= h.goal).length; };
function streak(h, upto = today()) {
  let n = 0;
  for (let d = upto, i = 0; d >= h.start && i < 2000; d = addDays(d, -1), i++) {
    if (isDone(h, d)) { n++; continue; }
    if (!scheduled(h, d) || snoozed(h, d) || d === upto) continue;
    break;
  }
  return n;
}
function bestStreak(h) {
  let b = 0, c = 0; const t = today();
  for (let d = h.start, i = 0; d <= t && i < 2000; d = addDays(d, 1), i++) {
    if (isDone(h, d)) { c++; b = Math.max(b, c); } else if (scheduled(h, d) && !snoozed(h, d) && d !== t) c = 0;
  }
  return b;
}
function rate(h) {
  let s = 0, c = 0; const t = today();
  for (let d = h.start, i = 0; d <= t && i < 2000; d = addDays(d, 1), i++) {
    if (!scheduled(h, d) || snoozed(h, d)) continue;
    if (d === t && !isDone(h, d)) continue;
    s++; if (isDone(h, d)) c++;
  }
  return s ? Math.round((c / s) * 100) : 0;
}
function daysLabel(days) {
  const s = [...days].sort().join('');
  if (days.length === 7) return 'Daily';
  if (s === '12345') return 'Weekdays';
  if (s === '06') return 'Weekends';
  if (!days.length) return 'Choose at least 1 day';
  return `${days.length}x / week`;
}
function schedText(h) {
  const dl = daysLabel(h.days);
  const which = h.days.length < 7 && !['Weekdays', 'Weekends'].includes(dl) ? ` (${ORDER.filter(x => h.days.includes(x)).map(x => DOW[x]).join(', ')})` : '';
  return `${dl}${which}${h.times.length ? ' at ' + h.times.join(', ') : ''}`;
}

/* ---------- layers (sheets, flows, menus) ---------- */
const layers = [];
let suppressPop = 0;
function pushLayer(el, onClose) {
  $('#layers').append(el);
  const L = { el, onClose, closed: false };
  layers.push(L);
  if (STANDALONE) { try { history.pushState({ layer: layers.length }, ''); } catch { } }
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  return L;
}
function closeLayer(L, fromPop) {
  if (!L || L.closed) return;
  L.closed = true;
  layers.splice(layers.indexOf(L), 1);
  L.el.classList.remove('in'); L.el.classList.add('out');
  setTimeout(() => L.el.remove(), 420);
  if (L.onClose) L.onClose();
  if (STANDALONE && !fromPop) { suppressPop++; try { history.back(); } catch { suppressPop--; } }
}
const closeTop = () => closeLayer(layers[layers.length - 1]);
window.addEventListener('popstate', () => {
  if (suppressPop > 0) { suppressPop--; return; }
  const L = layers[layers.length - 1];
  if (L) closeLayer(L, true);
});
function wire(L, acts) {
  L.el.addEventListener('click', e => {
    const c = e.target.closest('[data-close]');
    if (c && L.el.contains(c)) { closeLayer(L); return; }
    const a = e.target.closest('[data-a]');
    if (a && acts[a.dataset.a]) acts[a.dataset.a](a, e, L);
  });
}
function dragClose(L, sh) {
  let y0 = null, dy = 0, id = null;
  sh.addEventListener('pointerdown', e => {
    if (!e.target.closest('.grab,.sh-head') || e.target.closest('button')) return;
    y0 = e.clientY; id = e.pointerId; sh.style.transition = 'none'; sh.setPointerCapture(id);
  });
  sh.addEventListener('pointermove', e => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)`; });
  const end = () => {
    if (y0 === null) return;
    y0 = null; sh.style.transition = ''; sh.style.transform = '';
    if (dy > 90) closeLayer(L);
    dy = 0;
  };
  sh.addEventListener('pointerup', end); sh.addEventListener('pointercancel', end);
}
function sheet({ title = '', body = '', foot = '', tall = false, acts = {}, mount, onClose }) {
  const el = document.createElement('div');
  el.className = 'layer';
  el.innerHTML = `<div class="scrim" data-close></div>
    <section class="sheet ${tall ? 'tall' : ''}" role="dialog" aria-modal="true" ${title ? `aria-label="${esc(title)}"` : ''}>
      <div class="grab"></div>
      ${title ? `<header class="sh-head"><h2>${title}</h2><button class="iconbtn" data-close aria-label="Close">${I.close}</button></header>` : ''}
      <div class="sheet-body">${body}</div>
      ${foot ? `<div class="sheet-foot">${foot}</div>` : ''}
    </section>`;
  const L = pushLayer(el, onClose);
  L.body = el.querySelector('.sheet-body');
  wire(L, acts);
  dragClose(L, el.querySelector('.sheet'));
  if (mount) mount(L);
  return L;
}
const after = (L, fn) => { closeLayer(L); setTimeout(fn, 160); };

let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- render: shell ---------- */
function render(opts = {}) {
  const v = $('#view');
  if (UI.tab === 'home') v.innerHTML = homeHTML(opts);
  else if (UI.tab === 'progress') v.innerHTML = progressHTML();
  else if (UI.tab === 'duo') v.innerHTML = duoHTML(!!opts.still);
  else v.innerHTML = focusHTML();
  duoPoll();
  document.querySelectorAll('.tab').forEach(t => {
    const on = t.dataset.v === UI.tab;
    t.classList.toggle('on', on); t.setAttribute('aria-current', on ? 'page' : 'false');
  });
  paintFocusPill();
}
function go(tab) {
  if (tab === UI.tab) { $('#view').scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const doit = () => { UI.tab = tab; render(); $('#view').scrollTop = 0; };
  if (document.startViewTransition && !reduce && !document.hidden) {
    const vt = document.startViewTransition(doit);
    vt.ready.catch(() => { }); vt.finished.catch(() => { });
  } else doit();
  haptic(6);
}
function topHTML(withDays) {
  const initial = (D.name || 'Y').trim().charAt(0).toUpperCase() || 'Y';
  return `<header class="top">
    <div class="bar">
      <button class="avatar" data-act="profile" aria-label="Your profile and backup"><span>${esc(initial)}</span></button>
      ${UI.tab === 'home' ? `<button class="btn-pill" data-act="plus">${I.plus}Habits</button>` : ''}
    </div>
    ${withDays ? daysHTML() : ''}
  </header>`;
}
function daysHTML() {
  const t = today();
  let out = '';
  for (let k = 6; k >= 0; k--) {
    const d = addDays(t, -k);
    const sch = live().filter(h => d >= h.start && scheduled(h, d) && !snoozed(h, d));
    const full = sch.length && sch.every(h => isDone(h, d));
    out += `<button class="day ${d === UI.day ? 'on' : ''} ${full ? 'alldone' : ''}" data-act="day" data-v="${d}" aria-pressed="${d === UI.day}">
      <span>${d === t ? 'Today' : DOW[parse(d).getDay()]}</span><b>${pad(parse(d).getDate())}</b><i></i></button>`;
  }
  return `<nav class="days" aria-label="Pick a day">${out}</nav>`;
}

/* ---------- render: home ---------- */
function dayLists(day) {
  const act = live().filter(h => day >= h.start);
  const sn = act.filter(h => snoozed(h, day));
  const rest = act.filter(h => !snoozed(h, day));
  return { sched: rest.filter(h => scheduled(h, day)), unsched: rest.filter(h => !scheduled(h, day)), snz: sn };
}
const firstTime = h => h.times[0] || '99:99';
function headlineHTML() {
  const day = UI.day, t = today();
  const { sched } = dayLists(day);
  const n = sched.length, done = sched.filter(h => isDone(h, day)).length;
  const d = parse(day);
  const eyebrow = `${day === t ? 'Today · ' : ''}${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
  let line;
  if (!n) line = day === t ? 'Nothing scheduled. Rest, or do it anyway.' : 'Nothing was scheduled that day.';
  else if (day !== t) line = done === n ? 'You did the work that day.' : `${done} of ${n} done that day.`;
  else if (!done) line = 'Do some work, idiot.';
  else if (done < n) line = `${n - done} to go. Keep moving.`;
  else line = 'Fine. You did the work.';
  const segs = sched.map(h => `<i class="c-${h.color} ${isDone(h, day) ? 'on' : ''}"></i>`).join('');
  return `<section class="headline" id="hl">
    <div class="headline-row"><p class="eyebrow">${eyebrow}</p><button class="qbtn" data-act="help" aria-label="How this works">${I.help}</button></div>
    <h1 class="hl">${line}</h1>
    ${n ? `<div class="segs" aria-label="${done} of ${n} done">${segs}</div>` : ''}
  </section>`;
}
function cardHTML(h, day, i, fx = '', o = null) {
  const v = val(h, day), done = v >= h.goal, st = streak(h);
  const stepper = COUNTABLE.has(h.unit) && h.goal <= 20;
  const origin = o ? `--ox:${o.x}%;--oy:${o.y}%;` : '';
  const pill = done ? '' : stepper
    ? `<div class="pill"><button class="r" data-act="dec" data-id="${h.id}" aria-label="Minus one">${I.minus}</button>
         <span class="v">${fmt(v)} <small>${esc(unitLbl(v, h.unit))}</small></span>
         <button class="r plus" data-act="inc" data-id="${h.id}" aria-label="Plus one">${I.plus}</button></div>`
    : `<button class="pill kp" data-act="kp" data-id="${h.id}" aria-label="Enter amount"><span class="v">${fmt(v)} <small>${esc(h.unit)}</small></span><span class="r">${I.keypad}</span></button>`;
  return `<article class="habit c-${h.color} ${done ? 'done' : ''} ${fx}" data-hid="${h.id}" style="--i:${i};${origin}">
    <div class="badge" aria-label="Streak ${st}">${I.bolt}<span>${st}</span></div>
    <div class="blob" style="--p:${Math.min(1, v / h.goal)}">
      <div class="lvl"></div><div class="fill"></div>
      <button class="more" data-act="more" data-id="${h.id}" aria-label="Habit actions">${I.dots}</button>
      <h3 class="h-title"><span>${esc(h.name)}</span></h3>
      <p class="h-goal">${fmt(h.goal)} ${esc(unitLbl(h.goal, h.unit))}/day</p>
      <p class="h-eye">I want to become</p>
      <p class="h-id">${esc(cap(h.identity))}</p>
      ${done ? `<button class="undo" data-act="undo" data-id="${h.id}" aria-label="Undo">${I.undo}</button>` : ''}
    </div>
    ${pill}
  </article>`;
}
function homeHTML(opts) {
  if (!D.habits.length) {
    return `${topHTML(false)}
      <div class="empty">
        <div class="blob">
          <div class="bolt-tile">${I.boltBig}</div>
          <h2>Do some work, idiot.</h2>
          <p>Start with one small habit. Two minutes is enough.</p>
        </div>
        <button class="btn-pill" data-act="newHabit" style="margin-top:-26px;position:relative;height:52px;padding:0 24px 0 16px">${I.plus}Create your first habit</button>
        <button class="link" data-act="sample">or load sample habits to look around</button>
      </div>`;
  }
  const day = UI.day;
  const { sched, unsched, snz } = dayLists(day);
  const used = new Set();
  const blocks = [];
  for (const s of D.stacks) {
    const hs = s.ids.map(H).filter(h => h && sched.includes(h));
    if (hs.length >= 2) { hs.forEach(h => used.add(h.id)); blocks.push({ s, hs }); }
  }
  const singles = sched.filter(h => !used.has(h.id)).sort((a, b) => firstTime(a).localeCompare(firstTime(b)) || a.created - b.created);
  let i = 0, html = '';
  for (const b of blocks) {
    html += `<div class="stack"><button class="stack-head" data-act="stackOpen" data-id="${b.s.id}">${I.chain}<b>${esc(b.s.name)}</b> · ${b.hs.length} habits</button>
      ${b.hs.map((h, k) => (k ? '<div class="then">then</div>' : '') + cardHTML(h, day, i++)).join('')}</div>`;
  }
  html += singles.map(h => cardHTML(h, day, i++)).join('');
  if (!sched.length) {
    html += `<div class="habit" style="--i:0"><div class="blob"><div class="bolt-tile">${I.boltBig}</div>
      <p class="h-title" style="margin-top:16px;font-size:26px">You don't have any scheduled habits ${day === today() ? 'today' : 'this day'}</p></div></div>`;
  }
  if (unsched.length) {
    html += `<section class="section" style="--i:${i++}">
      <div class="sec-head">${I.clock}Unscheduled<span class="n">${unsched.length}</span></div>
      <p class="sec-note">Log these any day. Skipping them never breaks a streak.</p>
      ${unsched.map(h => {
        const done = isDone(h, day);
        return `<div class="row c-${h.color} ${done ? 'done' : ''}"><span class="dot"></span>
          <div class="grow"><small>${daysLabel(h.days)} · ${ORDER.filter(x => h.days.includes(x)).map(x => DOW[x]).join(' ')}</small><span class="nm">${esc(h.name)}</span></div>
          ${done ? `<button class="mini icon" data-act="undo" data-id="${h.id}" aria-label="Undo">${I.undo}</button>`
                 : `<button class="mini icon" data-act="${COUNTABLE.has(h.unit) && h.goal <= 20 ? 'inc' : 'kp'}" data-id="${h.id}" aria-label="Log">${I.plus}</button>`}
          <button class="mini icon" data-act="more" data-id="${h.id}" aria-label="Habit actions">${I.dots}</button></div>`;
      }).join('')}
    </section>`;
  }
  if (snz.length && day === today()) {
    html += `<section class="section" style="--i:${i++}">
      <div class="sec-head">${I.snooze}Snoozed<span class="n">${snz.length}</span></div>
      ${snz.map(h => `<div class="row c-${h.color}"><span class="dot"></span><div class="grow"><small>${h.snooze === 'forever' ? 'Until you turn it back on' : 'Back on ' + fmtDate(h.snooze)}</small><span class="nm">${esc(h.name)}</span></div>
        <button class="mini" data-act="resume" data-id="${h.id}">Resume</button></div>`).join('')}
    </section>`;
  }
  return `${topHTML(true)}${headlineHTML()}<div class="list ${opts.still ? 'still' : ''}">${html}</div>`;
}

/* ---------- logging ---------- */
function originOf(btn, h) {
  const blob = $(`.habit[data-hid="${h.id}"] .blob`);
  if (!btn || !blob) return null;
  const b = btn.getBoundingClientRect(), r = blob.getBoundingClientRect();
  return { x: Math.round(((b.left + b.width / 2 - r.left) / r.width) * 100), y: Math.round(((b.top + b.height / 2 - r.top) / r.height) * 100) };
}
function logTo(h, nv, btn, held = null) {
  const day = UI.day;
  if (day < h.start) { toast("Can't log before this habit's start date"); return; }
  const was = isDone(h, day), r0 = reps(h);
  const o = held ? held.o : originOf(btn, h);
  const rect = held ? held.rect : btn ? btn.getBoundingClientRect() : null;
  setVal(h, day, Math.max(0, nv));
  const now = isDone(h, day);
  const fx = now && !was ? (held ? 'just-held norise' : 'just-done norise') : !now && was ? 'just-undone norise' : 'norise';
  const el = $(`.habit[data-hid="${h.id}"]`);
  if (el) {
    const tmp = document.createElement('div');
    tmp.innerHTML = cardHTML(h, day, 0, fx, o || { x: 50, y: 100 });
    el.replaceWith(tmp.firstElementChild);
    const hl = $('#hl'); if (hl) hl.outerHTML = headlineHTML();
    const days = $('.days'); if (days) days.outerHTML = daysHTML();
  } else render({ still: true });
  if (now && !was) {
    haptic([12, 50, 20]);
    if (rect) burst(rect, h.color);
    const r1 = reps(h), m = MILESTONES.find(x => x > r0 && x <= r1);
    if (m || held) setTimeout(() => celebrate(h, m || null), held ? 420 : 950);
  } else haptic(8);
}

/* ---------- press and hold a card to complete it ---------- */
let HOLD = null;
const HOLD_MS = 650;
function holdStart(e) {
  if ((e.button && e.button !== 0) || layers.length || HOLD) return;
  const blob = e.target.closest('.habit[data-hid] .blob');
  if (!blob || e.target.closest('button')) return;
  const card = blob.closest('.habit'), h = H(card.dataset.hid);
  if (!h || UI.day < h.start) return;
  const r = blob.getBoundingClientRect();
  const o = { x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) };
  HOLD = { h, card, x0: e.clientX, y0: e.clientY, o, rect: { left: e.clientX - 12, top: e.clientY - 12, width: 24, height: 24 }, t: 0 };
  if (isDone(h, UI.day)) {
    // Already done: holding opens the completion page again.
    HOLD.t = setTimeout(() => { const x = HOLD; holdEnd(); haptic(10); celebrate(x.h, null); }, 420);
    return;
  }
  card.style.setProperty('--ox', o.x + '%'); card.style.setProperty('--oy', o.y + '%');
  card.classList.add('holding'); haptic(5);
  HOLD.t = setTimeout(() => {
    const x = HOLD; HOLD = null; x.card.classList.remove('holding');
    logTo(x.h, Math.max(val(x.h, UI.day), x.h.goal), null, x);
  }, HOLD_MS);
}
function holdEnd() { if (!HOLD) return; clearTimeout(HOLD.t); HOLD.card.classList.remove('holding'); HOLD = null; }
function burst(rect, color, n = 16, gold = false) {
  if (reduce) return;
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  for (let k = 0; k < n; k++) {
    const p = document.createElement('i');
    p.className = `spark c-${color} ${gold ? 'gold' : ''}`;
    p.style.left = cx + 'px'; p.style.top = cy + 'px';
    const s = 4 + Math.random() * 7; p.style.width = p.style.height = s + 'px';
    document.body.append(p);
    const a = Math.random() * Math.PI * 2, dist = 50 + Math.random() * (gold ? 160 : 80);
    p.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist}px)) scale(.2)`, opacity: 0 },
    ], { duration: 650 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => p.remove();
  }
}

/* ---------- keypad ---------- */
function keypad(h) {
  const day = UI.day;
  if (day < h.start) { toast("Can't log before this habit's start date"); return; }
  let s = val(h, day) ? fmt(val(h, day)) : '';
  const disp = () => `<b>${esc(s || '0')}</b><span>${esc(h.unit)} · goal ${fmt(h.goal)}</span>`;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  const btnRef = $(`.habit[data-hid="${h.id}"] .pill`);
  sheet({
    title: esc(h.name),
    body: `<div class="kp-display" id="kpd">${disp()}</div><div class="keys">${keys.map(k => `<button data-a="k" data-v="${k}" aria-label="${k === '⌫' ? 'Delete' : k}">${k}</button>`).join('')}</div>`,
    foot: `<button class="btn" data-a="save">Save</button><button class="btn ghost" data-a="fill">Fill the goal (${fmt(h.goal)} ${esc(h.unit)})</button>`,
    acts: {
      k: a => {
        const k = a.dataset.v;
        if (k === '⌫') s = s.slice(0, -1);
        else if (k === '.' && s.includes('.')) return;
        else if (s.length < 7) s = (s === '0' && k !== '.') ? k : s + k;
        $('#kpd').innerHTML = disp(); haptic(4);
      },
      save: (a, e, L) => { closeLayer(L); logTo(h, parseFloat(s) || 0, btnRef); },
      fill: (a, e, L) => { closeLayer(L); logTo(h, h.goal, btnRef); },
    },
  });
}

/* ---------- celebration ---------- */
function medalSVG(n) {
  return `<svg class="medal" viewBox="0 0 220 220" aria-hidden="true">
    <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,226,154,.12)" stroke-width="4"/>
    <circle class="ring" cx="110" cy="110" r="100" stroke="url(#g-gold)" pathLength="1" transform="rotate(-90 110 110)"/>
    <polygon points="172,110 141,56.3 79,56.3 48,110 79,163.7 141,163.7" fill="url(#g-gold)" stroke="url(#g-gold)" stroke-width="22" stroke-linejoin="round"/>
    <text x="110" y="${n >= 100 ? 124 : 130}" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="${n >= 1000 ? 40 : n >= 100 ? 50 : 64}" fill="#3a2205">${n}</text>
  </svg>`;
}
// m = milestone just reached, or null for a plain "habit completed" page.
function celebrate(h, m) {
  const t = today();
  const week = Array.from({ length: 7 }, (_, k) => addDays(t, k - 6));
  const r = reps(h), next = MILESTONES.find(x => x > r);
  const el = document.createElement('div');
  el.className = 'layer';
  el.innerHTML = `<div class="celebrate" role="dialog" aria-modal="true" aria-label="${m ? 'Milestone reached' : 'Habit completed'}">
    <p class="c-top">Habit completed</p>
    ${medalSVG(m || r)}
    <h2 class="c-title">${m ? (MTITLE[m] || `${m} repetitions!`) : 'Another vote cast.'}</h2>
    <p class="c-sub">${m ? `You earned the <b>${m} rep milestone</b> for ${esc(h.name)}.`
      : `${esc(h.name)}: <b>${r} rep${r === 1 ? '' : 's'}</b> so far.${next ? ` ${next - r} more to the ${next} rep milestone.` : ''}`}</p>
    <div class="week">${week.map(d => `<div class="wd ${isDone(h, d) ? 'on' : ''} ${d === t ? 'now' : ''}"><i>${isDone(h, d) ? I.check : ''}</i><span>${DOW[parse(d).getDay()]}</span></div>`).join('')}</div>
    <div class="c-actions"><button class="btn" data-a="details">View habit details</button><button class="btn ghost" data-close>Back to home</button></div>
  </div>`;
  const L = pushLayer(el);
  wire(L, { details: (a, e, L2) => after(L2, () => detailsSheet(h.id)) });
  haptic(m ? [30, 60, 30, 60, 80] : [20, 40, 30]);
  setTimeout(() => { const md = el.querySelector('.medal'); if (md) burst(md.getBoundingClientRect(), 'honey', m ? 34 : 18, true); }, 650);
}

/* ---------- habit actions ---------- */
function habitActions(id) {
  const h = H(id); if (!h) return;
  sheet({
    title: 'Habit actions',
    body: `<div class="acts">
      <button data-a="details">${I.eye}Habit details</button>
      <button data-a="snooze">${I.snooze}Snooze habit</button>
      <button data-a="fame">${I.star}Move to Hall of Fame</button>
      <button data-a="edit">${I.edit}Edit</button>
      <button data-a="del" class="danger">${I.trash}Delete</button></div>`,
    acts: {
      details: (a, e, L) => after(L, () => detailsSheet(id)),
      snooze: (a, e, L) => after(L, () => snoozeSheet(id)),
      fame: (a, e, L) => after(L, () => fameSheet(id)),
      edit: (a, e, L) => after(L, () => openFlow('edit', id)),
      del: (a, e, L) => after(L, () => deleteSheet(id)),
    },
  });
}
function snoozeSheet(id) {
  const h = H(id); let pick = null;
  const opts = [['tomorrow', 'Snooze until tomorrow'], ['week', 'Snooze for a week'], ['month', 'Snooze for a month'], ['forever', 'Snooze until I turn it off']];
  sheet({
    body: `<div class="center" style="padding:6px 0 18px"><span class="mico" style="background:var(--surface-3);width:52px;height:52px">${I.snooze}</span>
      <h2 class="serif-h">Snooze your habit</h2><p class="muted" style="margin:0;max-width:32ch">Take a break and pick it back up when you're ready. Snoozed days never break your streak.</p></div>
      ${opts.map(([k, l]) => `<button class="opt" data-a="pick" data-v="${k}">${l}<i></i></button>`).join('')}`,
    foot: `<button class="btn" data-a="ok" disabled>Confirm</button><button class="btn ghost" data-close>Cancel</button>`,
    acts: {
      pick: (a, e, L) => { pick = a.dataset.v; L.el.querySelectorAll('.opt').forEach(o => o.classList.toggle('on', o === a)); L.el.querySelector('[data-a=ok]').disabled = false; haptic(5); },
      ok: (a, e, L) => {
        const t = today();
        h.snoozeFrom = t;
        h.snooze = pick === 'forever' ? 'forever' : addDays(t, pick === 'tomorrow' ? 1 : pick === 'week' ? 7 : 30);
        save(); closeLayer(L); render({ still: true });
        toast(h.snooze === 'forever' ? 'Snoozed until you turn it back on' : `Snoozed. Back on ${fmtDate(h.snooze)}`);
      },
    },
  });
}
function fameSheet(id) {
  const h = H(id);
  sheet({
    body: `<div class="center" style="padding:6px 0 4px">
      <span class="mico" style="width:56px;height:56px;background:linear-gradient(155deg,var(--gold1),var(--gold2));color:var(--ink)">${I.star}</span>
      <h2 class="serif-h">Ready to add this habit to the Hall of Fame?</h2>
      <p class="muted" style="margin:0;max-width:34ch">The Hall of Fame is for habits that are part of you now. They stop showing up each day, which leaves room for new ones.</p>
      <div class="ycard c-${h.color}" style="width:100%;min-height:0;margin-top:8px;text-align:center">
        <span class="nm">${esc(h.name)}</span><p>I want to become ${esc(h.identity)}</p>
        <div class="row-sb" style="justify-content:space-around"><div><small>Repetitions</small><br><b style="font-size:22px">${reps(h)}</b></div><div><small>Best streak</small><br><b style="font-size:22px">${bestStreak(h)}</b></div></div>
      </div></div>`,
    foot: `<button class="btn" data-a="ok">Move to Hall of Fame</button><button class="btn ghost" data-close>Cancel</button>`,
    acts: {
      ok: (a, e, L) => {
        h.fame = true; h.fameDate = today();
        D.stacks.forEach(s => { s.ids = s.ids.filter(x => x !== id); });
        D.stacks = D.stacks.filter(s => s.ids.length >= 2);
        save(); closeLayer(L); render({ still: true }); toast('Moved to the Hall of Fame');
      },
    },
  });
}
function deleteSheet(id) {
  const h = H(id);
  const cue = D.stacks.find(s => s.ids[0] === id);
  sheet({
    body: `<div class="center" style="padding:6px 0 4px"><span class="mico" style="width:52px;height:52px;background:var(--surface-3);color:var(--danger)">${I.trash}</span>
      <h2 class="serif-h">Delete “${esc(h.name)}” for good?</h2>
      <p class="muted" style="margin:0;max-width:34ch">All of its history goes with it. This can't be undone.${cue ? ` It's the cue habit of “${esc(cue.name)}”, so the next habit in that stack becomes the new cue.` : ''}</p></div>`,
    foot: `<button class="btn danger" data-a="ok">Delete habit</button><button class="btn ghost" data-close>Cancel</button>`,
    acts: {
      ok: (a, e, L) => {
        D.habits = D.habits.filter(x => x.id !== id); delete D.logs[id];
        D.stacks.forEach(s => { s.ids = s.ids.filter(x => x !== id); });
        D.stacks = D.stacks.filter(s => s.ids.length >= 2);
        if (D.focus.hid === id) D.focus.hid = null;
        save(); closeLayer(L); render({ still: true }); toast('Habit deleted');
      },
    },
  });
}

/* ---------- details ---------- */
function heatmapHTML(h, editing) {
  const t = today(), now = parse(t);
  let html = `<div class="mrow"><div class="wlabels">${ORDER.map(x => `<span>${DOW1[x]}</span>`).join('')}</div>`;
  for (let k = 2; k >= 0; k--) {
    const m0 = new Date(now.getFullYear(), now.getMonth() - k, 1);
    if (ymd(new Date(m0.getFullYear(), m0.getMonth() + 1, 0)) < h.start) continue;
    const days = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
    const off = (m0.getDay() + 6) % 7;
    let cells = '<span class="cell gap"></span>'.repeat(off);
    for (let d = 1; d <= days; d++) {
      const s = ymd(new Date(m0.getFullYear(), m0.getMonth(), d));
      const v = val(h, s);
      const cls = s > t ? 'fut' : s < h.start ? 'pre' : v >= h.goal ? 'done' : v > 0 ? 'part' : (!scheduled(h, s) || snoozed(h, s)) ? 'off' : '';
      cells += `<button class="cell ${cls} ${s === t ? 'today' : ''}" ${editing ? `data-a="cell" data-v="${s}"` : 'tabindex="-1"'} aria-label="${fmtDate(s)}${v >= h.goal ? ', done' : ''}"></button>`;
    }
    html += `<div class="month"><h4>${MONTH[m0.getMonth()]}</h4><div class="mgrid">${cells}</div></div>`;
  }
  return html + '</div>';
}
function detailsBody(h, editing) {
  const r = reps(h), j = MILESTONES.findIndex(x => x > r), st = Math.max(0, Math.min((j < 0 ? MILESTONES.length : j) - 1, MILESTONES.length - 3));
  return `<p class="sentence sm">${sentenceHTML(h, null, false)}</p>
    <p class="sched">${I.clock}${esc(schedText(h))}</p>
    <div class="d-card c-${h.color} ${editing ? 'editing' : ''}">
      <div class="row-sb"><div><h3>Total repetitions</h3><small>Since ${fmtDate(h.start)}</small></div>
        <button class="mini" data-a="hist">${editing ? I.check + 'Done' : I.edit + 'Edit history'}</button></div>
      <div class="big">${r}</div>
      <div class="months">${heatmapHTML(h, editing)}</div>
      ${editing ? '<p class="small-note">Tap a day to mark it done or not done.</p>' : ''}
    </div>
    <div class="stats">
      <div class="stat"><b>${rate(h)}%</b><small>Completion</small></div>
      <div class="stat"><b>${streak(h)}</b><small>Current streak</small></div>
      <div class="stat"><b>${bestStreak(h)}</b><small>Best streak</small></div>
    </div>
    <div class="d-card"><h3>Milestones</h3><div class="hexes">${MILESTONES.slice(st, st + 3).map(n => `<div class="hex ${r >= n ? 'on' : ''}">${hexSVG(n, r >= n)}<span>${n} reps</span></div>`).join('')}</div></div>
    <div class="d-card">
      <div class="kv"><span>Repeat</span><b>${esc(daysLabel(h.days))}</b></div>
      <div class="kv"><span>Daily goal</span><b>${fmt(h.goal)} ${esc(unitLbl(h.goal, h.unit))}</b></div>
      <div class="kv"><span>Habit time</span><b>${h.times.length ? h.times.join(', ') : 'Any time'}</b></div>
      ${h.bad ? `<div class="kv"><span>Replaces</span><b>${esc(h.bad)}</b></div>` : ''}
    </div>
    <button class="btn ghost" data-a="edit">${I.edit}Edit habit</button>`;
}
function detailsSheet(id) {
  const h = H(id); if (!h) return;
  let editing = false;
  sheet({
    title: `<span class="c-${h.color}" style="display:inline-flex;align-items:center;gap:10px"><span class="dot"></span>${esc(h.name)}</span>`,
    tall: true, body: detailsBody(h, editing),
    onClose: () => render({ still: true }),
    acts: {
      hist: (a, e, L) => { editing = !editing; const y = L.body.scrollTop; L.body.innerHTML = detailsBody(h, editing); L.body.scrollTop = y; },
      cell: (a, e, L) => {
        const d = a.dataset.v;
        if (d < h.start) { toast("Can't log before this habit's start date"); return; }
        setVal(h, d, isDone(h, d) ? 0 : h.goal); haptic(6);
        const y = L.body.scrollTop; L.body.innerHTML = detailsBody(h, editing); L.body.scrollTop = y;
      },
      edit: (a, e, L) => after(L, () => openFlow('edit', id)),
    },
  });
}

/* ---------- plus menu ---------- */
function plusMenu() {
  const act = live();
  const el = document.createElement('div');
  el.className = 'layer';
  el.innerHTML = `<div class="scrim" data-close></div>
    <div class="menu" role="menu">
      <button class="mopt" data-a="new" role="menuitem"><span class="mico" style="background:linear-gradient(155deg,#ffb45e,#ff5a1f)">${I.plus}</span><div><b>Create a habit</b><small>Start a small habit that compounds.</small></div></button>
      <button class="mopt" data-a="replace" role="menuitem"><span class="mico" style="background:var(--surface-3)">${I.swap}</span><div><b>Replace a bad habit</b><small>Point that time and energy at something better.</small></div></button>
      <button class="mopt" data-a="stack" role="menuitem"><span class="mico" style="background:linear-gradient(155deg,#f59be6,#86ecfb)">${I.chain}</span><div><b>Create a habit stack</b><small>Chain habits so one leads into the next.</small></div></button>
    </div>
    ${act.length ? `<div class="yh"><div class="yh-head"><span>Your habits</span><span class="muted">${act.length}</span></div>
      <div class="yh-scroll">${act.map(h => `<div class="ycard c-${h.color}"><span class="nm">${esc(h.name)}</span>
        <p>${esc(sentencePlain(h))}</p>
        <div class="row-sb"><div class="tools"><button data-a="edit" data-id="${h.id}" aria-label="Edit">${I.edit}</button><button data-a="del" data-id="${h.id}" aria-label="Delete">${I.trash}</button></div>
        <button data-a="fame" data-id="${h.id}" aria-label="Move to Hall of Fame">${I.star}</button></div></div>`).join('')}</div></div>` : ''}`;
  const L = pushLayer(el);
  wire(L, {
    new: (a, e, L2) => after(L2, () => openFlow('new')),
    replace: (a, e, L2) => after(L2, () => openFlow('replace')),
    stack: (a, e, L2) => after(L2, () => openStack()),
    edit: (a, e, L2) => after(L2, () => openFlow('edit', a.dataset.id)),
    del: (a, e, L2) => after(L2, () => deleteSheet(a.dataset.id)),
    fame: (a, e, L2) => after(L2, () => fameSheet(a.dataset.id)),
  });
  haptic(6);
}

/* ---------- create / edit flow ---------- */
const EYEBROW = { bad: 'Name the habit to break', habit: 'Define your habit', when: 'Get specific', identity: 'Ground it in an identity' };
const PH = { bad: 'bad habit', habit: 'habit', when: 'time/location', identity: 'type of person I want to be' };
const PROMPTS = {
  bad: ['What habit do you want to break?', 'What do you keep doing that you wish you didn\'t?', 'What eats your time without giving anything back?'],
  habit: ['What\'s your habit? Think small and specific.', 'What\'s 1% better than what you do now?', 'What\'s the two-minute version of what you want to do?'],
  when: ['When does it make sense to do this habit?', 'Where can you do this habit easily?', 'Is this habit attached to something you already do?'],
  identity: ['Don\'t aim to read a book. Aim to become a reader.', 'Don\'t aim to run a race. Aim to become a runner.', 'Who do you become if you keep this up for a year?'],
};
const SUG = {
  bad: ['scrolling in bed', 'snoozing my alarm', 'checking my phone first thing', 'eating late at night', 'skipping workouts', 'doom-scrolling at lunch'],
  habit: ['read 1 page', 'do 10 push-ups', 'put on my running shoes', 'meditate for 2 minutes', 'drink a glass of water', 'write one sentence', 'stretch for 5 minutes'],
  when: ['every day at 8am', 'after I pour my coffee', 'after I brush my teeth', 'every weekday at lunch', 'before I open my laptop', 'when I get home'],
  identity: ['an active person', 'a mindful person', 'a reader', 'a writer', 'a healthy person', 'someone who is wise with money', 'a dedicated musician'],
};
function sentenceHTML(d, active, clickable) {
  const B = k => `<span class="slot ${d[k] ? 'is-set' : 'is-blank'} ${active === k ? 'active' : ''}" id="slot-${k}" ${clickable ? `data-a="jump" data-v="${k}" role="button" tabindex="0"` : ''}>${esc(d[k] || PH[k])}</span>`;
  const isBad = d.bad !== null && d.bad !== undefined && (d.bad !== '' || d._replace);
  return `${isBad ? `Instead of ${B('bad')}, I will` : 'I will'} ${B('habit')}, ${B('when')} so that I can become ${B('identity')}`;
}
const sentencePlain = h => `${h.bad ? `Instead of ${h.bad}, I` : 'I'} will ${h.habit}, ${h.when} so that I can become ${h.identity}`;

function openFlow(mode, editId) {
  const h = editId ? H(editId) : null;
  const replace = mode === 'replace' || !!(h && h.bad);
  const d = h
    ? { bad: h.bad || null, _replace: replace, habit: h.habit, when: h.when, identity: h.identity, days: [...h.days], goal: h.goal, unit: h.unit, times: [...h.times], reminder: h.reminder, before: h.before || 0, share: h.share !== false, color: h.color }
    : { bad: replace ? '' : null, _replace: replace, habit: '', when: '', identity: '', days: [0, 1, 2, 3, 4, 5, 6], goal: 1, unit: 'times', times: [], reminder: true, before: 0, share: true, color: nextColor() };
  const fields = replace ? ['bad', 'habit', 'when', 'identity'] : ['habit', 'when', 'identity'];
  const steps = ['intro', ...fields, 'review', 'settings'];
  const F = { d, h, steps, fields, i: h ? steps.length - 1 : 0, ret: false, pi: {}, replace };

  const el = document.createElement('div');
  el.className = 'layer';
  el.innerHTML = '<div class="full" role="dialog" aria-modal="true"></div>';
  const L = pushLayer(el);
  const root = el.querySelector('.full');
  const k = () => F.steps[F.i];

  function draw(dir = 'f') {
    const key = k();
    if (F.fields.includes(key)) {
      const v = F.d[key] || '';
      const p = F.pi[key] || 0;
      const prog = (F.fields.indexOf(key) + (v ? 1 : 0)) / F.fields.length;
      root.innerHTML = `<header class="fl-top"><span class="fl-eyebrow">${EYEBROW[key]}</span><button class="iconbtn" data-a="close" aria-label="Close">${I.down}</button></header>
        <div class="fl-body step-in-${dir}">
          <p class="sentence">${sentenceHTML(F.d, key, false)}</p>
          <p class="q" id="fq">${PROMPTS[key][p]}</p>
          <div class="hint-row"><span>Pick one or type your own</span><button class="qbtn" data-a="tip" aria-label="Show another prompt">${I.help}</button></div>
          <div class="chips">${SUG[key].map((s, n) => `<button class="chip" style="--i:${n}" data-a="chip" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        </div>
        <form class="fl-input" style="--prog:${prog}" data-form>
          <input id="fin" value="${esc(v)}" placeholder="${PH[key]}" autocomplete="off" autocapitalize="off" enterkeyhint="next" aria-label="${EYEBROW[key]}">
          ${F.fields.indexOf(key) > 0 && !F.ret ? `<button type="button" class="rb ghost" data-a="back" aria-label="Back">${I.left}</button>` : ''}
          <button type="submit" class="rb" id="fnext" ${v.trim() ? '' : 'disabled'} aria-label="Next">${I.right}</button>
        </form>`;
      const inp = root.querySelector('#fin');
      inp.addEventListener('input', () => {
        F.d[key] = inp.value;
        const slot = root.querySelector('#slot-' + key);
        slot.textContent = inp.value || PH[key];
        slot.classList.toggle('is-blank', !inp.value); slot.classList.toggle('is-set', !!inp.value);
        root.querySelector('#fnext').disabled = !inp.value.trim();
        root.querySelector('.fl-input').style.setProperty('--prog', (F.fields.indexOf(key) + (inp.value.trim() ? 1 : 0)) / F.fields.length);
      });
      root.querySelector('[data-form]').addEventListener('submit', e => { e.preventDefault(); next(); });
      setTimeout(() => { try { inp.focus({ preventScroll: true }); inp.setSelectionRange(inp.value.length, inp.value.length); } catch { } }, reduce ? 0 : 380);
    } else if (key === 'intro') {
      root.innerHTML = `<header class="fl-top"><span class="fl-eyebrow">${F.replace ? 'Replace a bad habit' : 'New habit'}</span><button class="iconbtn" data-a="close" aria-label="Close">${I.close}</button></header>
        <div class="fl-body mid step-in-${dir}"><p class="sentence" style="font-size:31px">${sentenceHTML(F.d, null, false)}</p></div>
        <div class="fl-foot"><div class="note">${F.replace
          ? 'Bad habits rarely just stop. You swap them for something that fills the same moment, then tie it to who you want to be.'
          : 'Strong habits have three parts: a small action, a clear time or place, and the kind of person it helps you become.'}</div>
          <button class="btn" data-a="next">${F.replace ? 'Name the habit to break' : 'Define your habit'}</button></div>`;
    } else if (key === 'review') {
      root.innerHTML = `<header class="fl-top"><div class="l"><button class="iconbtn" data-a="back" aria-label="Back">${I.left}</button><span class="fl-eyebrow">Review</span></div><button class="iconbtn" data-a="close" aria-label="Close">${I.close}</button></header>
        <div class="fl-body mid step-in-${dir}"><p class="sentence" style="font-size:31px">${sentenceHTML(F.d, null, true)}</p></div>
        <div class="fl-foot"><div class="note"><b>You did it!</b> Read it out loud. Does it feel exciting and easy to stick with? Tap any underlined part to change it.</div>
          <button class="btn" data-a="next">Continue</button></div>`;
    } else drawSettings(dir);
  }
  function drawSettings(dir = 'f') {
    const d = F.d;
    const edit = !!F.h;
    root.innerHTML = `<header class="fl-top"><div class="l">${edit ? '' : `<button class="iconbtn" data-a="back" aria-label="Back">${I.left}</button>`}<span class="fl-eyebrow">${edit ? 'Adjust habit' : 'Habit settings'}</span></div><button class="iconbtn" data-a="close" aria-label="Close">${I.close}</button></header>
      <div class="fl-body step-in-${dir}">
        ${edit ? `<div class="note" style="margin-bottom:16px">It's normal to adjust a habit so it fits your life better. <b>Your progress stays exactly where it is.</b></div>` : ''}
        <p class="sentence sm">${sentenceHTML(d, null, true)}</p>
        <div class="set-sec"><div class="set-row">Repeat<span id="dl">${daysLabel(d.days)}</span></div>
          <div class="dows">${ORDER.map(x => `<button class="dow ${d.days.includes(x) ? 'on' : ''}" data-a="dow" data-v="${x}" aria-pressed="${d.days.includes(x)}" aria-label="${DOW[x]}">${DOW1[x]}</button>`).join('')}</div></div>
        <div class="set-sec"><div class="set-row">Daily goal</div>
          <div class="goal"><input class="field" id="goal" inputmode="decimal" value="${fmt(d.goal)}" aria-label="Daily goal amount">
          <button class="select" data-a="unit"><span id="unitl">${esc(d.unit)}</span>${I.down}</button></div></div>
        <div class="set-sec"><div class="set-row">Habit time<span>${d.times.length ? '' : 'Any time'}</span></div>
          <div class="times">${d.times.map((t, n) => `<button class="tchip" data-a="time" data-v="${n}">${t}</button>`).join('')}<button class="tchip add" data-a="time" data-v="-1">${I.plus}Add</button></div></div>
        <div class="set-sec"><div class="set-row">Color<span id="cname">${colorName(d.color)}</span></div>
          <div class="colors" role="group" aria-label="Habit color">${PICK.map(c => `<button class="cdot c-${c} ${d.color === c ? 'on' : ''}" data-a="color" data-v="${c}" aria-label="${colorName(c)}" aria-pressed="${d.color === c}"></button>`).join('')}</div></div>
        <div class="set-sec"><div class="row-sb"><b style="font-weight:600;font-size:14px">Send reminder</b><button class="switch ${d.reminder ? 'on' : ''}" data-a="rem" role="switch" aria-checked="${d.reminder}" aria-label="Send reminder"></button></div>
          <div class="times" id="befs" style="margin-top:12px" ${d.reminder ? '' : 'hidden'}>${BEFORE.map(m => `<button class="tchip ${(d.before || 0) === m ? 'on' : ''}" data-a="before" data-v="${m}" aria-pressed="${(d.before || 0) === m}">${m ? m + ' min before' : 'At habit time'}</button>`).join('')}</div>
          <p class="small-note" id="remnote">${reminderNote(d)}</p></div>
        <div class="set-sec"><div class="row-sb"><b style="font-weight:600;font-size:14px">Share with partner</b><button class="switch ${d.share !== false ? 'on' : ''}" data-a="share" role="switch" aria-checked="${d.share !== false}" aria-label="Share with partner"></button></div>
          <p class="small-note">Your Duo partners see today's progress on this habit, nothing else.</p></div>
      </div>
      <div class="fl-foot"><button class="btn" data-a="save" id="fsave" ${d.days.length ? '' : 'disabled'}>${edit ? 'Save changes' : 'Create habit'}</button></div>`;
    const g = root.querySelector('#goal');
    g.addEventListener('input', () => { const n = parseFloat(g.value.replace(',', '.')); F.d.goal = n > 0 ? n : 1; });
  }
  function next() {
    const key = k();
    if (F.fields.includes(key)) {
      if (!(F.d[key] || '').trim()) return;
      F.d[key] = F.d[key].trim();
      if (F.ret) { F.ret = false; F.i = F.steps.indexOf(F.h ? 'settings' : 'review'); draw('f'); return; }
    }
    F.i = Math.min(F.i + 1, F.steps.length - 1); draw('f'); haptic(5);
  }
  function back() {
    if (F.ret) { F.ret = false; F.i = F.steps.indexOf(F.h ? 'settings' : 'review'); draw('b'); return; }
    F.i = Math.max(F.i - 1, 0); draw('b');
  }
  function saveHabit() {
    const d = F.d;
    if (!d.days.length) return;
    const data = { name: cap(d.habit), habit: d.habit, when: d.when, identity: d.identity, bad: d._replace ? d.bad : null, days: [...d.days].sort(), goal: d.goal || 1, unit: d.unit, times: [...d.times].sort(), reminder: d.reminder, before: d.before || 0, share: d.share !== false, color: d.color };
    if (F.h) { Object.assign(F.h, data); toast('Habit updated'); }
    else { D.habits.push({ id: uid(), ...data, start: today(), created: Date.now(), snooze: null, snoozeFrom: null, fame: false }); toast('Habit created. Now do it, idiot.'); }
    // Still inside the Save tap, so Android allows the notification prompt.
    if (d.reminder && d.times.length && pushSupported() && !pushOn() && Notification.permission !== 'denied') enablePush();
    save(); closeLayer(L); UI.day = today(); if (UI.tab !== 'home') UI.tab = 'home'; render();
  }

  wire(L, {
    close: () => closeLayer(L),
    next: () => next(),
    back: () => back(),
    tip: () => { const key = k(); F.pi[key] = ((F.pi[key] || 0) + 1) % PROMPTS[key].length; const q = root.querySelector('#fq'); q.textContent = PROMPTS[key][F.pi[key]]; q.classList.remove('swap'); void q.offsetWidth; q.classList.add('swap'); },
    chip: a => { const inp = root.querySelector('#fin'); inp.value = a.dataset.v; inp.dispatchEvent(new Event('input')); haptic(5); inp.focus({ preventScroll: true }); },
    jump: a => { F.ret = true; F.i = F.steps.indexOf(a.dataset.v); draw('b'); },
    dow: a => { const x = +a.dataset.v; const ds = F.d.days; const j = ds.indexOf(x); if (j >= 0) ds.splice(j, 1); else ds.push(x); a.classList.toggle('on', j < 0); a.setAttribute('aria-pressed', j < 0); root.querySelector('#dl').textContent = daysLabel(ds); root.querySelector('#fsave').disabled = !ds.length; haptic(4); },
    unit: () => wheelSheet('Select units', UNITS, Math.max(0, UNITS.indexOf(F.d.unit)), i => { F.d.unit = UNITS[i]; root.querySelector('#unitl').textContent = F.d.unit; }),
    time: a => { const n = +a.dataset.v; timeSheet(n >= 0 ? F.d.times[n] : null, t => { if (t === null) F.d.times.splice(n, 1); else if (n >= 0) F.d.times[n] = t; else if (!F.d.times.includes(t)) F.d.times.push(t); F.d.times.sort(); const y = root.querySelector('.fl-body').scrollTop; drawSettings('none'); root.querySelector('.fl-body').scrollTop = y; }); },
    color: a => { F.d.color = a.dataset.v; root.querySelector('#cname').textContent = colorName(F.d.color); root.querySelectorAll('.cdot').forEach(c => { c.classList.toggle('on', c === a); c.setAttribute('aria-pressed', c === a); }); haptic(4); },
    rem: a => {
      F.d.reminder = !F.d.reminder; a.classList.toggle('on', F.d.reminder); a.setAttribute('aria-checked', F.d.reminder); haptic(4);
      root.querySelector('#befs').hidden = !F.d.reminder; root.querySelector('#remnote').textContent = reminderNote(F.d);
    },
    share: a => { F.d.share = F.d.share === false; a.classList.toggle('on', F.d.share); a.setAttribute('aria-checked', F.d.share); haptic(4); },
    before: a => {
      F.d.before = Number(a.dataset.v); haptic(3);
      root.querySelectorAll('#befs .tchip').forEach(b => { const on = Number(b.dataset.v) === F.d.before; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    },
    save: () => saveHabit(),
  });
  root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.slot[data-a]')) e.target.click(); });
  draw('f');
}

/* ---------- pickers ---------- */
function wheelHTML(id, items) {
  return `<div class="wheel" id="${id}"><div class="wheel-hl"></div><ul>${items.map((t, i) => `<li data-i="${i}">${esc(t)}</li>`).join('')}</ul></div>`;
}
function wheelMount(el, sel) {
  const ul = el.querySelector('ul'), R = 44;
  let idx = sel;
  const mark = () => [...ul.children].forEach((li, i) => li.classList.toggle('sel', i === idx));
  requestAnimationFrame(() => { ul.scrollTop = sel * R; mark(); });
  ul.addEventListener('scroll', () => { const i = Math.max(0, Math.min(ul.children.length - 1, Math.round(ul.scrollTop / R))); if (i !== idx) { idx = i; mark(); haptic(3); } }, { passive: true });
  ul.addEventListener('click', e => { const li = e.target.closest('li'); if (li) ul.scrollTo({ top: li.dataset.i * R, behavior: 'smooth' }); });
  return () => idx;
}
function wheelSheet(title, items, sel, cb) {
  let get;
  sheet({
    title, body: `<div class="wheels">${wheelHTML('w1', items)}</div>`,
    foot: `<button class="btn" data-a="ok">Confirm</button><button class="btn ghost" data-close>Cancel</button>`,
    mount: L => { get = wheelMount(L.el.querySelector('#w1'), sel); },
    acts: { ok: (a, e, L) => { cb(get()); closeLayer(L); } },
  });
}
// Clock-face time picker: outer ring 0–11, inner ring 12–23, then every minute 0–59.
function timeSheet(cur, cb) {
  const now = new Date();
  let [hh, mm] = cur ? cur.split(':').map(Number) : [now.getHours(), now.getMinutes()];
  let mode = 'h', root, svg;
  const C = 140, RO = 112, RI = 74, TAU = Math.PI * 2;
  const pos = (i, n, r) => { const a = (i / n) * TAU; return [C + r * Math.sin(a), C - r * Math.cos(a)]; };
  const num = (x, y, t, cls) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}">${t}</text>`;
  function face() {
    let marks = '', sx, sy, kr = 20;
    if (mode === 'h') {
      for (let i = 0; i < 24; i++) { const [x, y] = pos(i % 12, 12, i < 12 ? RO : RI); marks += num(x, y, i, `${i >= 12 ? 'in' : ''} ${i === hh ? 'on' : ''}`); }
      [sx, sy] = pos(hh % 12, 12, hh < 12 ? RO : RI); if (hh >= 12) kr = 17;
    } else {
      for (let i = 0; i < 60; i += 5) { const [x, y] = pos(i, 60, RO); marks += num(x, y, pad(i), i === mm ? 'on' : ''); }
      [sx, sy] = pos(mm, 60, RO);
    }
    return `<circle class="face" cx="${C}" cy="${C}" r="136"/>
      <line class="hand" x1="${C}" y1="${C}" x2="${sx.toFixed(1)}" y2="${sy.toFixed(1)}"/><circle class="hub" cx="${C}" cy="${C}" r="4"/>
      <circle class="knob" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${kr}"/>
      ${mode === 'm' && mm % 5 ? `<circle class="kdot" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="3"/>` : ''}${marks}`;
  }
  function paint() {
    svg.innerHTML = face();
    svg.setAttribute('aria-label', mode === 'h' ? `Hour ${hh}` : `Minute ${mm}`);
    const ch = root.querySelector('#tch'), cm = root.querySelector('#tcm');
    ch.textContent = pad(hh); cm.textContent = pad(mm);
    ch.classList.toggle('on', mode === 'h'); cm.classList.toggle('on', mode === 'm');
    ch.setAttribute('aria-pressed', mode === 'h'); cm.setAttribute('aria-pressed', mode === 'm');
  }
  function pick(e) {
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 280 - C, y = ((e.clientY - r.top) / r.height) * 280 - C;
    let a = Math.atan2(x, -y); if (a < 0) a += TAU;
    if (mode === 'h') {
      const h = (Math.round((a / TAU) * 12) % 12) + (Math.hypot(x, y) < (RO + RI) / 2 ? 12 : 0);
      if (h !== hh) { hh = h; haptic(3); paint(); }
    } else {
      const m = Math.round((a / TAU) * 60) % 60;
      if (m !== mm) { mm = m; if (m % 5 === 0) haptic(3); paint(); }
    }
  }
  sheet({
    title: 'Habit time',
    body: `<div class="tpick"><button class="tcell on" id="tch" data-a="mh" aria-label="Pick the hour">${pad(hh)}</button><span class="colon">:</span><button class="tcell" id="tcm" data-a="mm" aria-label="Pick the minute">${pad(mm)}</button></div>
      <svg class="dial" id="dial" viewBox="0 0 280 280" role="slider" tabindex="0" aria-label="Hour"></svg>
      <p class="small-note" style="text-align:center">Drag around the clock. Inner ring is afternoon and evening.</p>`,
    foot: `<button class="btn" data-a="ok">Confirm</button>${cur ? '<button class="btn danger-ghost" data-a="rm">Remove this time</button>' : '<button class="btn ghost" data-close>Cancel</button>'}`,
    mount: L => {
      root = L.el; svg = root.querySelector('#dial'); paint();
      let down = false;
      svg.addEventListener('pointerdown', e => { down = true; e.stopPropagation(); try { svg.setPointerCapture(e.pointerId); } catch { } pick(e); });
      svg.addEventListener('pointermove', e => { if (down) pick(e); });
      const up = () => { if (!down) return; down = false; if (mode === 'h') setTimeout(() => { mode = 'm'; paint(); }, 220); };
      svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
      svg.addEventListener('keydown', e => {
        const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key]; if (!d) return;
        e.preventDefault();
        if (mode === 'h') hh = (hh + d + 24) % 24; else mm = (mm + d + 60) % 60;
        paint();
      });
    },
    acts: {
      mh: () => { mode = 'h'; paint(); haptic(3); },
      mm: () => { mode = 'm'; paint(); haptic(3); },
      ok: (a, e, L) => { cb(`${pad(hh)}:${pad(mm)}`); closeLayer(L); },
      rm: (a, e, L) => { cb(null); closeLayer(L); },
    },
  });
}
function habitPicker(title, exclude, cb) {
  const list = live().filter(h => !exclude.includes(h.id));
  if (!list.length) { toast('No other habits to pick'); return; }
  sheet({
    title,
    body: list.map(h => `<button class="select c-${h.color}" data-a="p" data-id="${h.id}"><span class="dot"></span><span>${esc(h.name)}</span>${I.right}</button>`).join(''),
    acts: { p: (a, e, L) => { cb(a.dataset.id); closeLayer(L); } },
  });
}

/* ---------- habit stacks ---------- */
function openStack(existing) {
  if (live().length < 2) { toast('You need at least 2 habits to build a stack'); return; }
  const S = existing ? { id: existing.id, name: existing.name, cue: existing.ids[0], next: existing.ids.slice(1), stage: 1 } : { name: 'My habit stack', cue: null, next: [null], stage: 1 };
  const el = document.createElement('div');
  el.className = 'layer';
  el.innerHTML = '<div class="full" role="dialog" aria-modal="true"></div>';
  const L = pushLayer(el);
  const root = el.querySelector('.full');
  const nm = id => (id && H(id) ? H(id).name : null);
  const sel = (id, k, label) => { const h = id && H(id); return `<button class="select ${h ? 'c-' + h.color : ''}" data-a="pick" data-v="${k}">${h ? '<span class="dot"></span>' : ''}<span>${h ? esc(h.name) : label}</span>${I.down}</button>`; };
  const ready = () => S.cue && S.next.length && S.next.every(Boolean);
  function draw(dir = 'f') {
    if (S.stage === 1) {
      root.innerHTML = `<header class="fl-top"><span class="fl-eyebrow">${existing ? 'Manage habit stack' : 'Create habit stack'}</span><button class="iconbtn" data-a="close" aria-label="Close">${I.close}</button></header>
        <div class="fl-body step-in-${dir}">
          <p class="sentence sm">After I <span class="slot ${S.cue ? 'is-set' : 'is-blank'}">${esc(nm(S.cue) || 'cue habit')}</span>, I will ${S.next.map(n => `<span class="slot ${n ? 'is-set' : 'is-blank'}">${esc(nm(n) || 'next habit')}</span>`).join(', then ')}.</p>
          <div class="note">Pick something you already do every day as the cue. Each habit you finish becomes the trigger for the next one.</div>
          <p class="sec-label">My cue habit</p>${sel(S.cue, 'cue', 'Choose the first habit')}
          <p class="sec-label">Next habit${S.next.length > 1 ? 's' : ''}</p>
          ${S.next.map((n, j) => sel(n, j, 'Choose the next habit')).join('')}
          ${S.next.length < 4 ? `<button class="tchip add" style="margin-top:12px" data-a="add">${I.plus}Add another habit</button>` : ''}
        </div>
        <div class="fl-foot"><button class="btn" data-a="next" ${ready() ? '' : 'disabled'}>Next</button></div>`;
    } else {
      root.innerHTML = `<header class="fl-top"><div class="l"><button class="iconbtn" data-a="back" aria-label="Back">${I.left}</button><span class="fl-eyebrow">Name your stack</span></div><button class="iconbtn" data-a="close" aria-label="Close">${I.close}</button></header>
        <div class="fl-body step-in-${dir}">
          <input class="field" id="sname" value="${esc(S.name)}" aria-label="Stack name" style="font:300 26px var(--serif);height:60px">
          <p class="sec-label">My cue habit</p><p class="sentence sm" style="margin:0">${esc(nm(S.cue))}</p>
          ${S.next.map(n => `<p class="sec-label">Then</p><p class="sentence sm" style="margin:0">${esc(nm(n))}</p>`).join('')}
        </div>
        <div class="fl-foot"><div class="note"><b>You did it!</b> Ride the momentum. Finishing one habit makes starting the next one easy.</div>
          <button class="btn" data-a="save">Save stack</button>${existing ? '<button class="btn danger-ghost" data-a="del">Delete this stack</button>' : ''}</div>`;
      root.querySelector('#sname').addEventListener('input', e => { S.name = e.target.value; });
    }
  }
  wire(L, {
    close: () => closeLayer(L),
    pick: a => {
      const k = a.dataset.v;
      const taken = [S.cue, ...S.next].filter(Boolean).filter(x => x !== (k === 'cue' ? S.cue : S.next[+k]));
      habitPicker(k === 'cue' ? 'Select your cue habit' : 'Select the next habit', taken, id => { if (k === 'cue') S.cue = id; else S.next[+k] = id; draw('none'); });
    },
    add: () => { S.next.push(null); draw('none'); },
    next: () => { if (!ready()) return; S.stage = 2; draw('f'); },
    back: () => { S.stage = 1; draw('b'); },
    save: () => {
      const ids = [S.cue, ...S.next];
      D.stacks.forEach(s => { if (s.id !== S.id) s.ids = s.ids.filter(x => !ids.includes(x)); });
      D.stacks = D.stacks.filter(s => s.id === S.id || s.ids.length >= 2);
      const name = (S.name || '').trim() || 'My habit stack';
      if (existing) Object.assign(existing, { name, ids }); else D.stacks.push({ id: uid(), name, ids });
      save(); closeLayer(L); UI.tab = 'home'; render(); toast('Stack saved');
    },
    del: () => { D.stacks = D.stacks.filter(s => s.id !== S.id); save(); closeLayer(L); render({ still: true }); toast('Stack deleted. The habits stay.'); },
  });
  draw('f');
}
function stackSheet(sid) {
  const s = D.stacks.find(x => x.id === sid); if (!s) return;
  sheet({
    title: esc(s.name),
    body: `<p class="muted" style="margin-top:0">${s.ids.length} stacked habits. Finish one and the next one is your cue.</p>
      ${s.ids.map((id, n) => { const h = H(id); return h ? `<div class="hrow c-${h.color}"><b class="muted" style="width:18px">${n + 1}</b><span class="dot"></span><span>${esc(h.name)}</span>${isDone(h, today()) ? I.check : ''}</div>` : ''; }).join('')}`,
    foot: '<button class="btn" data-a="manage">Manage habit stack</button>',
    acts: { manage: (a, e, L) => after(L, () => openStack(s)) },
  });
}

/* ---------- progress ---------- */
function progressHTML() {
  const all = D.habits;
  const total = all.reduce((n, h) => n + reps(h), 0);
  let body = '';
  if (!all.length) {
    body = `<div class="card"><h3>Nothing here yet</h3><p class="say" style="margin-top:10px">Every time you do a habit, you cast a vote for who you want to be. Create a habit to start counting.</p></div>`;
  } else if (UI.seg === 'progress') {
    const withR = all.filter(h => reps(h) > 0);
    const best = all.map(h => ({ h, b: bestStreak(h) })).sort((a, b) => b.b - a.b)[0];
    const fame = all.filter(h => h.fame);
    body = `<div class="card" style="--i:0"><h3>Total repetitions</h3><div class="big">${total}</div>
        <p class="say">I've cast <u>${total} vote${total === 1 ? '' : 's'}</u> towards becoming a better me.</p>
        ${total ? `<div class="votebar">${withR.map(h => `<i class="c-${h.color}" style="flex:${reps(h)}">${reps(h)}</i>`).join('')}</div>` : '<div class="votebar zero">Your first vote is one tap away</div>'}
        ${all.map(h => `<div class="hrow c-${h.color}"><span class="dot"></span><span>${esc(h.name)}</span><b>${reps(h)}</b></div>`).join('')}
      </div>
      <div class="card" style="--i:1"><h3>Streaks</h3><div class="big">${best.b}</div>
        <p class="say" style="margin-bottom:10px">My best streak is ${best.b} day${best.b === 1 ? '' : 's'} on ${esc(best.h.name.toLowerCase())}.</p>
        ${live().map(h => { const s = streak(h); return `<div class="srow">${flameSVG(h.color)}<div><b>${s} day${s === 1 ? '' : 's'} in a row${s ? '!' : ''}</b><small>${esc(h.name)}</small></div></div>`; }).join('')}
      </div>
      <div class="card" style="--i:2"><div class="row-sb"><h3>Hall of Fame</h3><span class="muted">${fame.length}</span></div>
        ${fame.length ? fame.map(h => `<div class="fame"><span class="nm">${esc(h.name)}</span><br><small>${reps(h)} reps · best streak ${bestStreak(h)} · since ${fmtDate(h.fameDate || h.start)}</small>
          <div style="margin-top:10px"><button class="mini" data-act="fameBack" data-id="${h.id}">Bring it back</button></div></div>`).join('')
        : '<p class="muted" style="margin:10px 0 0">Habits you\'ve mastered live here. Move one in from its ••• menu when it\'s part of who you are.</p>'}
      </div>`;
  } else {
    body = all.map((h, n) => {
      const r = reps(h), j = MILESTONES.findIndex(x => x > r), st = Math.max(0, Math.min((j < 0 ? MILESTONES.length : j) - 1, MILESTONES.length - 3));
      return `<div class="card c-${h.color}" style="--i:${n}"><div class="row-sb"><div><b style="font:600 16px var(--sans)">${esc(h.name)}</b><br><small class="muted">${esc(cap(h.identity))}</small></div>${h.fame ? `<span class="mini" style="color:var(--gold1)">${I.star}</span>` : ''}</div>
        <div class="big" style="font-size:44px">${r}</div>
        <div class="hexes">${MILESTONES.slice(st, st + 3).map(m => `<div class="hex ${r >= m ? 'on' : ''}">${hexSVG(m, r >= m)}<span>${m} reps</span></div>`).join('')}</div>
        <button class="mini" style="margin-top:14px" data-act="msAll" data-id="${h.id}">View all ${I.right}</button></div>`;
    }).join('');
  }
  return `${topHTML(false)}<div class="pad">
    <h1 class="page-title">Habit progress</h1>
    <p class="sub">Every rep is a vote for the person you want to become.</p>
    <div class="segctl" data-v="${UI.seg}" role="tablist">
      <button class="${UI.seg === 'progress' ? 'on' : ''}" data-act="seg" data-v="progress" role="tab" aria-selected="${UI.seg === 'progress'}">Progress</button>
      <button class="${UI.seg === 'milestones' ? 'on' : ''}" data-act="seg" data-v="milestones" role="tab" aria-selected="${UI.seg === 'milestones'}">Milestones</button>
    </div>${body}</div>`;
}
function milestonesSheet(id) {
  const h = H(id), r = reps(h);
  sheet({
    title: esc(h.name), tall: true,
    body: `<p class="muted" style="margin-top:0">${r} repetitions so far. ${MILESTONES.find(m => m > r) ? `Next up: ${MILESTONES.find(m => m > r)}.` : 'Every milestone earned.'}</p>
      <div class="hexes">${MILESTONES.map(m => `<div class="hex ${r >= m ? 'on' : ''}">${hexSVG(m, r >= m)}<span>${m} reps</span></div>`).join('')}</div>`,
  });
}

/* ---------- focus ---------- */
const FS = { total: D.focus.mins * 60, left: D.focus.mins * 60, running: false, end: 0, timer: null, done: false };
let actx = null, wake = null;
const mmss = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
function focusCtl() {
  if (FS.running) return `<button class="btn-pill" data-act="fPause">${I.pause}Pause</button><button class="r" data-act="fReset" aria-label="Reset">${I.reset}</button>`;
  if (FS.left < FS.total && !FS.done) return `<button class="btn-pill" data-act="fStart">${I.play}Resume</button><button class="r" data-act="fReset" aria-label="Reset">${I.reset}</button>`;
  return `<button class="btn-pill" data-act="fStart">${I.play}${FS.done ? 'Go again' : 'Start'}</button>`;
}
const focusState = () => FS.running ? 'Focusing. Phone down.' : FS.done ? 'Session complete' : FS.left < FS.total ? 'Paused' : `${D.focus.mins} minute session`;
function focusHTML() {
  const h = D.focus.hid && H(D.focus.hid);
  return `${topHTML(false)}<div class="pad"><h1 class="page-title">Focus</h1><p class="sub">One block of real work. Put the phone face down.</p></div>
    <div class="focus-wrap">
      <div class="blob fblob c-ember ${FS.running ? 'run' : ''}" id="fblob" style="--p:${1 - FS.left / FS.total}">
        <div class="lvl"></div>
        <button class="more" data-act="fEdit" aria-label="Change session length">${ic('<path d="M4 20h4L19 9l-4-4L4 16v4z"/>', 16, 2)}</button>
        <div class="ftime" id="ftime" role="timer">${mmss(FS.left)}</div>
        <p class="fstate" id="fstate">${focusState()}</p>
      </div>
      <div class="fctl" id="fctl">${focusCtl()}</div>
    </div>
    <div class="card fopts">
      <div class="row-sb"><b style="font:600 15px var(--sans)">Log a habit when the session ends</b><button class="switch ${D.focus.logOn ? 'on' : ''}" data-act="fLog" role="switch" aria-checked="${D.focus.logOn}" aria-label="Log a habit when the session ends"></button></div>
      <button class="select ${h ? 'c-' + h.color : ''}" data-act="fPick" ${D.focus.logOn ? '' : 'disabled'}>${h ? '<span class="dot"></span>' : ''}<span>${h ? esc(h.name) : 'Choose a habit'}</span>${I.down}</button>
    </div>`;
}
function paintFocus() {
  const t = $('#ftime');
  if (t) {
    const tm = mmss(FS.left); if (t.textContent !== tm) t.textContent = tm;
    const st = $('#fstate'), sv = focusState(); if (st.textContent !== sv) st.textContent = sv;
    const b = $('#fblob'); b.style.setProperty('--p', 1 - FS.left / FS.total); b.classList.toggle('run', FS.running);
    const c = $('#fctl'); const html = focusCtl(); if (c.dataset.h !== html) { c.innerHTML = html; c.dataset.h = html; }
  }
  paintFocusPill();
}
function paintFocusPill() {
  const p = $('#fpill');
  const show = FS.running && UI.tab !== 'focus';
  p.classList.toggle('show', show);
  if (show) p.innerHTML = `${I.timer}${mmss(FS.left)}`;
}
function fStart() {
  if (FS.done || FS.left <= 0) { FS.left = FS.total; FS.done = false; }
  FS.end = Date.now() + FS.left * 1000; FS.running = true;
  clearInterval(FS.timer); FS.timer = setInterval(fTick, 250);
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch { }
  try { navigator.wakeLock && navigator.wakeLock.request('screen').then(w => { wake = w; }).catch(() => { }); } catch { }
  haptic(10); paintFocus();
}
function fPause() {
  FS.left = Math.max(0, Math.ceil((FS.end - Date.now()) / 1000)); FS.running = false; clearInterval(FS.timer);
  try { wake && wake.release(); } catch { } paintFocus();
}
function fReset() { FS.running = false; clearInterval(FS.timer); FS.left = FS.total; FS.done = false; try { wake && wake.release(); } catch { } paintFocus(); }
function fTick() { FS.left = Math.max(0, Math.ceil((FS.end - Date.now()) / 1000)); if (FS.left <= 0) fDone(); paintFocus(); }
function chime() {
  if (!actx) return;
  try {
    [[660, 0], [880, .18], [1320, .36]].forEach(([f, t]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, actx.currentTime + t);
      g.gain.linearRampToValueAtTime(.25, actx.currentTime + t + .02);
      g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + t + 1.4);
      o.connect(g).connect(actx.destination); o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 1.5);
    });
  } catch { }
}
function fDone() {
  clearInterval(FS.timer); FS.running = false; FS.left = 0; FS.done = true;
  try { wake && wake.release(); } catch { }
  chime(); haptic([200, 100, 200]);
  const h = D.focus.logOn && D.focus.hid && H(D.focus.hid);
  if (h) {
    const add = h.unit === 'minutes' ? D.focus.mins : h.unit === 'hours' ? D.focus.mins / 60 : h.unit === 'seconds' ? D.focus.mins * 60 : 1;
    const t = today(); const was = isDone(h, t), r0 = reps(h);
    setVal(h, t, val(h, t) + add);
    toast(`Session done. Logged ${fmt(add)} ${unitLbl(add, h.unit)} to ${h.name}`);
    if (!was && isDone(h, t)) { const m = MILESTONES.find(x => x > r0 && x <= reps(h)); if (m) setTimeout(() => celebrate(h, m), 600); }
  } else toast('Session done. Nice work.');
  const b = $('#fblob'); if (b) burst(b.getBoundingClientRect(), 'ember', 26);
}
function focusEdit() {
  if (FS.running) { toast('Pause the session first'); return; }
  const MINS = Array.from({ length: 120 }, (_, i) => `${i + 1} min`);
  let get;
  const presets = [5, 15, 25, 45, 60, 90];
  sheet({
    title: 'Session length',
    body: `<div class="chips" style="margin-bottom:14px">${presets.map(p => `<button class="chip" data-a="pre" data-v="${p}">${p} min</button>`).join('')}</div><div class="wheels">${wheelHTML('fw', MINS)}</div>`,
    foot: '<button class="btn" data-a="ok">Confirm</button>',
    mount: L => { get = wheelMount(L.el.querySelector('#fw'), D.focus.mins - 1); },
    acts: {
      pre: (a, e, L) => { L.el.querySelector('#fw ul').scrollTo({ top: (a.dataset.v - 1) * 44, behavior: 'smooth' }); },
      ok: (a, e, L) => { D.focus.mins = get() + 1; save(); FS.total = FS.left = D.focus.mins * 60; FS.done = false; closeLayer(L); paintFocus(); },
    },
  });
}

/* ---------- profile, help, sample ---------- */
function profileSheet() {
  const all = D.habits, total = all.reduce((n, h) => n + reps(h), 0);
  let armed = false;
  sheet({
    title: 'You', tall: true,
    body: `<input class="field" id="pname" placeholder="Your name" value="${esc(D.name)}" aria-label="Your name" style="font:300 24px var(--serif)">
      <div class="stats" style="margin-top:12px"><div class="stat"><b>${live().length}</b><small>Active habits</small></div><div class="stat"><b>${total}</b><small>Votes cast</small></div><div class="stat"><b>${all.filter(h => h.fame).length}</b><small>Hall of Fame</small></div></div>
      ${themesHTML()}
      <p class="sec-label">Reminders</p>
      <div id="remsec">${remindersHTML()}</div>
      <p class="sec-label">Backup</p>
      <p class="muted" style="margin:0 0 12px">Your habits and history live on this phone. With reminders on, the reminder server keeps only names, times and what's done today. Copy a backup now and then and keep it somewhere safe.</p>
      <div class="stackbtns">
      ${STANDALONE ? `<button class="btn ghost" data-a="download">${ic('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', 20, 2)}Save backup file</button>
      <label class="btn ghost" for="rfile">Restore from backup file</label>
      <input type="file" id="rfile" accept=".json,application/json" hidden>` : ''}
      <button class="btn ghost" data-a="copy">${I.copy}Copy backup as text</button>
      <textarea class="field ta" id="restore" placeholder="Or paste a backup here to restore it" aria-label="Backup to restore"></textarea>
      <button class="btn ghost" data-a="restore">Restore pasted backup</button></div>
      <p class="sec-label">Try it out</p>
      <div class="stackbtns"><button class="btn ghost" data-a="sample">Load sample habits</button>
      <button class="btn danger-ghost" data-a="erase">Erase everything</button></div>
      <p class="small-note" style="text-align:center;margin-top:20px">Do Some Work Idiot · version 1.1</p>`,
    onClose: () => render({ still: true }),
    mount: L => {
      L.el.querySelector('#pname').addEventListener('input', e => { D.name = e.target.value.slice(0, 40); save(); });
      const rf = L.el.querySelector('#rfile');
      if (rf) rf.addEventListener('change', () => {
        const f = rf.files && rf.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => { if (restoreFrom(String(r.result))) closeLayer(L); };
        r.readAsText(f);
      });
    },
    acts: {
      pushOn: async (a, e, L) => { a.disabled = true; await enablePush(); const s = L.el.querySelector('#remsec'); if (s) s.innerHTML = remindersHTML(); },
      pushOff: async (a, e, L) => { a.disabled = true; await disablePush(); const s = L.el.querySelector('#remsec'); if (s) s.innerHTML = remindersHTML(); },
      pushTest: async a => { a.disabled = true; await testPush(); a.disabled = false; },
      theme: (a, e, L) => {
        FX.setTheme(a.dataset.v); haptic(6);
        L.el.querySelectorAll('.theme').forEach(b => { const on = b === a; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      },
      motion: a => { FX.setMotion(!FX.motion()); a.classList.toggle('on', FX.motion()); a.setAttribute('aria-checked', FX.motion()); haptic(4); },
      download: () => {
        try {
          const blob = new Blob([JSON.stringify(D, null, 1)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = `do-some-work-backup-${today()}.json`;
          document.body.append(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
          toast('Backup saved to your Downloads');
        } catch { toast("Couldn't save the file. Use Copy backup as text instead."); }
      },
      copy: () => {
        const txt = JSON.stringify(D);
        const fallback = () => { const ta = $('#restore'); ta.value = txt; ta.select(); toast('Select all and copy the text in the box'); };
        try { navigator.clipboard.writeText(txt).then(() => toast('Backup copied'), fallback); } catch { fallback(); }
      },
      restore: (a, e, L) => { if (restoreFrom($('#restore').value)) closeLayer(L); },
      sample: (a, e, L) => { loadSample(); closeLayer(L); },
      erase: (a, e, L) => {
        if (!armed) { armed = true; a.textContent = 'Tap again to erase all habits and history'; a.classList.replace('danger-ghost', 'danger'); return; }
        D = blank(); save(); closeLayer(L); UI.day = today(); toast('Everything erased');
      },
    },
  });
}
function themesHTML() {
  if (!window.FX) return '';
  const cur = FX.theme(), m = FX.motion();
  return `<p class="sec-label">Theme</p>
    <div class="themes" role="radiogroup" aria-label="Theme">${FX.THEMES.map(t => `<button class="theme ${cur === t.id ? 'on' : ''}" data-a="theme" data-v="${t.id}" role="radio" aria-checked="${cur === t.id}"
      style="--tb:${t.bg};--tg:${t.glow};--t1:${t.sw[0]};--t2:${t.sw[1]}"><i></i><b>${t.name}</b><small>${t.note}</small></button>`).join('')}</div>
    <div class="row-sb" style="margin-top:14px"><div><b style="font-weight:600;font-size:14px">Moving background</b><p class="small-note" style="margin:2px 0 0">Off keeps the scene still and saves battery.</p></div>
      <button class="switch ${m ? 'on' : ''}" data-a="motion" role="switch" aria-checked="${m}" aria-label="Moving background"></button></div>`;
}
function remindersHTML() {
  if (!pushSupported()) return `<p class="muted" style="margin:0">Reminders work in the installed app. Open Do Work from your home screen to turn them on.</p>`;
  if (Notification.permission === 'denied') return `<p class="muted" style="margin:0">Notifications are blocked for this app. Allow them in Android Settings, Apps, Do Work, Notifications, then come back here.</p>`;
  const n = remindable().reduce((k, h) => k + h.times.length, 0);
  if (!pushOn()) return `<p class="muted" style="margin:0 0 12px">Get a nudge on this phone at each habit's time. Habits without a time never ring.</p>
    <div class="stackbtns"><button class="btn" data-a="pushOn">${I.clock}Turn on reminders</button></div>`;
  return `<p class="muted" style="margin:0 0 12px"><b style="color:var(--text)">On for this phone.</b> ${n ? `${n} reminder${n === 1 ? '' : 's'} set across your habits.` : 'No habit has a time yet, so nothing will ring.'} A habit already done that day stays quiet.</p>
    <div class="stackbtns"><button class="btn ghost" data-a="pushTest">Send a test reminder</button><button class="btn ghost" data-a="pushOff">Turn off reminders</button></div>`;
}
function restoreFrom(text) {
  try {
    const o = JSON.parse(text);
    if (!o || !Array.isArray(o.habits)) throw new Error();
    D = Object.assign(blank(), o); save(); UI.day = today(); render(); toast('Backup restored');
    return true;
  } catch { toast("That doesn't look like a backup from this app"); return false; }
}
function helpSheet() {
  sheet({
    title: 'How it works',
    body: `<div class="acts" style="gap:4px">
      <div class="row"><span class="mico" style="background:var(--ivory);color:var(--ink)">${I.plus}</span><div class="grow">Tap <b>+</b> under a habit to log it, or press and hold the card to finish it in one go. Hit the goal and the card lights up.</div></div>
      <div class="row"><span class="mico" style="background:linear-gradient(155deg,#ffb45e,#ff5a1f)">${I.bolt}</span><div class="grow">The bolt number is your streak. Days a habit isn't scheduled, or is snoozed, never break it.</div></div>
      <div class="row"><span class="mico" style="background:var(--surface-3)">${I.dots}</span><div class="grow">Tap <b>•••</b> for details, history, snooze, Hall of Fame, edit or delete.</div></div>
      <div class="row"><span class="mico" style="background:var(--surface-3)">${I.clock}</span><div class="grow">Tap a past day at the top to fill in what you forgot to log.</div></div></div>`,
  });
}
function loadSample() {
  const t = today(), r = n => addDays(t, -n);
  const mk = (o, n) => ({ id: uid(), created: Date.now() - n * 864e5, start: r(n), snooze: null, snoozeFrom: null, fame: false, reminder: true, bad: null, ...o, name: cap(o.habit) });
  const hs = [
    mk({ habit: 'not touch my phone for 30 minutes after I wake up', when: 'every morning', identity: 'more focused', days: [0, 1, 2, 3, 4, 5, 6], goal: 30, unit: 'minutes', times: ['05:00'], color: 'ember' }, 34),
    mk({ habit: 'read 5 pages', when: 'right after that', identity: 'a mindful person', days: [0, 1, 2, 3, 4, 5, 6], goal: 5, unit: 'pages', times: ['05:30'], color: 'orchid' }, 34),
    mk({ habit: 'do 20 push-ups', when: 'every day at 5pm', identity: 'stronger than yesterday', days: [1, 2, 3, 4, 5], goal: 20, unit: 'reps', times: ['17:00'], color: 'honey', bad: 'scrolling after class' }, 26),
    mk({ habit: 'put on my running shoes', when: 'Saturday at 8am', identity: 'an active person', days: [6], goal: 1, unit: 'times', times: ['08:00'], color: 'lagoon' }, 20),
  ];
  const logs = {};
  const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(42);
  hs.forEach((h, n) => {
    logs[h.id] = {};
    for (let k = 1; k <= 34; k++) {
      const d = r(k); if (d < h.start) continue;
      if (scheduled(h, d) && rnd() < [0.82, 0.74, 0.7, 0.9][n]) logs[h.id][d] = h.goal;
    }
  });
  logs[hs[1].id][t] = 2;
  D = { ...blank(), name: D.name, habits: hs, logs, stacks: [{ id: uid(), name: 'Morning stack', ids: [hs[0].id, hs[1].id] }] };
  save(); UI.day = t; UI.tab = 'home'; render(); toast('Sample habits loaded. Erase them anytime from your profile.');
}

/* ---------- global events ---------- */
const ACT = {
  tab: a => go(a.dataset.v),
  duoInvite: () => duoInvite(), duoCopy: () => duoCopy(), duoJoin: () => duoJoin(), duoNudge: a => duoNudge(a), duoSettings: () => duoSettings(),
  day: a => { if (UI.day === a.dataset.v) return; UI.day = a.dataset.v; haptic(4); render({ still: true }); $('#view').scrollTop = 0; },
  plus: () => plusMenu(),
  newHabit: () => openFlow('new'),
  inc: a => { const h = H(a.dataset.id); logTo(h, val(h, UI.day) + 1, a); },
  dec: a => { const h = H(a.dataset.id); if (val(h, UI.day) > 0) logTo(h, val(h, UI.day) - 1, a); },
  kp: a => keypad(H(a.dataset.id)),
  undo: a => { const h = H(a.dataset.id); logTo(h, 0, a); },
  more: a => habitActions(a.dataset.id),
  profile: () => profileSheet(),
  help: () => helpSheet(),
  sample: () => loadSample(),
  resume: a => { const h = H(a.dataset.id); h.snooze = null; h.snoozeFrom = null; save(); render({ still: true }); toast('Welcome back. Let\'s go.'); },
  stackOpen: a => stackSheet(a.dataset.id),
  seg: a => { UI.seg = a.dataset.v; const y = $('#view').scrollTop; render(); $('#view').scrollTop = y; haptic(4); },
  msAll: a => milestonesSheet(a.dataset.id),
  fameBack: a => { const h = H(a.dataset.id); h.fame = false; save(); render(); toast('Back on your daily list'); },
  fStart: () => fStart(), fPause: () => fPause(), fReset: () => fReset(), fEdit: () => focusEdit(),
  fLog: () => { D.focus.logOn = !D.focus.logOn; save(); render(); },
  fPick: () => habitPicker('Select a habit to log', [], id => { D.focus.hid = id; save(); render(); }),
  fpill: () => go('focus'),
};
document.addEventListener('click', e => {
  if (e.target.closest('#layers')) return;
  const a = e.target.closest('[data-act]');
  if (a && ACT[a.dataset.act]) ACT[a.dataset.act](a, e);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && layers.length) closeTop(); });
{
  const v = $('#view');
  v.addEventListener('pointerdown', holdStart);
  ['pointerup', 'pointercancel', 'scroll'].forEach(ev => v.addEventListener(ev, holdEnd, { passive: true }));
  v.addEventListener('pointermove', e => { if (HOLD && Math.hypot(e.clientX - HOLD.x0, e.clientY - HOLD.y0) > 12) holdEnd(); }, { passive: true });
  v.addEventListener('contextmenu', e => { if (e.target.closest('.habit .blob')) e.preventDefault(); });
}
if (window.visualViewport) {
  const vv = () => document.documentElement.style.setProperty('--vvh', window.visualViewport.height + 'px');
  window.visualViewport.addEventListener('resize', vv); vv();
}
document.addEventListener('visibilitychange', () => { duoPoll(); if (document.hidden) return; if (FS.running) fTick(); schedSync(); schedShare(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data && ['home', 'progress', 'focus', 'duo'].includes(e.data.tab)) { while (layers.length) closeTop(); go(e.data.tab); } });
schedSync(); // keeps the server current after an update or a new day
setInterval(() => { if (UI.day > today() || (!layers.length && UI.tab === 'home' && $('.day.on') && $('.day.on span').textContent === 'Today' && UI.day !== today())) { UI.day = today(); render({ still: true }); } }, 60000);

/* ---------- install / offline ---------- */
if ('serviceWorker' in navigator && STANDALONE && /^https?:$/.test(location.protocol)) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('./sw.js').catch(() => { });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    if (!layers.length && !FS.running) location.reload();
    else toast('Update ready. Reopen the app to get it.');
  });
}
if (['#focus', '#progress', '#duo'].includes(location.hash)) UI.tab = location.hash.slice(1);
schedShare();

render();
