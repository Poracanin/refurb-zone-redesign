'use strict';

// One small, shared wordmark for the header, preview, and transparent PNG export.
window.refurbBrand = (() => {
  const duration = 2700;
  const negativeDuration = 3000;
  const tagline = 'LCD & OLED REFURBISHING';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const playing = new Map();
  const pending = new WeakMap();
  function markup({ header = false, intro = false } = {}) {
    const animate = !header && intro && !reducedMotion.matches;
    const tag = header ? 'a' : 'div';
    const attributes = header
      ? 'href="/" aria-label="Refurb.zone — LCD & OLED REFURBISHING — úvodní stránka"'
      : 'role="img" aria-label="refurb.zone — LCD & OLED REFURBISHING"';
    return `<${tag} class="${header ? 'logo ' : ''}brand-logo${animate ? ' is-intro' : ''}" ${attributes}>
      <span class="brand-stage" aria-hidden="true">
        <svg class="brand-seed" viewBox="0 0 40 40" focusable="false">
          <rect class="brand-seed-bg" width="40" height="40" rx="11" fill="#111419"/>
          <text class="brand-seed-letter" x="10" y="29" fill="white" font-family="Arial,sans-serif" font-size="31" font-weight="700">r</text>
          <circle cx="30" cy="28" r="3" fill="#ec4899"/>
        </svg>
        <span class="brand-wordmark"><span class="brand-initial">r</span><span class="brand-stem">efurb</span><span class="brand-dot">.</span><span class="brand-zone">zone</span></span>
      </span>
      <small class="brand-tagline" aria-hidden="true">LCD &amp; OLED REFURBISHING</small>
    </${tag}>`;
  }

  async function play(element, { negativeCanvas = null } = {}) {
    if (!element) return;
    playing.get(element)?.();
    const complete = () => {
      element.classList.remove('is-intro', 'is-playing');
      element.classList.toggle('is-negative', Boolean(negativeCanvas));
      negativeCanvas?.classList.add('is-negative');
    };
    if (reducedMotion.matches) {
      complete();
      return;
    }
    element.classList.remove('is-negative');
    negativeCanvas?.classList.remove('is-negative');
    const request = {};
    pending.set(element, request);
    element.classList.add('is-intro');
    // Await the bundled font so the reveal ends in exactly the existing wordmark.
    await document.fonts.ready;
    if (pending.get(element) !== request) return;
    if (!element.isConnected || reducedMotion.matches) {
      complete();
      return;
    }
    const seed = element.querySelector('.brand-seed');
    const stage = element.querySelector('.brand-stage');
    const startX = (stage.getBoundingClientRect().width - seed.getBoundingClientRect().width) / 2;
    element.classList.add('is-playing');
    const animations = [];
    const introDuration = negativeCanvas ? 2300 : duration;
    const animate = (selector, frames, options = {}) => {
      const target = typeof selector === 'string' ? element.querySelector(selector) : selector;
      const animation = target.animate(frames, {
        duration: introDuration,
        fill: 'both',
        easing: 'linear',
        ...options,
      });
      animations.push(animation);
      return animation;
    };
    // The favicon remains intact. One continuous slide opens the full wordmark.
    animate(
      '.brand-seed',
      [{ transform: `translateX(${startX}px)` }, { transform: 'translateX(0)' }],
      { duration: 1750, easing: 'cubic-bezier(.4,0,.2,1)' },
    );
    animate('.brand-wordmark', [
      {
        clipPath: 'inset(-15% 100% -15% 0)',
        opacity: 0,
        transform: 'translateX(-.16em)',
        offset: 0,
      },
      {
        clipPath: 'inset(-15% 100% -15% 0)',
        opacity: 0,
        transform: 'translateX(-.16em)',
        offset: 0.14,
        easing: 'cubic-bezier(.35,0,.2,1)',
      },
      { clipPath: 'inset(-15% 0 -15% 0)', opacity: 1, transform: 'translateX(0)', offset: 0.86 },
      { clipPath: 'inset(-15% 0 -15% 0)', opacity: 1, transform: 'translateX(0)', offset: 1 },
    ]);
    let last = animate('.brand-tagline', [
      { opacity: 0, transform: 'translateY(.4em)', offset: 0 },
      {
        opacity: 0,
        transform: 'translateY(.4em)',
        offset: 0.62,
        easing: 'cubic-bezier(.22,1,.36,1)',
      },
      { opacity: 1, transform: 'translateY(0)', offset: 1 },
    ]);
    if (negativeCanvas) {
      const negativeTiming = {
        delay: introDuration,
        duration: negativeDuration - introDuration,
        easing: 'cubic-bezier(.4,0,.2,1)',
      };
      animate('.brand-wordmark', [{ color: '#101318' }, { color: '#f7f9fc' }], negativeTiming);
      animate('.brand-tagline', [{ color: '#737d8c' }, { color: '#c0c8d5' }], negativeTiming);
      animate('.brand-dot', [{ color: '#ec4899' }, { color: '#ec4899' }], negativeTiming);
      animate('.brand-seed-bg', [{ fill: '#111419' }, { fill: '#f7f9fc' }], negativeTiming);
      animate('.brand-seed-letter', [{ fill: '#ffffff' }, { fill: '#111419' }], negativeTiming);
      last = animate(
        negativeCanvas,
        [
          { backgroundColor: '#ffffff', borderColor: '#e4e8ef' },
          { backgroundColor: '#111419', borderColor: '#111419' },
        ],
        negativeTiming,
      );
    }
    const finish = () => {
      complete();
      animations.forEach((animation) => animation.cancel());
      playing.delete(element);
    };
    playing.set(element, finish);
    return last.finished.then(finish, () => {});
  }

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) [...playing.values()].forEach((finish) => finish());
  });
  return { duration, negativeDuration, tagline, markup, play };
})();
