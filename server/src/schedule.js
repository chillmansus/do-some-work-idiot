// When reminders are due, and what they say. Kept apart from index.js because a Worker's main module may only export handlers.
export const TITLE = 'Your future self is sending this';

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

export const LINE = 'Do some work, idiot.';
// Each phone can set its own title and its own line (the part that says "Do some work, idiot.").
export const titleOf = msg => (msg && msg.title) || TITLE;
export const lineOf = msg => (msg && msg.line) || LINE;
export function message(it, t, msg) {
  const who = it.identity ? ` Become ${it.identity}.` : '';
  const body = it.before ? `${it.name}, in ${it.before} minutes at ${t}.${who}` : `${it.name}. It's time. ${lineOf(msg)}${who}`;
  return { title: titleOf(msg), body, tag: `h-${it.id}`, hid: it.id };
}
