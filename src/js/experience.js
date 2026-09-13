'use strict';
let compactHeaderBound = false,
  headerScrollFrame = 0;
function initCompactHeader() {
  if (typeof window.requestAnimationFrame !== 'function') return;
  const header = document.getElementById('site-header'),
    spacer = document.getElementById('header-spacer');
  if (!header || !spacer) return;
  const sync = () => {
    const compact = header.classList.contains('is-compact');
    header.classList.toggle('is-compact', window.scrollY > 80 || (compact && window.scrollY > 24));
    document.documentElement.style.setProperty(
      '--header-current-height',
      header.offsetHeight + 'px',
    );
  };
  const measure = () => {
    const compact = header.classList.contains('is-compact');
    header.classList.remove('is-compact');
    spacer.style.height = header.offsetHeight + 'px';
    header.classList.toggle('is-compact', compact);
    header.classList.add('is-pinned');
    sync();
  };
  measure();
  if (compactHeaderBound) return;
  compactHeaderBound = true;
  window.addEventListener(
    'scroll',
    () => {
      if (headerScrollFrame) return;
      headerScrollFrame = window.requestAnimationFrame(() => {
        headerScrollFrame = 0;
        sync();
      });
    },
    { passive: true },
  );
  window.addEventListener('resize', measure, { passive: true });
  document.fonts?.ready.then(measure);
}
const NAV_GROUPS = [
  {
    label: 'Díly pro Apple',
    key: 'apple-parts',
    url: '/katalog.html?category=nahradni-dily',
    items: [
      ['iPhone', '/katalog.html?category=iphone', 'Displeje, baterie a další díly'],
      ['iPad', '/katalog.html?category=ipad', 'Díly pro vaše tablety'],
      ['MacBook', '/katalog.html?category=macbook', 'Klávesnice a další díly'],
      ['Apple Watch', '/katalog.html?category=watch', 'Díly pro chytré hodinky'],
    ],
  },
  {
    label: 'Refurbish materiál',
    key: 'materials',
    url: '/katalog.html?category=refurb',
    items: [
      ['Pro Apple', '/katalog.html?category=refurb-apple', 'Skla, rámečky a drobné komponenty'],
      ['Pro Android', '/katalog.html?category=refurb-android', 'Materiál pro Samsung a Lenovo'],
      ['Lepení', '/katalog.html?category=lepeni', 'Lepidla, pásky a příslušenství'],
      [
        'Čištění a chemie',
        '/katalog.html?category=cisteni-a-chemie',
        'Příprava a čištění při opravách',
      ],
    ],
  },
  {
    label: 'Příslušenství',
    key: 'equipment',
    url: '/katalog.html?category=doplnky',
    items: [
      ['Programátory', '/katalog.html?category=programatory', ''],
      ['Adaptéry a kabely', '/katalog.html?category=adaptery-a-kabely', ''],
      ['Ochranná skla', '/katalog.html?category=ochranna-skla', ''],
      ['Nářadí', '/katalog.html?category=naradi', ''],
      ['Pájení', '/katalog.html?category=pajeni', ''],
      ['Čištění a chemie', '/katalog.html?category=cisteni-a-chemie', ''],
    ],
  },
];
const SERVICE_LINKS = [
  ['Repasování displejů', 'repase'],
  ['Výkup displejů', 'vykup'],
  ['Výměna zadních skel', 'zadni-skla'],
];
function deliveryTopline() {
  return `<div class="delivery-topline"><div class="container"><a href="/doprava.html">${icon('truck')}<span>Objednávky do <strong>17:30</strong> ve všední dny odesíláme tentýž den</span></a><a href="/doprava.html#wolt"><span class="wolt-mini">Wolt Drive</span> Praha do 2 hodin ${icon('arrow')}</a></div></div>`;
}
function navigationHtml() {
  return `<nav class="container main-nav focused-nav" aria-label="Hlavní navigace">${NAV_GROUPS.map((g) => `<details class="nav-dropdown"><summary>${esc(g.label)}${icon('chevron')}</summary><div class="nav-panel"><div class="nav-panel-heading"><strong>${esc(g.label)}</strong><a href="${g.url}">Zobrazit vše ${icon('arrow')}</a></div><div class="nav-panel-grid">${g.items.map(([name, url, desc]) => `<a href="${url}"><strong>${esc(name)}</strong>${desc ? `<small>${esc(desc)}</small>` : ''}</a>`).join('')}</div></div></details>`).join('')}<span class="nav-separator" aria-hidden="true"></span>${SERVICE_LINKS.map(([label, key], i) => `<a class="${i === 0 ? 'nav-service-primary' : ''}" href="/sluzby.html?service=${key}" ${location.pathname.endsWith('sluzby.html') && qs.get('service') === key ? 'aria-current="page"' : ''}>${label}</a>`).join('')}<a class="sale-link" href="/katalog.html?category=novinky">Novinky</a></nav>`;
}
document.addEventListener('click', (e) => {
  document.querySelectorAll('.nav-dropdown[open]').forEach((d) => {
    if (!d.contains(e.target)) d.removeAttribute('open');
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape')
    document.querySelectorAll('.nav-dropdown[open]').forEach((d) => {
      d.removeAttribute('open');
      d.querySelector('summary').focus();
    });
});

const DEVICE_CARDS = [
  ['iphone', 'iPhone', 'Displeje, baterie a další díly', '/assets/categories/iphone.png'],
  ['ipad', 'iPad', 'Náhradní díly pro tablety', '/assets/categories/ipad.png'],
  ['macbook', 'MacBook', 'Díly pro notebooky Apple', '/assets/categories/macbook.png'],
  ['watch', 'Apple Watch', 'Díly pro vaše hodinky', '/assets/categories/watch.png'],
  ['refurb', 'Refurbish materiál', 'Skla, OCA a rámečky', null],
  ['doplnky', 'Servisní vybavení', 'Nářadí a příslušenství', null],
];
let selectedServiceGroup = '',
  serviceSearch = '';
function renderHomeExperience() {
  const el = document.getElementById('category-grid');
  if (!el) return;
  renderHomeDeviceCards();
  const delivery = document.getElementById('home-delivery');
  if (delivery) delivery.innerHTML = deliveryCards();
  const services = document.getElementById('home-services');
  if (services)
    services.innerHTML = `<section class="service-feature" aria-labelledby="services-heading"><div class="service-feature-main"><span class="eyebrow">VÍCE NEŽ NÁHRADNÍ DÍLY</span><h2 id="services-heading">Prasklé sklo.<br>Další šance pro displej.</h2><p>Repasování displejů pro iPhone, iPad a Apple Watch. Najděte svůj model a podívejte se na možnosti opravy.</p><a class="button" href="/sluzby.html?service=repase">Prohlédnout repasování ${icon('arrow')}</a><span class="service-devices">iPhone <span>·</span> iPad <span>·</span> Apple Watch</span></div><div class="service-feature-aside"><a href="/sluzby.html?service=vykup"><span class="service-number">01</span><div><h3>Výkup displejů</h3><p>Poškozené displeje nám můžete poslat k otestování a výkupu.</p></div>${icon('arrow')}</a><a href="/sluzby.html?service=zadni-skla"><span class="service-number">02</span><div><h3>Výměna zadních skel</h3><p>Oprava zadního skla iPhonu s rozebráním a novým podlepením.</p></div>${icon('arrow')}</a></div></section>`;
}
function deliveryCards() {
  return `<section class="delivery-section" aria-labelledby="delivery-heading"><div class="section-heading"><div><span class="eyebrow">ZE SKLADU ROVNOU DO VAŠEHO SERVISU</span><h2 id="delivery-heading">Na správný díl nemusíte dlouho čekat.</h2></div><a class="text-link" href="/doprava.html">Vše o dopravě ${icon('arrow')}</a></div><div class="delivery-cards"><article class="delivery-card wolt-card" id="wolt"><div class="delivery-card-top"><span class="delivery-location">PRAHA</span><img src="/assets/delivery/wolt.jpg" alt="Wolt Drive" width="136" height="46" loading="lazy"></div><div class="delivery-metric">Do 2 hodin<span>od objednání</span></div><p>Expresní doručení zboží po Praze přes Wolt Drive.</p><div class="delivery-card-bottom"><span>Doprava zdarma <strong>nad 7 500 Kč</strong> bez DPH</span><a class="circle" href="/doprava.html#wolt" aria-label="Podmínky doručení Wolt Drive">${icon('arrow')}</a></div></article><article class="delivery-card parcel-card"><div class="delivery-card-top"><span class="delivery-location">PO ČESKU</span><img src="/assets/delivery/carriers.png" alt="PPL a Balíkovna" width="180" height="46" loading="lazy"></div><div class="delivery-metric">Odeslání v den objednání<span>ve všední dny do 17:30</span></div><div class="carrier-details"><p><strong>PPL</strong><span>Doporučeno pro doručení do druhého dne</span><small>Zdarma od 3 000 Kč bez DPH</small></p><p><strong>Balíkovna</strong><span>Obvykle 1–2 pracovní dny</span><small>Zdarma od 2 000 Kč bez DPH</small></p></div></article></div></section>`;
}
function deliveryDetailHtml() {
  return `<div class="delivery-detail-content"><div class="delivery-detail-note">${icon('truck')}<div><strong>Objednávky do 17:30 odesíláme tentýž pracovní den.</strong><p>Pro doručení do druhého dne doporučuje obchod PPL. Balíkovna obvykle doručuje během 1–2 pracovních dnů.</p></div></div><div class="delivery-detail-grid"><article><h3>Praha do 2 hodin</h3><p>Wolt Drive nabízí expresní doručení zboží po Praze. Doprava je zdarma při nákupu nad 7 500 Kč bez DPH.</p></article><article><h3>Doprava zdarma</h3><dl><div><dt>Balíkovna</dt><dd>od 2 000 Kč bez DPH</dd></div><div><dt>PPL</dt><dd>od 3 000 Kč bez DPH</dd></div><div><dt>Wolt Drive po Praze</dt><dd>nad 7 500 Kč bez DPH</dd></div></dl></article></div><a class="text-link" href="https://www.refurb.zone/doprava-a-platba/" target="_blank" rel="noopener">Kompletní ceník a aktuální podmínky dopravy ${icon('arrow')}</a></div>`;
}
function deliveryPage() {
  document.title = 'Doprava do vašeho servisu — Refurb.zone';
  document.getElementById('page-content').innerHTML =
    `<div class="container information-page"><div class="breadcrumbs"><a href="/">Domů</a><span>/</span><span>Doprava</span></div><header class="information-heading"><span class="eyebrow">DÍLY PŘIPRAVENÉ NA DALŠÍ OPRAVU</span><h1>Rychlé doručení<br>do vašeho servisu.</h1><p>Po Praze během hodin, po Česku s PPL nebo Balíkovnou. Vyberte si dopravu podle toho, jak rychle díl potřebujete.</p></header>${deliveryCards()}${deliveryDetailHtml()}<div class="service-contact"><div>${icon('headphones')}<span><strong>Potřebujete ověřit možnosti doručení?</strong><small>Po–Pá 10:00–18:00</small></span></div><a class="button primary" href="tel:+420777122858">+420 777 122 858 ${icon('arrow')}</a></div></div>`;
}
function servicePage() {
  const key = qs.get('service') || 'repase',
    s = DATA.services?.find((x) => x.id === key);
  if (!s) {
    document.getElementById('page-content').innerHTML =
      '<div class="container empty"><h1>Služba nebyla nalezena</h1><a class="button primary" href="/sluzby.html?service=repase">Repasování displejů</a></div>';
    return;
  }
  if (key === 'vykup') {
    buybackPage(s);
    return;
  }
  if (s.groups && !s.groups.some((g) => g.id === selectedServiceGroup))
    selectedServiceGroup = s.groups[0].id;
  document.title = s.title + ' — Refurb.zone';
  document.querySelector('meta[name=description]').content = s.summary;
  document.getElementById('page-content').innerHTML =
    `<div class="container information-page service-page"><div class="breadcrumbs"><a href="/">Domů</a><span>/</span><span>${esc(s.title)}</span></div><header class="service-page-hero"><div><span class="eyebrow">${esc(s.eyebrow)}</span><h1>${esc(s.title)}</h1><p>${esc(s.summary)}</p><div class="hero-actions"><a class="button primary" href="tel:+420777122858">Domluvit ${key === 'repase' ? 'repasování' : key === 'vykup' ? 'výkup' : 'opravu'} ${icon('arrow')}</a><a class="button secondary" href="${key === 'vykup' ? s.form_url : '#cenik'}" ${key === 'vykup' ? 'target="_blank" rel="noopener"' : ''}>${key === 'vykup' ? 'Výkupní formulář (PDF)' : 'Prohlédnout ceník'}</a></div></div><div class="service-side-note">${icon(key === 'vykup' ? 'truck' : 'shield')}<h2>${key === 'repase' ? 'Původní displej. Nová šance.' : key === 'vykup' ? 'Od balíku k nabídce.' : 'Pečlivě, zevnitř i zvenku.'}</h2><p>${key === 'repase' ? 'Výměna vrchního skla, dotyku nebo podsvícení podle modelu.' : key === 'vykup' ? 'Po přijetí zásilky následuje kontrola a test report s cenovou nabídkou.' : 'Telefon se před výměnou rozebírá. Baterie i displej dostanou nové podlepení.'}</p></div></header>${s.groups ? `<section class="service-pricing" id="cenik" aria-labelledby="pricing-heading"><div class="section-heading"><h2 id="pricing-heading">Ceník ${key === 'repase' ? 'repasování' : 'výměny skla'}</h2><span class="pricing-date">Podle ceníku z ${s.checked_at.split('-').reverse().join('. ')}</span></div><div class="service-pricing-controls"><div class="service-group-tabs" role="tablist" aria-label="Typ zařízení">${s.groups.map((g) => `<button id="service-tab-${g.id}" role="tab" data-service-group="${g.id}" aria-selected="${selectedServiceGroup === g.id}">${g.label}</button>`).join('')}</div><label class="service-model-search">${icon('search')}<input id="service-model-search" type="search" value="${esc(serviceSearch)}" placeholder="Najít model, např. iPhone 15" aria-label="Vyhledat model v ceníku"></label></div>${!demoClient ? `<div class="service-pricing-access">${icon('lock')}<div><strong>Ceník pro přihlášené klienty</strong><p>Přihlaste se pro zobrazení cen služeb.</p></div><button class="button primary" data-login>Přihlásit se ${icon('arrow')}</button></div>` : ''}<div id="service-price-table" role="tabpanel" aria-labelledby="service-tab-${selectedServiceGroup}"></div></section>` : `<section class="buyback-steps" aria-label="Jak probíhá výkup">${s.steps.map((step, i) => `<article><span>0${i + 1}</span><h2>${step.title}</h2><p>${step.text}</p></article>`).join('')}</section><div class="buyback-price-note">${icon('info')}<div><h2>Kolik za displeje dostanete?</h2><p>${s.note}</p></div><a class="button secondary" href="${s.source}" target="_blank" rel="noopener">Aktuální výkupní ceník ${icon('arrow')}</a></div>`}${s.note && s.groups ? `<p class="service-important">${icon('info')}${esc(s.note)}</p>` : ''}<div class="service-contact"><div>${icon('headphones')}<span><strong>Probereme váš model a možnosti opravy.</strong><small>Po–Pá 10:00–18:00 · info@refurb.zone</small></span></div><a class="button primary" href="tel:+420777122858">+420 777 122 858 ${icon('arrow')}</a></div><p class="service-source-note">Službu a její dostupnost si domluvte přímo se servisem. <a href="${s.source}" target="_blank" rel="noopener">Původní stránka služby ${icon('arrow')}</a></p></div>`;
  if (s.groups) renderServicePrices();
}
function renderServicePrices() {
  const s = DATA.services?.find((x) => x.id === (qs.get('service') || 'repase')),
    group = s?.groups?.find((g) => g.id === selectedServiceGroup);
  if (!group) return;
  const rows = group.rows.filter((r) =>
    normalize(r.model).includes(normalize(serviceSearch.trim())),
  );
  const el = document.getElementById('service-price-table');
  el.setAttribute('aria-labelledby', 'service-tab-' + group.id);
  el.innerHTML = `<div class="service-table-wrap"><table class="service-table"><thead><tr><th scope="col">Model</th><th scope="col">Druh opravy</th><th scope="col">Cena bez DPH</th></tr></thead><tbody>${rows.length ? rows.map((r) => `<tr><th scope="row"><span class="service-model">${r.image ? `<span class="service-model-photo"><img class="${r.image_thumbnail ? 'service-model-thumbnail' : ''}" src="${esc(r.image)}" alt="${esc(r.image_model || r.model)}" width="56" height="66" loading="lazy"></span>` : ''}<span>${esc(r.model.replaceAll('/', ' / '))}</span></span></th><td>${esc(r.work)}</td><td>${demoClient ? money(r.price) : '<span class="locked-service-price">' + icon('lock') + 'Po přihlášení</span>'}</td></tr>`).join('') : '<tr><td colspan="3" class="service-no-results">Pro tento model nemáme v převzatém ceníku položku. Zkuste jiný model nebo zavolejte do servisu.</td></tr>'}</tbody></table></div><div class="service-surcharge">${icon('info')}<p>${group.surcharge !== null ? `<strong>Celé zařízení: ${demoClient ? 'příplatek ' + money(group.surcharge) + ' bez DPH' : 'příplatek po přihlášení'}.</strong> ` : ''}${esc(group.note)}</p></div>`;
  document
    .querySelectorAll('[data-service-group]')
    .forEach((b) => b.setAttribute('aria-selected', b.dataset.serviceGroup === group.id));
}
function mobileNavigation() {
  openDialog(
    `<div class="dialog-heading"><h2 id="dialog-title">Nabídka a služby</h2>${closeButton()}</div><div class="mobile-category-list focused-mobile-menu"><a class="mobile-all-products" href="/katalog.html">Všechny produkty ${icon('arrow')}</a>${NAV_GROUPS.map((g) => `<section><h3><a href="${g.url}">${esc(g.label)}</a></h3>${g.items.map(([name, url]) => `<a href="${url}">${esc(name)}${icon('arrow')}</a>`).join('')}</section>`).join('')}<section><h3>Servisní služby</h3>${SERVICE_LINKS.map(([name, key]) => `<a href="/sluzby.html?service=${key}">${name}${icon('arrow')}</a>`).join('')}<a href="/doprava.html">Doprava ${icon('truck')}</a></section></div>`,
    'menu-drawer',
  );
}
document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-service-group]');
  if (tab) {
    selectedServiceGroup = tab.dataset.serviceGroup;
    renderServicePrices();
  }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'service-model-search') {
    serviceSearch = e.target.value;
    renderServicePrices();
  }
});
