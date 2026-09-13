'use strict';
const ICONS = {
  service:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  cart: '<path d="M3 3h2l2.1 12h11.8L21 7H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  user: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/>',
  tools:
    '<path d="m4 3 5 5-2 2-5-5m6 4 12 12m0-18a5 5 0 0 1-6 6L3 20l1 1L15 10a5 5 0 0 0 6-6l-3 3-2-2z"/>',
  truck:
    '<path d="M2 4h13v13H2zM15 9h4l3 4v4h-7"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/>',
  shield: '<path d="M12 2 3 6v5c0 6 9 11 9 11s9-5 9-11V6z"/><path d="m8 12 3 3 5-6"/>',
  headphones:
    '<path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12H2v7h4v-7zm16 0h2v7h-4v-7zm0 7c0 3-4 3-7 3"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 5h4m-3 14h2"/>',
  heart:
    '<path d="M20.5 4.5a5 5 0 0 0-7 0L12 6l-1.5-1.5a5 5 0 0 0-7 7L12 20l8.5-8.5a5 5 0 0 0 0-7z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sliders:
    '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5" fill="white"/><circle cx="15" cy="17" r="2.5" fill="white"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
};
const icon = (name, cl = '') =>
  `<svg class="icon ${cl}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.arrow}</svg>`;
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const money = (n) =>
  new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
const normalize = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
let DATA = { products: [], groups: [], brands: [] },
  fav = new Set(),
  cart = [],
  toastTimer,
  demoClient = false;
try {
  demoClient = sessionStorage.getItem('refurb-demo-client') === 'active';
} catch {}
// Explicit, browser-local prototype session. This is not production authentication.
const DEMO_EMAIL = 'servis@example.com',
  DEMO_PASSWORD = 'Demo2026!';
try {
  fav = new Set(JSON.parse(localStorage.getItem('refurb-favorites') || '[]'));
  cart = JSON.parse(sessionStorage.getItem('refurb-cart') || '[]');
} catch {}
const qs = new URLSearchParams(location.search);
const getProduct = (id) => DATA.products.find((p) => p.id === id);
function decorate() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
    el.removeAttribute('data-icon');
  });
}
function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3000);
}
function header() {
  document.getElementById('site-header').innerHTML =
    `${deliveryTopline()}<div class="container header-top"><a href="/" class="logo" aria-label="Refurb.zone — úvodní stránka">refurb<span>.</span>zone<small>Díly pro delší život zařízení.</small></a><form class="search-form" action="/katalog.html" role="search"><button id="site-search" type="button" data-open-device-search aria-haspopup="dialog" aria-label="Hledat díl nebo vybrat zařízení">${icon('search')}<span>Hledejte díl, model nebo označení (např. iPhone 15 Pro)</span><kbd>⌘ K</kbd></button></form><div class="header-actions"><a href="https://www.refurb.zone/b2b-spoluprace/" class="service-head" target="_blank" rel="noopener"><span class="service-mark">${icon('service')}</span><span>Pro servisy</span></a><button class="account-action ${demoClient ? 'is-signed-in' : ''}" data-account aria-label="${demoClient ? 'Otevřít klientský účet' : 'Přihlášení pro klienty'}">${icon('user')}<span class="account-label">${demoClient ? 'Můj účet' : 'Přihlásit se'}</span>${demoClient ? '<span class="account-dot"></span>' : ''}</button><button class="cart-trigger" aria-label="Otevřít košík">${icon('cart')}<span class="cart-count">${cart.reduce((a, x) => a + x.qty, 0)}</span></button><button class="mobile-menu" aria-label="Otevřít kategorie">${icon('menu')}</button></div></div>${navigationHtml()}`;
  document.getElementById('site-footer').innerHTML =
    `<div class="footer"><div class="container"><div class="footer-top"><a class="logo" href="/">refurb<span>.</span>zone</a><div class="footer-links"><a href="tel:+420777122858">+420 777 122 858</a><a href="mailto:info@refurb.zone">info@refurb.zone</a><a href="/doprava.html">Doprava</a><a href="https://www.refurb.zone/vraceni-a-reklamace/" target="_blank" rel="noopener">Vrácení a reklamace</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Refurb.zone · Díly a vybavení pro servisy.</span><span>Ukázka obchodu · katalog k 10. 9. 2026 · ${demoClient ? (qs.get('service') === 'vykup' ? 'výkupní ceník v Kč' : 'ceny bez DPH') : 'ceny po přihlášení'}</span></div><details class="brand-attribution"><summary>Loga a licence</summary><p>Apple a ostatní značky patří svým vlastníkům. Android je ochranná známka společnosti Google LLC. Robot Android pochází z díla vytvořeného a sdíleného společností Google a je použit podle licence <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">Creative Commons Uveďte původ 3.0</a>.</p></details></div></div>`;
  decorate();
  initCompactHeader();
}
function inStock(p) {
  return p.variants.some((v) => v.availability === 'Skladem' && !v.disabled);
}
function badge(p) {
  const flags = p.flags.filter((f) => !f.includes('Kč'));
  return flags.find((f) => /Elite|ORIGINAL|PREMIUM|Novinka/i.test(f)) || flags[0] || '';
}
function card(p) {
  const b = badge(p);
  return `<article class="product-card">${b ? `<span class="product-badge ${b === 'Novinka' ? 'blue' : ''}">${esc(b)}</span>` : ''}<button class="favorite ${fav.has(p.id) ? 'active' : ''}" data-favorite="${p.id}" aria-label="${fav.has(p.id) ? 'Odebrat z' : 'Přidat do'} oblíbených: ${esc(p.name)}" aria-pressed="${fav.has(p.id)}">${icon('heart')}</button><a href="/produkt.html?id=${p.id}" class="product-image" tabindex="-1" aria-hidden="true"><img src="${p.images[0]}" alt="" loading="lazy" width="200" height="180"></a><a href="/produkt.html?id=${p.id}" class="product-title">${esc(p.name)}</a><p class="product-subtitle">${p.variants.length > 1 ? p.variants.length + ' variant' : esc(p.variants[0].sku)}</p><div class="stock ${inStock(p) ? '' : 'unavailable'}">${inStock(p) ? 'Skladem' : p.variants.some((v) => v.availability === 'Na dotaz') ? 'Na dotaz' : 'Momentálně nedostupné'}</div><div class="product-bottom">${demoClient ? `<span class="card-price">${p.variants.some((v) => v.price !== p.price) ? '<small>od </small>' : ''}${money(p.price)}</span><button class="small-cart" data-add="${p.id}" aria-label="${p.variants.length > 1 ? 'Vybrat variantu' : 'Přidat do košíku'}: ${esc(p.name)}">${icon(p.variants.length > 1 ? 'arrow' : 'cart')}</button>` : `<button class="price-login" data-login aria-label="Přihlásit se a zobrazit cenu: ${esc(p.name)}">${icon('lock')}<span>Cena po přihlášení</span>${icon('arrow')}</button>`}</div></article>`;
}
function home() {
  if (!document.getElementById('category-grid')) return;
  renderHomeExperience();
  featured('selected');
}
function featured(type) {
  let ps =
    type === 'new'
      ? DATA.products.filter((p) => p.flags.includes('Novinka'))
      : type === 'sale'
        ? DATA.products.filter((p) => p.flags.some((x) => /[–−-]\d+\s?%/.test(x)))
        : ['3051', '6699', '1646', '2965', '698', '9360'].map(getProduct);
  if (type === 'new' && ps.length < 6)
    ps = [...ps, ...DATA.products.filter((p) => !ps.includes(p)).sort((a, b) => +b.id - +a.id)];
  document.getElementById('featured-products').innerHTML = ps.slice(0, 6).map(card).join('');
  document
    .querySelectorAll('[data-featured]')
    .forEach((b) => b.setAttribute('aria-selected', b.dataset.featured === type));
  document.getElementById('featured-products').setAttribute('aria-labelledby', 'tab-' + type);
}
document.addEventListener('click', (e) => {
  const f = e.target.closest('[data-favorite]');
  if (f) {
    const id = f.dataset.favorite;
    fav.has(id) ? fav.delete(id) : fav.add(id);
    try {
      localStorage.setItem('refurb-favorites', JSON.stringify([...fav]));
    } catch {}
    f.classList.toggle('active', fav.has(id));
    f.setAttribute('aria-pressed', fav.has(id));
    toast(fav.has(id) ? 'Produkt uložen do oblíbených' : 'Produkt odebrán z oblíbených');
  }
  const t = e.target.closest('[data-featured]');
  if (t) featured(t.dataset.featured);
  const a = e.target.closest('[data-add]');
  if (a) {
    if (!demoClient) {
      loginDialog();
      return;
    }
    const p = getProduct(a.dataset.add);
    if (p && p.variants.length === 1 && inStock(p)) {
      try {
        addCart(p.id, p.variants[0].id, 1);
        renderCart();
      } catch (err) {
        toast(err.message);
      }
    } else location.href = '/produkt.html?id=' + a.dataset.add;
  }
});
header();
dataRepository
  .load()
  .then((d) => {
    DATA = d;
    home();
    refreshDeviceSearch();
    if (typeof initPage === 'function') initPage();
  })
  .catch(() => {
    const el =
      document.getElementById('featured-products') || document.getElementById('page-content');
    if (el)
      el.innerHTML =
        '<div class="empty"><h2>Katalog se nepodařilo načíst</h2><p>Zkuste stránku načíst znovu.</p><button class="button primary" onclick="location.reload()">Načíst znovu</button></div>';
  });

const CAT_NAMES = {
  'nahradni-dily': 'Náhradní díly pro Apple',
  iphone: 'Díly pro iPhone',
  ipad: 'Díly pro iPad',
  macbook: 'Díly pro MacBook',
  watch: 'Díly pro Apple Watch',
  novinky: 'Novinky',
  all: 'Všechny produkty',
  apple: 'Apple',
  refurb: 'Refurbish materiál',
  displeje: 'Displeje',
  baterie: 'Baterie',
  konektory: 'Konektory a flex kabely',
  kryty: 'Kryty a šasi',
  kamery: 'Kamery',
  naradi: 'Nářadí',
  'refurb-apple': 'Refurbish materiál — Apple',
  'refurb-android': 'Refurbish materiál — Android',
  programatory: 'Programátory',
  'adaptery-a-kabely': 'Adaptéry a kabely',
  lepeni: 'Lepení',
  'ochranna-skla': 'Ochranná skla',
  pajeni: 'Pájení',
  'cisteni-a-chemie': 'Čištění a chemie',
  doplnky: 'Příslušenství',
  akce: 'Akční nabídka',
};
let activeCategory = qs.get('category') || 'all',
  searchTerm = qs.get('q') || '',
  sortBy = 'recommended',
  activeBrand = qs.get('brand') || '',
  activeDevice = qs.get('device') || '',
  onlyStock = false,
  onlyFavorites = false,
  currentProduct = null,
  currentVariant = null,
  currentImage = 0;
const modal = () => document.getElementById('shop-dialog');
function openDialog(contents, cl = '') {
  let d = modal();
  if (d?.open) d.close();
  if (!d) {
    d = document.createElement('dialog');
    d.id = 'shop-dialog';
    document.getElementById('overlays').append(d);
    d.addEventListener('click', (e) => {
      if (e.target === d) d.close();
    });
    d.addEventListener('close', () => {
      if (!d.open) document.body.classList.remove('dialog-open');
    });
  }
  d.className = 'shop-dialog ' + cl;
  d.innerHTML = contents;
  d.setAttribute('aria-labelledby', 'dialog-title');
  d.showModal();
  document.body.classList.add('dialog-open');
}
function closeButton() {
  return `<button class="icon-button close-dialog" data-close aria-label="Zavřít">${icon('close')}</button>`;
}
function categoryMatch(p, key) {
  if (key === 'all') return true;
  if (['iphone', 'ipad', 'macbook', 'watch'].includes(key))
    return p.group === 'nahradni-dily' && new RegExp(key, 'i').test(p.name);
  if (key === 'novinky') return p.flags.includes('Novinka');
  if (key === 'apple') return /iphone|ipad|macbook|watch|apple/i.test(p.name);
  if (key === 'refurb') return p.group.startsWith('refurb-');
  if (key === 'doplnky')
    return !['nahradni-dily', 'refurb-apple', 'refurb-android'].includes(p.group);
  if (key === 'akce') return p.flags.some((f) => /[–−-]\d+\s?%/.test(f));
  return p.kind === key || p.group === key;
}
function searchMatch(p, term) {
  const hay = normalize(
    [p.name, p.short, p.variants.map((v) => v.sku + ' ' + v.name).join(' ')].join(' '),
  );
  return normalize(term)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) =>
      /^\d+$/.test(word) ? new RegExp('(?<!\\d)' + word + '(?!\\d)').test(hay) : hay.includes(word),
    );
}
function filteredProducts() {
  let ps = DATA.products.filter(
    (p) =>
      categoryMatch(p, activeCategory) &&
      searchMatch(p, searchTerm) &&
      brandMatch(p, activeBrand) &&
      deviceProductMatch(p, activeDevice) &&
      (!onlyStock || inStock(p)) &&
      (!onlyFavorites || fav.has(p.id)),
  );
  if (sortBy === 'price-asc') ps.sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') ps.sort((a, b) => b.price - a.price);
  if (sortBy === 'name') ps.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
  if (sortBy === 'new') ps.sort((a, b) => +b.id - +a.id);
  return ps;
}
function categoryOptions() {
  return [
    'all',
    'nahradni-dily',
    'iphone',
    'ipad',
    'macbook',
    'watch',
    'displeje',
    'baterie',
    'konektory',
    'kryty',
    'kamery',
    'refurb-apple',
    'refurb-android',
    'programatory',
    'adaptery-a-kabely',
    'lepeni',
    'ochranna-skla',
    'naradi',
    'pajeni',
    'cisteni-a-chemie',
  ];
}
function categoryLinks() {
  return categoryOptions()
    .map(
      (key) =>
        `<a class="category-filter ${activeCategory === key ? 'selected' : ''}" href="/katalog.html${key === 'all' ? '' : '?category=' + key}" data-category="${key}"><span>${esc(CAT_NAMES[key])}</span><small>${DATA.products.filter((p) => categoryMatch(p, key)).length}</small></a>`,
    )
    .join('');
}
function catalog() {
  document.title =
    (searchTerm
      ? 'Hledání: ' + searchTerm
      : deviceTitle() || brandTitle() || CAT_NAMES[activeCategory] || 'Katalog') + ' — Refurb.zone';
  document.getElementById('page-content').innerHTML =
    `<div class="container catalog-page"><div class="breadcrumbs"><a href="/">Domů</a><span>/</span><span>Katalog produktů</span></div><div class="catalog-heading"><div><span class="eyebrow">DÍLY, KTERÉ POTŘEBUJETE</span><h1 id="catalog-title">${esc(searchTerm ? 'Výsledky pro „' + searchTerm + '“' : deviceTitle() || brandTitle() || CAT_NAMES[activeCategory] || 'Katalog')}</h1></div><span class="catalog-total">${DATA.products.length} produktů pro váš servis</span></div><div class="catalog-layout"><aside class="catalog-sidebar"><h2>Kategorie</h2><div id="category-links">${categoryLinks()}</div><div class="sidebar-help">${icon('headphones')}<h3>Nevíte si rady s výběrem?</h3><p>Pomůžeme vám najít správný díl.</p><a href="tel:+420777122858">+420 777 122 858</a><small>Po–Pá 10:00–18:00</small></div></aside><section class="catalog-results" aria-label="Produkty"><div class="catalog-toolbar"><button class="filter-toggle button secondary" data-mobile-filters>${icon('sliders')} Kategorie</button><span id="result-count" aria-live="polite"></span><label class="sort-label">Řadit podle <select id="sort-select"><option value="recommended">Doporučené</option>${demoClient ? '<option value="price-asc">Nejlevnější</option><option value="price-desc">Nejdražší</option>' : ''}<option value="new">Nejnovější</option><option value="name">Názvu A–Z</option></select></label></div><div class="catalog-access ${demoClient ? 'signed-in' : ''}">${icon(demoClient ? 'check' : 'lock')}<span>${demoClient ? 'Klientské ceny jsou zobrazené bez DPH.' : 'Ceny jsou dostupné přihlášeným klientům.'}</span>${demoClient ? '' : '<button data-login>Přihlásit se</button>'}</div>${activeDevice ? `<div class="brand-filter-label">Zařízení: ${esc(deviceTitle())}<button data-clear-device aria-label="Zrušit filtr zařízení">${icon('close')}</button></div>` : ''}${activeBrand ? `<div class="brand-filter-label">${esc(brandTitle())}<button data-clear-brand aria-label="Zrušit filtr značky">${icon('close')}</button></div>` : ''}<div class="filter-row"><label><input type="checkbox" id="stock-filter"> Pouze skladem</label><label><input type="checkbox" id="favorite-filter"> Jen oblíbené ${icon('heart')}</label><button class="reset-filters" data-reset-filters>Zrušit filtry</button></div><div class="products-grid catalog-grid" id="catalog-grid"></div></section></div></div>`;
  renderResults();
}
function renderResults() {
  const ps = filteredProducts();
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  grid.innerHTML = ps.length
    ? ps.map(card).join('')
    : `<div class="empty">${icon('search')}<h2>Žádný odpovídající produkt</h2><p>Zkuste jiný název, model nebo upravte filtry.</p><button class="button primary" data-reset-filters>Zobrazit všechny produkty</button></div>`;
  document.getElementById('result-count').textContent =
    ps.length +
    ' ' +
    (ps.length === 1 ? 'produkt' : ps.length > 1 && ps.length < 5 ? 'produkty' : 'produktů');
  document.getElementById('catalog-title').textContent = searchTerm
    ? 'Výsledky pro „' + searchTerm + '“'
    : deviceTitle() || brandTitle() || CAT_NAMES[activeCategory] || 'Katalog';
  document.getElementById('category-links').innerHTML = categoryLinks();
  document.getElementById('sort-select').value = sortBy;
  document.getElementById('stock-filter').checked = onlyStock;
  document.getElementById('favorite-filter').checked = onlyFavorites;
}
function applyCategory(key) {
  activeCategory = CAT_NAMES[key] ? key : 'all';
  const params = new URLSearchParams();
  if (activeCategory !== 'all') params.set('category', activeCategory);
  if (searchTerm) params.set('q', searchTerm);
  if (activeBrand) params.set('brand', activeBrand);
  if (activeDevice) params.set('device', activeDevice);
  history.replaceState({}, '', location.pathname + (params.size ? '?' + params : ''));
  renderResults();
  modal()?.close();
}
function variantLabel(v) {
  return v.name?.includes(':') ? v.name.slice(v.name.indexOf(':') + 1).trim() : v.name || v.sku;
}
function priceHint(p) {
  return p.variants.some((v) => v.price !== p.price) ? 'od ' : '';
}
function product() {
  const id = qs.get('id') || '3051';
  currentProduct = getProduct(id);
  const p = currentProduct;
  if (!p) {
    document.getElementById('page-content').innerHTML =
      `<div class="container empty"><h1>Produkt nebyl nalezen</h1><p>Podívejte se na ostatní díly v nabídce.</p><a class="button primary" href="/katalog.html">Přejít do katalogu</a></div>`;
    return;
  }
  currentVariant = p.variants.length === 1 ? p.variants[0] : null;
  document.title = p.name + ' — Refurb.zone';
  document.querySelector('meta[name=description]').content = p.short || p.name;
  const flags = p.flags.filter((f) => !f.includes('Kč') && !/\d+\s?%/.test(f));
  const category = CAT_NAMES[p.kind] || CAT_NAMES[p.group] || 'Náhradní díly';
  const compatible = p.short.replace(/^Vhodné pro modely:\s*/i, '');
  const rating = p.rating.value
    ? `<span class="review-stars">${Array.from({ length: 5 }, () => icon('star')).join('')}</span><strong>${p.rating.value.toLocaleString('cs-CZ')}</strong><a href="#hodnoceni">${p.rating.count} hodnocení</a>`
    : '';
  document.getElementById('page-content').innerHTML =
    `<div class="container detail-page"><nav class="breadcrumbs" aria-label="Drobečková navigace"><a href="/">Domů</a><span>/</span><a href="/katalog.html?category=${p.kind}">${esc(category)}</a><span>/</span><span>${esc(p.name)}</span></nav><div class="detail-grid"><div class="gallery"><div class="gallery-main"><button class="favorite detail-favorite ${fav.has(p.id) ? 'active' : ''}" data-favorite="${p.id}" aria-pressed="${fav.has(p.id)}" aria-label="Uložit do oblíbených">${icon('heart')}</button><button class="zoom-image" aria-label="Zvětšit fotografii produktu" data-zoom><img id="main-product-image" src="${p.images[0]}" alt="${esc(p.name)}" width="600" height="500"></button><span class="gallery-caption">Kliknutím zvětšíte fotografii</span></div><div class="thumbnails" aria-label="Galerie produktu">${p.images.map((im, i) => `<button class="thumbnail ${i === 0 ? 'selected' : ''}" data-image="${i}" aria-label="Zobrazit fotografii ${i + 1}" aria-pressed="${i === 0}"><img src="${im}" alt="${esc(p.name)} — pohled ${i + 1}" width="70" height="64" loading="lazy"></button>`).join('')}</div><div class="gallery-assurance">${icon('shield')}<span>Pečlivě vybrané díly.<br><strong>Podpora lidí, kteří opravám rozumí.</strong></span></div></div><div class="product-info"><div class="detail-badges">${flags
      .slice(0, 3)
      .map((f) => `<span>${esc(f)}</span>`)
      .join(
        '',
      )}</div><h1>${esc(p.name)}</h1><div class="detail-review">${rating}</div>${compatible ? `<div class="compatibility">${icon('phone')}<div><strong>Kompatibilita</strong><p>${esc(compatible)}</p></div></div>` : ''}<div class="buy-box">${p.variants.length > 1 ? `<div class="variant-heading"><label for="variant-select">${esc(p.variants[0].name?.split(':')[0] || 'Varianta')}</label><span>${p.variants.length} variant</span></div><select id="variant-select" class="variant-select"><option value="">Vyberte variantu</option>${p.variants.map((v) => `<option value="${v.id}">${esc(variantLabel(v))}${demoClient ? ' — ' + money(v.price) : ''}${v.availability ? ' · ' + esc(v.availability) : ''}</option>`).join('')}</select>${p.variants.length <= 5 ? `<div class="variant-chips" aria-label="Rychlý výběr varianty">${p.variants.map((v) => `<button data-variant="${v.id}" aria-pressed="false">${esc(variantLabel(v))}</button>`).join('')}</div>` : ''}` : ''}<div class="detail-price-row"><div><div class="detail-price" id="detail-price"></div><div class="detail-gross" id="detail-gross"></div></div></div><div id="variant-status"></div><div class="buy-actions"><div class="quantity"><button data-qty="-1" aria-label="Snížit množství">${icon('minus')}</button><input type="number" id="quantity" value="1" min="1" max="99" step="1" aria-label="Počet kusů"><button data-qty="1" aria-label="Zvýšit množství">${icon('plus')}</button></div><button class="button primary add-main" id="add-main" data-add-detail>${icon('cart')}<span>Do košíku</span></button></div><div class="detail-sku">Kód produktu: <span id="detail-sku">${esc(currentVariant?.sku || 'vyberte variantu')}</span></div><div class="buy-details"><div>${icon('truck')}<span>Ve všední dny do 17:30 odesíláme tentýž den<a href="/doprava.html">Praha do 2 hodin s Wolt Drive</a></span></div><div>${icon('shield')}<span>${p.warranty ? 'Záruka: ' + esc(p.warranty) : 'Podpora při výběru i po nákupu'}<a href="https://www.refurb.zone/vraceni-a-reklamace/" target="_blank" rel="noopener">Podmínky vrácení a reklamace</a></span></div></div></div><div class="detail-help">${icon('headphones')}<p>Potřebujete poradit? <a href="tel:+420777122858">+420 777 122 858</a><small>Po–Pá 10:00–18:00</small></p></div></div></div><section class="product-content"><div class="detail-tabs" role="tablist" aria-label="Informace o produktu"><button role="tab" id="detail-tab-description" data-detail-tab="description" aria-selected="true">Popis produktu</button><button role="tab" id="detail-tab-parameters" data-detail-tab="parameters" aria-selected="false">Parametry</button><button role="tab" id="detail-tab-delivery" data-detail-tab="delivery" aria-selected="false">Doprava a vrácení</button></div><div id="detail-tab-panel" role="tabpanel" aria-labelledby="detail-tab-description"></div></section>${p.rating.value ? `<section class="rating-summary" id="hodnoceni"><div><h2>Hodnocení zákazníků</h2><p>Hodnocení převzaté z původního e-shopu.</p></div><strong>${p.rating.value.toLocaleString('cs-CZ')}<small> / 5 · ${p.rating.count} hodnocení</small></strong><a class="text-link" href="${p.source}" target="_blank" rel="noopener">Zobrazit na Refurb.zone ${icon('arrow')}</a></section>` : ''}<section class="related-section"><div class="section-heading"><h2>Mohlo by se vám hodit</h2><a class="text-link" href="/katalog.html">Celá nabídka ${icon('arrow')}</a></div><div class="products-grid">${DATA.products
      .filter((x) => x.id !== p.id)
      .sort((a, b) => (b.group === p.group) - (a.group === p.group))
      .slice(0, 6)
      .map(card)
      .join('')}</div></section></div>`;
  updateVariant();
  detailTab('description');
}
function updateVariant() {
  const p = currentProduct,
    v = currentVariant;
  if (!p) return;
  document.getElementById('detail-price').innerHTML = demoClient
    ? (v ? '' : priceHint(p)) + money(v ? v.price : p.price) + ' <small>bez DPH</small>'
    : `<span class="detail-price-locked">${icon('lock')} Cena pro přihlášené klienty</span>`;
  document.getElementById('detail-gross').textContent = demoClient
    ? money(v ? v.gross : p.gross) + ' včetně DPH'
    : 'Přihlaste se a zobrazte cenu této varianty.';
  const available = v && v.availability === 'Skladem' && !v.disabled;
  document.getElementById('variant-status').innerHTML =
    `<div class="stock detail-stock ${available ? '' : 'unavailable'}">${v ? v.availability || (p.variants.length > 1 ? 'Dostupnost ověřte u prodejce' : 'Dostupnost není uvedena') : 'Nejprve vyberte variantu'}${available && v.stock !== null ? ' · ' + v.stock + ' ks' : ''}</div>`;
  const b = document.getElementById('add-main');
  b.disabled = demoClient && !available;
  b.querySelector('span').textContent = !demoClient
    ? 'Přihlásit se a zobrazit cenu'
    : !v
      ? 'Vyberte variantu'
      : available
        ? 'Do košíku'
        : 'Momentálně nedostupné';
  document.querySelector('.buy-actions .quantity').hidden = !demoClient;
  document.getElementById('detail-sku').textContent = v?.sku || 'vyberte variantu';
  const qty = document.getElementById('quantity');
  qty.max = String(available && v.stock !== null ? Math.max(1, v.stock) : 99);
  qty.value = String(Math.min(+qty.value || 1, +qty.max));
  if (v?.image) document.getElementById('main-product-image').src = v.image;
  const sel = document.getElementById('variant-select');
  if (sel) sel.value = v?.id || '';
  document.querySelectorAll('[data-variant]').forEach((b) => {
    b.classList.toggle('selected', b.dataset.variant === v?.id);
    b.setAttribute('aria-pressed', b.dataset.variant === v?.id);
  });
}
function detailTab(key) {
  const p = currentProduct;
  let content = '';
  if (key === 'parameters')
    content = `<div class="specification-layout"><h2>Technické parametry</h2><dl class="specifications">${[{ name: 'Produkt', value: p.name }, ...p.parameters, ...(p.warranty && !p.parameters.some((x) => x.name === 'Záruka') ? [{ name: 'Záruka', value: p.warranty }] : [])].map((x) => `<div><dt>${esc(x.name)}</dt><dd>${esc(x.value)}</dd></div>`).join('')}</dl></div>`;
  else if (key === 'delivery') content = deliveryDetailHtml();
  else {
    const desc = p.description;
    const parts = desc.split(/(?<=\.)\s+(?=[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ📱])/u);
    content = `<div class="description-layout"><div><span class="eyebrow">PŘIPRAVENO NA DALŠÍ OPRAVU</span><h2>Detail, na kterém záleží.</h2><a class="text-link source-link" href="${p.source}" target="_blank" rel="noopener">Produkt v původním e-shopu ${icon('arrow')}</a></div><div class="description-copy">${p.short ? `<p class="description-lead">${esc(p.short)}</p>` : ''}${parts.map((part) => `<p>${esc(part)}</p>`).join('')}</div></div>`;
  }
  document.getElementById('detail-tab-panel').innerHTML = content;
  document.getElementById('detail-tab-panel').setAttribute('aria-labelledby', 'detail-tab-' + key);
  document
    .querySelectorAll('[data-detail-tab]')
    .forEach((b) => b.setAttribute('aria-selected', b.dataset.detailTab === key));
}
function cartItems() {
  return cart
    .map((c) => {
      const p = getProduct(c.productId),
        v = p?.variants.find((v) => v.id === c.variantId);
      return p && v
        ? { ...c, qty: Math.max(1, Math.min(99, Math.floor(c.qty) || 1)), product: p, variant: v }
        : null;
    })
    .filter(Boolean);
}
function syncCart() {
  try {
    sessionStorage.setItem('refurb-cart', JSON.stringify(cart));
  } catch {}
  const c = document.querySelector('.cart-count');
  if (c) c.textContent = cartItems().reduce((sum, x) => sum + x.qty, 0);
}
function addCart(productId, variantId, qty = 1) {
  if (!demoClient)
    throw Error('Pro zobrazení cen a nákup se nejprve přihlaste do ukázkového účtu.');
  const p = getProduct(productId),
    v = p?.variants.find((v) => v.id === variantId);
  if (!v || v.disabled || v.availability !== 'Skladem')
    throw Error('Tuto variantu nyní nelze přidat do košíku.');
  if (!Number.isInteger(qty) || qty < 1 || qty > 99)
    throw Error('Zadejte celé množství od 1 do 99 kusů.');
  const item = cart.find((c) => c.productId === productId && c.variantId === variantId);
  const total = (item?.qty || 0) + qty;
  if (v.stock !== null && total > v.stock)
    throw Error('Ve zdroji je uvedeno jen ' + v.stock + ' ks.');
  if (total > 99) throw Error('Maximální množství je 99 kusů.');
  if (item) item.qty = total;
  else cart.push({ productId, variantId, qty });
  syncCart();
  toast('Přidáno do košíku');
  return { productId, variantId, quantity: total };
}
function removeCart(variantId) {
  if (!cart.some((c) => c.variantId === variantId)) throw Error('Položka není v košíku.');
  cart = cart.filter((c) => c.variantId !== variantId);
  syncCart();
  return { variant_id: variantId, removed: true };
}
function renderCart() {
  if (!demoClient) {
    loginDialog('Pro nákup a zobrazení cen se nejprve přihlaste.');
    return;
  }
  const items = cartItems(),
    net = items.reduce((sum, c) => sum + c.variant.price * c.qty, 0),
    gross = items.reduce((sum, c) => sum + c.variant.gross * c.qty, 0);
  const contents = `<div class="dialog-heading"><div><span class="eyebrow">VŠE PRO VAŠI DALŠÍ OPRAVU</span><h2 id="dialog-title">Váš košík <small>${items.reduce((sum, c) => sum + c.qty, 0)}</small></h2></div>${closeButton()}</div>${!items.length ? `<div class="cart-empty">${icon('cart')}<h3>Košík čeká na první díl.</h3><p>Vyberte si z dílů a vybavení pro váš servis.</p><a href="/katalog.html" class="button primary">Prohlédnout nabídku ${icon('arrow')}</a></div>` : `<div class="cart-items">${items.map((c) => `<article class="cart-item"><a href="/produkt.html?id=${c.productId}"><img src="${c.variant.image || c.product.images[0]}" alt="${esc(c.product.name)}" width="84" height="84"></a><div class="cart-item-info"><a href="/produkt.html?id=${c.productId}">${esc(c.product.name)}</a><small>${esc(c.variant.name || c.variant.sku)}</small><div class="cart-line-bottom"><div class="quantity small"><button data-cart-delta="-1" data-variant-id="${c.variantId}" aria-label="Snížit počet ${esc(c.product.name)}">${icon('minus')}</button><span>${c.qty}</span><button data-cart-delta="1" data-variant-id="${c.variantId}" aria-label="Zvýšit počet ${esc(c.product.name)}">${icon('plus')}</button></div><strong>${money(c.variant.price * c.qty)}</strong></div></div><button class="cart-remove" data-remove="${c.variantId}" aria-label="Odebrat ${esc(c.product.name)}">${icon('close')}</button></article>`).join('')}</div><div class="cart-summary"><div><span>Celkem bez DPH</span><strong>${money(net)}</strong></div><div class="gross-total"><span>Celkem včetně DPH</span><span>${money(gross)}</span></div><p class="cart-demo-note">Toto je ukázkový košík. Objednávku lze vytvořit v původním e-shopu; vybrané položky se tam nepřenášejí.</p><a class="button primary" target="_blank" rel="noopener" href="https://www.refurb.zone/">Přejít na Refurb.zone ${icon('arrow')}</a><button class="continue-shopping" data-close>Pokračovat ve výběru</button></div>`}`;
  if (modal()?.open && modal().classList.contains('cart-drawer')) modal().innerHTML = contents;
  else openDialog(contents, 'cart-drawer');
}
function mobileFilters() {
  openDialog(
    `<div class="dialog-heading"><h2 id="dialog-title">Kategorie</h2>${closeButton()}</div><div class="mobile-category-list">${categoryLinks()}</div>`,
    'menu-drawer',
  );
}
function initPage() {
  if (location.pathname.endsWith('katalog.html')) catalog();
  if (location.pathname.endsWith('produkt.html')) product();
  if (location.pathname.endsWith('sluzby.html')) servicePage();
  if (location.pathname.endsWith('doprava.html')) deliveryPage();
  syncCart();
  registerTools();
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) modal()?.close();
  if (e.target.closest('.cart-trigger')) renderCart();
  if (e.target.closest('.mobile-menu')) mobileNavigation();
  if (e.target.closest('[data-mobile-filters]')) mobileFilters();
  const cat = e.target.closest('[data-category]');
  if (cat && document.getElementById('catalog-grid')) {
    e.preventDefault();
    applyCategory(cat.dataset.category);
  }
  const reset = e.target.closest('[data-reset-filters]');
  if (reset) {
    searchTerm = '';
    activeBrand = '';
    activeDevice = '';
    onlyStock = false;
    onlyFavorites = false;
    sortBy = 'recommended';
    document.getElementById('site-search').value = '';
    applyCategory('all');
    catalog();
  }
  const variant = e.target.closest('[data-variant]');
  if (variant) {
    currentVariant = currentProduct.variants.find((v) => v.id === variant.dataset.variant);
    updateVariant();
  }
  const thumb = e.target.closest('[data-image]');
  if (thumb) {
    currentImage = +thumb.dataset.image;
    document.getElementById('main-product-image').src = currentProduct.images[currentImage];
    document.querySelectorAll('[data-image]').forEach((b) => {
      b.classList.toggle('selected', +b.dataset.image === currentImage);
      b.setAttribute('aria-pressed', +b.dataset.image === currentImage);
    });
  }
  if (e.target.closest('[data-zoom]'))
    openDialog(
      `<div class="lightbox-heading"><h2 id="dialog-title">${esc(currentProduct.name)}</h2>${closeButton()}</div><img class="lightbox-image" src="${document.getElementById('main-product-image').src}" alt="${esc(currentProduct.name)}">`,
      'lightbox',
    );
  const dt = e.target.closest('[data-detail-tab]');
  if (dt) detailTab(dt.dataset.detailTab);
  const q = e.target.closest('[data-qty]');
  if (q) {
    const inp = document.getElementById('quantity');
    inp.value = String(
      Math.min(+inp.max, Math.max(1, (Math.floor(+inp.value) || 1) + +q.dataset.qty)),
    );
  }
  if (e.target.closest('[data-add-detail]')) {
    if (!demoClient) {
      loginDialog();
      return;
    }
    try {
      addCart(
        currentProduct.id,
        currentVariant?.id,
        Number(document.getElementById('quantity').value),
      );
      renderCart();
    } catch (err) {
      toast(err.message);
    }
  }
  const rm = e.target.closest('[data-remove]');
  if (rm) {
    removeCart(rm.dataset.remove);
    renderCart();
  }
  const delta = e.target.closest('[data-cart-delta]');
  if (delta) {
    const item = cart.find((c) => c.variantId === delta.dataset.variantId);
    if (item) {
      if (+delta.dataset.cartDelta === 1) {
        try {
          addCart(item.productId, item.variantId, 1);
        } catch (err) {
          toast(err.message);
        }
      } else if (item.qty > 1) item.qty--;
      else cart = cart.filter((c) => c !== item);
      syncCart();
      renderCart();
    }
  }
  if (
    e.target.closest('[data-favorite]') &&
    document.getElementById('catalog-grid') &&
    onlyFavorites
  )
    renderResults();
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'variant-select') {
    currentVariant = currentProduct.variants.find((v) => v.id === e.target.value) || null;
    updateVariant();
  }
  if (e.target.id === 'sort-select') {
    sortBy = e.target.value;
    renderResults();
  }
  if (e.target.id === 'stock-filter') {
    onlyStock = e.target.checked;
    renderResults();
  }
  if (e.target.id === 'favorite-filter') {
    onlyFavorites = e.target.checked;
    renderResults();
  }
  if (e.target.id === 'quantity') {
    e.target.value = String(Math.max(1, Math.min(+e.target.max, Math.floor(+e.target.value) || 1)));
  }
});
document.addEventListener('keydown', (e) => {
  const tabs = e.target.closest('[role=tablist]');
  if (!tabs || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
  const buttons = [...tabs.querySelectorAll('[role=tab]')];
  let index = buttons.indexOf(document.activeElement);
  if (e.key === 'ArrowRight') index = (index + 1) % buttons.length;
  if (e.key === 'ArrowLeft') index = (index - 1 + buttons.length) % buttons.length;
  if (e.key === 'Home') index = 0;
  if (e.key === 'End') index = buttons.length - 1;
  e.preventDefault();
  buttons[index].focus();
  buttons[index].click();
});

function brandTitle() {
  return DATA.brands?.find((b) => b.id === activeBrand)?.label || '';
}
function brandMatch(p, id) {
  return !id || Boolean(DATA.brands?.find((b) => b.id === id)?.product_ids.includes(p.id));
}
function renderBrands() {
  const strip = document.getElementById('brand-strip');
  if (!strip) return;
  strip.innerHTML =
    (DATA.brands || [])
      .map(
        (b) =>
          `<a class="brand-logo brand-${esc(b.id)}" href="/katalog.html?brand=${esc(b.id)}" aria-label="${esc(b.label)} — ${b.product_ids.length} ${b.product_ids.length === 1 ? 'produkt' : b.product_ids.length < 5 ? 'produkty' : 'produktů'}" title="${esc(b.label)}"><img src="${esc(b.logo)}" alt="${esc(b.name)}" width="110" height="38" loading="lazy"></a>`,
      )
      .join('') +
    '<a class="all-brands" href="/katalog.html">Celá nabídka ' +
    icon('arrow') +
    '</a>';
}
function loginDialog(message = 'Přihlaste se a zobrazte klientské ceny dílů a vybavení.') {
  if (demoClient) {
    accountDialog();
    return;
  }
  pendingDeviceSearch =
    modal()?.open && modal()?.classList.contains('product-search-dialog')
      ? { ...deviceSearch }
      : null;
  openDialog(
    `<div class="login-layout"><aside class="login-intro"><a class="logo" href="/">refurb<span>.</span>zone</a><div class="login-intro-copy"><span class="eyebrow">PRO VAŠI DALŠÍ OPRAVU</span><h3>Váš servis.<br>Vaše ceny.</h3><p>Díly a vybavení na jednom místě, připravené pro vaše podnikání.</p><ul><li>${icon('check')} Ceny dostupné po přihlášení</li><li>${icon('check')} Přehled variant a dostupnosti</li><li>${icon('check')} Rychlý výběr do košíku</li></ul></div><small>Klientská zóna pro servisy a firmy</small></aside><section class="login-main"><div class="login-heading"><span class="demo-pill">Ukázka přihlášení</span>${closeButton()}</div><h2 id="dialog-title">Vítejte zpět.</h2><p class="login-subtitle">${esc(message)}</p><form id="client-login" class="login-form"><label for="client-email">E-mail<input id="client-email" name="email" type="email" autocomplete="off" placeholder="vas@servis.cz" required aria-describedby="login-demo-note"></label><label for="client-password">Heslo<div class="password-field"><input id="client-password" name="password" type="password" autocomplete="off" placeholder="Zadejte ukázkové heslo" required><button type="button" data-show-password aria-label="Zobrazit heslo" aria-pressed="false">Zobrazit</button></div></label><p id="login-error" class="login-error" role="alert" hidden></p><button type="submit" class="button primary">Přihlásit se ${icon('arrow')}</button></form><div class="demo-credentials" id="login-demo-note"><strong>Vyzkoušejte si klientský účet</strong><p>E-mail: <code>${DEMO_EMAIL}</code><br>Heslo: <code>${DEMO_PASSWORD}</code></p><button class="button secondary" data-fill-demo>Vyplnit ukázkové údaje</button><small>Jde o ukázku. Nepoužívejte své skutečné přihlašovací údaje.</small></div><p class="login-register">Ještě nejste naším klientem? <a href="https://www.refurb.zone/b2b-spoluprace/" target="_blank" rel="noopener">Spolupráce pro servisy ${icon('arrow')}</a></p></section></div>`,
    'login-dialog',
  );
}
function authenticateDemo(email, password) {
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD)
    throw Error('Pro tuto ukázku použijte údaje uvedené níže.');
  setDemoClient(true);
}
function setDemoClient(value) {
  demoClient = value;
  try {
    if (value) sessionStorage.setItem('refurb-demo-client', 'active');
    else sessionStorage.removeItem('refurb-demo-client');
  } catch {}
  if (!value) {
    cart = [];
    sortBy = 'recommended';
    syncCart();
  }
  modal()?.close();
  refreshClientView();
  if (value && pendingDeviceSearch) {
    const previousSearch = pendingDeviceSearch;
    pendingDeviceSearch = null;
    openDeviceSearch(previousSearch);
  }
  toast(
    value
      ? 'Jste přihlášeni. Klientské ceny jsou nyní viditelné.'
      : 'Jste odhlášeni. Ceny jsou znovu skryté.',
  );
}
function refreshClientView() {
  const variantId = currentVariant?.id,
    quantity = document.getElementById('quantity')?.value,
    selected =
      document.querySelector('[data-featured][aria-selected="true"]')?.dataset.featured ||
      'selected';
  header();
  if (document.getElementById('category-grid')) {
    home();
    featured(selected);
  }
  if (location.pathname.endsWith('katalog.html')) catalog();
  if (location.pathname.endsWith('produkt.html')) {
    product();
    if (variantId) {
      currentVariant = currentProduct?.variants.find((v) => v.id === variantId) || null;
      updateVariant();
    }
    if (quantity && document.getElementById('quantity'))
      document.getElementById('quantity').value = quantity;
  }
  if (location.pathname.endsWith('sluzby.html')) servicePage();
  syncCart();
}
function accountDialog() {
  openDialog(
    `<div class="dialog-heading"><div><span class="demo-pill">Ukázkový účet</span><h2 id="dialog-title">Váš klientský účet</h2></div>${closeButton()}</div><div class="account-content"><div class="account-avatar">${icon('user')}</div><h3>Ukázkový servis</h3><p>${DEMO_EMAIL}</p><div class="account-status">${icon('check')} Klientské ceny jsou odemčené</div><dl><div><dt>Zobrazení cen</dt><dd>Bez DPH i včetně DPH</dd></div><div><dt>Katalog</dt><dd>${DATA.products.length} produktů ze stažených dat</dd></div></dl><button class="button primary" data-close>Pokračovat ve výběru ${icon('arrow')}</button><button class="button secondary" data-logout>Odhlásit se</button><small>Ukázkové přihlášení platí v této kartě prohlížeče. Objednávky se neodesílají.</small></div>`,
    'account-dialog',
  );
}
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'client-login') return;
  e.preventDefault();
  const error = document.getElementById('login-error');
  try {
    authenticateDemo(
      document.getElementById('client-email').value,
      document.getElementById('client-password').value,
    );
  } catch (err) {
    error.textContent = err.message;
    error.hidden = false;
    document.getElementById('client-email').setAttribute('aria-invalid', 'true');
    document.getElementById('client-password').setAttribute('aria-invalid', 'true');
  }
});
document.addEventListener('input', (e) => {
  if (!e.target.closest('#client-login')) return;
  e.target.removeAttribute('aria-invalid');
  const error = document.getElementById('login-error');
  if (error) error.hidden = true;
});
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-login]')) loginDialog();
  if (e.target.closest('[data-account]')) demoClient ? accountDialog() : loginDialog();
  if (e.target.closest('[data-logout]')) setDemoClient(false);
  if (e.target.closest('[data-fill-demo]')) {
    document.getElementById('client-email').value = DEMO_EMAIL;
    document.getElementById('client-password').value = DEMO_PASSWORD;
    document
      .querySelectorAll('#client-login [aria-invalid]')
      .forEach((el) => el.removeAttribute('aria-invalid'));
    document.getElementById('login-error').hidden = true;
    document.querySelector('#client-login [type="submit"]').focus();
  }
  const show = e.target.closest('[data-show-password]');
  if (show) {
    const input = document.getElementById('client-password'),
      visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    show.textContent = visible ? 'Skrýt' : 'Zobrazit';
    show.setAttribute('aria-label', visible ? 'Skrýt heslo' : 'Zobrazit heslo');
    show.setAttribute('aria-pressed', visible);
  }
  if (e.target.closest('[data-clear-brand]')) {
    activeBrand = '';
    applyCategory(activeCategory);
    catalog();
  }
});
function registerTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const abort = new AbortController();
  window.addEventListener('pagehide', () => abort.abort(), { once: true });
  const definitions = [
    {
      name: 'search_refurb_catalog',
      title: 'Vyhledat díly',
      description:
        'Read products in the current 50-product Refurb.zone sample by model, title or SKU. Does not navigate or modify the cart.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', maxLength: 200 } },
        required: ['query'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute(input) {
        if (!input || typeof input.query !== 'string' || input.query.length > 200)
          throw Error('Expected a query string, at most 200 characters.');
        return DATA.products
          .filter((p) => searchMatch(p, input.query))
          .slice(0, 20)
          .map((p) => ({
            id: p.id,
            name: p.name,
            ...(demoClient ? { price_excl_vat: p.price } : { price_requires_login: true }),
            url: '/produkt.html?id=' + p.id,
            variants: p.variants.map((v) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              availability: v.availability,
              ...(demoClient ? { price_excl_vat: v.price } : { price_requires_login: true }),
            })),
          }));
      },
    },
    {
      name: 'read_demo_cart',
      title: 'Přečíst ukázkový košík',
      description:
        'Read the local demo cart. This cart does not place orders or transfer to the live merchant.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute() {
        if (!demoClient) return { requires_login: true, items: [] };
        return cartItems().map((c) => ({
          product_id: c.productId,
          variant_id: c.variantId,
          name: c.product.name,
          quantity: c.qty,
          price_excl_vat: c.variant.price,
        }));
      },
    },
    {
      name: 'add_to_demo_cart',
      title: 'Přidat do ukázkového košíku',
      description:
        'Stage one selected product variant in the browser-session demo cart and open the cart. Does not order, pay, or send anything to the merchant.',
      inputSchema: {
        type: 'object',
        properties: {
          product_id: { type: 'string' },
          variant_id: { type: 'string' },
          quantity: { type: 'integer', minimum: 1, maximum: 99 },
        },
        required: ['product_id', 'variant_id', 'quantity'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        if (!input || typeof input.product_id !== 'string' || typeof input.variant_id !== 'string')
          throw Error('Product and variant IDs are required.');
        const result = addCart(input.product_id, input.variant_id, input.quantity);
        renderCart();
        return result;
      },
    },
  ];
  definitions.push({
    name: 'remove_from_demo_cart',
    title: 'Odebrat z ukázkového košíku',
    description:
      'Remove a staged item from the local browser-session demo cart. Does not affect the merchant.',
    inputSchema: {
      type: 'object',
      properties: { variant_id: { type: 'string' } },
      required: ['variant_id'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || typeof input.variant_id !== 'string') throw Error('Variant ID is required.');
      const result = removeCart(input.variant_id);
      renderCart();
      return result;
    },
  });
  for (const tool of definitions) {
    try {
      Promise.resolve(context.registerTool(tool, { signal: abort.signal })).catch(() => {});
    } catch {}
  }
}
