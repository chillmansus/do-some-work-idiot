import test from 'node:test';
import assert from 'node:assert/strict';
import { createECDH, randomBytes } from 'node:crypto';
import worker from '../src/index.js';
import { b64u } from '../src/webpush.js';

const ORIGIN = 'https://chillmansus.github.io';

class KV {
  constructor() { this.m = new Map(); }
  async get(k, t) { const v = this.m.get(k); if (v === undefined) return null; return t === 'json' ? JSON.parse(v) : v; }
  async put(k, v) { this.m.set(k, v); }
  async delete(k) { this.m.delete(k); }
}

async function setup() {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
  const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const pub = b64u.enc(new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)));
  const env = { KV: new KV(), VAPID_PUBLIC: pub, VAPID_PRIVATE: jwk.d, VAPID_SUBJECT: 'https://example.test/', ALLOWED_ORIGINS: ORIGIN };
  const pushes = [];
  globalThis.fetch = async (url, init) => { pushes.push({ url: String(url), id: String(url).split('/').pop(), headers: init.headers }); return new Response(null, { status: 201 }); };
  return { env, pushes };
}

let n = 0;
function phone(withPush = true) {
  const id = `phone${++n}abcdefgh`;
  const e = createECDH('prime256v1'); e.generateKeys();
  return {
    id, key: b64u.enc(randomBytes(24)),
    sub: { endpoint: 'https://fcm.googleapis.com/fcm/send/' + id, keys: { p256dh: b64u.enc(e.getPublicKey()), auth: b64u.enc(randomBytes(16)) } },
    withPush,
  };
}
const call = async (env, path, body, origin = ORIGIN) => {
  const res = await worker.fetch(new Request('https://w.test' + path, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), env);
  return [res.status, await res.json()];
};
const as = (p, extra = {}) => ({ id: p.id, key: p.key, ...extra });
const reg = (env, p) => call(env, '/sync', as(p, { sub: p.sub, tz: 'Asia/Ho_Chi_Minh', items: [], done: null }));
const row = (id, done, extra = {}) => ({ id, name: 'Read', v: done ? 5 : 2, goal: 5, unit: 'pages', streak: 3, done, ...extra });
const shareOf = (p, rows, extra = {}) => as(p, { name: 'Linh', date: '2026-11-10', rows, ...extra });

async function paired() {
  const ctx = await setup();
  const a = phone(), b = phone();
  await reg(ctx.env, a); await reg(ctx.env, b);
  const [, inv] = await call(ctx.env, '/invite', as(a));
  const [st] = await call(ctx.env, '/join', as(b, { code: inv.code, name: 'Minh' }));
  assert.equal(st, 200);
  ctx.pushes.length = 0;
  return { ...ctx, a, b, code: inv.code };
}

test('invite, join, then each phone sees the other one\'s progress', async () => {
  const { env, a, b, code } = await paired();
  assert.match(code, /^[A-HJKMNP-Z2-9]{6}$/);
  await call(env, '/share', shareOf(a, [row('h1', false), row('h2', true)]));
  await call(env, '/share', as(b, { name: 'Minh', date: '2026-11-10', rows: [row('x', true)] }));
  const [, seenByB] = await call(env, '/partner', as(b));
  assert.equal(seenByB.linked, true);
  assert.equal(seenByB.name, 'Linh');
  assert.deepEqual(seenByB.rows.map(r => [r.id, r.done]), [['h1', false], ['h2', true]]);
  const [, seenByA] = await call(env, '/partner', as(a));
  assert.equal(seenByA.name, 'Minh');
  assert.equal(seenByA.rows.length, 1);
});

test('wrong key, no key and strangers get nothing', async () => {
  const { env, a, b } = await paired();
  await call(env, '/share', shareOf(a, [row('h1', true)]));
  const imposter = { ...a, key: b64u.enc(randomBytes(24)) };
  assert.equal((await call(env, '/partner', as(imposter)))[0], 401);
  assert.equal((await call(env, '/partner', { id: a.id }))[0], 401);
  const stranger = phone();
  const [st, body] = await call(env, '/partner', as(stranger));
  assert.equal(st, 200); assert.equal(body.linked, false); assert.equal(body.rows, undefined);
  assert.equal((await call(env, '/partner', as(b)))[1].linked, true);
  assert.equal((await call(env, '/partner', as(a), 'https://evil.example'))[0], 403);
});

test('a code works once, not for yourself, and guessing is limited', async () => {
  const { env, a } = await setup().then(async c => ({ ...c, a: phone() }));
  const b = phone(), c = phone(), d = phone();
  const [, inv] = await call(env, '/invite', as(a));
  assert.equal((await call(env, '/join', as(a, { code: inv.code })))[0], 400);
  assert.equal((await call(env, '/join', as(b, { code: inv.code.toLowerCase().replace(/^(...)/, '$1-') })))[0], 200);
  assert.equal((await call(env, '/join', as(c, { code: inv.code })))[0], 404);
  for (let i = 0; i < 10; i++) await call(env, '/join', as(d, { code: 'ZZZZZ' + i }));
  const [st] = await call(env, '/join', as(d, { code: inv.code }));
  assert.equal(st, 429);
  // already paired with each other: a second code between the same two does nothing
  const [, again] = await call(env, '/invite', as(a));
  assert.equal((await call(env, '/join', as(b, { code: again.code })))[0], 409);
});

test('a hub sees every partner, each partner sees only the hub', async () => {
  const { env, pushes } = await setup();
  const hub = phone(), x = phone(), y = phone();
  for (const p of [hub, x, y]) await reg(env, p);
  for (const p of [x, y]) {
    const [, inv] = await call(env, '/invite', as(hub));
    assert.equal((await call(env, '/join', as(p, { code: inv.code })))[0], 200);
  }
  await call(env, '/share', shareOf(hub, [row('h', false)], { name: 'Hub' }));
  await call(env, '/share', shareOf(x, [row('x', true)], { name: 'X' }));
  await call(env, '/share', shareOf(y, [row('y', false)], { name: 'Y' }));
  const [, seenByHub] = await call(env, '/partner', as(hub));
  assert.deepEqual(seenByHub.partners.map(p => p.name), ['X', 'Y']);
  assert.equal(seenByHub.name, 'X', 'old app versions still get the first partner at the top level');
  for (const p of [x, y]) {
    const [, seen] = await call(env, '/partner', as(p));
    assert.deepEqual(seen.partners.map(q => q.name), ['Hub']);
  }
  // a nudge goes only to the chosen partner
  pushes.length = 0;
  const yRef = seenByHub.partners[1].ref;
  assert.equal((await call(env, '/nudge', as(hub, { partner: yRef })))[1].sent, true);
  assert.deepEqual(pushes.map(p => p.id), [y.id]);
  // finishing everything tells every partner
  pushes.length = 0;
  await call(env, '/share', shareOf(hub, [row('h', true)], { name: 'Hub' }));
  assert.deepEqual(pushes.map(p => p.id).sort(), [x.id, y.id].sort());
  // a ref from someone else's view does not work for you
  assert.equal((await call(env, '/nudge', as(x, { partner: yRef })))[0], 409);
  // leaving one link keeps the other, and keeps the hub's share for the one left
  pushes.length = 0;
  await call(env, '/leave', as(hub, { partner: yRef }));
  assert.deepEqual(pushes.map(p => p.id), [y.id]);
  assert.deepEqual((await call(env, '/partner', as(hub)))[1].partners.map(p => p.name), ['X']);
  assert.equal((await call(env, '/partner', as(y)))[1].linked, false);
  assert.equal(env.KV.m.has(`share:${hub.id}`), true);
  assert.equal(env.KV.m.has(`share:${y.id}`), false);
  assert.equal(env.KV.m.has(`share:${x.id}`), true);
});

test('a phone can have at most 5 partners, and old single-partner records still work', async () => {
  const { env } = await setup();
  const hub = phone();
  for (let i = 0; i < 5; i++) {
    const [, inv] = await call(env, '/invite', as(hub));
    assert.equal((await call(env, '/join', as(phone(), { code: inv.code })))[0], 200);
  }
  assert.equal((await call(env, '/invite', as(hub)))[0], 409);
  // first-version record
  const a = phone(), b = phone();
  env.KV.m.set('pair:' + a.id, JSON.stringify({ partner: b.id }));
  env.KV.m.set('pair:' + b.id, JSON.stringify({ partner: a.id }));
  await call(env, '/share', shareOf(b, [], { name: 'B' }));
  const [, seen] = await call(env, '/partner', as(a));
  assert.deepEqual(seen.partners.map(p => p.name), ['B']);
  const c = phone();
  const [, inv] = await call(env, '/invite', as(a));
  assert.equal((await call(env, '/join', as(c, { code: inv.code })))[0], 200);
  assert.equal((await call(env, '/partner', as(a)))[1].partners.length, 2);
});

test('finishing everything tells the partner once, and respects their switch', async () => {
  const { env, pushes, a, b } = await paired();
  await call(env, '/share', shareOf(a, [row('h1', false), row('h2', true)]));
  assert.equal(pushes.length, 0);
  await call(env, '/share', shareOf(a, [row('h1', true), row('h2', true)]));
  assert.equal(pushes.length, 1);
  assert.equal(pushes[0].id, b.id);
  await call(env, '/share', shareOf(a, [row('h1', true), row('h2', true)]));
  assert.equal(pushes.length, 1, 'same state twice is not news');
  // partner turns finished alerts off
  await call(env, '/share', as(b, { name: 'Minh', date: '2026-11-10', rows: [], prefs: { fin: false } }));
  await call(env, '/share', shareOf(a, [row('h1', false), row('h2', true)]));
  await call(env, '/share', shareOf(a, [row('h1', true), row('h2', true)]));
  assert.equal(pushes.length, 1);
});

test('nudge reaches the partner unless they switched it off or have no push', async () => {
  const { env, pushes, a, b } = await paired();
  await call(env, '/share', shareOf(a, [row('h1', false)]));
  const [, r1] = await call(env, '/nudge', as(a));
  assert.equal(r1.sent, true);
  assert.equal(pushes.at(-1).id, b.id);
  await call(env, '/share', as(b, { name: 'Minh', date: '2026-11-10', rows: [], prefs: { nudge: false } }));
  const [, r2] = await call(env, '/nudge', as(a));
  assert.deepEqual([r2.sent, r2.reason], [false, 'off']);
  const [, seen] = await call(env, '/partner', as(a));
  assert.equal(seen.nudgeOff, true);
  // a partner who never turned reminders on cannot be nudged
  const ctx = await setup(); const x = phone(), y = phone();
  await call(ctx.env, '/share', shareOf(x, [])); await call(ctx.env, '/share', shareOf(y, []));
  const [, inv] = await call(ctx.env, '/invite', as(x)); await call(ctx.env, '/join', as(y, { code: inv.code }));
  const [, r3] = await call(ctx.env, '/nudge', as(x));
  assert.deepEqual([r3.sent, r3.reason], [false, 'no-push']);
});

test('leaving wipes the shared data for both and tells the partner', async () => {
  const { env, pushes, a, b } = await paired();
  await call(env, '/share', shareOf(a, [row('h1', false)]));
  await call(env, '/share', as(b, { name: 'Minh', date: '2026-11-10', rows: [row('x', true)] }));
  await call(env, '/leave', as(a));
  assert.equal(pushes.some(p => p.id === b.id), true);
  for (const k of [`pair:${a.id}`, `pair:${b.id}`, `share:${a.id}`, `share:${b.id}`]) assert.equal(env.KV.m.has(k), false, k);
  assert.equal((await call(env, '/partner', as(b)))[1].linked, false);
  // they can pair again, with someone else if they like
  const [, inv] = await call(env, '/invite', as(b));
  assert.equal((await call(env, '/join', as(a, { code: inv.code })))[0], 200);
});

test('the old single-blob data is migrated and the cron still sends reminders', async () => {
  const { env, pushes } = await setup();
  const p = phone();
  env.KV.m.set('devices', JSON.stringify({
    [p.id]: { sub: p.sub, tz: 'Asia/Ho_Chi_Minh', done: null, updated: 1, items: [{ id: 'h1', name: 'Read', identity: '', days: [0, 1, 2, 3, 4, 5, 6], times: ['07:30'], before: 0, start: '2026-01-01', snooze: null, snoozeFrom: null }] },
  }));
  await worker.scheduled({ scheduledTime: Date.parse('2026-11-09T00:30:00Z') }, env);
  assert.equal(pushes.length, 1);
  assert.equal(pushes[0].id, p.id);
  assert.equal(env.KV.m.has('devices'), false);
  assert.deepEqual(JSON.parse(env.KV.m.get('idx')), [p.id]);
  await worker.scheduled({ scheduledTime: Date.parse('2026-11-09T00:31:00Z') }, env);
  assert.equal(pushes.length, 1);
});

test('each phone gets notifications in its own words', async () => {
  const { env, pushes, a, b } = await paired();
  // the receiver (b) sets its own title and line; a has none
  await call(env, '/sync', as(b, { sub: b.sub, tz: 'Asia/Ho_Chi_Minh', items: [{ id: 'h1', name: 'Read', days: [0, 1, 2, 3, 4, 5, 6], times: ['07:30'], start: '2026-01-01' }], done: null,
    msg: { title: '  Hey   Minh ', line: 'Cố lên nào!' } }));
  assert.deepEqual(JSON.parse(env.KV.m.get('dev:' + b.id)).msg, { title: 'Hey Minh', line: 'Cố lên nào!' });
  const bodies = [];
  globalThis.fetch = async (url, init) => { pushes.push({ id: String(url).split('/').pop() }); bodies.push(init); return new Response(null, { status: 201 }); };
  await call(env, '/nudge', as(a));
  assert.equal(pushes.at(-1).id, b.id);
  await worker.scheduled({ scheduledTime: Date.parse('2026-11-09T00:30:00Z') }, env);
  assert.equal(pushes.at(-1).id, b.id);
  // payloads are encrypted, so check the wording through the message builder directly
  const { message, lineOf, titleOf } = await import('../src/schedule.js');
  const m = message({ id: 'h1', name: 'Read', identity: 'a reader', before: 0 }, '07:30', { title: 'Hey Minh', line: 'Cố lên nào!' });
  assert.deepEqual([m.title, m.body], ['Hey Minh', "Read. It's time. Cố lên nào! Become a reader."]);
  assert.deepEqual([titleOf(null), lineOf({ title: 'x', line: '' })], ['Your future self is sending this', 'Do some work, idiot.']);
  // clearing both falls back to the defaults
  await call(env, '/sync', as(b, { sub: b.sub, tz: 'Asia/Ho_Chi_Minh', items: [], done: null, msg: { title: ' ', line: '' } }));
  assert.equal(JSON.parse(env.KV.m.get('dev:' + b.id)).msg, null);
});

test('a phone that never sent a key is let in once, then must keep using it', async () => {
  const { env } = await setup();
  const p = phone();
  const body = { id: p.id, sub: p.sub, tz: 'UTC', items: [], done: null };
  assert.equal((await call(env, '/sync', body))[0], 200);
  assert.equal((await call(env, '/sync', { ...body, key: p.key }))[0], 200);
  assert.equal((await call(env, '/sync', body))[0], 401);
  assert.equal((await call(env, '/sync', { ...body, key: b64u.enc(randomBytes(24)) }))[0], 401);
});

test('the server refuses new phones past its cap but keeps serving existing ones', async () => {
  const { env } = await setup();
  const first = phone();
  await reg(env, first);
  for (let i = 0; i < 19; i++) await reg(env, phone());
  assert.equal((await reg(env, phone()))[0], 429);
  assert.equal((await reg(env, first))[0], 200);
});
