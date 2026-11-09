// Reminder server for Do Some Work Idiot.
// The app sends each phone's push subscription, time zone and habit schedule to /sync.
// A cron runs every minute and pushes a notification when a habit's reminder time comes up.
import { sendPush } from './webpush.js';

const KEY = 'devices';
const MAX_DEVICES = 8;
const BEFORE = [0, 5, 10, 15, 30, 60];
const PUSH_HOSTS = ['fcm.googleapis.com', 'android.googleapis.com', 'push.services.mozilla.com', 'push.apple.com', 'notify.windows.com'];

/* ---------- time ---------- */
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
export function localNow(ms, tz) {
  const p = {};
  for (const x of new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23',
  }).formatToParts(new Date(ms))) p[x.type] = x.value;
  return { date: `${p.year}-${p.month}-${p.day}`, min: (Number(p.hour) % 24) * 60 + Number(p.minute), dow: WD[p.weekday] };
}
const nextDay = ymd => new Date(Date.parse(ymd + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10);
const dowOf = ymd => new Date(ymd + 'T00:00:00Z').getUTCDay();
const snoozed = (it, d) => !!it.snooze && d >= (it.snoozeFrom || '0000') && (it.snooze === 'forever' || d < it.snooze);

// Every reminder that should fire in the local minute `now` for one device.
export function dueNow(dev, ms) {
  const now = localNow(ms, dev.tz);
  const out = [];
  for (const it of dev.items) {
    for (const t of it.times) {
      const [h, m] = t.split(':').map(Number);
      let fire = h * 60 + m - (it.before || 0), day = now.date, dow = now.dow;
      if (fire < 0) { fire += 1440; day = nextDay(now.date); dow = dowOf(day); } // reminder lands the evening before
      if (fire !== now.min) continue;
      if (!it.days.includes(dow) || day < it.start || snoozed(it, day)) continue;
      if (dev.done && dev.done.date === day && dev.done.ids.includes(it.id)) continue;
      out.push({ it, t, day });
    }
  }
  return out;
}

function message(it, t) {
  const who = it.identity ? ` Become ${it.identity}.` : '';
  const body = it.before ? `In ${it.before} minutes, at ${t}.${who}` : `It's time. Do some work, idiot.${who}`;
  return { title: it.name, body, tag: `h-${it.id}`, hid: it.id };
}

/* ---------- input checks ---------- */
const str = (v, n) => String(v ?? '').slice(0, n);
const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
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
function validTz(tz) { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; } }

/* ---------- http ---------- */
function cors(req, env) {
  const origin = req.headers.get('Origin') || '';
  const ok = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).includes(origin);
  return ok ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : { Vary: 'Origin' };
}
const json = (data, status, headers) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const loadAll = async env => (await env.KV.get(KEY, 'json')) || {};

export default {
  async fetch(req, env) {
    const h = cors(req, env);
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (req.method === 'GET' && url.pathname === '/') return json({ ok: true, service: 'dswi-reminders' }, 200, h);
    if (req.method !== 'POST') return json({ error: 'not found' }, 404, h);
    if (!h['Access-Control-Allow-Origin']) return json({ error: 'origin not allowed' }, 403, h);

    let b; try { b = await req.json(); } catch { return json({ error: 'bad json' }, 400, h); }
    const id = typeof b.id === 'string' && /^[a-z0-9]{8,40}$/.test(b.id) ? b.id : null;
    if (!id) return json({ error: 'bad id' }, 400, h);
    const all = await loadAll(env);

    if (url.pathname === '/sync') {
      const sub = cleanSub(b.sub);
      if (!sub) return json({ error: 'bad subscription' }, 400, h);
      if (!validTz(b.tz)) return json({ error: 'bad time zone' }, 400, h);
      const done = b.done && isDate(b.done.date) && Array.isArray(b.done.ids) ? { date: b.done.date, ids: b.done.ids.slice(0, 100).map(x => str(x, 20)) } : null;
      all[id] = { sub, tz: b.tz, items: cleanItems(b.items), done, updated: Date.now() };
      const ids = Object.keys(all).sort((a, c) => all[c].updated - all[a].updated);
      for (const old of ids.slice(MAX_DEVICES)) delete all[old];
      await env.KV.put(KEY, JSON.stringify(all));
      return json({ ok: true, reminders: all[id].items.reduce((n, it) => n + it.times.length, 0) }, 200, h);
    }
    if (url.pathname === '/test') {
      const dev = all[id];
      if (!dev) return json({ error: 'this phone is not registered yet' }, 404, h);
      const status = await sendPush(dev.sub, { title: 'Reminders are on', body: 'This is what a nudge looks like. Now go do some work.', tag: 'test' }, env, { ttl: 300 });
      if (status === 404 || status === 410) { delete all[id]; await env.KV.put(KEY, JSON.stringify(all)); }
      return json({ ok: status >= 200 && status < 300, status }, 200, h);
    }
    if (url.pathname === '/remove') {
      if (all[id]) { delete all[id]; await env.KV.put(KEY, JSON.stringify(all)); }
      return json({ ok: true }, 200, h);
    }
    return json({ error: 'not found' }, 404, h);
  },

  async scheduled(event, env, ctx) {
    const all = await loadAll(env);
    let changed = false;
    const jobs = [];
    for (const [id, dev] of Object.entries(all)) {
      let due; try { due = dueNow(dev, event.scheduledTime); } catch { continue; }
      for (const { it, t } of due) {
        jobs.push(sendPush(dev.sub, message(it, t), env, { topic: `h${it.id}`.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) })
          .then(s => { console.log('push', it.id, t, 'status', s); if (s === 404 || s === 410) { delete all[id]; changed = true; } })
          .catch(e => console.log('push error', String(e))));
      }
    }
    await Promise.all(jobs);
    if (jobs.length) console.log(`cron ${new Date(event.scheduledTime).toISOString()}: ${jobs.length} reminder(s) sent`);
    if (changed) await env.KV.put(KEY, JSON.stringify(all));
  },
};
