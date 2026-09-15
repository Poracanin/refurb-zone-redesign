'use strict';
const A = operationsCore;
const ae = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const am = (value) =>
  value === null
    ? 'Na posouzení'
    : new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        maximumFractionDigits: 0,
      }).format(value);
const ad = (value) =>
  value
    ? new Date(value).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })
    : 'Bez termínu';
const an = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  tool: '<path d="m14 6 4 4 4-4a6 6 0 0 1-8 8l-7 7-4-4 7-7a6 6 0 0 1 8-8z"/>',
  box: '<path d="m3 7 9-5 9 5v10l-9 5-9-5zM3 7l9 5 9-5m-9 5v10M8 4l9 5"/>',
  truck:
    '<path d="M2 5h13v12H2zM15 10h4l3 4v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  layers: '<path d="m3 7 9-5 9 5-9 5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',
  users:
    '<circle cx="9" cy="7" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3m0-18a4 4 0 0 1 0 8m3 3a6 6 0 0 1 3 5v2"/>',
  settings:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  chevron: '<path d="m8 5 7 7-7 7"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  list: '<path d="M8 5h13M8 12h13M8 19h13M3 5h.1M3 12h.1M3 19h.1"/>',
  board:
    '<rect x="3" y="3" width="5" height="13" rx="1"/><rect x="10" y="3" width="5" height="18" rx="1"/><rect x="17" y="3" width="5" height="10" rx="1"/>',
  alert: '<path d="m12 3 10 18H2zM12 9v5m0 3v1"/>',
  logout: '<path d="M9 3H3v18h6m4-14 5 5-5 5m-6-5h15"/>',
  refresh: '<path d="M3 9a9 9 0 0 1 16-4l2 3m0-6v6h-6M21 15a9 9 0 0 1-16 4l-2-3m0 6v-6h6"/>',
  print: '<path d="M6 8V2h12v6M6 17H3V8h18v9h-3M6 13h12v9H6z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
};
const ai = (name) =>
  `<svg viewBox="0 0 24 24" class="admin-icon" aria-hidden="true">${paths[name] || paths.grid}</svg>`;
const serviceNames = {
  repase: 'Repase displejů',
  'zadni-skla': 'Zadní skla',
  vykup: 'Výkup displejů',
};
const views = {
  dashboard: ['Přehled', 'grid'],
  repairs: ['Servisní zakázky', 'tool'],
  buyback: ['Výkup displejů', 'refresh'],
  orders: ['Objednávky', 'box'],
  shipments: ['Expedice a balíky', 'truck'],
  inventory: ['Sklad', 'layers'],
  customers: ['Zákazníci', 'users'],
  settings: ['Nastavení', 'settings'],
};
let db = null,
  ui = {
    view: new URLSearchParams(location.search).get('view') || 'dashboard',
    query: '',
    status: 'all',
    payment: 'all',
    carrier: 'all',
    low: false,
    layout: 'board',
    selection: new Set(),
    page: 1,
  },
  selectedDetail = null,
  toastTimeout;
if (!views[ui.view]) ui.view = 'dashboard';
function product(id) {
  return opsStore.products.find((p) => p.id === id);
}
function customer(item) {
  return item.contact || db.customers.find((c) => c.id === (item.customerId || item.id)) || {};
}
function initials(name) {
  return String(name || 'RZ')
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('');
}
function badge(status, type = 'repair') {
  const labels =
    type === 'order'
      ? A.orderStatuses
      : type === 'shipment'
        ? A.shipmentStatuses
        : A.repairStatuses;
  return `<span class="admin-badge status-${status}">${ae(labels[status] || status)}</span>`;
}
function paidBadge(value) {
  return `<span class="payment-status ${value}"><i></i>${value === 'paid' ? 'Zaplaceno' : value === 'refunded' ? 'Vráceno' : 'Čeká na platbu'}</span>`;
}
function button(text, action, icon = 'arrow', extra = '') {
  return `<button class="admin-button" data-action="${action}" ${extra}>${ai(icon)}${text}</button>`;
}
function primary(text, action, icon = 'plus', extra = '') {
  return `<button class="admin-button primary" data-action="${action}" ${extra}>${ai(icon)}${text}</button>`;
}
function notify(text) {
  const el = document.getElementById('admin-toast');
  el.textContent = text;
  el.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('visible'), 4200);
}
function isAdmin() {
  return sessionStorage.getItem('refurb-admin-session') === 'active';
}
function empty(text = 'Pro tento výběr tu nic není.') {
  return `<div class="admin-empty">${ai('search')}<h3>${text}</h3><p>Zkuste jiný název nebo zrušte filtry.</p>${button('Zrušit filtry', 'clear', 'refresh')}</div>`;
}
function match(record) {
  const c = customer(record);
  return an(
    [record.id, record.model, c.company, c.name, c.email, record.carrier].join(' '),
  ).includes(an(ui.query));
}
function repairRows() {
  return db.repairs.filter(
    (r) =>
      (ui.view === 'buyback' ? r.service === 'vykup' : r.service !== 'vykup') &&
      match(r) &&
      (ui.status === 'all' || r.status === ui.status),
  );
}
function orderRows() {
  return db.orders.filter(
    (o) =>
      match(o) &&
      (ui.status === 'all' || o.status === ui.status) &&
      (ui.payment === 'all' || o.payment === ui.payment),
  );
}
function shipmentRows() {
  return db.shipments.filter(
    (s) =>
      match(s) &&
      (ui.status === 'all' || s.status === ui.status) &&
      (ui.carrier === 'all' || s.carrier === ui.carrier),
  );
}
function inventoryRows() {
  return db.inventory.filter((i) => {
    const p = product(i.productId);
    return (
      an([p.name, i.sku, i.location].join(' ')).includes(an(ui.query)) &&
      (!ui.low || i.onHand - A.reserved(db, i.productId) <= i.minimum)
    );
  });
}
function customerRows() {
  return db.customers.filter((c) =>
    an([c.name, c.company, c.email, c.city].join(' ')).includes(an(ui.query)),
  );
}
function visibleRows() {
  return ui.view === 'orders' ? orderRows() : ui.view === 'shipments' ? shipmentRows() : [];
}
function route(view, status = 'all', id = null) {
  ui = {
    ...ui,
    view,
    status,
    query: '',
    payment: 'all',
    carrier: 'all',
    low: false,
    selection: new Set(),
    page: 1,
  };
  const params = new URLSearchParams({ view });
  if (id) params.set('id', id);
  history.pushState({}, '', location.pathname + '?' + params);
  render();
  if (id) openDetail(view === 'orders' ? 'order' : 'repair', id);
}
function loginView(error = '') {
  document.getElementById('admin-root').innerHTML =
    `<main class="admin-login"><section class="admin-login-story">${refurbBrand.markup({ header: true })}<div><span class="admin-eyebrow">ZÁZEMÍ VAŠEHO SERVISU</span><h1>Od první poptávky<br>po poslední balík.</h1><p>Zakázky, objednávky a sklad. Všechno propojené na jednom místě.</p><div class="login-features"><span>${ai('tool')} Servis a repase</span><span>${ai('truck')} Balení a expedice</span><span>${ai('layers')} Skladové rezervace</span></div></div><small>Ukázková administrace Refurb.zone</small></section><section class="admin-login-panel"><span class="admin-demo-pill">DEMO ADMINISTRACE</span><h2>Vítejte v zázemí.</h2><p>Přihlaste se ukázkovým účtem a projděte si celý provoz.</p><form id="admin-login-form"><label>E-mail<input id="admin-email" type="email" required autocomplete="off" placeholder="admin@example.com"></label><label>Heslo<input id="admin-password" type="password" required autocomplete="off" placeholder="Ukázkové heslo"></label><p id="admin-login-error" class="admin-form-error" role="alert" ${error ? '' : 'hidden'}>${ae(error)}</p><button class="admin-button primary" type="submit">Otevřít administraci ${ai('arrow')}</button></form><div class="admin-demo-access"><strong>Vyzkoušejte si správu obchodu</strong><p>admin@example.com<br>Admin2026!</p>${button('Vyplnit demo přihlášení', 'fill-admin', 'users')}<small>Samostatný účet administrátora. Klientské přihlášení platí pouze v obchodě.</small></div><a href="/" class="admin-back-link">← Zpět do obchodu</a></section></main>`;
}
async function boot() {
  if (!isAdmin()) {
    loginView();
    return;
  }
  document.getElementById('admin-root').innerHTML =
    '<div class="admin-loading">Načítáme servisní pracoviště…</div>';
  try {
    db = await opsStore.load();
    if (!isAdmin()) return loginView();
    render();
    const id = new URLSearchParams(location.search).get('id');
    if (id) openDetail(ui.view === 'orders' ? 'order' : 'repair', id);
  } catch (e) {
    document.getElementById('admin-root').innerHTML =
      `<div class="admin-empty"><h2>Data se nepodařilo načíst</h2><p>${ae(e.message)}</p>${button('Zkusit znovu', 'reload', 'refresh')}</div>`;
  }
}
function render() {
  if (!isAdmin()) {
    loginView();
    return;
  }
  const focused = document.activeElement?.id,
    selectionStart = document.activeElement?.selectionStart;
  const counts = {
    repairs: db.repairs.filter(
      (r) => r.service !== 'vykup' && !['done', 'cancelled', 'shipped'].includes(r.status),
    ).length,
    buyback: db.repairs.filter(
      (r) => r.service === 'vykup' && !['done', 'cancelled', 'shipped'].includes(r.status),
    ).length,
    orders: db.orders.filter((o) => ['new', 'processing', 'ready'].includes(o.status)).length,
    shipments: db.shipments.filter((s) => ['ready', 'labeled'].includes(s.status)).length,
  };
  document.getElementById('admin-root').innerHTML =
    `<div class="admin-shell"><aside class="admin-sidebar" id="admin-navigation"><div class="admin-brand">${refurbBrand.markup({ header: true })}<span>PRACOVIŠTĚ SERVISU</span></div><nav aria-label="Administrace">${Object.entries(
      views,
    )
      .map(
        ([key, [name, icon]], i) =>
          `${i === 1 ? '<span class="admin-nav-label">PROVOZ</span>' : i === 5 ? '<span class="admin-nav-label">SPRÁVA OBCHODU</span>' : ''}<a href="/administrace.html?view=${key}" data-view="${key}" ${ui.view === key ? 'aria-current="page"' : ''}>${ai(icon)}<span>${name}</span>${counts[key] ? `<b>${counts[key]}</b>` : ''}</a>`,
      )
      .join(
        '',
      )}</nav><div class="admin-sidebar-bottom"><a href="/">${ai('arrow')} Otevřít obchod</a><span><i></i> Demo prostředí</span><small>Data v tomto prohlížeči</small></div></aside><div class="admin-workspace"><header class="admin-topbar"><button class="admin-icon-button admin-menu-toggle" data-action="toggle-menu" aria-label="Otevřít navigaci" aria-controls="admin-navigation" aria-expanded="false">${ai('menu')}</button><div class="admin-breadcrumb">Administrace ${ai('chevron')} <strong>${views[ui.view][0]}</strong></div><label class="admin-global-search">${ai('search')}<input id="admin-search" type="search" placeholder="Hledat v ${ui.view === 'inventory' ? 'produktech a SKU' : 'aktuálním přehledu'}…" value="${ae(ui.query)}" aria-label="Hledat v přehledu"></label><span class="admin-operator"><i>AP</i><span>Admin provozu<small>Správce · demo</small></span></span><button class="admin-icon-button" data-action="logout" aria-label="Odhlásit administrátora" title="Odhlásit">${ai('logout')}</button></header><div class="admin-demo-strip"><span>DEMO</span> Změny jsou propojené v tomto prohlížeči. E-maily ani skutečné zásilky se neodesílají.</div><main id="admin-main"><div class="admin-page-heading"><div><span class="admin-eyebrow">REFURB.ZONE / ${ui.view === 'dashboard' ? 'DNEŠNÍ PROVOZ' : 'SPRÁVA'}</span><h1>${views[ui.view][0]}</h1><p>${pageDescription()}</p></div><div class="admin-heading-actions">${ui.view === 'dashboard' ? `<span class="admin-today">${ai('clock')}${new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}</span>` : ui.view === 'settings' ? '' : button('Export CSV', 'export', 'download')}${['repairs', 'buyback'].includes(ui.view) ? `<a class="admin-button primary" href="/sluzby.html?service=${ui.view === 'buyback' ? 'vykup' : 'repase'}">${ai('plus')} Nová poptávka</a>` : ''}</div></div>${content()}</main><footer class="admin-footer">Refurb.zone · ukázková administrace<span>JSON + lokální změny · ${opsStore.products.length} produktů</span></footer></div></div>`;
  if (focused) {
    const el = document.getElementById(focused);
    if (el) {
      el.focus({ preventScroll: true });
      try {
        el.setSelectionRange(selectionStart, selectionStart);
      } catch {}
    }
  }
}
function pageDescription() {
  return {
    dashboard: 'Důležité zakázky, zásilky a zásoby na jednom místě.',
    repairs: 'Od přijetí zařízení přes repasi až po výstupní kontrolu.',
    buyback: 'Přijetí displejů, testování a cenové nabídky pro vaše partnery.',
    orders: 'Přehled objednávek dílů, plateb a přípravy k expedici.',
    shipments: 'Zabalte, zkontrolujte a předejte zásilky přepravci.',
    inventory: 'Fyzický stav, rezervace objednávek a skladové pohyby.',
    customers: 'Servisní partneři, jejich zakázky a objednávky.',
    settings: 'Základní nastavení ukázkového pracoviště a správa demo dat.',
  }[ui.view];
}
function content() {
  return {
    dashboard: dashboard,
    repairs: repairsView,
    buyback: repairsView,
    orders: ordersView,
    shipments: shipmentsView,
    inventory: inventoryView,
    customers: customersView,
    settings: settingsView,
  }[ui.view]();
}
function tabs(labels, rows) {
  return `<div class="admin-status-tabs" role="group" aria-label="Filtrovat podle stavu">${[['all', 'Vše'], ...Object.entries(labels)].map(([key, label]) => `<button data-status="${key}" class="${ui.status === key ? 'active' : ''}" aria-pressed="${ui.status === key}">${label}<span>${key === 'all' ? rows.length : rows.filter((r) => r.status === key).length}</span></button>`).join('')}</div>`;
}
function dashboard() {
  const open = db.repairs.filter(
      (r) => r.service !== 'vykup' && !['done', 'cancelled', 'shipped'].includes(r.status),
    ),
    ready = db.shipments.filter((s) => ['ready', 'labeled'].includes(s.status));
  const pending = db.orders.filter((o) => o.payment === 'pending' && o.status !== 'cancelled');
  const low = db.inventory.filter((i) => i.onHand - A.reserved(db, i.productId) <= i.minimum);
  const metrics = [
    ['Rozpracované zakázky', open.length, 'Ve všech servisních fázích', 'tool', 'repairs'],
    ['Balíky k expedici', ready.length, 'Připravené k zabalení a odeslání', 'truck', 'shipments'],
    [
      'Čeká na úhradu',
      am(pending.reduce((n, o) => n + A.orderTotal(o), 0)),
      `${pending.length} objednávek před platbou`,
      'clock',
      'orders',
    ],
    ['Pod minimem', low.length, 'Skladových položek k doplnění', 'layers', 'inventory'],
  ];
  const steps = [
    ['new', 'Nové'],
    ['received', 'Přijaté'],
    ['diagnostics', 'Diagnostika'],
    ['approval', 'Schválení'],
    ['repair', 'Oprava'],
    ['quality', 'Kontrola'],
    ['ready', 'K odeslání'],
  ];
  const urgent = open
    .filter((r) => r.priority === 'high' || (r.dueAt && new Date(r.dueAt) < new Date()))
    .slice(0, 4);
  return `<section class="admin-metrics">${metrics.map(([label, value, sub, icon, view]) => `<button data-view="${view}" class="admin-metric"><span>${label}${ai(icon)}</span><strong>${value}</strong><small>${sub}</small></button>`).join('')}</section><div class="admin-dashboard-grid"><section class="admin-panel admin-pipeline"><div class="admin-panel-title"><div><h2>Jak postupují zakázky</h2><p>Aktuální vytížení servisu</p></div><button data-view="repairs" class="admin-text-button">Otevřít servis ${ai('arrow')}</button></div><div class="pipeline-bar">${steps.map(([key]) => `<span class="pipeline-${key}" style="flex:${open.filter((r) => r.status === key).length || 0.1}" title="${A.repairStatuses[key]}"></span>`).join('')}</div><div class="pipeline-legend">${steps.map(([key, label]) => `<button data-view="repairs" data-route-status="${key}"><i class="pipeline-${key}"></i><span>${label}</span><strong>${open.filter((r) => r.status === key).length}</strong></button>`).join('')}</div></section><section class="admin-panel"><div class="admin-panel-title"><div><h2>Potřebuje pozornost</h2><p>Priority a blížící se termíny</p></div>${ai('alert')}</div><div class="admin-attention">${urgent.map((r) => `<button data-open="repair" data-id="${r.id}"><span class="attention-dot"></span><div><strong>${ae(r.model)}</strong><small>${ae(r.id)} · ${ae(customer(r).company)}</small></div><span>${r.priority === 'high' ? 'Priorita' : 'Po termínu'}${ai('chevron')}</span></button>`).join('')}</div></section><section class="admin-panel dashboard-orders"><div class="admin-panel-title"><div><h2>Poslední objednávky</h2><p>Nové díly na cestě do servisů</p></div><button data-view="orders" class="admin-text-button">Všechny objednávky ${ai('arrow')}</button></div>${orderTable(db.orders.filter(match).slice(0, 5), false)}</section><section class="admin-panel"><div class="admin-panel-title"><div><h2>Dnešní expedice</h2><p>Čeká na předání přepravcům</p></div>${ai('truck')}</div><div class="admin-carrier-list">${A.carriers
    .slice(0, 3)
    .map(
      (c) =>
        `<button data-view="shipments" data-route-carrier="${c}"><span class="carrier-logo carrier-${c === 'PPL' ? 'ppl' : c === 'Balíkovna' ? 'bal' : 'wolt'}">${c === 'Wolt Drive' ? 'Wolt' : c}</span><div><strong>${ready.filter((s) => s.carrier === c).length} zásilek</strong><small>K zabalení nebo odeslání</small></div>${ai('arrow')}</button>`,
    )
    .join('')}</div></section></div>`;
}
function repairsView() {
  const all = db.repairs.filter((r) =>
      ui.view === 'buyback' ? r.service === 'vykup' : r.service !== 'vykup',
    ),
    rows = repairRows();
  const stages = [
    ['Příjem', ['new', 'received']],
    ['Diagnostika', ['diagnostics', 'approval']],
    ['Zpracování', ['repair']],
    ['Kontrola', ['quality']],
    ['K expedici', ['ready']],
  ];
  return `${tabs(A.repairStatuses, all)}<div class="admin-list-toolbar"><span>${rows.length} zakázek ${ui.query ? '· výsledky hledání' : ''}</span><div class="admin-view-switch"><button data-layout="board" aria-pressed="${ui.layout === 'board'}">${ai('board')} Nástěnka</button><button data-layout="table" aria-pressed="${ui.layout === 'table'}">${ai('list')} Seznam</button></div></div>${
    ui.layout === 'board' &&
    ['all', 'new', 'received', 'diagnostics', 'approval', 'repair', 'quality', 'ready'].includes(
      ui.status,
    )
      ? `<div class="admin-kanban">${stages
          .map(([label, statuses]) => {
            const cards = rows.filter((r) => statuses.includes(r.status));
            return `<section><header><h2>${label}</h2><span>${cards.length}</span></header><div>${cards.map((r) => `<button class="repair-kanban-card" data-open="repair" data-id="${r.id}"><div><small>${r.id}</small>${r.priority === 'high' ? '<span class="priority-flag">Priorita</span>' : ''}</div><h3>${ae(r.model)}</h3><p>${ae(customer(r).company)}</p><span class="repair-kind">${ae(serviceNames[r.service])} · ${r.quantity} ks</span>${badge(r.status)}<footer><span class="admin-avatar small">${initials(r.technician)}</span><span class="${r.dueAt && new Date(r.dueAt) < new Date() ? 'overdue' : ''}">${ai('clock')}${ad(r.dueAt)}</span><strong>${am(A.repairTotal(r))}</strong></footer></button>`).join('') || '<div class="kanban-empty">Žádná zakázka v této fázi</div>'}</div></section>`;
          })
          .join(
            '',
          )}</div><p class="admin-helper">Nástěnka zobrazuje rozpracované zakázky. Odeslané a uzavřené najdete přes filtr stavu nebo v seznamu. Kliknutím otevřete detail.</p>`
      : rows.length
        ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Zakázka / model</th><th>Servisní partner</th><th>Služba</th><th>Stav</th><th>Technik</th><th>Termín</th><th class="align-right">Nabídka</th></tr></thead><tbody>${rows.map((r) => `<tr><td><button class="admin-record-link" data-open="repair" data-id="${r.id}">${r.id}</button><small>${ae(r.model)} · ${r.quantity} ks</small></td><td>${ae(customer(r).company)}<small>${ae(customer(r).name)}</small></td><td>${ae(serviceNames[r.service])}</td><td>${badge(r.status)}</td><td>${ae(r.technician)}</td><td>${ad(r.dueAt)}</td><td class="align-right"><strong>${am(A.repairTotal(r))}</strong></td></tr>`).join('')}</tbody></table></div>`
        : empty()
  }`;
}
function orderTable(rows, selectable = true) {
  return `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${selectable ? '<th class="check-cell"><input type="checkbox" data-select-all aria-label="Vybrat zobrazené objednávky"></th>' : ''}<th>Objednávka</th><th>Zákazník</th><th>Platba</th><th>Stav</th><th>Doprava</th><th class="align-right">Celkem bez DPH</th></tr></thead><tbody>${rows.map((o) => `<tr class="${ui.selection.has(o.id) ? 'selected' : ''}">${selectable ? `<td class="check-cell"><input type="checkbox" data-select="${o.id}" aria-label="Vybrat ${o.id}" ${ui.selection.has(o.id) ? 'checked' : ''}></td>` : ''}<td><button class="admin-record-link" data-open="order" data-id="${o.id}">${o.id}</button><small>${ad(o.createdAt)} · ${o.lines.reduce((n, l) => n + l.quantity, 0)} ks</small></td><td><strong>${ae(customer(o).company)}</strong><small>${ae(customer(o).name)}</small></td><td>${paidBadge(o.payment)}<small>${ae(o.paymentMethod)}</small></td><td>${badge(o.status, 'order')}</td><td><span class="carrier-tag">${ae(o.carrier)}</span></td><td class="align-right"><strong>${am(A.orderTotal(o))}</strong></td></tr>`).join('')}</tbody></table></div>`;
}
function bulkBar() {
  return `<div class="admin-bulk-bar"><span>${ui.selection.size ? `${ui.selection.size} vybráno` : 'Vyberte řádky pro hromadné akce'}</span>${ui.view === 'orders' ? `<select id="order-bulk-status" aria-label="Nový stav objednávek"><option value="processing">Vyřizuje se</option><option value="ready">K expedici</option><option value="cancelled">Stornováno</option></select>${button('Změnit stav', 'bulk-order-status', 'check')}${button('Připravit zásilky', 'bulk-create-shipments', 'truck')}` : `${button('Označit zabaleno', 'bulk-pack', 'box')}${primary('Předat přepravci', 'bulk-dispatch', 'truck')}${button('Doručeno', 'bulk-deliver', 'check')}`}</div>`;
}
function ordersView() {
  const rows = orderRows();
  return `${tabs(A.orderStatuses, db.orders)}<div class="admin-list-toolbar"><span>${rows.length} objednávek</span><label>Platba <select id="order-payment-filter"><option value="all">Všechny platby</option><option value="pending" ${ui.payment === 'pending' ? 'selected' : ''}>Čeká na platbu</option><option value="paid" ${ui.payment === 'paid' ? 'selected' : ''}>Zaplaceno</option></select></label></div>${bulkBar()}${rows.length ? orderTable(rows) : empty()}`;
}
function shipmentsView() {
  const rows = shipmentRows();
  return `<section class="admin-shipment-summary">${[
    ['ready', 'K zabalení', 'box'],
    ['labeled', 'Připraveno k odvozu', 'check'],
    ['shipped', 'Na cestě', 'truck'],
    ['delivered', 'Doručeno', 'users'],
  ]
    .map(
      ([s, label, icon]) =>
        `<button data-status="${s}" class="${ui.status === s ? 'active' : ''}">${ai(icon)}<div><strong>${db.shipments.filter((x) => x.status === s).length}</strong><span>${label}</span></div></button>`,
    )
    .join(
      '',
    )}</section>${tabs(A.shipmentStatuses, db.shipments)}<div class="admin-list-toolbar"><span>${rows.length} zásilek</span><label>Přepravce <select id="shipment-carrier-filter"><option value="all">Všichni přepravci</option>${A.carriers.map((c) => `<option ${ui.carrier === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>${bulkBar()}${rows.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th class="check-cell"><input type="checkbox" data-select-all aria-label="Vybrat zobrazené zásilky"></th><th>Zásilka</th><th>Zákazník</th><th>Zdroj</th><th>Přepravce</th><th>Stav</th><th>Hmotnost</th><th></th></tr></thead><tbody>${rows.map((s) => `<tr><td><input type="checkbox" data-select="${s.id}" aria-label="Vybrat ${s.id}" ${ui.selection.has(s.id) ? 'checked' : ''}></td><td><button class="admin-record-link" data-open="shipment" data-id="${s.id}">${s.id}</button><small>${ae(s.tracking)}</small></td><td>${ae(customer(s).company)}<small>${ae(customer(s).city)}</small></td><td><button class="admin-text-button" data-open="${s.sourceType}" data-id="${s.sourceId}">${s.sourceId}</button></td><td><span class="carrier-tag">${ae(s.carrier)}</span></td><td>${badge(s.status, 'shipment')}</td><td>${s.weight} kg</td><td><button class="admin-icon-button" data-print-shipment="${s.id}" aria-label="Tisk průvodky ${s.id}">${ai('print')}</button></td></tr>`).join('')}</tbody></table></div>` : empty()}`;
}
function inventoryView() {
  const rows = inventoryRows(),
    low = db.inventory.filter((i) => i.onHand - A.reserved(db, i.productId) <= i.minimum).length;
  return `<div class="admin-list-toolbar inventory-toolbar"><div><strong>${db.inventory.reduce((n, i) => n + i.onHand, 0)}</strong> fyzických kusů <span>·</span> <strong>${db.inventory.reduce((n, i) => n + A.reserved(db, i.productId), 0)}</strong> rezervováno</div><label class="admin-checkbox"><input id="inventory-low-filter" type="checkbox" ${ui.low ? 'checked' : ''}> Jen pod minimem (${low})</label></div>${
    rows.length
      ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Produkt / SKU</th><th>Pozice</th><th class="align-right">Fyzicky</th><th class="align-right">Rezervace</th><th class="align-right">K dispozici</th><th class="align-right">Minimum</th><th></th></tr></thead><tbody>${rows
          .map((i) => {
            const p = product(i.productId),
              reserved = A.reserved(db, i.productId),
              available = i.onHand - reserved;
            return `<tr><td><div class="inventory-product"><img src="${p.images[0]}" alt="" width="42" height="48"><div><button class="admin-record-link" data-open="stock" data-id="${i.productId}">${ae(p.name)}</button><small>${ae(i.sku)}</small></div></div></td><td><span class="location-code">${i.location}</span></td><td class="align-right">${i.onHand}</td><td class="align-right">${reserved}</td><td class="align-right"><strong class="${available <= i.minimum ? 'stock-low' : 'stock-ok'}">${available} ks</strong></td><td class="align-right">${i.minimum}</td><td>${button('Pohyb', 'stock-movement', 'plus', `data-id="${i.productId}"`)}</td></tr>`;
          })
          .join('')}</tbody></table></div>`
      : empty()
  }<p class="admin-helper">Rezervace vychází z otevřených objednávek. Fyzický stav se sníží při předání zásilky přepravci.</p>`;
}
function customersView() {
  const rows = customerRows();
  return `<div class="admin-list-toolbar"><span>${rows.length} servisních partnerů</span><span>Fiktivní kontakty pro demonstraci</span></div><div class="admin-customer-grid">${
    rows
      .map((c) => {
        const orders = db.orders.filter((o) => o.customerId === c.id),
          repairs = db.repairs.filter((r) => r.customerId === c.id);
        return `<button class="admin-customer-card" data-open="customer" data-id="${c.id}"><div><span class="admin-avatar">${initials(c.company)}</span><span class="admin-badge">${ae(c.group)}</span></div><h3>${ae(c.company)}</h3><p>${ae(c.name)} · ${ae(c.city)}</p><small>${ae(c.email)}</small><footer><span><strong>${orders.length}</strong> objednávek</span><span><strong>${repairs.length}</strong> zakázek</span>${ai('arrow')}</footer></button>`;
      })
      .join('') || empty()
  }</div>`;
}
function settingsView() {
  return `<div class="admin-settings-grid"><section class="admin-panel"><div class="admin-panel-title"><div><h2>Pracoviště a expedice</h2><p>Údaje pro interní demo průvodky</p></div>${ai('settings')}</div><form id="admin-settings-form" class="admin-form"><label>Název provozu<input name="company" required value="${ae(db.settings.company)}"></label><label>Sklad<input name="warehouse" value="${ae(db.settings.warehouse)}"></label><label>Adresa odesílatele<input name="sender" value="${ae(db.settings.sender)}"></label><label>Výchozí přepravce<select name="defaultCarrier">${A.carriers.map((c) => `<option ${db.settings.defaultCarrier === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label><button class="admin-button primary">Uložit nastavení</button></form></section><section class="admin-panel"><div class="admin-panel-title"><div><h2>Tým a přístupy</h2><p>Ukázkové role v servisním provozu</p></div>${ai('users')}</div><div class="admin-team-list">${db.team.map((t) => `<div><span class="admin-avatar">${initials(t)}</span><strong>${ae(t)}</strong><span class="admin-badge">${t.includes('expedice') ? 'Sklad / expedice' : 'Technik'}</span></div>`).join('')}</div><p class="admin-helper">Demo administrátor spravuje všechny sekce. Ostré účty, oprávnění a zabezpečení vyžadují backend.</p></section><section class="admin-panel"><div class="admin-panel-title"><div><h2>Ukázková data</h2><p>Export a obnovení tohoto prohlížeče</p></div>${ai('layers')}</div><div class="admin-settings-actions">${button('Stáhnout data JSON', 'export-json', 'download')}${button('Obnovit výchozí demo', 'confirm-reset', 'refresh')}</div><p class="admin-helper">Obnovení odstraní pouze lokální změny a poptávky tohoto dema. Předem si můžete stáhnout export.</p></section><section class="admin-panel"><div class="admin-panel-title"><div><h2>Napojení pro ostrý provoz</h2><p>Připravený návrh, nikoli aktivní integrace</p></div>${ai('box')}</div><div class="admin-integration"><span>Databáze a přihlášení</span><b>Plánováno</b><span>E-mailové notifikace</span><b>Plánováno</b><span>PPL / Balíkovna / Wolt</span><b>Demo průvodky</b><span>Shoptet API</span><b>Nepřipojeno</b></div></section></div>`;
}
function showDialog(title, html, kind = 'detail') {
  const d = document.getElementById('admin-dialog');
  d.className = 'admin-dialog ' + kind;
  d.innerHTML = `<header class="admin-dialog-heading"><h2 id="admin-dialog-title">${title}</h2><button class="admin-icon-button" data-close-admin aria-label="Zavřít detail">${ai('close')}</button></header><div class="admin-dialog-body">${html}<p id="admin-dialog-error" class="admin-form-error" role="alert" hidden></p></div>`;
  if (!d.open) d.showModal();
}
function contactBlock(c) {
  return `<section class="detail-block"><h3>${ai('users')} Servisní partner</h3><strong>${ae(c.company)}</strong><p>${ae(c.name)}<br>${ae(c.email)}<br>${ae(c.phone)}</p><address>${ae(c.street)}<br>${ae(c.zip)} ${ae(c.city)}</address></section>`;
}
function historyBlock(item) {
  return `<section class="detail-block"><h3>${ai('clock')} Historie</h3><ol class="admin-timeline">${(item.history || []).map((h) => `<li><span></span><div><strong>${ae(h.text)}</strong><small>${ad(h.at)} ${new Date(h.at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })} · ${ae(h.actor)}</small></div></li>`).join('')}</ol></section>`;
}
function notesBlock(item, collection) {
  return `<section class="detail-block"><h3>Interní poznámky</h3><div class="admin-notes">${(item.notes || []).map((n) => `<article><p>${ae(n.text)}</p><small>${ae(n.actor)} · ${ad(n.at)}</small></article>`).join('') || '<p class="admin-helper">Zatím bez interní poznámky.</p>'}</div><form id="admin-note-form" class="admin-form" data-collection="${collection}" data-id="${item.id}"><label class="sr-only" for="admin-note-text">Interní poznámka</label><textarea id="admin-note-text" name="text" rows="2" maxlength="3000" required placeholder="Zapište zjištění, domluvu nebo pokyn pro kolegy…"></textarea><button class="admin-button" type="submit">${ai('plus')} Přidat poznámku</button></form></section>`;
}
function shipmentLink(item, sourceType) {
  const shipment = db.shipments.find((s) => s.sourceType === sourceType && s.sourceId === item.id);
  return shipment
    ? `<div class="detail-shipment-link"><span>${ai('truck')} ${shipment.id} · ${ae(shipment.carrier)}</span>${badge(shipment.status, 'shipment')}<button class="admin-text-button" data-open="shipment" data-id="${shipment.id}">Otevřít zásilku ${ai('arrow')}</button></div>`
    : item.status === 'ready'
      ? primary(
          'Připravit zásilku',
          'create-shipment',
          'truck',
          `data-source="${sourceType}" data-id="${item.id}"`,
        )
      : '<p class="admin-helper">Zásilku vytvoříte, až bude případ připravený k expedici.</p>';
}
function openDetail(type, id) {
  if (!isAdmin()) return loginView();
  selectedDetail = { type, id };
  if (type === 'repair') {
    const r = db.repairs.find((r) => r.id === id);
    if (!r) {
      notify('Zakázka nebyla nalezena.');
      return;
    }
    showDialog(
      `${ae(r.id)} <span>${ae(serviceNames[r.service])}</span>`,
      `<div class="detail-topline">${badge(r.status)}<span>Přijato ${ad(r.createdAt)} · ${r.quantity} ks</span>${r.priority === 'high' ? '<b class="priority-flag">Priorita</b>' : ''}</div><div class="admin-detail-grid"><div><section class="detail-block"><div class="repair-detail-product"><img src="${r.image}" alt="${ae(r.model)}" width="100" height="110"><div><h3>${ae(r.model)}</h3><p>${ae(r.work)}</p><small>${ae(r.deviceScope)} · ${ae(r.condition)}</small>${r.serial ? `<small>Označení: ${ae(r.serial)}</small>` : ''}</div><strong>${am(A.repairTotal(r))}<small>${r.service === 'vykup' ? 'Nabídka výkupu' : 'Orientačně bez DPH'}</small></strong></div><div class="repair-description"><strong>Popis od zákazníka</strong><p>${ae(r.description || 'Bez poznámky.')}</p></div></section><section class="detail-block"><h3>Průběh a cenová nabídka</h3><form id="admin-repair-form" class="admin-form grid" data-id="${r.id}"><label>Stav zakázky<select name="status" ${['done', 'cancelled'].includes(r.status) ? 'disabled' : ''}>${Object.entries(
        A.repairStatuses,
      )
        .map(
          ([k, v]) =>
            `<option value="${k}" ${r.status === k ? 'selected' : ''} ${['shipped', 'done'].includes(k) ? 'disabled' : ''}>${v}</option>`,
        )
        .join(
          '',
        )}</select></label><label>Odpovědný technik<select name="technician">${['Nepřiřazeno', ...db.team].map((t) => `<option ${r.technician === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label>Priorita<select name="priority"><option value="normal">Standardní</option><option value="high" ${r.priority === 'high' ? 'selected' : ''}>Prioritní</option></select></label><label>Termín dokončení<input type="date" name="dueAt" value="${r.dueAt ? r.dueAt.slice(0, 10) : ''}"></label><label>Nabídka za kus ${r.service === 'vykup' ? '(Kč)' : '(Kč bez DPH)'}<input name="unitPrice" type="number" min="0" step=".01" value="${r.unitPrice ?? ''}" placeholder="Na posouzení"></label><div class="detail-quantity"><small>Počet zařízení</small><strong>${r.quantity} ks</strong></div><fieldset class="quality-checks field-wide"><legend>${r.service === 'vykup' ? 'Test report displeje' : 'Výstupní kontrola'}</legend>${[
        ['image', 'Obraz bez vad'],
        ['touch', 'Dotyk otestován'],
        ['frame', 'Sklo a rámeček zkontrolovány'],
        ['clean', 'Vyčištěno a označeno'],
        ['pack', 'Připraveno k zabalení'],
      ]
        .map(
          ([k, t]) =>
            `<label><input type="checkbox" name="checks" value="${k}" ${r.checks.includes(k) ? 'checked' : ''}>${t}</label>`,
        )
        .join(
          '',
        )}</fieldset><button type="submit" class="admin-button primary field-wide">${ai('check')} Uložit zakázku</button></form></section>${notesBlock(r, 'repairs')}</div><aside>${contactBlock(customer(r))}<section class="detail-block"><h3>${ai('truck')} Doručení</h3><p>${ae(r.inbound)}<br>Vrácení: ${ae(r.carrier)}</p>${shipmentLink(r, 'repair')}</section>${historyBlock(r)}</aside></div>`,
    );
  } else if (type === 'order') {
    const o = db.orders.find((o) => o.id === id);
    if (!o) {
      notify('Objednávka nebyla nalezena.');
      return;
    }
    showDialog(
      `${o.id} <span>Objednávka dílů</span>`,
      `<div class="detail-topline">${badge(o.status, 'order')}${paidBadge(o.payment)}<span>${ad(o.createdAt)}</span></div><div class="admin-detail-grid"><div><section class="detail-block"><h3>Položky objednávky</h3><div class="detail-order-items">${o.lines
        .map((l) => {
          const p = product(l.productId);
          return `<div><img src="${p.images[0]}" alt="" width="48" height="60"><div><strong>${ae(p.name)}</strong><small>${ae(p.variants[0].sku)} · ${l.quantity} ks × ${am(l.unitPrice)}</small></div><strong>${am(l.quantity * l.unitPrice)}</strong></div>`;
        })
        .join(
          '',
        )}</div><div class="detail-order-total"><span>Doprava</span><strong>${am(o.shippingPrice)}</strong><span>Celkem bez DPH</span><strong>${am(A.orderTotal(o))}</strong></div></section><section class="detail-block"><h3>Zpracování objednávky</h3><form id="admin-order-form" class="admin-form grid" data-id="${o.id}"><label>Stav objednávky<select name="status" ${['done', 'cancelled'].includes(o.status) ? 'disabled' : ''}>${Object.entries(
        A.orderStatuses,
      )
        .map(
          ([k, v]) =>
            `<option value="${k}" ${o.status === k ? 'selected' : ''} ${['shipped', 'done'].includes(k) ? 'disabled' : ''}>${v}</option>`,
        )
        .join(
          '',
        )}</select></label><label>Platba · ${ae(o.paymentMethod)}<select name="payment"><option value="pending" ${o.payment === 'pending' ? 'selected' : ''}>Čeká na úhradu</option><option value="paid" ${o.payment === 'paid' ? 'selected' : ''}>Zaplaceno (demo)</option><option value="refunded" ${o.payment === 'refunded' ? 'selected' : ''}>Vráceno (demo)</option></select></label><button class="admin-button primary field-wide">${ai('check')} Uložit objednávku</button></form></section>${notesBlock(o, 'orders')}</div><aside>${contactBlock(customer(o))}<section class="detail-block"><h3>${ai('truck')} Expedice</h3><p>${ae(o.carrier)}</p>${shipmentLink(o, 'order')}</section>${historyBlock(o)}</aside></div>`,
    );
  } else if (type === 'shipment') {
    const s = db.shipments.find((s) => s.id === id);
    if (!s) return notify('Zásilka nebyla nalezena.');
    const source = (s.sourceType === 'order' ? db.orders : db.repairs).find(
      (r) => r.id === s.sourceId,
    );
    showDialog(
      `${s.id} <span>Zásilka</span>`,
      `<div class="detail-topline">${badge(s.status, 'shipment')}<span>${ae(s.tracking)} · interní demo reference</span></div><div class="admin-detail-grid"><div><section class="detail-block"><h3>Zásilka pro ${ae(customer(source).company)}</h3><p>Zdroj: <button class="admin-text-button" data-open="${s.sourceType}" data-id="${source.id}">${source.id}</button></p><form id="admin-shipment-form" class="admin-form grid" data-id="${s.id}"><label>Přepravce<select name="carrier">${A.carriers.map((c) => `<option ${c === s.carrier ? 'selected' : ''}>${c}</option>`).join('')}</select></label><label>Hmotnost (kg)<input name="weight" type="number" step=".01" min=".01" max="50" required value="${s.weight}"></label><label class="field-wide">Poznámka pro expedici<textarea name="note" rows="2" maxlength="1000">${ae(s.note)}</textarea></label><button class="admin-button primary field-wide" ${['ready', 'labeled'].includes(s.status) ? '' : 'disabled'}>Uložit zásilku</button></form></section><section class="detail-block"><h3>Práce s balíkem</h3><div class="shipment-actions">${s.status === 'ready' ? primary('Označit jako zabalené', 'single-pack', 'box', `data-id="${s.id}"`) : ''}${s.status === 'labeled' ? primary('Předat přepravci', 'single-dispatch', 'truck', `data-id="${s.id}"`) : ''}${s.status === 'shipped' ? primary('Označit doručeno', 'single-deliver', 'check', `data-id="${s.id}"`) : ''}<button class="admin-button" data-print-shipment="${s.id}">${ai('print')} Tisk interní průvodky</button></div><p class="admin-helper">V demu se nezakládá skutečná zásilka u přepravce. Průvodka není platný přepravní štítek.</p></section>${historyBlock(source)}</div><aside>${contactBlock(customer(source))}<section class="detail-block"><h3>Obsah zásilky</h3><ul class="shipment-content">${s.sourceType === 'order' ? source.lines.map((l) => `<li><strong>${l.quantity}×</strong> ${ae(product(l.productId).name)}</li>`).join('') : `<li><strong>${source.quantity}×</strong> ${ae(source.model)}<small>${ae(serviceNames[source.service])}</small></li>`}</ul></section></aside></div>`,
    );
  } else if (type === 'stock') {
    const stock = db.inventory.find((i) => i.productId === id),
      p = product(id);
    if (!stock) return notify('Produkt nebyl nalezen.');
    showDialog(
      `Skladová karta <span>${ae(stock.sku)}</span>`,
      `<div class="repair-detail-product stock-detail-head"><img src="${p.images[0]}" alt="" width="90" height="110"><div><h3>${ae(p.name)}</h3><p>Pozice ${stock.location}</p></div></div><div class="stock-detail-metrics"><div><small>Fyzicky</small><strong>${stock.onHand} ks</strong></div><div><small>Rezervováno</small><strong>${A.reserved(db, id)} ks</strong></div><div><small>K dispozici</small><strong>${stock.onHand - A.reserved(db, id)} ks</strong></div><div><small>Minimum</small><strong>${stock.minimum} ks</strong></div></div><div class="admin-detail-grid"><section class="detail-block"><h3>Nový skladový pohyb</h3><form id="admin-stock-form" class="admin-form grid" data-id="${id}"><label>Typ pohybu<select name="kind"><option value="receive">Příjem na sklad</option><option value="issue">Výdej ze skladu</option></select></label><label>Počet kusů<input type="number" name="quantity" required min="1" step="1" value="1"></label><label class="field-wide">Důvod / číslo příjemky<input name="reason" required maxlength="300" placeholder="Např. příjem od dodavatele"></label><button class="admin-button primary field-wide">${ai('plus')} Zapsat pohyb</button></form></section><section class="detail-block"><h3>Poslední pohyby</h3><div class="stock-movements">${
        db.movements
          .filter((m) => m.productId === id)
          .slice(0, 12)
          .map(
            (m) =>
              `<div><span class="${m.quantity > 0 ? 'stock-ok' : 'stock-low'}">${m.quantity > 0 ? '+' : ''}${m.quantity} ks</span><div><strong>${ae(m.reason)}</strong><small>${ad(m.at)} · ${ae(m.actor)}</small></div></div>`,
          )
          .join('') || '<p class="admin-helper">Výchozí stav z demo dat.</p>'
      }</div></section></div>`,
      'stock-detail',
    );
  } else if (type === 'customer') {
    const c = db.customers.find((c) => c.id === id),
      orders = db.orders.filter((o) => o.customerId === id),
      repairs = db.repairs.filter((r) => r.customerId === id);
    showDialog(
      `${ae(c.company)} <span>${ae(c.id)}</span>`,
      `<div class="admin-detail-grid"><div><section class="detail-block"><h3>Servisní zakázky</h3><div class="customer-records">${repairs.map((r) => `<button data-open="repair" data-id="${r.id}"><strong>${r.id}</strong><span>${ae(r.model)}</span>${badge(r.status)}</button>`).join('') || '<p>Zatím bez zakázek.</p>'}</div></section><section class="detail-block"><h3>Objednávky dílů</h3>${orders.length ? orderTable(orders, false) : '<p>Zatím bez objednávek.</p>'}</section></div><aside>${contactBlock(c)}<section class="detail-block"><h3>Souhrn spolupráce</h3><p>${orders.length} objednávek · ${repairs.length} zakázek</p><strong>${am(orders.reduce((n, o) => n + A.orderTotal(o), 0))}</strong><small class="admin-helper">Objem ukázkových objednávek</small></section></aside></div>`,
    );
  }
}
function perform(action, message = 'Změna je uložená.') {
  try {
    db = opsStore.dispatch(action);
    render();
    if (selectedDetail && document.getElementById('admin-dialog').open)
      openDetail(selectedDetail.type, selectedDetail.id);
    notify(message);
    return true;
  } catch (e) {
    const error = document.getElementById('admin-dialog-error');
    if (document.getElementById('admin-dialog').open && error) {
      error.textContent = e.message;
      error.hidden = false;
      error.scrollIntoView({ block: 'nearest' });
    } else notify(e.message);
    return false;
  }
}
function download(name, content, type) {
  const blob = new Blob([content], { type }),
    url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportCsv() {
  let rows, headers;
  if (ui.view === 'inventory') {
    headers = ['SKU', 'Produkt', 'Pozice', 'Fyzicky', 'Rezervace', 'K dispozici'];
    rows = inventoryRows().map((i) => [
      i.sku,
      product(i.productId).name,
      i.location,
      i.onHand,
      A.reserved(db, i.productId),
      i.onHand - A.reserved(db, i.productId),
    ]);
  } else if (ui.view === 'customers') {
    headers = ['ID', 'Firma', 'Kontakt', 'E-mail', 'Město'];
    rows = customerRows().map((c) => [c.id, c.company, c.name, c.email, c.city]);
  } else if (ui.view === 'shipments') {
    headers = ['Zásilka', 'Zdroj', 'Zákazník', 'Přepravce', 'Stav', 'Hmotnost'];
    rows = shipmentRows().map((s) => [
      s.id,
      s.sourceId,
      customer(s).company,
      s.carrier,
      A.shipmentStatuses[s.status],
      s.weight,
    ]);
  } else if (ui.view === 'orders') {
    headers = ['Objednávka', 'Datum', 'Zákazník', 'Stav', 'Platba', 'Cena bez DPH'];
    rows = orderRows().map((o) => [
      o.id,
      o.createdAt,
      customer(o).company,
      A.orderStatuses[o.status],
      o.payment,
      A.orderTotal(o),
    ]);
  } else {
    headers = ['Zakázka', 'Služba', 'Model', 'Zákazník', 'Stav', 'Kusů', 'Nabídka'];
    rows = repairRows().map((r) => [
      r.id,
      serviceNames[r.service],
      r.model,
      customer(r).company,
      A.repairStatuses[r.status],
      r.quantity,
      A.repairTotal(r) ?? 'Na posouzení',
    ]);
  }
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  download(
    `refurb-${ui.view}-demo.csv`,
    '\ufeff' + [headers, ...rows].map((row) => row.map(cell).join(';')).join('\r\n'),
    'text/csv;charset=utf-8',
  );
  notify('CSV export je připravený.');
}
function printShipment(id) {
  const s = db.shipments.find((s) => s.id === id),
    source = (s.sourceType === 'order' ? db.orders : db.repairs).find((r) => r.id === s.sourceId),
    c = customer(source);
  const html = `<div class="admin-packing-sheet"><b>DEMO · INTERNÍ PRŮVODKA</b><h1>${s.id}</h1><p>Tento dokument není přepravní štítek.</p><hr><h2>${ae(c.company)}</h2><p>${ae(c.name)}<br>${ae(c.street)}<br>${ae(c.zip)} ${ae(c.city)}</p><p>Přepravce: ${ae(s.carrier)} · Hmotnost: ${s.weight} kg<br>Zdroj: ${source.id}</p><hr><h3>Obsah balíku</h3><ul>${s.sourceType === 'order' ? source.lines.map((l) => `<li>${l.quantity}× ${ae(product(l.productId).name)}</li>`).join('') : `<li>${source.quantity}× ${ae(source.model)} · ${ae(serviceNames[source.service])}</li>`}</ul><hr><small>Odesílatel: ${ae(db.settings.company)}, ${ae(db.settings.sender)}<br>Vytvořeno v ukázkové administraci Refurb.zone.</small></div>`;
  selectedDetail = null;
  document.getElementById('admin-print').innerHTML = html;
  showDialog(
    'Interní průvodka · demo',
    `${html}<div class="print-actions">${primary('Vytisknout průvodku', 'print-now', 'print')}</div>`,
    'packing-preview',
  );
}
document.addEventListener('click', (event) => {
  const target = event.target.closest(
    '[data-view],[data-action],[data-open],[data-status],[data-layout],[data-print-shipment],[data-close-admin]',
  );
  if (!target) return;
  if (target.dataset.action === 'fill-admin') {
    document.getElementById('admin-email').value = 'admin@example.com';
    document.getElementById('admin-password').value = 'Admin2026!';
    return;
  }
  if (target.dataset.action === 'reload') {
    boot();
    return;
  }
  if (!isAdmin()) return;
  if (target.hasAttribute('data-close-admin')) {
    document.getElementById('admin-dialog').close();
    selectedDetail = null;
    return;
  }
  if (target.dataset.view) {
    event.preventDefault();
    route(target.dataset.view, target.dataset.routeStatus || 'all');
    if (target.dataset.routeCarrier) {
      ui.carrier = target.dataset.routeCarrier;
      render();
    }
    return;
  }
  if (target.dataset.open) {
    openDetail(target.dataset.open, target.dataset.id);
    return;
  }
  if (target.dataset.status) {
    ui.status = target.dataset.status;
    ui.selection.clear();
    render();
    return;
  }
  if (target.dataset.layout) {
    ui.layout = target.dataset.layout;
    render();
    return;
  }
  if (target.dataset.printShipment) {
    printShipment(target.dataset.printShipment);
    return;
  }
  const action = target.dataset.action;
  if (action === 'logout') {
    sessionStorage.removeItem('refurb-admin-session');
    document.getElementById('admin-dialog').close();
    selectedDetail = null;
    loginView();
  }
  if (action === 'toggle-menu') {
    const open = document.querySelector('.admin-sidebar').classList.toggle('is-open');
    target.setAttribute('aria-expanded', String(open));
  }
  if (action === 'clear') {
    ui.query = '';
    ui.status = 'all';
    ui.payment = 'all';
    ui.carrier = 'all';
    ui.low = false;
    ui.selection.clear();
    render();
  }
  if (action === 'export') exportCsv();
  if (action === 'export-json')
    download('refurb-operations-demo.json', JSON.stringify(db, null, 2), 'application/json');
  if (action === 'confirm-reset') {
    selectedDetail = null;
    showDialog(
      'Obnovit výchozí demo?',
      `<p>Smažou se lokální poptávky, změny objednávek a skladové pohyby. Obnoví se výchozí ukázková data.</p><div class="admin-settings-actions">${button('Zrušit', 'close-reset', 'close')}${primary('Obnovit demo', 'reset', 'refresh')}</div>`,
      'small-dialog',
    );
  }
  if (action === 'close-reset') {
    document.getElementById('admin-dialog').close();
    selectedDetail = null;
  }
  if (action === 'reset') {
    try {
      opsStore.reset();
      db = opsStore.read();
      ui.selection.clear();
      document.getElementById('admin-dialog').close();
      render();
      notify('Výchozí demo je obnovené.');
    } catch (e) {
      notify(e.message);
    }
  }
  if (action === 'stock-movement') openDetail('stock', target.dataset.id);
  if (action === 'bulk-order-status')
    perform({
      type: 'order.update',
      ids: [...ui.selection],
      patch: { status: document.getElementById('order-bulk-status').value },
    });
  if (action === 'bulk-create-shipments')
    perform(
      { type: 'shipment.create', sources: [...ui.selection].map((id) => ({ type: 'order', id })) },
      'Zásilky najdete v expedici.',
    );
  if (action === 'create-shipment') {
    const source = { type: target.dataset.source, id: target.dataset.id };
    if (
      perform({ type: 'shipment.create', sources: [source] }, 'Zásilka je připravená k zabalení.')
    ) {
      const s = db.shipments.find((s) => s.sourceType === source.type && s.sourceId === source.id);
      openDetail('shipment', s.id);
    }
  }
  const shipmentActions = {
    'bulk-pack': 'pack',
    'bulk-dispatch': 'dispatch',
    'bulk-deliver': 'deliver',
    'single-pack': 'pack',
    'single-dispatch': 'dispatch',
    'single-deliver': 'deliver',
  };
  if (shipmentActions[action])
    perform({
      type: 'shipment.' + shipmentActions[action],
      ids: action.startsWith('single') ? [target.dataset.id] : [...ui.selection],
    });
  if (action === 'print-now') window.print();
});
document.addEventListener('input', (event) => {
  if (event.target.id === 'admin-search') {
    ui.query = event.target.value;
    ui.page = 1;
    ui.selection.clear();
    render();
  }
});
document.addEventListener('change', (event) => {
  const el = event.target;
  if (el.dataset.select) {
    el.checked ? ui.selection.add(el.dataset.select) : ui.selection.delete(el.dataset.select);
    render();
  }
  if (el.hasAttribute('data-select-all')) {
    ui.selection = el.checked ? new Set(visibleRows().map((r) => r.id)) : new Set();
    render();
  }
  if (el.id === 'order-payment-filter') {
    ui.payment = el.value;
    ui.selection.clear();
    render();
  }
  if (el.id === 'shipment-carrier-filter') {
    ui.carrier = el.value;
    ui.selection.clear();
    render();
  }
  if (el.id === 'inventory-low-filter') {
    ui.low = el.checked;
    render();
  }
});
document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!form.id.startsWith('admin-')) return;
  event.preventDefault();
  if (form.id === 'admin-login-form') {
    if (
      document.getElementById('admin-email').value.trim().toLowerCase() === 'admin@example.com' &&
      document.getElementById('admin-password').value === 'Admin2026!'
    ) {
      sessionStorage.setItem('refurb-admin-session', 'active');
      boot();
    } else {
      const error = document.getElementById('admin-login-error');
      error.textContent = 'Použijte ukázkové přihlašovací údaje uvedené níže.';
      error.hidden = false;
    }
    return;
  }
  if (!isAdmin()) return loginView();
  const values = Object.fromEntries(new FormData(form));
  if (form.id === 'admin-repair-form') {
    const r = db.repairs.find((r) => r.id === form.dataset.id);
    perform({
      type: 'repair.update',
      id: r.id,
      patch: {
        status: values.status || r.status,
        technician: values.technician,
        priority: values.priority,
        dueAt: values.dueAt ? values.dueAt + 'T16:00:00Z' : null,
        unitPrice: values.unitPrice === '' ? null : Number(values.unitPrice),
        checks: new FormData(form).getAll('checks'),
      },
    });
  }
  if (form.id === 'admin-order-form')
    perform({ type: 'order.update', ids: [form.dataset.id], patch: values });
  if (form.id === 'admin-shipment-form')
    perform({
      type: 'shipment.update',
      id: form.dataset.id,
      ...values,
      weight: Number(values.weight),
    });
  if (form.id === 'admin-stock-form')
    perform(
      {
        type: 'inventory.adjust',
        productId: form.dataset.id,
        ...values,
        quantity: Number(values.quantity),
      },
      'Skladový pohyb je zapsaný.',
    );
  if (form.id === 'admin-note-form')
    perform(
      {
        type: 'note.add',
        collection: form.dataset.collection,
        id: form.dataset.id,
        text: values.text,
      },
      'Poznámka je uložená.',
    );
  if (form.id === 'admin-settings-form')
    perform({ type: 'settings.update', patch: values }, 'Nastavení je uložené.');
});
window.addEventListener('popstate', () => {
  const view = new URLSearchParams(location.search).get('view') || 'dashboard';
  ui.view = views[view] ? view : 'dashboard';
  ui.status = 'all';
  ui.query = '';
  ui.selection.clear();
  if (db && isAdmin()) render();
});
window.addEventListener('refurb:operationschange', () => {
  if (db && isAdmin()) {
    db = opsStore.read();
    render();
  }
});
document.getElementById('admin-dialog').addEventListener('close', () => {
  selectedDetail = null;
});
boot();
