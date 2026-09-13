'use strict';
// Model-to-product links come from the sampled catalogue, not approximate name matching.
const platformLabel = (platform) =>
  `<img class="platform-logo platform-logo-${platform}" src="/assets/brands/${platform}.svg" alt="" aria-hidden="true" width="26" height="22"><span>${platform === 'apple' ? 'Apple' : 'Android'}</span>`;
const SEARCH_FAMILIES = [
  { id: 'all', name: 'Vše', image: null },
  { id: 'iphone', name: 'iPhone', image: '/assets/categories/iphone.png' },
  { id: 'ipad', name: 'iPad', image: '/assets/categories/ipad.png' },
  { id: 'macbook', name: 'MacBook', image: '/assets/categories/macbook.png' },
  { id: 'watch', name: 'Apple Watch', image: '/assets/categories/watch.png' },
];
let homePlatform = 'apple',
  pendingDeviceSearch = null;
let deviceSearch = { platform: 'apple', family: 'all', model: '', query: '' };
const deviceById = (id) => DATA.devices?.find((d) => d.id === id);
const deviceTitle = () => deviceById(activeDevice)?.name || '';
const deviceProductMatch = (p, id) => !id || Boolean(deviceById(id)?.product_ids.includes(p.id));
const searchWords = (s) =>
  normalize(s)
    .replace(/[″“”",.]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
const modelMatches = (d, q) => {
  const text = normalize([d.name, d.subtitle, ...d.aliases].join(' ')).replace(/[″“”",.]/g, ' ');
  return searchWords(q).every((w) => text.includes(w));
};
const modelProducts = (d) => (d?.product_ids || []).map(getProduct).filter(Boolean);
const productCount = (n) =>
  n + ' ' + (n === 1 ? 'položka' : n > 1 && n < 5 ? 'položky' : 'položek');
function renderHomeDeviceCards() {
  const el = document.getElementById('category-grid');
  if (!el) return;
  document
    .querySelectorAll('[data-home-platform]')
    .forEach((b) => b.setAttribute('aria-pressed', b.dataset.homePlatform === homePlatform));
  el.classList.toggle('android-device-grid', homePlatform === 'android');
  if (homePlatform === 'apple')
    el.innerHTML = DEVICE_CARDS.map(
      ([key, name, sub, img], i) =>
        `${i < 4 ? `<button type="button" data-open-device-search data-search-family="${key}"` : `<a href="/katalog.html?category=${key}"`} class="category-card device-card"><img src="${img || getProduct(i === 4 ? '4419' : '9360').images[0]}" alt="" width="180" height="150"><div class="category-label"><div><h2>${name}</h2><p>${sub}</p></div><span class="circle">${icon('arrow')}</span></div>${i < 4 ? '</button>' : '</a>'}`,
    ).join('');
  else
    el.innerHTML = (DATA.devices || [])
      .filter((d) => d.platform === 'android')
      .map(
        (d) =>
          `<button type="button" class="category-card device-card" data-open-device-search data-search-model="${d.id}"><img src="${d.image}" alt="${esc(d.name)}" width="180" height="150"><div class="category-label"><div><h2>${esc(d.name)}</h2><p>Skla a materiál pro repase</p></div><span class="circle">${icon('arrow')}</span></div></button>`,
      )
      .join('');
}
function openDeviceSearch(options = {}) {
  const d = deviceById(options.model);
  deviceSearch = {
    platform: d?.platform || options.platform || 'apple',
    family: d?.family || options.family || (options.platform === 'android' ? 'android' : 'all'),
    model: d?.id || '',
    query: options.query || '',
  };
  openDialog(
    `<div class="device-search-top"><div><span class="eyebrow">SPRÁVNÝ DÍL ZAČÍNÁ MODELEM</span><h2 id="dialog-title">Co dnes opravujete?</h2></div>${closeButton()}</div><form class="device-search-form" id="device-search-form" role="search"><label class="device-query-wrap" for="device-query">${icon('search')}<input id="device-query" type="search" name="q" autocomplete="off" spellcheck="false" maxlength="200" placeholder="Napište model, díl nebo kód produktu…" aria-label="Hledat model, díl nebo kód produktu" autofocus><button type="button" class="query-clear" data-clear-device-query aria-label="Vymazat hledání" hidden>${icon('close')}</button></label></form><div class="device-search-scroll"><div id="device-search-controls"></div><div id="device-search-results"></div></div><div class="device-search-footer"><span>${icon('lock')} Ceny ${demoClient ? 'pro klienty bez DPH' : 'po přihlášení'}</span><a class="text-link" id="device-search-catalog" href="/katalog.html">Otevřít katalog ${icon('arrow')}</a></div>`,
    'product-search-dialog',
  );
  document.getElementById('device-query').value = deviceSearch.query;
  refreshDeviceSearch();
  document.getElementById('device-query').focus();
  document.querySelector('.device-search-scroll').scrollTop = 0;
}
function deviceSearchData() {
  const state = deviceSearch,
    q = state.query.trim(),
    selected = deviceById(state.model),
    all = DATA.devices || [];
  const family = all.filter(
    (d) => d.platform === state.platform && (state.family === 'all' || d.family === state.family),
  );
  const modelQuery = /[0-9]|iphone|ipad|macbook|watch|samsung|lenovo|galaxy/i.test(q);
  const models = family.filter(
    (d) => modelMatches(d, q) || (!modelQuery && modelProducts(d).some((p) => searchMatch(p, q))),
  );
  const pool = selected
    ? modelProducts(selected)
    : DATA.products.filter((p) =>
        state.family !== 'all'
          ? family.some((d) => d.product_ids.includes(p.id))
          : !DATA.devices
              ?.filter((d) => d.platform === 'android')
              .some((d) => d.product_ids.includes(p.id)),
      );
  const products = pool.filter(
    (p) =>
      (selected && !q) ||
      searchMatch(p, q) ||
      (!selected &&
        q &&
        family.filter((d) => modelMatches(d, q)).some((d) => d.product_ids.includes(p.id))),
  );
  return { q, selected, models, products };
}
function refreshDeviceSearch() {
  const controls = document.getElementById('device-search-controls');
  if (!controls || !modal()?.open || !modal().classList.contains('product-search-dialog')) return;
  const state = deviceSearch,
    d = deviceById(state.model);
  controls.innerHTML = d
    ? `<button class="device-back" data-back-device-models>${icon('back')} Změnit model</button><div class="chosen-device"><img src="${d.image}" alt="${esc(d.name)}" width="70" height="76"><div><span>VYBRANÉ ZAŘÍZENÍ</span><h3>${esc(d.name)}</h3>${d.subtitle ? `<p>${esc(d.subtitle)}</p>` : ''}</div><span class="chosen-device-check">${icon('check')}</span></div>`
    : `<div class="device-platform-row"><span>Vyberte zařízení</span><div class="platform-switch" role="group" aria-label="Platforma pro vyhledávání"><button data-search-platform="apple" aria-pressed="${state.platform === 'apple'}">${platformLabel('apple')}</button><button data-search-platform="android" aria-pressed="${state.platform === 'android'}">${platformLabel('android')}</button></div></div>${state.platform === 'apple' ? `<div class="search-families" role="group" aria-label="Typ zařízení">${SEARCH_FAMILIES.map((f) => `<button data-search-family="${f.id}" aria-pressed="${state.family === f.id}">${f.image ? `<img src="${f.image}" alt="" width="36" height="42">` : icon('grid')}<span>${f.name}</span></button>`).join('')}</div>` : '<p class="android-search-note">Samsung a Lenovo · skla a materiál pro repase</p>'}`;
  renderDeviceSearchResults();
}
function renderDeviceSearchResults() {
  const el = document.getElementById('device-search-results');
  if (!el) return;
  const { q, selected, models, products } = deviceSearchData();
  document.querySelector('[data-clear-device-query]').hidden = !deviceSearch.query;
  const url = new URLSearchParams();
  if (selected) url.set('device', selected.id);
  else if (deviceSearch.platform === 'android') url.set('category', 'refurb-android');
  if (q) url.set('q', q);
  else if (!selected && deviceSearch.family !== 'all' && deviceSearch.platform === 'apple')
    url.set('category', deviceSearch.family);
  document.getElementById('device-search-catalog').href =
    '/katalog.html' + (url.size ? '?' + url : '');
  if (!DATA.devices) {
    el.innerHTML = '<p class="search-loading" role="status">Načítáme zařízení a nabídku…</p>';
    return;
  }
  let html = '';
  if (!selected) {
    html = `<div class="search-results-heading"><h3>${q ? 'Odpovídající modely' : 'Vyberte model'}</h3><span>${models.length} ${models.length === 1 ? 'model' : models.length < 5 && models.length > 1 ? 'modely' : 'modelů'}</span></div>`;
    if (models.length)
      html += `<div class="search-model-grid">${models.map((d) => `<button class="search-model-card" data-select-device="${d.id}"><div class="search-device-photo"><img src="${d.image}" alt="${esc(d.name)}${d.image_is_family ? ' — ilustrační fotografie řady' : ''}" width="180" height="146" loading="lazy"></div><strong>${esc(d.name)}</strong>${d.subtitle ? `<span class="model-subtitle">${esc(d.subtitle)}</span>` : ''}<span class="model-count">${productCount(d.product_ids.length)} ${icon('arrow')}</span></button>`).join('')}</div>`;
    else
      html +=
        '<p class="no-models">Pro hledaný výraz tu není odpovídající model. Níže najdete dostupné díly.</p>';
  }
  if (selected || q) {
    html += `<div class="search-results-heading product-results-heading"><h3>${selected ? 'Díly a příslušenství' : 'Nalezené produkty'}</h3><span role="status">${productCount(products.length)}</span></div>`;
    html += products.length
      ? `<div class="products-grid search-product-grid">${products.map(card).join('')}</div>`
      : `<div class="search-empty">${icon('search')}<h3>Takový díl tu zatím nemáme.</h3><p>${selected ? 'Zkuste jiný název dílu nebo změňte model.' : 'Zkuste název zařízení, jiný díl nebo kód produktu.'}</p><button class="button secondary" data-clear-device-query>Vymazat hledání</button></div>`;
  }
  el.innerHTML = html;
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-clear-device]')) {
    activeDevice = '';
    applyCategory(activeCategory);
    catalog();
    return;
  }
  if (
    modal()?.classList.contains('login-dialog') &&
    (e.target.closest('[data-close]') || e.target === modal())
  )
    pendingDeviceSearch = null;
  const opener = e.target.closest('[data-open-device-search]');
  if (opener) {
    e.preventDefault();
    openDeviceSearch({ family: opener.dataset.searchFamily, model: opener.dataset.searchModel });
    return;
  }
  const home = e.target.closest('[data-home-platform]');
  if (home) {
    homePlatform = home.dataset.homePlatform;
    renderHomeDeviceCards();
    return;
  }
  const platform = e.target.closest('[data-search-platform]');
  if (platform) {
    deviceSearch.platform = platform.dataset.searchPlatform;
    deviceSearch.family = deviceSearch.platform === 'android' ? 'android' : 'all';
    deviceSearch.model = '';
    refreshDeviceSearch();
    document
      .querySelector('[data-search-platform="' + deviceSearch.platform + '"]')
      .focus({ preventScroll: true });
    return;
  }
  const family = e.target.closest('[data-search-family]');
  if (family) {
    deviceSearch.family = family.dataset.searchFamily;
    deviceSearch.model = '';
    refreshDeviceSearch();
    document
      .querySelector('[data-search-family="' + deviceSearch.family + '"]')
      .focus({ preventScroll: true });
    return;
  }
  const model = e.target.closest('[data-select-device]');
  if (model) {
    deviceSearch.model = model.dataset.selectDevice;
    deviceSearch.query = '';
    document.getElementById('device-query').value = '';
    refreshDeviceSearch();
    document.querySelector('.device-search-scroll').scrollTop = 0;
    document.getElementById('device-query').focus();
    return;
  }
  if (e.target.closest('[data-back-device-models]')) {
    deviceSearch.model = '';
    refreshDeviceSearch();
    return;
  }
  if (e.target.closest('[data-clear-device-query]')) {
    deviceSearch.query = '';
    document.getElementById('device-query').value = '';
    renderDeviceSearchResults();
    document.getElementById('device-query').focus();
  }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'device-query') {
    deviceSearch.query = e.target.value.slice(0, 200);
    if (!deviceSearch.model) {
      const q = normalize(deviceSearch.query),
        family = /iphone|ipad|macbook|watch/.exec(q)?.[0];
      if (/samsung|lenovo|galaxy|android|x510|x516|m11/.test(q)) {
        deviceSearch.platform = 'android';
        deviceSearch.family = 'android';
      } else if (family) {
        deviceSearch.platform = 'apple';
        deviceSearch.family = family;
      }
    }
    refreshDeviceSearch();
  }
});
document.addEventListener('submit', (e) => {
  if (e.target.id === 'device-search-form') {
    e.preventDefault();
    const { models, q, selected } = deviceSearchData();
    if (!selected && q && models.length === 1) {
      deviceSearch.model = models[0].id;
      deviceSearch.query = '';
      document.getElementById('device-query').value = '';
      refreshDeviceSearch();
    } else location.href = document.getElementById('device-search-catalog').href;
  } else if (e.target.classList.contains('search-form')) {
    e.preventDefault();
    openDeviceSearch();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal()?.classList.contains('login-dialog')) pendingDeviceSearch = null;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openDeviceSearch();
  }
});
