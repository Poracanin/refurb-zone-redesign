'use strict';

// Count down to the next Mon–Fri cutoff in the shop's timezone, not the visitor's.
(function (root) {
  const defaults = { cutoff: '17:45', timezone: 'Europe/Prague' };
  const formatters = new Map();
  let interval,
    config = defaults,
    visibilityBound = false;

  function wallTime(timestamp, timezone) {
    if (!formatters.has(timezone))
      formatters.set(
        timezone,
        new Intl.DateTimeFormat('en-GB', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23',
        }),
      );
    return Object.fromEntries(
      formatters
        .get(timezone)
        .formatToParts(timestamp)
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)]),
    );
  }

  function wallTimestamp(parts) {
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  }

  function cutoffTimestamp(day, hour, minute, timezone) {
    const target = Date.UTC(
      day.getUTCFullYear(),
      day.getUTCMonth(),
      day.getUTCDate(),
      hour,
      minute,
    );
    let timestamp = target;
    // Resolve the offset on the target date, including weekends across DST changes.
    for (let i = 0; i < 3; i++) {
      const correction = target - wallTimestamp(wallTime(timestamp, timezone));
      timestamp += correction;
      if (!correction) break;
    }
    return timestamp;
  }

  function stateAt(now = Date.now(), settings = {}) {
    const { cutoff, timezone } = { ...defaults, ...settings };
    const [hour, minute] = cutoff.split(':').map(Number);
    const current = wallTime(now, timezone);
    const day = new Date(Date.UTC(current.year, current.month - 1, current.day));
    for (let offset = 0; offset < 8; offset++, day.setUTCDate(day.getUTCDate() + 1)) {
      if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue;
      const deadline = cutoffTimestamp(day, hour, minute, timezone);
      if (deadline <= now) continue;
      const seconds = Math.ceil((deadline - now) / 1000);
      const days = Math.floor(seconds / 86400);
      const digits = [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
        .map((number) => String(number).padStart(2, '0'))
        .join(':');
      return {
        deadline,
        seconds,
        isToday: offset === 0,
        text: (days ? `${days} d ` : '') + digits,
      };
    }
  }

  function render() {
    const element = document.querySelector('[data-shipping-countdown]');
    if (!element) return;
    const state = stateAt(Date.now(), config);
    const label = state.isToday ? 'Zbývá' : 'Další uzávěrka za';
    element.querySelector('[data-countdown-label]').textContent = label;
    element.querySelector('[data-countdown-value]').textContent = state.text;
    const deadline = new Intl.DateTimeFormat('cs-CZ', {
      timeZone: config.timezone,
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(state.deadline);
    element.setAttribute(
      'aria-label',
      `Do uzávěrky objednávek ${deadline} českého času zbývá ${state.text}`,
    );
    element.title = `Uzávěrka: ${deadline} (český čas). Objednávky odesíláme ve všední dny.`;
  }

  function mount(settings = {}) {
    config = { ...defaults, ...settings };
    document.querySelectorAll('[data-shipping-cutoff]').forEach((element) => {
      element.textContent = config.cutoff;
    });
    clearInterval(interval);
    render();
    interval = setInterval(render, 1000);
    if (!visibilityBound) {
      document.addEventListener('visibilitychange', render);
      visibilityBound = true;
    }
  }

  const api = { stateAt, mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.shippingCountdown = api;
})(globalThis);
