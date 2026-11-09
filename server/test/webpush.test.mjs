import test from 'node:test';
import assert from 'node:assert/strict';
import { createECDH, randomBytes } from 'node:crypto';
import ece from 'http_ece';
import { encrypt, vapidHeader, b64u } from '../src/webpush.js';
import { dueNow, localNow } from '../src/index.js';

test('payload decrypts with an independent aes128gcm implementation', async () => {
  const ua = createECDH('prime256v1'); ua.generateKeys();
  const auth = randomBytes(16);
  const msg = JSON.stringify({ title: 'Read 5 pages', body: "It's time. Ünïcødé ✓" });
  const body = await encrypt(msg, b64u.enc(ua.getPublicKey()), b64u.enc(auth));
  const out = ece.decrypt(Buffer.from(body), { version: 'aes128gcm', privateKey: ua, authSecret: auth });
  assert.equal(out.toString('utf8'), msg);
});

test('VAPID token is a valid ES256 JWT for the push origin', async () => {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const pub = b64u.enc(new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)));
  const hdr = await vapidHeader('https://fcm.googleapis.com/fcm/send/abc', pub, jwk.d, 'https://example.test/');
  const m = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(hdr);
  assert.ok(m, hdr);
  assert.equal(m[4], pub);
  const claims = JSON.parse(new TextDecoder().decode(b64u.dec(m[2])));
  assert.equal(claims.aud, 'https://fcm.googleapis.com');
  assert.ok(claims.exp > Date.now() / 1000);
  const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, kp.publicKey, b64u.dec(m[3]), new TextEncoder().encode(`${m[1]}.${m[2]}`));
  assert.ok(ok);
});

const at = iso => Date.parse(iso);
const dev = (items, extra = {}) => ({ tz: 'Asia/Ho_Chi_Minh', items, ...extra });
const item = o => ({ id: 'h1', name: 'Read', days: [0, 1, 2, 3, 4, 5, 6], times: ['07:30'], before: 0, start: '2026-01-01', snooze: null, snoozeFrom: null, ...o });

test('local time follows the phone time zone', () => {
  // 00:30 UTC on Mon 9 Nov 2026 is 07:30 the same day in Vietnam (UTC+7)
  assert.deepEqual(localNow(at('2026-11-09T00:30:00Z'), 'Asia/Ho_Chi_Minh'), { date: '2026-11-09', min: 450, dow: 1 });
});

test('fires exactly at the habit time, and only then', () => {
  assert.equal(dueNow(dev([item()]), at('2026-11-09T00:30:00Z')).length, 1);
  assert.equal(dueNow(dev([item()]), at('2026-11-09T00:31:00Z')).length, 0);
  assert.equal(dueNow(dev([item()]), at('2026-11-09T00:29:00Z')).length, 0);
});

test('minutes-before shifts the time, across midnight too', () => {
  assert.equal(dueNow(dev([item({ before: 15 })]), at('2026-11-09T00:15:00Z')).length, 1);
  // habit at 00:10 Tuesday, remind 30 min before = 23:40 Monday local = 16:40 UTC Monday
  const r = dueNow(dev([item({ times: ['00:10'], before: 30, days: [2] })]), at('2026-11-09T16:40:00Z'));
  assert.equal(r.length, 1);
  assert.equal(r[0].day, '2026-11-10');
});

test('skips days off, snoozed days, habits not started, and habits already done', () => {
  const t = at('2026-11-09T00:30:00Z'); // Monday
  assert.equal(dueNow(dev([item({ days: [2, 3] })]), t).length, 0);
  assert.equal(dueNow(dev([item({ snooze: '2026-11-12', snoozeFrom: '2026-11-08' })]), t).length, 0);
  assert.equal(dueNow(dev([item({ snooze: 'forever', snoozeFrom: '2026-11-01' })]), t).length, 0);
  assert.equal(dueNow(dev([item({ snooze: '2026-11-09', snoozeFrom: '2026-11-01' })]), t).length, 1); // snooze ended
  assert.equal(dueNow(dev([item({ start: '2026-11-10' })]), t).length, 0);
  assert.equal(dueNow(dev([item()], { done: { date: '2026-11-09', ids: ['h1'] } }), t).length, 0);
  assert.equal(dueNow(dev([item()], { done: { date: '2026-11-08', ids: ['h1'] } }), t).length, 1);
});
