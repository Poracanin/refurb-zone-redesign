'use strict';
let pendingServiceInquiry = null,
  activeInquiry = null,
  serviceSort = 'newest';
const serviceLabels = {
  repase: 'Repasování displeje',
  vykup: 'Výkup displeje',
  'zadni-skla': 'Výměna zadního skla',
};
function serviceTile(row, group, service, index) {
  const buyback = service.id === 'vykup',
    token = `${service.id}|${group.id}|${index}`;
  const price = (value) => (value === null ? 'Na posouzení' : money(value));
  let priceHtml;
  if (!demoClient)
    priceHtml = `<div class="service-card-locked">${icon('lock')}<span>Cena po přihlášení</span></div>`;
  else if (buyback) {
    const working = group.id !== 'iphone' || buybackState.condition !== 'damaged',
      damaged = group.id === 'iphone' && buybackState.condition !== 'working';
    priceHtml = `<div class="service-card-prices">${working ? `<div><small>${group.id === 'iphone' ? 'Funkční dotyk' : 'Výkupní cena'}</small><strong>${price(row.price)}</strong></div>` : ''}${damaged ? `<div class="secondary-price"><small>Poškozený dotyk</small><strong>${price(row.damaged_touch_price)}</strong></div>` : ''}</div><span class="service-price-unit">Za kus · po ověření stavu</span>`;
  } else
    priceHtml = `<div class="service-card-prices"><div><small>Cena za kus</small><strong>${price(row.price)}</strong></div></div><span class="service-price-unit">Bez DPH${group.surcharge !== null ? ' · samostatný displej' : ''}</span>`;
  return `<article class="service-product-card"><span class="service-card-kind">${buyback ? 'VÝKUP DISPLEJE' : service.id === 'repase' ? 'REPASE DISPLEJE' : 'ZADNÍ SKLO'}</span><button type="button" class="service-card-image" data-service-inquiry="${token}" aria-label="Poptat: ${esc(row.model)}"><img src="${row.image || group.image}" alt="${esc(row.image_model || row.model)}" width="170" height="160" loading="lazy"></button><div class="service-card-body"><h3><button type="button" data-service-inquiry="${token}">${esc(row.model.replaceAll('/', ' / '))}</button></h3><p>${esc(row.work || (group.id === 'iphone' ? 'Prasklé sklo, cenu určuje stav dotyku.' : 'Testování a výkup prasklého displeje.'))}</p>${row.image_is_family ? '<small class="service-photo-note">Ilustrační foto řady zařízení</small>' : ''}<div class="service-card-bottom">${priceHtml}<button type="button" class="button ${demoClient ? 'primary' : 'secondary'} service-card-cta" data-service-inquiry="${token}">${icon(demoClient ? 'arrow' : 'lock')}${demoClient ? (buyback ? 'Poptat výkup' : 'Poptat opravu') : 'Přihlásit se a poptat'}</button></div></div></article>`;
}
function renderServiceTiles() {
  const service = DATA.services.find((s) => s.id === (qs.get('service') || 'repase')),
    group = service?.groups?.find((g) => g.id === selectedServiceGroup);
  if (!group) return;
  const rows = group.rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => normalize(row.model).includes(normalize(serviceSearch.trim())));
  if (serviceSort === 'price-asc' && demoClient) rows.sort((a, b) => a.row.price - b.row.price);
  else if (serviceSort === 'price-desc' && demoClient)
    rows.sort((a, b) => b.row.price - a.row.price);
  else rows.reverse();
  const el = document.getElementById('service-price-table');
  el.setAttribute('aria-labelledby', 'service-tab-' + group.id);
  el.innerHTML = `<div class="service-grid-toolbar"><span role="status">${rows.length} nabídek · ${esc(group.label)}</span><label>Řazení <select id="service-sort"><option value="newest">Nejnovější modely</option>${demoClient ? `<option value="price-asc" ${serviceSort === 'price-asc' ? 'selected' : ''}>Od nejlevnějších</option><option value="price-desc" ${serviceSort === 'price-desc' ? 'selected' : ''}>Od nejdražších</option>` : ''}</select></label></div>${rows.length ? `<div class="service-products-grid">${rows.map(({ row, index }) => serviceTile(row, group, service, index)).join('')}</div>` : '<div class="empty"><h3>Pro tento model nemáme nabídku.</h3><p>Zkuste jiný název nebo vyberte jiný typ zařízení.</p></div>'}<div class="service-surcharge">${icon('info')}<p>${group.surcharge !== null ? `<strong>Celé zařízení: ${demoClient ? 'příplatek ' + money(group.surcharge) + ' bez DPH za kus' : 'příplatek po přihlášení'}.</strong> ` : ''}${esc(group.note)}</p></div>`;
  document
    .querySelectorAll('[data-service-group]')
    .forEach((b) => b.setAttribute('aria-selected', b.dataset.serviceGroup === group.id));
}
function inquirySelection(token) {
  const [id, family, index] = token.split('|'),
    service = DATA.services.find((s) => s.id === id),
    group = (service?.groups || service?.buyback_groups)?.find((g) => g.id === family),
    row = group?.rows[Number(index)];
  if (!row) throw Error('Vybraný model již není dostupný.');
  return { token, service, group, row };
}
function inquiryModels(selection) {
  if (selection.row.models) return selection.row.models;
  const prefix =
    selection.group.id === 'iphone'
      ? 'iPhone '
      : selection.group.id === 'ipad'
        ? 'iPad '
        : 'Apple Watch ';
  return selection.row.model
    .split('/')
    .map((name) => name.trim())
    .map((name) => (/^(iPhone|iPad|Apple Watch)/i.test(name) ? name : prefix + name));
}
async function openServiceInquiry(token) {
  if (!demoClient) {
    pendingServiceInquiry = token;
    loginDialog('Pro odeslání poptávky se přihlaste ke klientskému účtu.');
    return;
  }
  try {
    const selection = inquirySelection(token),
      state = await opsStore.load();
    if (!demoClient) return;
    activeInquiry = selection;
    const { service, group, row } = selection,
      buyback = service.id === 'vykup';
    const contact =
      state.repairs.find((r) => r.ownerId === 'demo-client')?.contact ||
      state.customers.find((c) => c.email === DEMO_EMAIL) ||
      {};
    const options = inquiryModels(selection);
    openDialog(
      `<div class="dialog-heading"><div><span class="demo-pill">Klientská poptávka · demo</span><h2 id="dialog-title">${buyback ? 'Poptávka výkupu' : 'Poptávka opravy'}</h2></div>${closeButton()}</div><form id="service-inquiry-form" class="service-inquiry-form"><div class="inquiry-summary"><img src="${row.image || group.image}" alt="${esc(row.image_model || row.model)}" width="130" height="150"><div><span class="eyebrow">${esc(serviceLabels[service.id])}</span><h3>${esc(row.model.replaceAll('/', ' / '))}</h3><p>${esc(row.work || 'Otestování displeje a výkupní nabídka')}</p><strong id="inquiry-total"></strong><small id="inquiry-price-note"></small></div></div><div class="inquiry-fields"><fieldset><legend>01 · Zařízení a závada</legend><div class="inquiry-fields-grid"><label>Konkrétní model<select name="model" required>${options.map((m) => `<option>${esc(m)}</option>`).join('')}</select></label><label>Počet kusů<input name="quantity" type="number" min="1" max="100" step="1" value="1" required></label>${service.id === 'repase' ? `<label>Co posíláte<select name="deviceScope"><option value="panel">Samostatný displej</option><option value="device">Celé zařízení</option></select></label>` : ''}${buyback && group.id === 'iphone' ? `<label>Stav dotyku<select name="condition"><option value="working">Funkční dotyk</option><option value="damaged" ${buybackState.condition === 'damaged' ? 'selected' : ''}>Poškozený dotyk</option></select></label>` : ''}<label>${buyback ? 'Označení balíčku (volitelné)' : 'Sériové číslo (volitelné)'}<input name="serial" maxlength="100" placeholder="Vaše interní označení"></label><label class="field-wide">${buyback ? 'Poznámka ke stavu displejů' : 'Popis závady'}<textarea name="description" rows="3" maxlength="3000" ${buyback ? '' : 'required minlength="8"'} placeholder="Např. prasklé sklo, obraz a dotyk fungují…"></textarea></label></div></fieldset><fieldset><legend>02 · Kontakt</legend><div class="inquiry-fields-grid"><label>Jméno a příjmení<input name="name" required maxlength="120" value="${esc(contact.name)}"></label><label>Firma / servis<input name="company" maxlength="160" value="${esc(contact.company)}"></label><label>E-mail<input name="email" type="email" required maxlength="160" value="${esc(contact.email || DEMO_EMAIL)}"></label><label>Telefon<input name="phone" type="tel" required value="${esc(contact.phone)}"></label></div></fieldset><fieldset><legend>03 · Předání a doručení</legend><div class="inquiry-fields-grid"><label>Předání do servisu<select name="inbound"><option>Pošlu přepravcem</option><option>Předám osobně</option></select></label><label>${buyback ? 'Vrácení nevyhovujících kusů' : 'Vrácení po opravě'}<select name="carrier">${operationsCore.carriers.map((c) => `<option ${c === state.settings.defaultCarrier ? 'selected' : ''}>${c}</option>`).join('')}</select></label><div id="inquiry-address" class="inquiry-fields-grid field-wide"><label class="field-wide">Ulice a číslo<input name="street" maxlength="160" value="${esc(contact.street)}" required></label><label>Město<input name="city" maxlength="100" value="${esc(contact.city)}" required></label><label>PSČ<input name="zip" inputmode="numeric" pattern="[0-9]{3} ?[0-9]{2}" value="${esc(contact.zip)}" required></label></div></div></fieldset><p class="inquiry-disclaimer">${buyback ? 'Výkupní nabídku potvrdíme po otestování displejů.' : 'Cena je orientační. Konečný rozsah a cenu opravy potvrdí servis po kontrole.'}</p><p id="inquiry-error" class="form-error" role="alert" hidden></p><div class="inquiry-submit"><p><strong>Ukázkový provoz</strong><br>Poptávka se uloží do administrace v tomto prohlížeči. E-mail se neodesílá.</p><button type="submit" class="button primary">Odeslat poptávku ${icon('arrow')}</button></div></div></form>`,
      'service-inquiry-dialog',
    );
    updateInquiryTotal();
  } catch (error) {
    toast(error.message);
  }
}
function inquiryPrice(form) {
  const { service, group, row } = activeInquiry,
    buyback = service.id === 'vykup';
  const base =
    buyback && group.id === 'iphone' && form.elements.condition.value === 'damaged'
      ? row.damaged_touch_price
      : row.price;
  const whole = service.id === 'repase' && form.elements.deviceScope.value === 'device';
  const surcharge = whole ? group.surcharge : 0;
  return {
    base,
    surcharge,
    whole,
    unit: base === null || surcharge === null ? null : base + surcharge,
  };
}
function updateInquiryTotal() {
  const form = document.getElementById('service-inquiry-form');
  if (!form || !activeInquiry) return;
  const p = inquiryPrice(form),
    quantity = Number(form.elements.quantity.value) || 1,
    buyback = activeInquiry.service.id === 'vykup';
  document.getElementById('inquiry-total').textContent =
    p.unit === null ? 'Cena na posouzení' : money(p.unit * quantity) + (buyback ? '' : ' bez DPH');
  document.getElementById('inquiry-price-note').textContent =
    `${quantity} ks · ${p.whole ? 'celé zařízení včetně příplatku' : 'orientační ' + (buyback ? 'výkupní cena' : 'cena opravy')}`;
  const personal = form.elements.carrier.value === 'Osobní odběr';
  document.getElementById('inquiry-address').hidden = personal;
  ['street', 'city', 'zip'].forEach((name) => {
    form.elements[name].required = !personal;
  });
}
async function showMyServiceRequests() {
  if (!demoClient) {
    loginDialog();
    return;
  }
  try {
    const state = await opsStore.load();
    if (!demoClient) return;
    const requests = state.repairs.filter((r) => r.ownerId === 'demo-client');
    openDialog(
      `<div class="dialog-heading"><div><span class="demo-pill">Klientský účet · demo</span><h2 id="dialog-title">Moje poptávky</h2></div>${closeButton()}</div><div class="my-service-requests">${requests.length ? requests.map((r) => `<article><img src="${r.image}" alt="" width="60" height="70"><div><small>${esc(r.id)} · ${new Date(r.createdAt).toLocaleDateString('cs-CZ')}</small><h3>${esc(r.model)}</h3><p>${esc(serviceLabels[r.service])} · ${r.quantity} ks</p><span class="request-status">${esc(operationsCore.repairStatuses[r.status])}</span></div><strong>${r.unitPrice === null ? 'Na posouzení' : money(operationsCore.repairTotal(r))}</strong></article>`).join('') : '<div class="empty"><h3>Zatím nemáte žádnou poptávku.</h3><p>Vyberte zařízení a odešlete poptávku ze stránky služeb.</p></div>'}<a class="button secondary" href="/sluzby.html?service=repase">Vybrat další opravu ${icon('arrow')}</a><small>Zobrazené stavy patří k ukázkovým datům v tomto prohlížeči.</small></div>`,
      'my-requests-dialog',
    );
  } catch (e) {
    toast(e.message);
  }
}
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-service-inquiry]');
  if (trigger) openServiceInquiry(trigger.dataset.serviceInquiry);
  if (event.target.closest('[data-my-requests]')) showMyServiceRequests();
});
document.addEventListener('change', (event) => {
  if (event.target.id === 'service-sort') {
    serviceSort = event.target.value;
    renderServiceTiles();
  }
  if (event.target.closest('#service-inquiry-form')) updateInquiryTotal();
});
document.addEventListener('input', (event) => {
  if (event.target.closest('#service-inquiry-form')) updateInquiryTotal();
});
document.addEventListener('submit', (event) => {
  if (event.target.id !== 'service-inquiry-form') return;
  event.preventDefault();
  const form = event.target,
    error = document.getElementById('inquiry-error');
  try {
    if (!demoClient) throw Error('Pro odeslání poptávky se nejprve přihlaste.');
    const values = Object.fromEntries(new FormData(form)),
      price = inquiryPrice(form),
      { row, group, service } = activeInquiry;
    const payload = {
      service: service.id,
      family: group.id,
      model: values.model,
      work: row.work || 'Výkup prasklého displeje',
      image: row.image || group.image,
      quantity: Number(values.quantity),
      basePrice: price.base,
      surcharge: price.surcharge,
      unitPrice: price.unit,
      deviceScope: price.whole
        ? 'Celé zařízení'
        : service.id === 'zadni-skla'
          ? 'Celé zařízení'
          : 'Samostatný displej',
      condition: values.condition === 'damaged' ? 'Poškozený dotyk' : 'Funkční dotyk',
      serial: values.serial,
      description: values.description,
      carrier: values.carrier,
      inbound: values.inbound,
      contact: Object.fromEntries(
        ['name', 'company', 'email', 'phone', 'street', 'city', 'zip'].map((k) => [
          k,
          values[k]?.trim() || '',
        ]),
      ),
    };
    const state = opsStore.dispatch({ type: 'request.create', payload }),
      request = state.repairs[0];
    activeInquiry = null;
    openDialog(
      `<div class="dialog-heading"><h2 id="dialog-title">Poptávka je připravená</h2>${closeButton()}</div><div class="inquiry-success"><span>${icon('check')}</span><h3>${esc(request.id)}</h3><p>${esc(serviceLabels[request.service])} · ${esc(request.model)} · ${request.quantity} ks</p><div class="request-status">Nová poptávka</div><p>Uložili jsme ji do ukázkové administrace. Skutečný e-mail nebyl odeslán.</p><button class="button primary" data-my-requests>Moje poptávky ${icon('arrow')}</button><a class="text-link" href="/administrace.html?view=${request.service === 'vykup' ? 'buyback' : 'repairs'}&id=${request.id}">Zobrazit v demo administraci ${icon('arrow')}</a></div>`,
      'my-requests-dialog',
    );
  } catch (e) {
    error.hidden = false;
    error.textContent = e.message;
    error.focus();
  }
});
window.addEventListener('refurb:clientchange', (event) => {
  if (!event.detail.signedIn) {
    pendingServiceInquiry = null;
    activeInquiry = null;
    return;
  }
  if (pendingServiceInquiry) {
    const token = pendingServiceInquiry;
    pendingServiceInquiry = null;
    openServiceInquiry(token);
  }
});
