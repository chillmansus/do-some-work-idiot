// Themes: the app's background colors plus a quiet animated scene drawn behind the content.
// One canvas, at most 30 frames a second, a few dozen simple shapes, glows drawn from cached sprites
// (no shadowBlur), stopped while the app is hidden. With "Moving background" off or reduced motion,
// the scene is drawn once and stays still.
(() => {
  const THEMES = [
    { id: 'night', name: 'Night', fx: 'dust', bg: '#0b0a09', glow: '#191510', s: ['#151311', '#1e1b18', '#2a2622'], tint: '255,236,214', sw: ['#ffb45e', '#f59be6'], note: 'Drifting dust' },
    { id: 'ember', name: 'Ember', fx: 'sparks', bg: '#0f0806', glow: '#2e1507', s: ['#1a110d', '#241813', '#33221a'], tint: '255,205,170', sw: ['#ffcf6e', '#ff5a1f'], note: 'Rising sparks' },
    { id: 'forest', name: 'Forest', fx: 'leaves', bg: '#060b08', glow: '#10261a', s: ['#111813', '#18211a', '#222e25'], tint: '215,240,205', sw: ['#d3f58a', '#2f9e55'], note: 'Leaves in the wind' },
    { id: 'ocean', name: 'Ocean', fx: 'ocean', bg: '#040910', glow: '#0b2643', s: ['#0e1620', '#141e2a', '#1d2a3a'], tint: '195,228,255', sw: ['#86ecfb', '#1c6fe0'], note: 'Fish and bubbles' },
    { id: 'sakura', name: 'Sakura', fx: 'petals', bg: '#100a0c', glow: '#2e1524', s: ['#1a1216', '#23191e', '#30232a'], tint: '255,218,232', sw: ['#ffd1e0', '#f0709a'], note: 'Falling petals' },
    { id: 'nebula', name: 'Nebula', fx: 'stars', bg: '#08070f', glow: '#20133b', s: ['#13111c', '#1a1726', '#252136'], tint: '222,208,255', sw: ['#c5b3ff', '#8a3fe0'], note: 'Stars and comets' },
    { id: 'firefly', name: 'Firefly', fx: 'fireflies', bg: '#0a0a06', glow: '#23200b', s: ['#15140e', '#1d1c14', '#29271d'], tint: '255,242,195', sw: ['#fff28f', '#a9d84a'], note: 'Fireflies' },
    { id: 'rain', name: 'Rain', fx: 'rain', bg: '#080a0d', glow: '#18212d', s: ['#12151a', '#191d23', '#242a32'], tint: '212,224,240', sw: ['#c3cddd', '#5f7590'], note: 'Rain and ripples' },
    { id: 'aurora', name: 'Aurora', fx: 'aurora', bg: '#040b0c', glow: '#0b2b2b', s: ['#0f1717', '#152020', '#1e2c2c'], tint: '198,245,235', sw: ['#8ff0c8', '#2fa8c9'], note: 'Northern lights' },
    { id: 'snow', name: 'Snow', fx: 'snow', bg: '#090b0f', glow: '#1c2636', s: ['#13161c', '#1a1e26', '#252a34'], tint: '228,238,255', sw: ['#ffffff', '#9cc0ff'], note: 'Snowfall' },
    { id: 'crimson', name: 'Lantern', fx: 'lanterns', bg: '#0e0607', glow: '#300c12', s: ['#1a1012', '#23171a', '#312024'], tint: '255,208,205', sw: ['#ffb36b', '#e8455a'], note: 'Floating lanterns' },
    { id: 'dune', name: 'Dune', fx: 'sand', bg: '#0d0a07', glow: '#2b1e10', s: ['#18130e', '#211b14', '#2e261d'], tint: '245,226,198', sw: ['#f4e3c3', '#c9874a'], note: 'Desert wind' },
    { id: 'dawn', name: 'Dawn', fx: 'dawn', bg: '#0a0a12', glow: '#2c1c30', s: ['#15141c', '#1d1b25', '#292633'], tint: '255,222,220', sw: ['#ffd9a8', '#c77dba'], note: 'Sunrise and birds' },
    { id: 'golden', name: 'Golden hour', fx: 'golden', bg: '#0d0a05', glow: '#33230a', s: ['#18140d', '#211b12', '#2e261a'], tint: '255,232,190', sw: ['#ffe39a', '#f0a92b'], note: 'Sun rays, drifting seeds' },
    { id: 'sunset', name: 'Sunset', fx: 'sunset', bg: '#0e0807', glow: '#3b170c', s: ['#1a110e', '#241814', '#33221c'], tint: '255,210,185', sw: ['#ffb35e', '#e8455a'], note: 'Sun over the sea' },
    { id: 'twilight', name: 'Twilight', fx: 'twilight', bg: '#08081a', glow: '#261b42', s: ['#12121f', '#191829', '#232238'], tint: '222,214,255', sw: ['#f0a3c8', '#5b4fd6'], note: 'Moon and mountains' },
    { id: 'moonlight', name: 'Moonlight', fx: 'moonlight', bg: '#05080d', glow: '#15212f', s: ['#0f141b', '#151b24', '#1f2733'], tint: '215,228,250', sw: ['#eef3ff', '#5f7fb0'], note: 'Clouds past the moon' },
    { id: 'storm', name: 'Storm', fx: 'storm', bg: '#07090c', glow: '#1a2230', s: ['#111419', '#181c22', '#22272f'], tint: '210,220,238', sw: ['#d6e2ff', '#3d4a63'], note: 'Rain and lightning' },
  ];
  const TK = { theme: 'dswi.theme', motion: 'dswi.fx' };
  const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, v); } catch { } };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let theme = THEMES.find(t => t.id === get(TK.theme)) || THEMES[0];
  let motion = get(TK.motion) !== '0';

  /* ---------- colors ---------- */
  function paint(t) {
    const r = document.documentElement.style;
    r.setProperty('--bg', t.bg); r.setProperty('--bg-glow', t.glow);
    r.setProperty('--surface', t.s[0]); r.setProperty('--surface-2', t.s[1]); r.setProperty('--surface-3', t.s[2]);
    r.setProperty('--line', `rgba(${t.tint},.08)`); r.setProperty('--line-2', `rgba(${t.tint},.15)`);
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t.bg;
  }
  paint(theme);

  /* ---------- helpers ---------- */
  const R = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const TAU = Math.PI * 2;
  const sprites = new Map();
  // a soft round glow, drawn once per color and size, then stamped with drawImage
  function glow(color, r) {
    const k = color + r;
    if (sprites.has(k)) return sprites.get(k);
    const c = document.createElement('canvas'); c.width = c.height = r * 2;
    const g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, color); gr.addColorStop(.25, color.replace(/[\d.]+\)$/, m => (parseFloat(m) * .45) + ')')); gr.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
    sprites.set(k, c); return c;
  }
  const stamp = (ctx, spr, x, y, a = 1, scale = 1) => {
    ctx.globalAlpha = a; const w = spr.width * scale; ctx.drawImage(spr, x - w / 2, y - w / 2, w, w); ctx.globalAlpha = 1;
  };
  const wrap = (v, lo, hi) => (v < lo ? hi : v > hi ? lo : v);

  /* ---------- scenes ---------- */
  // Each scene: make(W, H) -> state, draw(ctx, state, t, dt, W, H)
  const SCENES = {
    dust: {
      make: (W, H) => ({ p: Array.from({ length: 26 }, () => ({ x: R(0, W), y: R(0, H), vx: R(-4, 4), vy: R(-7, -2), r: R(.6, 1.6), ph: R(0, TAU), sp: R(.4, 1.1) })) }),
      draw(ctx, s, t, dt, W, H) {
        const spr = glow('rgba(255,214,170,1)', 6);
        for (const p of s.p) {
          p.x = wrap(p.x + (p.vx + Math.sin(t * .3 + p.ph) * 3) * dt, -10, W + 10); p.y = wrap(p.y + p.vy * dt, -10, H + 10);
          stamp(ctx, spr, p.x, p.y, (.18 + .2 * Math.sin(t * p.sp + p.ph)) * p.r, p.r * .9);
        }
      },
    },
    sparks: {
      make: (W, H) => ({ p: Array.from({ length: 36 }, () => spark(W, H, true)) }),
      draw(ctx, s, t, dt, W, H) {
        const g = s.g || (s.g = (() => { const x = ctx.createLinearGradient(0, H * .62, 0, H); x.addColorStop(0, 'rgba(255,90,31,0)'); x.addColorStop(1, 'rgba(255,90,31,.13)'); return x; })());
        ctx.fillStyle = g; ctx.fillRect(0, H * .62, W, H * .38);
        const hot = glow('rgba(255,190,90,1)', 10), warm = glow('rgba(255,110,40,1)', 10);
        for (const p of s.p) {
          p.life -= dt; p.y += p.vy * dt; p.x += (Math.sin(t * p.f + p.ph) * 14 + p.vx) * dt;
          if (p.life <= 0 || p.y < -20) Object.assign(p, spark(W, H));
          const k = Math.max(0, p.life / p.max), fl = .75 + .25 * Math.sin(t * 13 + p.ph);
          stamp(ctx, k > .5 ? hot : warm, p.x, p.y, Math.min(1, k * 1.6) * .8 * fl, p.r);
        }
      },
    },
    leaves: {
      make: (W, H) => ({
        p: Array.from({ length: 24 }, () => leaf(W, H, true)),
        g: Array.from({ length: Math.ceil(W / 7) }, (_, i) => ({ x: i * 7 + R(-3, 3), h: R(16, 58), c: pick(['#1f5a33', '#2a7040', '#357f44', '#24603a']), ph: R(0, TAU) })),
      }),
      draw(ctx, s, t, dt, W, H) {
        const wind = Math.sin(t * .35) * .6 + Math.sin(t * .13 + 1) * .4; // gusts, -1..1
        for (const p of s.p) {
          p.y += p.vy * dt; p.x += (wind * 34 + Math.sin(t * p.f + p.ph) * p.a) * dt; p.rot += (p.vr + wind * .8) * dt;
          if (p.y > H + 30 || p.x < -40 || p.x > W + 40) Object.assign(p, leaf(W, H));
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, .55 + .45 * Math.abs(Math.cos(t * p.f + p.ph)));
          ctx.globalAlpha = .75; ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.quadraticCurveTo(p.s * .75, 0, 0, p.s); ctx.quadraticCurveTo(-p.s * .75, 0, 0, -p.s); ctx.fill();
          ctx.globalAlpha = .35; ctx.strokeStyle = '#0d2414'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(0, -p.s * .8); ctx.lineTo(0, p.s * 1.15); ctx.stroke();
          ctx.restore();
        }
        ctx.globalAlpha = .55; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        for (const b of s.g) {
          const bend = (wind * 12 + Math.sin(t * 2.1 + b.ph + b.x * .03) * 4) * (b.h / 50);
          ctx.strokeStyle = b.c; ctx.beginPath(); ctx.moveTo(b.x, H + 2);
          ctx.quadraticCurveTo(b.x + bend * .3, H - b.h * .55, b.x + bend, H - b.h); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      },
    },
    ocean: {
      make: (W, H) => ({
        fish: Array.from({ length: 9 }, () => fish(W, H, true)),
        b: Array.from({ length: 22 }, () => ({ x: R(0, W), y: R(0, H), r: R(1.2, 3.6), vy: R(-38, -16), ph: R(0, TAU) })),
        weed: Array.from({ length: Math.max(5, Math.round(W / 55)) }, (_, i) => ({ x: (i + R(.1, .9)) * (W / Math.max(5, Math.round(W / 55))), h: R(60, 150), ph: R(0, TAU), c: pick(['#14593f', '#1b6b4a', '#0f4a3a']) })),
      }),
      draw(ctx, s, t, dt, W, H) {
        // light from the surface
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) {
          const x = W * (.15 + i * .25) + Math.sin(t * .25 + i * 1.7) * 30;
          const g = ctx.createLinearGradient(0, 0, 0, H * .8); g.addColorStop(0, 'rgba(120,200,255,.07)'); g.addColorStop(1, 'rgba(120,200,255,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 18, 0); ctx.lineTo(x + 22, 0); ctx.lineTo(x + 90, H * .8); ctx.lineTo(x + 10, H * .8); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        // seaweed
        ctx.lineCap = 'round';
        for (const w of s.weed) {
          ctx.strokeStyle = w.c; ctx.globalAlpha = .7; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(w.x, H + 4);
          for (let k = 1; k <= 6; k++) { const y = H - w.h * k / 6; ctx.lineTo(w.x + Math.sin(t * 1.1 + w.ph + k * .7) * k * 2.6, y); }
          ctx.stroke();
        }
        // fish
        for (const f of s.fish) {
          f.x += f.v * f.dir * dt; f.y += Math.sin(t * .6 + f.ph) * 6 * dt;
          if ((f.dir > 0 && f.x > W + 60) || (f.dir < 0 && f.x < -60)) Object.assign(f, fish(W, H));
          const L = f.L, wig = Math.sin(t * f.w + f.ph) * L * .22;
          ctx.save(); ctx.translate(f.x, f.y); ctx.scale(f.dir, 1); ctx.globalAlpha = .62; ctx.fillStyle = f.c;
          ctx.beginPath(); ctx.ellipse(0, 0, L * .5, L * .22, 0, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.moveTo(-L * .42, 0); ctx.lineTo(-L * .78, -L * .2 + wig); ctx.lineTo(-L * .78, L * .2 + wig); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = .8; ctx.fillStyle = '#04101c'; ctx.beginPath(); ctx.arc(L * .3, -L * .04, Math.max(1, L * .045), 0, TAU); ctx.fill();
          ctx.restore();
        }
        // bubbles
        ctx.strokeStyle = 'rgba(190,235,255,.45)'; ctx.lineWidth = 1;
        for (const b of s.b) {
          b.y += b.vy * dt; b.x += Math.sin(t * 2 + b.ph) * 10 * dt;
          if (b.y < -10) { b.y = H + R(0, 40); b.x = R(0, W); }
          ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      },
    },
    petals: {
      make: (W, H) => ({ p: Array.from({ length: 32 }, () => petal(W, H, true)) }),
      draw(ctx, s, t, dt, W, H) {
        const wind = Math.sin(t * .3) * 14;
        for (const p of s.p) {
          p.y += p.vy * dt; p.x += (wind + Math.sin(t * p.f + p.ph) * p.a) * dt; p.rot += p.vr * dt;
          if (p.y > H + 20) Object.assign(p, petal(W, H));
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(t * p.flip + p.ph));
          ctx.globalAlpha = .85; ctx.fillStyle = p.c; const z = p.s;
          ctx.beginPath(); ctx.moveTo(0, z); ctx.bezierCurveTo(z * 1.1, z * .3, z * .7, -z * .9, z * .15, -z * .75);
          ctx.lineTo(0, -z * .5); ctx.lineTo(-z * .15, -z * .75); ctx.bezierCurveTo(-z * .7, -z * .9, -z * 1.1, z * .3, 0, z); ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      },
    },
    stars: {
      make: (W, H) => ({
        st: Array.from({ length: 110 }, () => ({ x: R(0, W), y: R(0, H), r: R(.5, 1.8), ph: R(0, TAU), sp: R(.5, 2) })),
        neb: [0, 1, 2].map(i => ({ x: R(0, W), y: R(H * .1, H * .8), c: ['rgba(140,80,230,1)', 'rgba(70,100,230,1)', 'rgba(220,90,200,1)'][i], ph: R(0, TAU) })),
        shoot: null, next: R(2, 5),
      }),
      draw(ctx, s, t, dt, W, H) {
        ctx.globalCompositeOperation = 'lighter';
        for (const n of s.neb) stamp(ctx, glow(n.c, 120), n.x + Math.sin(t * .05 + n.ph) * 40, n.y + Math.cos(t * .04 + n.ph) * 30, .22, 1.8);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#fff';
        for (const p of s.st) { ctx.globalAlpha = .25 + .55 * (.5 + .5 * Math.sin(t * p.sp + p.ph)); ctx.fillRect(p.x, p.y, p.r, p.r); }
        s.next -= dt;
        if (!s.shoot && s.next <= 0) { s.shoot = { x: R(W * .2, W * 1.1), y: R(-20, H * .35), v: R(520, 760), life: 0 }; s.next = R(4, 9); }
        if (s.shoot) {
          const m = s.shoot; m.life += dt; m.x -= m.v * dt * .8; m.y += m.v * dt * .45;
          const g = ctx.createLinearGradient(m.x, m.y, m.x + 110, m.y - 62); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(200,180,255,0)');
          ctx.globalAlpha = Math.max(0, 1 - m.life / .9); ctx.strokeStyle = g; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + 110, m.y - 62); ctx.stroke();
          if (m.life > .9) s.shoot = null;
        }
        ctx.globalAlpha = 1;
      },
    },
    fireflies: {
      make: (W, H) => ({ p: Array.from({ length: 20 }, () => ({ x: R(0, W), y: R(H * .2, H), a: R(0, TAU), v: R(10, 24), ph: R(0, TAU), sp: R(.8, 2.2), turn: R(-1, 1) })) }),
      draw(ctx, s, t, dt, W, H) {
        const spr = glow('rgba(220,255,120,1)', 14), core = glow('rgba(255,255,210,1)', 3);
        ctx.globalCompositeOperation = 'lighter';
        for (const p of s.p) {
          p.turn += R(-1.5, 1.5) * dt; p.turn = Math.max(-1, Math.min(1, p.turn)); p.a += p.turn * dt;
          p.x = wrap(p.x + Math.cos(p.a) * p.v * dt, -20, W + 20); p.y = wrap(p.y + Math.sin(p.a) * p.v * dt, -20, H + 20);
          const on = Math.max(0, Math.sin(t * p.sp + p.ph)) ** 2;
          stamp(ctx, spr, p.x, p.y, .15 + .7 * on); stamp(ctx, core, p.x, p.y, .3 + .7 * on);
        }
        ctx.globalCompositeOperation = 'source-over';
      },
    },
    rain: {
      make: (W, H) => ({ d: Array.from({ length: 70 }, () => ({ x: R(-40, W), y: R(0, H), v: R(420, 680), l: R(10, 22) })), rip: [], acc: 0 }),
      draw(ctx, s, t, dt, W, H) {
        ctx.strokeStyle = 'rgba(190,210,235,.28)'; ctx.lineWidth = 1; ctx.beginPath();
        for (const d of s.d) {
          d.y += d.v * dt; d.x += d.v * .12 * dt;
          if (d.y > H) { d.y = R(-40, 0); d.x = R(-40, W); }
          ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * .12, d.y - d.l);
        }
        ctx.stroke();
        s.acc += dt * 4;
        while (s.acc > 1) { s.acc--; s.rip.push({ x: R(0, W), y: R(H * .72, H), r: 1, life: 0 }); }
        ctx.lineWidth = 1;
        s.rip = s.rip.filter(r => (r.life += dt) < 1.1);
        for (const r of s.rip) {
          const k = r.life / 1.1; ctx.strokeStyle = `rgba(190,210,235,${.35 * (1 - k)})`;
          ctx.beginPath(); ctx.ellipse(r.x, r.y, 4 + k * 26, (4 + k * 26) * .3, 0, 0, TAU); ctx.stroke();
        }
      },
    },
    aurora: {
      make: (W, H) => ({
        st: Array.from({ length: 45 }, () => ({ x: R(0, W), y: R(0, H * .7), r: R(.4, 1.2), ph: R(0, TAU) })),
        bands: [{ y: .16, h: 120, c: [80, 240, 170], ph: 0 }, { y: .26, h: 100, c: [60, 190, 230], ph: 2 }, { y: .36, h: 80, c: [170, 120, 240], ph: 4 }],
      }),
      draw(ctx, s, t, dt, W, H) {
        ctx.fillStyle = '#fff';
        for (const p of s.st) { ctx.globalAlpha = .2 + .3 * Math.sin(t + p.ph); ctx.fillRect(p.x, p.y, p.r, p.r); }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter';
        for (const b of s.bands) {
          const base = H * b.y, [r, g, bl] = b.c;
          const y = x => base + Math.sin(x * .011 + t * .35 + b.ph) * 26 + Math.sin(x * .027 - t * .22 + b.ph) * 12;
          const gr = ctx.createLinearGradient(0, base - 40, 0, base + b.h);
          gr.addColorStop(0, `rgba(${r},${g},${bl},0)`); gr.addColorStop(.3, `rgba(${r},${g},${bl},${.16 + .05 * Math.sin(t * .7 + b.ph)})`); gr.addColorStop(1, `rgba(${r},${g},${bl},0)`);
          ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, y(0) - 20);
          for (let x = 0; x <= W + 16; x += 16) ctx.lineTo(x, y(x) - 20);
          for (let x = W + 16; x >= 0; x -= 16) ctx.lineTo(x, y(x) + b.h * (.7 + .3 * Math.sin(x * .02 + t * .5)));
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      },
    },
    snow: {
      make: (W, H) => ({ p: Array.from({ length: 64 }, () => ({ x: R(0, W), y: R(0, H), r: R(.8, 2.6), v: R(14, 42), ph: R(0, TAU), big: Math.random() < .08 })) }),
      draw(ctx, s, t, dt, W, H) {
        const soft = glow('rgba(235,242,255,1)', 12);
        ctx.fillStyle = 'rgba(240,246,255,.8)';
        for (const p of s.p) {
          p.y += p.v * (p.big ? 1.6 : 1) * dt; p.x += Math.sin(t * .8 + p.ph) * 12 * dt + Math.sin(t * .2) * 6 * dt;
          if (p.y > H + 10) { p.y = -10; p.x = R(0, W); }
          if (p.big) stamp(ctx, soft, p.x, p.y, .35, p.r * .7);
          else { ctx.globalAlpha = .35 + p.r * .2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); }
        }
        ctx.globalAlpha = 1;
      },
    },
    lanterns: {
      make: (W, H) => ({ p: Array.from({ length: 9 }, () => lantern(W, H, true)) }),
      draw(ctx, s, t, dt, W, H) {
        const halo = glow('rgba(255,140,60,1)', 40);
        for (const p of s.p) {
          p.y -= p.v * dt; p.x += Math.sin(t * .5 + p.ph) * 8 * dt;
          if (p.y < -60) Object.assign(p, lantern(W, H));
          const fl = .85 + .15 * Math.sin(t * 9 + p.ph) * Math.sin(t * 5.3 + p.ph), z = p.s;
          ctx.globalCompositeOperation = 'lighter'; stamp(ctx, halo, p.x, p.y, .28 * fl * p.a, z / 14); ctx.globalCompositeOperation = 'source-over';
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(t * .7 + p.ph) * .08); ctx.globalAlpha = .8 * p.a;
          const g = ctx.createLinearGradient(0, -z, 0, z); g.addColorStop(0, '#ff6a4a'); g.addColorStop(.6, '#ffb15e'); g.addColorStop(1, '#ffe2a0');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-z * .55, -z); ctx.lineTo(z * .55, -z); ctx.quadraticCurveTo(z * .78, 0, z * .5, z); ctx.lineTo(-z * .5, z); ctx.quadraticCurveTo(-z * .78, 0, -z * .55, -z); ctx.fill();
          ctx.globalAlpha = .9 * fl * p.a; ctx.fillStyle = '#fff3c4'; ctx.fillRect(-z * .2, z * .7, z * .4, z * .22);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      },
    },
    sand: {
      make: (W, H) => ({
        p: Array.from({ length: 55 }, () => ({ x: R(0, W), y: R(0, H), v: R(50, 150), r: R(.6, 1.6), ph: R(0, TAU) })),
        streak: Array.from({ length: 5 }, () => ({ x: R(-W, W), y: R(0, H * .8), v: R(70, 120), l: R(120, 260) })),
      }),
      draw(ctx, s, t, dt, W, H) {
        const gust = .7 + .3 * Math.sin(t * .4);
        // dunes
        const dune = (base, amp, k, sp, c) => {
          ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, H);
          for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, H - base - Math.sin(x * k + t * sp) * amp - Math.sin(x * k * 2.3 + 1) * amp * .35);
          ctx.lineTo(W, H); ctx.fill();
        };
        dune(170, 26, .008, .03, 'rgba(120,86,50,.2)'); dune(105, 18, .012, -.05, 'rgba(150,108,62,.24)');
        ctx.strokeStyle = 'rgba(245,220,180,.11)'; ctx.lineWidth = 1.2;
        for (const w of s.streak) {
          w.x += w.v * gust * dt; if (w.x > W + 40) { w.x = -w.l - R(0, W); w.y = R(0, H * .8); }
          ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.quadraticCurveTo(w.x + w.l / 2, w.y - 10, w.x + w.l, w.y); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(245,215,165,.7)';
        for (const p of s.p) {
          p.x += p.v * gust * dt; p.y += Math.sin(t * 3 + p.ph) * 8 * dt;
          if (p.x > W + 5) { p.x = -5; p.y = R(0, H); }
          ctx.fillRect(p.x, p.y, p.r * 1.8, p.r);
        }
      },
    },
    dawn: {
      make: (W, H) => ({ birds: Array.from({ length: 5 }, () => bird(W, H, true)), mist: [0, 1, 2].map(i => ({ x: R(0, W), y: H * (.6 + i * .08), w: R(160, 260), v: R(4, 10) })) }),
      draw(ctx, s, t, dt, W, H) {
        sky(ctx, s, H, W, [[0, 'rgba(40,50,120,0)'], [.5, 'rgba(120,80,150,.16)'], [.82, 'rgba(255,150,130,.30)'], [1, 'rgba(255,200,140,.40)']]);
        const sy = H * .84 - Math.sin(t * .05) * 8;
        ctx.globalCompositeOperation = 'lighter';
        stamp(ctx, glow('rgba(255,190,140,1)', 120), W * .62, sy, .45, 1.6);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = .7; ctx.fillStyle = '#ffe2b8'; ctx.beginPath(); ctx.arc(W * .62, sy, 26, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
        hills(ctx, W, H, 70, 26, .006, '#2a1a33', .85, t * 0); hills(ctx, W, H, 34, 14, .011, '#1a1222', .95, 2);
        for (const m of s.mist) { m.x += m.v * dt; if (m.x - m.w > W) m.x = -m.w; stamp(ctx, glow('rgba(255,215,220,1)', 60), m.x, m.y, .1, m.w / 60); }
        flock(ctx, s.birds, t, dt, W, H, '#2a1830');
      },
    },
    sunset: {
      make: (W, H) => ({ birds: Array.from({ length: 4 }, () => bird(W, H, true)), cl: Array.from({ length: 4 }, (_, i) => ({ x: R(0, W), y: H * (.45 + i * .07), w: R(90, 170), v: R(3, 8) })), sh: Array.from({ length: 26 }, () => ({ dy: R(6, H * .16), w: R(10, 40), ph: R(0, TAU), dx: R(-1, 1) })) }),
      draw(ctx, s, t, dt, W, H) {
        const hz = H * .8;
        sky(ctx, s, H, W, [[0, 'rgba(60,20,60,0)'], [.45, 'rgba(160,50,70,.18)'], [.78, 'rgba(255,110,50,.38)'], [.8, 'rgba(60,20,40,.35)'], [1, 'rgba(20,8,20,.5)']]);
        for (const c of s.cl) {
          c.x += c.v * dt; if (c.x - c.w > W) c.x = -c.w;
          ctx.globalAlpha = .16; ctx.fillStyle = '#ff9a7a'; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w, 8, 0, 0, TAU); ctx.fill();
        }
        ctx.globalCompositeOperation = 'lighter';
        stamp(ctx, glow('rgba(255,120,50,1)', 140), W * .5, hz, .55, 1.6);
        ctx.globalCompositeOperation = 'source-over';
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, hz); ctx.clip();
        ctx.globalAlpha = .8; ctx.fillStyle = '#ffb35e'; ctx.beginPath(); ctx.arc(W * .5, hz + 6, 38, 0, TAU); ctx.fill(); ctx.restore();
        ctx.strokeStyle = '#ffc07a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        for (const r of s.sh) {
          const k = r.dy / (H * .16), w = r.w * (1 - k * .6), x = W * .5 + r.dx * 30 * k + Math.sin(t * 1.3 + r.ph) * 6;
          ctx.globalAlpha = (.55 - k * .45) * (.6 + .4 * Math.sin(t * 2.2 + r.ph));
          ctx.beginPath(); ctx.moveTo(x - w / 2, hz + r.dy); ctx.lineTo(x + w / 2, hz + r.dy); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        flock(ctx, s.birds, t, dt, W, H * .7, '#24101a');
      },
    },
    twilight: {
      make: (W, H) => ({ st: Array.from({ length: 70 }, () => ({ x: R(0, W), y: R(0, H * .7), r: R(.4, 1.5), ph: R(0, TAU), sp: R(.4, 1.6) })), cl: Array.from({ length: 3 }, (_, i) => ({ x: R(0, W), y: H * (.4 + i * .09), w: R(100, 180), v: R(2, 6) })) }),
      draw(ctx, s, t, dt, W, H) {
        sky(ctx, s, H, W, [[0, 'rgba(30,30,90,0)'], [.5, 'rgba(70,50,140,.18)'], [.85, 'rgba(210,110,160,.28)'], [1, 'rgba(255,160,150,.32)']]);
        ctx.fillStyle = '#fff';
        for (const p of s.st) { ctx.globalAlpha = (.15 + .55 * (.5 + .5 * Math.sin(t * p.sp + p.ph))) * (1 - p.y / (H * .8)); ctx.fillRect(p.x, p.y, p.r, p.r); }
        ctx.globalAlpha = 1;
        const mx = W * .8, my = H * .2;
        ctx.globalCompositeOperation = 'lighter'; stamp(ctx, glow('rgba(220,210,255,1)', 60), mx, my, .35, 1.4); ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(crescent(), mx - 24, my - 24);
        for (const c of s.cl) { c.x += c.v * dt; if (c.x - c.w > W) c.x = -c.w; ctx.globalAlpha = .1; ctx.fillStyle = '#c99ad6'; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w, 7, 0, 0, TAU); ctx.fill(); }
        ctx.globalAlpha = 1;
        mountains(ctx, W, H, 150, '#1c1638', .9, 7); mountains(ctx, W, H, 95, '#130f26', .95, 3);
      },
    },
    moonlight: {
      make: (W, H) => ({ st: Array.from({ length: 50 }, () => ({ x: R(0, W), y: R(0, H * .75), r: R(.4, 1.3), ph: R(0, TAU) })), cl: Array.from({ length: 5 }, () => cloud(W, H, true)), sh: Array.from({ length: 22 }, () => ({ dy: R(6, H * .14), w: R(8, 30), ph: R(0, TAU) })) }),
      draw(ctx, s, t, dt, W, H) {
        const hz = H * .82, mx = W * .8, my = H * .2;
        sky(ctx, s, H, W, [[0, 'rgba(20,40,70,0)'], [.6, 'rgba(40,70,110,.16)'], [.82, 'rgba(80,110,150,.22)'], [.83, 'rgba(10,20,35,.45)'], [1, 'rgba(5,10,20,.55)']]);
        ctx.fillStyle = '#fff';
        for (const p of s.st) { ctx.globalAlpha = .2 + .3 * Math.sin(t * .8 + p.ph); ctx.fillRect(p.x, p.y, p.r, p.r); }
        ctx.globalCompositeOperation = 'lighter'; stamp(ctx, glow('rgba(200,220,255,1)', 90), mx, my, .4, 1.6); ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = .95; ctx.fillStyle = '#eef3ff'; ctx.beginPath(); ctx.arc(mx, my, 28, 0, TAU); ctx.fill();
        ctx.globalAlpha = .12; ctx.fillStyle = '#7d8aa6'; [[-8, -6, 7], [9, 5, 5], [-2, 11, 4]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(mx + a, my + b, r, 0, TAU); ctx.fill(); });
        for (const c of s.cl) {
          c.x += c.v * dt; if (c.x - c.w * 1.5 > W) Object.assign(c, cloud(W, H));
          for (const [ox, oy, r] of c.parts) stamp(ctx, glow('rgba(120,135,165,1)', 40), c.x + ox, c.y + oy, .28, r / 40);
        }
        ctx.strokeStyle = '#dfe8ff'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        for (const r of s.sh) {
          const k = r.dy / (H * .14), w = r.w * (1 - k * .5), x = mx + Math.sin(t * 1.1 + r.ph) * 5;
          ctx.globalAlpha = (.5 - k * .4) * (.5 + .5 * Math.sin(t * 1.8 + r.ph));
          ctx.beginPath(); ctx.moveTo(x - w / 2, hz + r.dy); ctx.lineTo(x + w / 2, hz + r.dy); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      },
    },
    golden: {
      make: (W, H) => ({ seeds: Array.from({ length: 16 }, () => seed(W, H, true)), motes: Array.from({ length: 24 }, () => ({ x: R(0, W), y: R(0, H), ph: R(0, TAU), v: R(3, 9) })) }),
      draw(ctx, s, t, dt, W, H) {
        sky(ctx, s, H, W, [[0, 'rgba(255,200,90,.10)'], [.5, 'rgba(230,150,60,.12)'], [1, 'rgba(255,190,90,.26)']]);
        ctx.globalCompositeOperation = 'lighter';
        stamp(ctx, glow('rgba(255,210,120,1)', 140), W * .92, H * .1, .5, 1.6);
        for (let i = 0; i < 5; i++) {
          const a = .05 + .035 * Math.sin(t * .4 + i * 1.9), x0 = W * .95, y0 = H * .08, ang = 2.05 + i * .13 + Math.sin(t * .1 + i) * .02;
          const g = ctx.createLinearGradient(x0, y0, x0 + Math.cos(ang) * H, y0 + Math.sin(ang) * H);
          g.addColorStop(0, `rgba(255,220,140,${a})`); g.addColorStop(1, 'rgba(255,220,140,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y0);
          ctx.lineTo(x0 + Math.cos(ang - .035) * H * 1.2, y0 + Math.sin(ang - .035) * H * 1.2); ctx.lineTo(x0 + Math.cos(ang + .035) * H * 1.2, y0 + Math.sin(ang + .035) * H * 1.2); ctx.fill();
        }
        const m = glow('rgba(255,225,150,1)', 5);
        for (const p of s.motes) { p.y -= p.v * dt; p.x += Math.sin(t * .5 + p.ph) * 5 * dt; if (p.y < -10) { p.y = H + 10; p.x = R(0, W); } stamp(ctx, m, p.x, p.y, .3 + .3 * Math.sin(t * 1.5 + p.ph)); }
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255,245,225,.75)'; ctx.lineWidth = .8;
        for (const p of s.seeds) {
          p.x += (p.v + Math.sin(t * .6 + p.ph) * 8) * dt; p.y += (Math.sin(t * .9 + p.ph) * 10 - 3) * dt; p.rot += Math.sin(t + p.ph) * .3 * dt;
          if (p.x > W + 20 || p.y < -20) Object.assign(p, seed(W, H));
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = .8;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, p.s * 1.3);
          for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * .32; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * p.s, Math.sin(a) * p.s); }
          ctx.stroke(); ctx.restore();
        }
        ctx.globalAlpha = 1;
      },
    },
    storm: {
      make: (W, H) => ({ cl: Array.from({ length: 7 }, (_, i) => ({ x: (i / 6) * W + R(-30, 30), y: R(H * .1, H * .24), r: R(50, 90), v: R(4, 9) })), d: Array.from({ length: 80 }, () => ({ x: R(-60, W), y: R(0, H), v: R(560, 820), l: R(14, 26) })), flash: 0, bolt: null, next: R(3, 6) }),
      draw(ctx, s, t, dt, W, H) {
        sky(ctx, s, H, W, [[0, 'rgba(40,50,70,.35)'], [.4, 'rgba(30,38,55,.15)'], [1, 'rgba(20,25,35,.25)']]);
        s.next -= dt;
        if (s.next <= 0) {
          s.next = R(5, 11); s.flash = 1;
          let x = R(W * .15, W * .85), y = H * .18; const pts = [[x, y]];
          while (y < H * R(.55, .8)) { x += R(-26, 26); y += R(18, 40); pts.push([x, y]); }
          s.bolt = pts;
        }
        if (s.flash > 0) {
          ctx.fillStyle = `rgba(200,215,255,${.16 * s.flash})`; ctx.fillRect(0, 0, W, H);
          if (s.bolt && s.flash > .55) {
            ctx.strokeStyle = `rgba(235,240,255,${s.flash})`; ctx.lineWidth = 2; ctx.lineJoin = 'round';
            ctx.beginPath(); s.bolt.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
          }
          s.flash = Math.max(0, s.flash - dt * (s.flash > .55 ? 2.2 : 1.4));
        }
        const dark = glow('rgba(60,70,90,1)', 60);
        for (const c of s.cl) { c.x += c.v * dt; if (c.x - c.r > W) c.x = -c.r; stamp(ctx, dark, c.x, c.y, .75 + .25 * s.flash, c.r / 40); }
        ctx.strokeStyle = 'rgba(180,200,230,.3)'; ctx.lineWidth = 1; ctx.beginPath();
        for (const d of s.d) {
          d.y += d.v * dt; d.x += d.v * .25 * dt;
          if (d.y > H) { d.y = R(-40, 0); d.x = R(-80, W); }
          ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * .25, d.y - d.l);
        }
        ctx.stroke();
      },
    },
  };
  // sky scenes: a tall gradient (cached per state), hills, mountains, birds, clouds, a crescent moon
  function sky(ctx, s, H, W, stops) {
    if (!s.sky) { const g = ctx.createLinearGradient(0, 0, 0, H); for (const [o, c] of stops) g.addColorStop(o, c); s.sky = g; }
    ctx.fillStyle = s.sky; ctx.fillRect(0, 0, W, H);
  }
  function hills(ctx, W, H, base, amp, k, color, a, ph) {
    ctx.globalAlpha = a; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, H - base - Math.sin(x * k + ph) * amp - Math.sin(x * k * 2.7 + ph * 2) * amp * .3);
    ctx.lineTo(W, H); ctx.fill(); ctx.globalAlpha = 1;
  }
  function mountains(ctx, W, H, base, color, a, seed) {
    ctx.globalAlpha = a; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 24; x += 24) {
      const n = Math.sin(x * .013 + seed) * .6 + Math.sin(x * .031 + seed * 2) * .3 + Math.abs(Math.sin(x * .007 + seed)) * .7;
      ctx.lineTo(x, H - base - n * 46);
    }
    ctx.lineTo(W, H); ctx.fill(); ctx.globalAlpha = 1;
  }
  function bird(W, H, any) { const dir = Math.random() < .5 ? 1 : -1; return { dir, x: any ? R(0, W) : dir > 0 ? -30 : W + 30, y: R(H * .25, H * .62), v: R(16, 30), s: R(5, 9), f: R(5, 8), ph: R(0, TAU) }; }
  function flock(ctx, birds, t, dt, W, H, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = .85;
    for (const b of birds) {
      b.x += b.v * b.dir * dt; b.y += Math.sin(t * .7 + b.ph) * 4 * dt;
      if ((b.dir > 0 && b.x > W + 40) || (b.dir < 0 && b.x < -40)) Object.assign(b, bird(W, H));
      const w = Math.sin(t * b.f + b.ph) * b.s * .55;
      ctx.beginPath(); ctx.moveTo(b.x - b.s, b.y - w); ctx.quadraticCurveTo(b.x - b.s * .4, b.y - w * .3 - 1, b.x, b.y);
      ctx.quadraticCurveTo(b.x + b.s * .4, b.y - w * .3 - 1, b.x + b.s, b.y - w); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function cloud(W, H, any) { const w = R(50, 110); return { x: any ? R(-w, W) : -w * 1.5, y: R(H * .15, H * .5), w, v: R(5, 11), parts: Array.from({ length: 4 }, (_, i) => [(i - 1.5) * w * .4, R(-8, 8), R(w * .35, w * .55)]) }; }
  let moonSpr = null;
  function crescent() {
    if (moonSpr) return moonSpr;
    const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d');
    g.fillStyle = '#f3efff'; g.beginPath(); g.arc(24, 24, 20, 0, TAU); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(33, 18, 18, 0, TAU); g.fill();
    return (moonSpr = c);
  }
  function seed(W, H, any) { return { x: any ? R(0, W) : -20, y: R(H * .2, H * .95), v: R(14, 30), s: R(4, 7), ph: R(0, TAU), rot: R(-.5, .5) }; }
  function spark(W, H, any) { const m = R(2.5, 6); return { x: R(0, W), y: any ? R(H * .2, H) : H + R(0, 30), vx: R(-6, 6), vy: R(-55, -22), r: R(.35, .9), f: R(1, 3), ph: R(0, TAU), life: any ? R(0, m) : m, max: m }; }
  function leaf(W, H, any) { return { x: R(-20, W), y: any ? R(-20, H) : R(-60, -20), s: R(7, 14), vy: R(18, 38), a: R(20, 50), f: R(.6, 1.4), ph: R(0, TAU), rot: R(0, TAU), vr: R(-1.2, 1.2), c: pick(['#6fbf55', '#9fd65a', '#3f9e4f', '#c9d65a', '#d9a441']) }; }
  function petal(W, H, any) { return { x: R(-20, W + 20), y: any ? R(-20, H) : R(-40, -10), s: R(5, 10), vy: R(20, 42), a: R(16, 36), f: R(.5, 1.3), flip: R(1, 2.6), ph: R(0, TAU), rot: R(0, TAU), vr: R(-1.5, 1.5), c: pick(['#ffc4d6', '#ffb0c8', '#f7a1c0', '#ffd9e4', '#f58fb2']) }; }
  function fish(W, H, any) { const dir = Math.random() < .5 ? 1 : -1; return { dir, x: any ? R(0, W) : dir > 0 ? -50 : W + 50, y: R(H * .12, H * .78), L: R(14, 34), v: R(18, 46), w: R(6, 10), ph: R(0, TAU), c: pick(['#ffb45e', '#86ecfb', '#f59be6', '#ffe38a', '#7fd3ff', '#ff8a6b']) }; }
  function lantern(W, H, any) { return { x: R(20, W - 20), y: any ? R(0, H) : H + R(30, 120), s: R(8, 17), v: R(10, 22), ph: R(0, TAU), a: R(.6, 1) }; }

  /* ---------- engine ---------- */
  let cv, ctx, W = 0, H = 0, dpr = 1, state = null, raf = 0, last = 0, t0 = performance.now();
  const moving = () => motion && !reduce.matches && !document.hidden;
  function size() {
    if (!cv) return;
    const box = cv.parentElement.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = Math.max(1, box.width); H = Math.max(1, box.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    state = SCENES[theme.fx].make(W, H);
    frame(performance.now(), true);
  }
  function frame(now, force) {
    raf = 0;
    if (!ctx || !state) return;
    if (!force && now - last < 32) { schedule(); return; } // about 30 frames a second
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    const t = (now - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    SCENES[theme.fx].draw(ctx, state, t, force && !moving() ? 0 : dt, W, H);
    schedule();
  }
  function schedule() { if (!raf && moving()) raf = requestAnimationFrame(frame); }
  function restart() { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; if (!state) return; if (moving()) schedule(); else frame(performance.now(), true); }
  function start() {
    cv = document.getElementById('fx'); if (!cv) return;
    ctx = cv.getContext('2d');
    size();
    if ('ResizeObserver' in window) new ResizeObserver(() => size()).observe(cv.parentElement); else addEventListener('resize', size);
    document.addEventListener('visibilitychange', restart);
    reduce.addEventListener && reduce.addEventListener('change', restart);
    // a still scene keeps a little life on screen while the moving one is off: pre-run it a few seconds
    if (!moving()) { for (let i = 0; i < 90; i++) SCENES[theme.fx].draw(ctx, state, i / 30, 1 / 30, W, H); frame(performance.now(), true); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.FX = {
    THEMES,
    theme: () => theme.id,
    setTheme(id) {
      const t = THEMES.find(x => x.id === id); if (!t) return;
      theme = t; put(TK.theme, id); paint(t);
      if (ctx) { state = SCENES[t.fx].make(W, H); if (!moving()) for (let i = 0; i < 90; i++) SCENES[t.fx].draw(ctx, state, i / 30, 1 / 30, W, H); restart(); }
    },
    motion: () => motion,
    setMotion(on) { motion = !!on; put(TK.motion, on ? '1' : '0'); restart(); },
  };
})();
