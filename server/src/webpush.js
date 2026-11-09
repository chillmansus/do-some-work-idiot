// Web Push with nothing but WebCrypto: VAPID (RFC 8292) + aes128gcm payload encryption (RFC 8291).
// Runs in Cloudflare Workers and in Node 20+.

const te = new TextEncoder();

export const b64u = {
  enc(buf) {
    const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  dec(str) {
    const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  },
};

const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

async function hkdf(salt, ikm, info, bytes) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8));
}

// Encrypt one message for one subscription. `opts.salt` and `opts.serverKeys` exist only for tests.
export async function encrypt(plaintext, p256dh, auth, opts = {}) {
  const uaPublic = b64u.dec(p256dh);
  const authSecret = b64u.dec(auth);
  const serverKeys = opts.serverKeys || await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeys.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, serverKeys.privateKey, 256));

  const ikm = await hkdf(authSecret, ecdh, concat(te.encode('WebPush: info\0'), uaPublic, asPublic), 32);
  const salt = opts.salt || crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);

  const body = typeof plaintext === 'string' ? te.encode(plaintext) : plaintext;
  const padded = concat(body, new Uint8Array([2])); // 0x02 marks the last (only) record
  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, padded));

  const rs = new Uint8Array(4); new DataView(rs.buffer).setUint32(0, 4096);
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, cipher);
}

// VAPID: a short signed JWT that proves the push came from us.
export async function vapidHeader(endpoint, publicKey, privateKey, subject) {
  const pub = b64u.dec(publicKey);
  const jwk = { kty: 'EC', crv: 'P-256', d: privateKey, x: b64u.enc(pub.slice(1, 33)), y: b64u.enc(pub.slice(33, 65)), ext: true };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u.enc(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u.enc(te.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(`${head}.${claims}`));
  return `vapid t=${head}.${claims}.${b64u.enc(sig)}, k=${publicKey}`;
}

// Send one push. Returns the push service's HTTP status (201 = accepted, 404/410 = subscription is gone).
export async function sendPush(sub, payload, env, { ttl = 1800, urgency = 'high', topic } = {}) {
  const body = await encrypt(JSON.stringify(payload), sub.keys.p256dh, sub.keys.auth);
  const headers = {
    Authorization: await vapidHeader(sub.endpoint, env.VAPID_PUBLIC, env.VAPID_PRIVATE, env.VAPID_SUBJECT),
    'Content-Encoding': 'aes128gcm',
    'Content-Type': 'application/octet-stream',
    TTL: String(ttl),
    Urgency: urgency,
  };
  if (topic) headers.Topic = topic;
  const res = await fetch(sub.endpoint, { method: 'POST', headers, body });
  return res.status;
}
