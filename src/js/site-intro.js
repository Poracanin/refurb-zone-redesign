'use strict';

// One entrance per tab; browsing products and signing in keep the header still.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !window.refurbBrand) return;
  try {
    const key = 'refurb-site-intro-v1';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'seen');
  } catch {
    // The entrance still works when browser storage is unavailable.
  }

  const canvas = document.createElement('div');
  canvas.className = 'site-intro';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.innerHTML = refurbBrand.markup({ intro: true });
  const logo = canvas.querySelector('.brand-logo');
  const content = [...document.body.children].filter(
    (element) => element instanceof HTMLElement && !element.inert,
  );
  content.forEach((element) => {
    element.inert = true;
  });
  document.documentElement.classList.add('has-site-intro');
  document.body.prepend(canvas);
  let closing = false;
  let fade;

  function release() {
    closing = true;
    clearTimeout(fallback);
    fade?.cancel();
    logo.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
    canvas.remove();
    content.forEach((element) => {
      element.inert = false;
    });
    document.documentElement.classList.remove('has-site-intro');
    document.removeEventListener('keydown', onKey, true);
    reducedMotion.removeEventListener('change', onMotionChange);
    window.removeEventListener('pagehide', release);
  }

  function dismiss(immediate = false) {
    if (immediate) return release();
    if (closing) return;
    closing = true;
    clearTimeout(fallback);
    fade = canvas.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 280,
      easing: 'ease-out',
      fill: 'forwards',
    });
    fade.finished.then(release, release);
  }

  function onKey(event) {
    if (!['Escape', 'Enter', ' ', 'Tab'].includes(event.key)) return;
    if (event.key !== 'Tab') event.preventDefault();
    dismiss(true);
  }

  function onMotionChange() {
    if (reducedMotion.matches) dismiss(true);
  }

  canvas.addEventListener('pointerdown', () => dismiss(true));
  document.addEventListener('keydown', onKey, true);
  reducedMotion.addEventListener('change', onMotionChange);
  window.addEventListener('pagehide', release);
  // Never leave the store covered if a font or animation fails to finish.
  const fallback = setTimeout(() => dismiss(true), 5500);
  refurbBrand.play(logo, { negativeCanvas: canvas }).then(
    () => dismiss(),
    () => dismiss(true),
  );
})();
