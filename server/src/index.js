// Server for Do Some Work Idiot: habit reminders (web push) and Duo mode (private two-way links, up to 5 per phone).
//
// Storage (Workers KV, one small key per thing so two phones never overwrite each other):
//   idx            list of device ids that have a push subscription (the cron walks this)
//   dev:<id>       push subscription, time zone and reminder schedule of one phone
//   auth:<id>      sha-256 of that phone's secret key (set on first contact, then required)
//   share:<id>     what that phone shares with its partners: name and today's progress
//   pair:<id>      who that phone is paired with: { partners: [ids] } (first version: { partner: id })
//   code:<CODE>    one-time invite code -> inviter id (expires after 24 h)
//   invite:<id>    the invite code currently open for that phone
//   fail:<id>      wrong-code counter (stops guessing)
import { sendPush } from './webpush.js';
import { dueNow, message, TITLE } from './schedule.js';

const MAX_DEVICES = 20;
const BEFORE = [0, 5, 10, 15, 30, 60];
const PUSH_HOSTS = ['fcm.googleapis.com', 'android.googleapis.com', 'push.services.mozilla.com', 'push.apple.com', 'notify.windows.com'];
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
const CODE_TTL = 24 * 3600;
const MAX_FAILS = 10;
const MAX_PARTNERS = 5;

/* ---------- input checks ---------- */
const str = (v, n) => String(v ?? '').slice(0, n);
const num = v => (Number.isFinite(Number(v)) ? Math.round(Number(v) * 100) / 100 : 0);
const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const ID_RE = /^[a-z0-9]{8,40}$/;
const KEY_RE = /^[A-Za-z0-9_-]{22,64}$/;
function cleanSub(s) {
  if (!s || typeof s.endpoint !== 'string' || !s.keys || typeof s.keys.p256dh !== 'string' || typeof s.keys.auth !== 'string') return null;
  let u; try { u = new URL(s.endpoint); } catch { return null; }
  if (u.protocol !== 'https:' || !PUSH_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h))) return null;
  return { endpoint: s.endpoint.slice(0, 1000), keys: { p256dh: str(s.keys.p256dh, 120), auth: str(s.keys.auth, 40) } };
}
function cleanItems(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 100).map(x => ({
    id: str(x.id, 20),
    name: str(x.name, 80) || 'Your habit',
    identity: str(x.identity, 80),
    days: Array.isArray(x.days) ? x.days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6) : [],
    times: Array.isArray(x.times) ? x.times.filter(t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t)).slice(0, 10) : [],
    before: BEFORE.includes(x.before) ? x.before : 0,
    start: isDate(x.start) ? x.start : '0000-01-01',
    snooze: x.snooze === 'forever' || isDate(x.snooze) ? x.snooze : null,
    snoozeFrom: isDate(x.snoozeFrom) ? x.snoozeFrom : null,
  })).filter(x => x.id && x.times.length && x.days.length);
}
function cleanShare(b) {
  const rows = Array.isArray(b.rows) ? b.rows.slice(0, 60).map(r => ({
    id: str(r.id, 20), name: str(r.name, 80) || 'Habit', color: /^[a-z]{1,10}$/.test(r.color) ? r.color : 'ember', v: num(r.v), goal: num(r.goal) || 1, unit: str(r.unit, 20),
    streak: Math.max(0, Math.min(99999, Math.floor(num(r.streak)))), done: !!r.done,
  })).filter(r => r.id) : [];
  return { name: str(b.name, 40).trim(), date: isDate(b.date) ? b.date : null, rows, prefs: { nudge: !(b.prefs && b.prefs.nudge === false), fin: !(b.prefs && b.prefs.fin === false) } };
}
const validTz = tz => { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return typeof tz === 'string'; } catch { return false; } };
const normCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), x => CODE_CHARS[x % CODE_CHARS.length]).join('');
async function sha256(s) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  return Array.from(d, b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- storage ---------- */
const kget = (env, k) => env.KV.get(k, 'json');
const kput = (env, k, v, opts) => env.KV.put(k, JSON.stringify(v), opts);
const kdel = (env, k) => env.KV.delete(k);

// The first version kept every phone in one "devices" blob. Split it up once.
async function loadIdx(env) {
  const idx = await kget(env, 'idx');
  if (idx) return idx;
  const old = await kget(env, 'devices');
  if (!old) return [];
  const ids = Object.keys(old);
  for (const id of ids) await kput(env, 'dev:' + id, old[id]);
  await kput(env, 'idx', ids);
  await kdel(env, 'devices');
  return ids;
}
async function dropDevice(env, id) {
  await kdel(env, 'dev:' + id);
  const idx = await loadIdx(env);
  if (idx.includes(id)) await kput(env, 'idx', idx.filter(x => x !== id));
}

// A phone proves who it is with a secret key it generated itself. The server keeps only a hash of it.
// `hard` routes need the key; the old reminder routes accept a phone that has never sent one yet.
async function authenticate(env, id, key, hard) {
  const rec = await kget(env, 'auth:' + id);
  if (!key) return !hard && !rec;
  if (!KEY_RE.test(key)) return false;
  const h = await sha256(key);
  if (!rec) { await kput(env, 'auth:' + id, { h }); return true; }
  return rec.h === h;
}

/* ---------- push helpers ---------- */
async function notify(env, toId, payload, ttl = 3600) {
  const dev = await kget(env, 'dev:' + toId);
  if (!dev || !dev.sub) return false;
  try {
    const s = await sendPush(dev.sub, payload, env, { ttl, topic: str(payload.tag, 32).replace(/[^A-Za-z0-9_-]/g, '') || undefined });
    if (s === 404 || s === 410) { await dropDevice(env, toId); return false; }
    return s >= 200 && s < 300;
  } catch (e) { console.log('push error', String(e)); return false; }
}
const nameOf = sh => (sh && sh.name) || 'Your partner';
const allDone = sh => !!sh && sh.rows.length > 0 && sh.rows.every(r => r.done);

/* ---------- routes ---------- */
const ok = (data = {}) => [{ ok: true, ...data }, 200];
const fail = (error, status = 400) => [{ error }, status];

async function sync(env, id, b) {
  const sub = cleanSub(b.sub);
  if (!sub) return fail('bad subscription');
  if (!validTz(b.tz)) return fail('bad time zone');
  const done = b.done && isDate(b.done.date) && Array.isArray(b.done.ids) ? { date: b.done.date, ids: b.done.ids.slice(0, 100).map(x => str(x, 20)) } : null;
  const idx = await loadIdx(env);
  if (!idx.includes(id)) {
    if (idx.length >= MAX_DEVICES) return fail('the reminder server is full', 429);
    await kput(env, 'idx', [...idx, id]);
  }
  const dev = { sub, tz: b.tz, items: cleanItems(b.items), done, updated: Date.now() };
  await kput(env, 'dev:' + id, dev);
  return ok({ reminders: dev.items.reduce((n, it) => n + it.times.length, 0) });
}
async function test(env, id) {
  const dev = await kget(env, 'dev:' + id);
  if (!dev) return fail('this phone is not registered yet', 404);
  const status = await sendPush(dev.sub, { title: TITLE, body: 'Reminders are on. This is what a nudge looks like. Now go do some work.', tag: 'test' }, env, { ttl: 300 });
  if (status === 404 || status === 410) await dropDevice(env, id);
  return [{ ok: status >= 200 && status < 300, status }, 200];
}
async function remove(env, id) { await dropDevice(env, id); return ok(); }

/* ---------- duo links ---------- */
// A phone can be linked to up to MAX_PARTNERS others. Every link is two-way and private to that pair:
// if A is linked to B and C, A sees both, while B and C each see only A.
async function partnersOf(env, id) {
  const pr = await kget(env, 'pair:' + id);
  if (!pr) return [];
  if (Array.isArray(pr.partners)) return pr.partners.filter(x => typeof x === 'string');
  return pr.partner ? [pr.partner] : []; // first version: one partner
}
const savePartners = (env, id, list) => list.length ? kput(env, 'pair:' + id, { partners: list }) : kdel(env, 'pair:' + id);
const refOf = async (me, other) => (await sha256(me + ':' + other)).slice(0, 16);
async function pickPartner(env, id, ref) {
  const list = await partnersOf(env, id);
  if (!ref) return list[0] || null;
  for (const p of list) if (await refOf(id, p) === ref) return p;
  return null;
}

async function share(env, id, b) {
  const next = cleanShare(b);
  if (!next.date) return fail('bad date');
  const prev = await kget(env, 'share:' + id);
  const same = prev && JSON.stringify({ n: prev.name, d: prev.date, r: prev.rows, p: prev.prefs }) === JSON.stringify({ n: next.name, d: next.date, r: next.rows, p: next.prefs });
  if (!same) await kput(env, 'share:' + id, { ...next, updated: Date.now() });
  const list = await partnersOf(env, id);
  if (!list.length) return ok({ linked: false });
  const wasDone = !!prev && prev.date === next.date && allDone(prev);
  if (!same && allDone(next) && !wasDone) {
    await Promise.all(list.map(async p => {
      const theirs = await kget(env, 'share:' + p);
      if (!theirs || theirs.prefs.fin) await notify(env, p, { title: `${nameOf(next)} finished everything today`, body: 'Your turn. Do some work, idiot.', tag: 'fin', tab: 'duo' });
    }));
  }
  return ok({ linked: true });
}
async function partner(env, id) {
  const list = await partnersOf(env, id);
  if (!list.length) return ok({ linked: false, partners: [], max: MAX_PARTNERS });
  const partners = await Promise.all(list.map(async p => {
    const [sh, dev] = await Promise.all([kget(env, 'share:' + p), kget(env, 'dev:' + p)]);
    return {
      ref: await refOf(id, p),
      name: nameOf(sh), date: sh ? sh.date : null, rows: sh ? sh.rows : [], updated: sh ? sh.updated : null,
      canNudge: !!(dev && dev.sub) && (!sh || sh.prefs.nudge),
      nudgeOff: !!sh && !sh.prefs.nudge, noPush: !(dev && dev.sub),
    };
  }));
  const { ref, ...first } = partners[0]; // top-level copy of the first partner for older app versions
  return ok({ linked: true, ...first, partners, max: MAX_PARTNERS });
}
async function invite(env, id) {
  if ((await partnersOf(env, id)).length >= MAX_PARTNERS) return fail(`you already have ${MAX_PARTNERS} partners`, 409);
  const old = await kget(env, 'invite:' + id);
  if (old && old.code) await kdel(env, 'code:' + old.code);
  let code = makeCode();
  for (let i = 0; i < 5 && await kget(env, 'code:' + code); i++) code = makeCode();
  await kput(env, 'code:' + code, { id }, { expirationTtl: CODE_TTL });
  await kput(env, 'invite:' + id, { code }, { expirationTtl: CODE_TTL });
  return ok({ code, expiresIn: CODE_TTL });
}
async function join(env, id, b) {
  const f = (await kget(env, 'fail:' + id)) || { n: 0 };
  if (f.n >= MAX_FAILS) return fail('too many wrong codes, try again in an hour', 429);
  const code = normCode(b.code);
  const rec = /^[A-Z0-9]{6}$/.test(code) ? await kget(env, 'code:' + code) : null;
  if (!rec) {
    await kput(env, 'fail:' + id, { n: f.n + 1 }, { expirationTtl: 3600 });
    return fail("That code doesn't work. It may have expired.", 404);
  }
  if (rec.id === id) return fail("That's your own code. Send it to your partner.");
  const [mine, theirs] = await Promise.all([partnersOf(env, id), partnersOf(env, rec.id)]);
  if (mine.includes(rec.id)) { await kdel(env, 'code:' + code); return fail("You're already paired with them.", 409); }
  if (mine.length >= MAX_PARTNERS) return fail(`you already have ${MAX_PARTNERS} partners`, 409);
  if (theirs.length >= MAX_PARTNERS) { await kdel(env, 'code:' + code); return fail('that person already has the most partners allowed', 409); }
  await Promise.all([savePartners(env, id, [...mine, rec.id]), savePartners(env, rec.id, [...theirs, id])]);
  await Promise.all([kdel(env, 'code:' + code), kdel(env, 'invite:' + rec.id), kdel(env, 'fail:' + id)]);
  const who = str(b.name, 40).trim() || 'Your partner';
  await notify(env, rec.id, { title: 'Duo connected', body: `${who} joined. Check how they're doing.`, tag: 'pair', tab: 'duo' });
  return ok();
}
// Ends one link (b.partner = its ref) or, without a ref, every link of this phone.
// A phone's shared progress is deleted from the server once it has no partners left.
async function leave(env, id, b) {
  const list = await partnersOf(env, id);
  let gone = list;
  if (b.partner) {
    const p = await pickPartner(env, id, str(b.partner, 32));
    if (!p) return fail('not paired with that person', 404);
    gone = [p];
  }
  const rest = list.filter(x => !gone.includes(x));
  const mine = await kget(env, 'share:' + id);
  const jobs = [savePartners(env, id, rest)];
  if (!rest.length) jobs.push(kdel(env, 'share:' + id));
  if (!b.partner) {
    const inv = await kget(env, 'invite:' + id);
    jobs.push(kdel(env, 'invite:' + id));
    if (inv && inv.code) jobs.push(kdel(env, 'code:' + inv.code));
  }
  for (const p of gone) {
    const theirs = (await partnersOf(env, p)).filter(x => x !== id);
    jobs.push(savePartners(env, p, theirs));
    if (!theirs.length) jobs.push(kdel(env, 'share:' + p));
  }
  await Promise.all(jobs);
  await Promise.all(gone.map(p => notify(env, p, { title: 'Duo ended', body: `${nameOf(mine)} left. Your shared progress with them is gone from the server.`, tag: 'pair', tab: 'duo' })));
  return ok({ left: gone.length, partners: rest.length });
}
async function nudge(env, id, b) {
  const p = await pickPartner(env, id, b.partner ? str(b.partner, 32) : null);
  if (!p) return fail('you are not paired', 409);
  const [theirs, mine] = await Promise.all([kget(env, 'share:' + p), kget(env, 'share:' + id)]);
  if (theirs && !theirs.prefs.nudge) return ok({ sent: false, reason: 'off' });
  const dev = await kget(env, 'dev:' + p);
  if (!dev || !dev.sub) return ok({ sent: false, reason: 'no-push' });
  const sent = await notify(env, p, { title: `${nameOf(mine)} nudged you`, body: 'Do some work, idiot.', tag: 'nudge', tab: 'duo' });
  return ok({ sent, reason: sent ? null : 'failed' });
}

const ROUTES = {
  '/sync': { hard: false, run: sync }, '/test': { hard: false, run: test }, '/remove': { hard: false, run: remove },
  '/share': { hard: true, run: share }, '/partner': { hard: true, run: partner },
  '/invite': { hard: true, run: invite }, '/join': { hard: true, run: join },
  '/leave': { hard: true, run: leave }, '/nudge': { hard: true, run: nudge },
};

/* ---------- http ---------- */
function cors(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).includes(origin);
  return allowed ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : { Vary: 'Origin' };
}
const json = (data, status, headers) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });

export default {
  async fetch(req, env) {
    const h = cors(req, env);
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (req.method === 'GET' && url.pathname === '/') return json({ ok: true, service: 'dswi-reminders' }, 200, h);
    const route = ROUTES[url.pathname];
    if (req.method !== 'POST' || !route) return json({ error: 'not found' }, 404, h);
    if (!h['Access-Control-Allow-Origin']) return json({ error: 'origin not allowed' }, 403, h);

    const text = await req.text();
    if (text.length > 60000) return json({ error: 'too big' }, 413, h);
    let b; try { b = JSON.parse(text); } catch { return json({ error: 'bad json' }, 400, h); }
    if (!b || typeof b !== 'object') return json({ error: 'bad json' }, 400, h);
    const id = typeof b.id === 'string' && ID_RE.test(b.id) ? b.id : null;
    if (!id) return json({ error: 'bad id' }, 400, h);
    if (!await authenticate(env, id, b.key, route.hard)) return json({ error: 'not allowed' }, 401, h);

    const [data, status] = await route.run(env, id, b);
    return json(data, status, h);
  },

  async scheduled(event, env) {
    const idx = await loadIdx(env);
    const devs = await Promise.all(idx.map(async id => [id, await kget(env, 'dev:' + id)]));
    const gone = new Set();
    const jobs = [];
    for (const [id, dev] of devs) {
      if (!dev) { gone.add(id); continue; }
      let due; try { due = dueNow(dev, event.scheduledTime); } catch { continue; }
      for (const { it, t } of due) {
        jobs.push(sendPush(dev.sub, message(it, t), env, { topic: `h${it.id}`.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) })
          .then(s => { console.log('push', it.id, t, 'status', s); if (s === 404 || s === 410) gone.add(id); })
          .catch(e => console.log('push error', String(e))));
      }
    }
    await Promise.all(jobs);
    if (jobs.length) console.log(`cron ${new Date(event.scheduledTime).toISOString()}: ${jobs.length} reminder(s) sent`);
    if (gone.size) {
      const cur = await loadIdx(env);
      await kput(env, 'idx', cur.filter(x => !gone.has(x)));
      await Promise.all([...gone].map(id => kdel(env, 'dev:' + id)));
    }
  },
};
