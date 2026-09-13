'use strict';

// Only the explicitly displayed CZK source prices are used. Unquoted prices stay null.
let buybackState = { family: 'iphone', query: '', condition: 'all', minimum: 0, sort: 'default' };
function buybackService() {
  return DATA.services.find((s) => s.id === 'vykup');
}
function buybackGroup() {
  return buybackService().buyback_groups.find((g) => g.id === buybackState.family);
}
function buybackComparablePrice(row) {
  return buybackState.family === 'iphone' && buybackState.condition === 'damaged'
    ? row.damaged_touch_price
    : row.price;
}
function buybackFilteredRows() {
  const words = normalize(buybackState.query).match(/[a-z0-9]+/g) || [];
  const rows = buybackGroup().rows.filter((row) => {
    const matches = (row.models || [row.model]).some((model) => {
      const haystack = normalize(model).replace(/[^a-z0-9]+/g, ' ');
      return words.every((word) =>
        new RegExp('\\b' + word + (/^[0-9]+$/.test(word) ? '\\b' : '')).test(haystack),
      );
    });
    if (!matches) return false;
    const price = buybackComparablePrice(row);
    return (
      !demoClient || !buybackState.minimum || (price !== null && price >= buybackState.minimum)
    );
  });
  if (demoClient && buybackState.sort !== 'default')
    rows.sort((a, b) => {
      const ap = buybackComparablePrice(a),
        bp = buybackComparablePrice(b);
      if (ap === null) return bp === null ? 0 : 1;
      if (bp === null) return -1;
      return buybackState.sort === 'price-asc' ? ap - bp : bp - ap;
    });
  else rows.reverse();
  return rows;
}
function buybackPage(s) {
  if (!demoClient) {
    buybackState.minimum = 0;
    buybackState.sort = 'default';
  }
  document.title = 'Výkup displejů Apple — ceník a postup | Refurb.zone';
  document.querySelector('meta[name=description]').content = s.summary;
  document.getElementById('page-content').innerHTML = `
    <div class="container buyback-page">
      <div class="breadcrumbs"><a href="/">Domů</a><span>/</span><span>Výkup displejů</span></div>

      <section class="buyback-hero" aria-labelledby="buyback-title">
        <div class="buyback-hero-copy"><span class="eyebrow">VÝKUP DISPLEJŮ APPLE</span>
          <h1 id="buyback-title">Prasklé sklo.<br><span>Hodnota zůstává.</span></h1>
          <p>Dejte displejům z oprav další šanci. Vykupujeme prasklé displeje pro iPhone, iPad a Apple Watch. Zjistěte cenu svého modelu a pošlete nám je k otestování.</p>
          <div class="hero-actions"><a class="button primary" href="#cenik">Zjistit výkupní cenu ${icon('arrow')}</a><a class="button secondary" href="#jak-to-funguje">Jak výkup funguje</a></div>
          <div class="buyback-hero-proof">${icon('shield')}<span>Test report ke každému výkupu</span><i aria-hidden="true"></i><span>Hotově nebo na účet</span></div>
        </div>
        <figure class="buyback-hero-photo"><img src="/assets/display-buyback-editorial.png" alt="Třídění prasklých iPhone displejů v antistatických zásobnících při servisním testování" width="1448" height="1086" fetchpriority="high"><figcaption>Další život začíná ve vašem servisu.<small>Ilustrační fotografie</small></figcaption></figure>
      </section>
      <section class="buyback-pricing" id="cenik" aria-labelledby="buyback-pricing-title">
        <div class="buyback-section-title"><div><span class="eyebrow">NAJDĚTE SVŮJ MODEL</span><h2 id="buyback-pricing-title">Kolik za displej dostanete?</h2><p>Vyberte zařízení a porovnejte výkupní ceny podle stavu displeje.</p></div><a class="text-link" href="${esc(s.form_url)}" target="_blank" rel="noopener">Výkupní formulář (PDF) ${icon('arrow')}</a></div>
        <div class="buyback-families" role="group" aria-label="Zařízení pro výkup">${s.buyback_groups.map((g) => `<button type="button" data-buyback-family="${g.id}" aria-pressed="${buybackState.family === g.id}"><img src="${g.image}" alt="" width="76" height="80"><span><strong>${g.label}</strong><small>${g.rows.length} ${g.rows.length < 5 ? 'položky' : 'položek'} v ceníku</small></span><span class="buyback-family-check">${icon('check')}</span></button>`).join('')}</div>
        <div class="buyback-price-panel">
          <div class="buyback-filters">
            <label class="buyback-search"><span>Vyhledat model</span><span class="buyback-input">${icon('search')}<input type="search" id="buyback-query" value="${esc(buybackState.query)}" placeholder="Např. iPhone 15 Pro" autocomplete="off"></span></label>
            <label class="buyback-field"><span>Stav dotyku</span><select id="buyback-condition">${buybackConditionOptions()}</select></label>
            <label class="buyback-field"><span>Výkupní cena od</span><select id="buyback-minimum" ${!demoClient ? 'disabled' : ''}>${buybackMinimumOptions()}</select></label>
            <label class="buyback-field"><span>Seřadit podle</span><select id="buyback-sort" ${!demoClient ? 'disabled' : ''}><option value="default">Pořadí modelů</option>${demoClient ? `<option value="price-desc" ${buybackState.sort === 'price-desc' ? 'selected' : ''}>Nejvyšší ceny</option><option value="price-asc" ${buybackState.sort === 'price-asc' ? 'selected' : ''}>Nejnižší ceny</option>` : ''}</select></label>
          </div>
          ${!demoClient ? `<div class="buyback-login">${icon('lock')}<div><strong>Ceník pro přihlášené klienty</strong><p>Přihlaste se a zobrazte si ceny i filtrování podle částky.</p></div><button class="button primary" data-login>Přihlásit se ${icon('arrow')}</button></div>` : ''}
          <div class="buyback-results-bar"><p id="buyback-results-count" role="status" aria-live="polite"></p><button id="buyback-reset" type="button">Zrušit filtry ${icon('close')}</button></div>
          <div id="buyback-table"></div>
          <div class="buyback-table-note">${icon('info')}<p>${esc(s.note)} <span id="buyback-condition-note"></span></p></div>
        </div>
        <div class="buyback-pricing-foot"><span>Ceník převzatý ${s.checked_at.split('-').reverse().join('. ')} · cena za kus v Kč</span><a href="${esc(s.source)}" target="_blank" rel="noopener">Původní ceník ${icon('arrow')}</a></div>
      </section>
      <section class="buyback-condition-guide" aria-labelledby="condition-guide-heading">
        <div><span class="eyebrow">NA STAVU ZÁLEŽÍ</span><h2 id="condition-guide-heading">Prasklé sklo není<br>celý příběh.</h2><p>U iPhonu ceník rozlišuje funkční a poškozený dotyk. Skutečný stav displeje ověříme při testování.</p></div>
        <article><span class="buyback-state-icon good">${icon('check')}</span><h3>Funkční dotyk <small>OK</small></h3><p>Sklo je prasklé, ale dotyková vrstva reaguje. Pro tento stav najdete v ceníku samostatnou výkupní cenu.</p></article>
        <article><span class="buyback-state-icon damaged">${icon('sliders')}</span><h3>Poškozený dotyk <small>KO</small></h3><p>Dotyk nereaguje správně? Některé modely mají cenu i pro tento stav. Kde chybí, je potřeba individuální posouzení.</p></article>
      </section>
      <section class="buyback-process" id="jak-to-funguje" aria-labelledby="buyback-process-heading">
        <div class="buyback-section-title"><div><span class="eyebrow">OD VAŠEHO SERVISU K DALŠÍ OPRAVĚ</span><h2 id="buyback-process-heading">Tři kroky. Jasný postup.</h2></div><span class="buyback-process-time">${icon('shield')}Testování obvykle 1–3 pracovní dny</span></div>
        <div class="buyback-process-grid"><article><span class="buyback-step">01 ${icon('truck')}</span><h3>Zabalte a pošlete</h3><p>Displeje bezpečně zabalte a pošlete na naši adresu. Přiložte vyplněný výkupní formulář, aby šlo zásilku snadno přiřadit.</p><a class="text-link" href="${esc(s.form_url)}" target="_blank" rel="noopener">Otevřít výkupní formulář ${icon('arrow')}</a></article><article><span class="buyback-step">02 ${icon('search')}</span><h3>Otestujeme displeje</h3><p>Po přijetí zkontrolujeme jejich stav. Testování trvá obvykle 1–3 pracovní dny podle aktuálního vytížení servisu.</p><span class="buyback-step-detail">Výsledkem je test report a cenová nabídka.</span></article><article><span class="buyback-step">03 ${icon('check')}</span><h3>Dostanete zaplaceno</h3><p>Obdržíte přehled otestovaných displejů s aktuální výkupní cenou. Způsob výplaty si můžete domluvit hotově nebo na účet.</p><span class="buyback-step-detail">Konečná cena podle otestovaného stavu.</span></article></div>
      </section>
      <section class="buyback-shipping" aria-labelledby="shipping-heading"><div class="buyback-shipping-main"><span class="eyebrow">MÁTE DISPLEJE PŘIPRAVENÉ?</span><h2 id="shipping-heading">Pošlete je k nám.<br>O zbytek se postaráme.</h2><p>Formulář přiložte k dobře zabalené zásilce. Nevíte si rady s modelem nebo jeho stavem? Ozvěte se nám.</p><a class="button" href="${esc(s.form_url)}" target="_blank" rel="noopener">Stáhnout formulář (PDF) ${icon('arrow')}</a></div><div class="buyback-shipping-contact"><span class="buyback-address-label">ADRESA PRO ZASLÁNÍ</span><address><strong>REFURB.ZONE</strong>Korytná 1538/4<br>100 00 Praha 10</address><div class="buyback-contact-links"><a href="tel:+420777122858">${icon('phone')}+420 777 122 858</a><a href="mailto:info@refurb.zone">${icon('headphones')}info@refurb.zone</a><small>Po–Pá 10:00–18:00</small></div></div></section>
      <section class="buyback-faq" aria-labelledby="buyback-faq-heading"><div><span class="eyebrow">JEŠTĚ SE MŮŽE HODIT</span><h2 id="buyback-faq-heading">Než displeje odešlete</h2><a class="text-link" href="/sluzby.html?service=repase">Raději displej opravit? ${icon('arrow')}</a></div><div>
        <details><summary>Je uvedená cena konečná? ${icon('plus')}</summary><p>Ceník slouží pro orientaci. Po přijetí zásilky displeje otestujeme a pošleme vám test report s aktuálními výkupními cenami.</p></details>
        <details><summary>Co znamená „Na posouzení“? ${icon('plus')}</summary><p>Pro tento model a stav původní ceník samostatnou cenu neuvádí. Nejde o nulovou hodnotu ani o automatické zamítnutí výkupu. Možnost výkupu ověřte se servisem.</p></details>
        <details><summary>Můj model v ceníku není. Co dál? ${icon('plus')}</summary><p>Zkontrolujte vybraný typ zařízení a zrušte filtry. Pokud model stále chybí, napište na <a href="mailto:info@refurb.zone">info@refurb.zone</a> nebo zavolejte na <a href="tel:+420777122858">+420 777 122 858</a>.</p></details>
        <details><summary>Můžu si nechat displej repasovat místo výkupu? ${icon('plus')}</summary><p>Ano, k dispozici je také <a href="/sluzby.html?service=repase">repasování displejů</a>. Podívejte se na ceník pro svůj model a domluvte vhodný postup přímo se servisem.</p></details>
      </div></section>
    </div>`;
  updateBuybackFamilyControls();
  renderBuybackPrices();
}
function buybackConditionOptions() {
  return buybackState.family === 'iphone'
    ? [
        ['all', 'Oba stavy'],
        ['working', 'Funkční dotyk (OK)'],
        ['damaged', 'Poškozený dotyk (KO)'],
      ]
        .map(
          ([value, label]) =>
            `<option value="${value}" ${buybackState.condition === value ? 'selected' : ''}>${label}</option>`,
        )
        .join('')
    : '<option value="all">Prasklý displej</option>';
}
function buybackMinimumOptions() {
  return demoClient
    ? [0, 300, 500, 1000, 1500]
        .map(
          (value) =>
            `<option value="${value}" ${buybackState.minimum === value ? 'selected' : ''}>${value ? money(value) : 'Bez omezení'}</option>`,
        )
        .join('')
    : '<option>Po přihlášení</option>';
}
function updateBuybackFamilyControls() {
  const group = buybackGroup();
  document
    .querySelectorAll('[data-buyback-family]')
    .forEach((button) =>
      button.setAttribute('aria-pressed', button.dataset.buybackFamily === group.id),
    );
  const condition = document.getElementById('buyback-condition');
  condition.innerHTML = buybackConditionOptions();
  condition.disabled = group.id !== 'iphone';
  document.getElementById('buyback-query').placeholder =
    group.id === 'iphone'
      ? 'Např. iPhone 15 Pro'
      : group.id === 'ipad'
        ? 'Např. iPad Pro 11'
        : 'Např. Series 7';
}
function buybackPriceCell(value) {
  return demoClient
    ? value === null
      ? '<span class="buyback-unquoted">Na posouzení</span>'
      : `<strong>${money(value)}</strong>`
    : `<button class="buyback-price-lock" data-login>${icon('lock')}<span>Po přihlášení</span></button>`;
}
function renderBuybackPrices() {
  const rows = buybackFilteredRows(),
    iphone = buybackState.family === 'iphone';
  const working = !iphone || buybackState.condition !== 'damaged',
    damaged = iphone && buybackState.condition !== 'working';
  document.getElementById('buyback-results-count').textContent =
    `${rows.length} z ${buybackGroup().rows.length} položek · ${buybackGroup().label}${demoClient && iphone && buybackState.condition === 'all' && buybackState.sort !== 'default' ? ' · řazení dle funkčního dotyku' : ''}`;
  document.getElementById('buyback-reset').hidden = !(
    buybackState.query ||
    buybackState.minimum ||
    buybackState.condition !== 'all' ||
    buybackState.sort !== 'default'
  );
  document.getElementById('buyback-table').innerHTML = rows.length
    ? `<div class="buyback-table-scroll" tabindex="0" role="region" aria-label="Výkupní ceník, posouvatelný seznam"><table class="buyback-table"><caption class="sr-only">Výkupní ceník — ${buybackGroup().label}</caption><thead><tr><th scope="col">Model zařízení</th>${working ? `<th scope="col">${iphone ? 'Funkční dotyk <span>OK</span>' : 'Prasklý displej'}</th>` : ''}${damaged ? '<th scope="col">Poškozený dotyk <span>KO</span></th>' : ''}</tr></thead><tbody>${rows.map((row) => `<tr><th scope="row">${esc(row.model.replaceAll('/', ' / '))}</th>${working ? `<td>${buybackPriceCell(row.price)}</td>` : ''}${damaged ? `<td class="buyback-damaged-price">${buybackPriceCell(row.damaged_touch_price)}</td>` : ''}</tr>`).join('')}</tbody></table></div>`
    : `<div class="buyback-empty">${icon('search')}<h3>Pro tento výběr jsme cenu nenašli.</h3><p>Zkuste jiný model nebo upravte filtry. Model, který není v ceníku, můžete ověřit přímo se servisem.</p><button class="button secondary" data-buyback-clear>Zrušit filtry</button><a class="text-link" href="tel:+420777122858">Zavolat do servisu ${icon('arrow')}</a></div>`;
  document.getElementById('buyback-condition-note').textContent = iphone
    ? 'Označení „Na posouzení“ znamená, že zdroj pro tento stav cenu neuvádí.'
    : 'U této skupiny původní ceník nerozlišuje stav dotyku.';
}
function clearBuybackFilters() {
  buybackState = { ...buybackState, query: '', condition: 'all', minimum: 0, sort: 'default' };
  document.getElementById('buyback-query').value = '';
  document.getElementById('buyback-minimum').value = '0';
  document.getElementById('buyback-sort').value = 'default';
  updateBuybackFamilyControls();
  renderBuybackPrices();
  document.getElementById('buyback-query').focus();
}
document.addEventListener('click', (event) => {
  const family = event.target.closest('[data-buyback-family]');
  if (family) {
    buybackState.family = family.dataset.buybackFamily;
    buybackState.condition = 'all';
    buybackState.query = '';
    buybackState.minimum = 0;
    document.getElementById('buyback-query').value = '';
    document.getElementById('buyback-minimum').value = '0';
    updateBuybackFamilyControls();
    renderBuybackPrices();
  }
  if (event.target.closest('#buyback-reset,[data-buyback-clear]')) clearBuybackFilters();
});
document.addEventListener('input', (event) => {
  if (event.target.id === 'buyback-query') {
    buybackState.query = event.target.value;
    renderBuybackPrices();
  }
});
document.addEventListener('change', (event) => {
  const fields = {
      'buyback-condition': 'condition',
      'buyback-minimum': 'minimum',
      'buyback-sort': 'sort',
    },
    field = fields[event.target.id];
  if (!field) return;
  buybackState[field] = field === 'minimum' ? Number(event.target.value) : event.target.value;
  renderBuybackPrices();
});
