'use strict';
(function (root) {
  const repairStatuses = {
    new: 'Nová poptávka',
    received: 'Přijato',
    diagnostics: 'Diagnostika',
    approval: 'Čeká na souhlas',
    repair: 'V opravě',
    quality: 'Výstupní kontrola',
    ready: 'K odeslání',
    shipped: 'Odesláno',
    done: 'Dokončeno',
    cancelled: 'Zrušeno',
  };
  const orderStatuses = {
    new: 'Nová',
    processing: 'Vyřizuje se',
    ready: 'K expedici',
    shipped: 'Odesláno',
    done: 'Vyřízeno',
    cancelled: 'Stornováno',
  };
  const shipmentStatuses = {
    ready: 'K zabalení',
    labeled: 'Zabaleno',
    shipped: 'U přepravce',
    delivered: 'Doručeno',
  };
  const carriers = ['PPL', 'Balíkovna', 'Wolt Drive', 'Osobní odběr'];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const check = (condition, message) => {
    if (!condition) throw Error(message);
  };
  const integer = (value, minimum = 1, maximum = 10000) =>
    Number.isInteger(value) && value >= minimum && value <= maximum;
  const record = (state, collection, id) => {
    const item = state[collection].find((x) => x.id === id);
    check(item, 'Záznam nebyl nalezen.');
    return item;
  };
  function reserved(state, productId) {
    return state.orders
      .filter((o) => ['new', 'processing', 'ready'].includes(o.status))
      .reduce(
        (sum, o) =>
          sum +
          o.lines.filter((l) => l.productId === productId).reduce((n, l) => n + l.quantity, 0),
        0,
      );
  }
  function orderTotal(order) {
    return (
      Math.round(
        (order.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0) +
          (order.shippingPrice || 0)) *
          100,
      ) / 100
    );
  }
  function repairTotal(repair) {
    return repair.unitPrice === null ? null : repair.quantity * repair.unitPrice;
  }
  function reduce(input, action) {
    const state = clone(input),
      at = action.at || new Date().toISOString(),
      actor = action.actor || 'Administrátor';
    const history = (item, text) => {
      item.history ||= [];
      item.history.unshift({ at, text, actor });
    };
    const nextId = (prefix) => `${prefix}-${++state.counter}`;
    if (action.type === 'request.create') {
      const p = action.payload;
      check(['repase', 'vykup', 'zadni-skla'].includes(p.service), 'Vyberte platnou službu.');
      check(integer(p.quantity, 1, 100), 'Počet kusů musí být celé číslo od 1 do 100.');
      check(p.model?.trim().length >= 2, 'Doplňte konkrétní model.');
      check(
        p.contact?.name?.trim() &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contact.email) &&
          String(p.contact.phone || '').replace(/\D/g, '').length >= 9,
        'Doplňte jméno, platný e-mail a telefon.',
      );
      check(carriers.includes(p.carrier), 'Vyberte způsob vrácení zařízení.');
      check(
        p.carrier === 'Osobní odběr' ||
          (p.contact.street?.trim() &&
            p.contact.city?.trim() &&
            /^\d{5}$/.test(String(p.contact.zip || '').replace(/\s/g, ''))),
        'Doplňte adresu a pětimístné PSČ pro doručení.',
      );
      check(
        p.service === 'vykup' || p.description?.trim().length >= 8,
        'Popište závadu alespoň osmi znaky.',
      );
      check(
        p.unitPrice === null || (Number.isFinite(p.unitPrice) && p.unitPrice >= 0),
        'Neplatná orientační cena.',
      );
      let customer = state.customers.find((c) => c.email === p.contact.email);
      if (!customer) {
        customer = { ...clone(p.contact), id: nextId('KLI'), group: 'B2B partner' };
        state.customers.unshift(customer);
      }
      state.repairs.unshift({
        ...clone(p),
        id: nextId('POP'),
        customerId: customer.id,
        ownerId: 'demo-client',
        createdAt: at,
        dueAt: null,
        status: 'new',
        technician: 'Nepřiřazeno',
        priority: 'normal',
        checks: [],
        notes: [],
        history: [{ at, text: 'Poptávka přijata z webu (demo).', actor: 'Klient' }],
      });
    } else if (action.type === 'repair.update') {
      const item = record(state, 'repairs', action.id),
        p = action.patch;
      if (p.status && p.status !== item.status) {
        check(
          repairStatuses[p.status] && !['shipped', 'done'].includes(p.status),
          'Tento stav nastavte přes expedici.',
        );
        check(
          !['shipped', 'done', 'cancelled'].includes(item.status),
          'Uzavřenou nebo odeslanou zakázku nelze vrátit do opravy.',
        );
        history(item, `Stav: ${repairStatuses[item.status]} → ${repairStatuses[p.status]}.`);
        item.status = p.status;
        if (p.status === 'cancelled')
          state.shipments = state.shipments.filter(
            (s) =>
              !(
                s.sourceType === 'repair' &&
                s.sourceId === item.id &&
                ['ready', 'labeled'].includes(s.status)
              ),
          );
      }
      for (const key of ['technician', 'priority', 'dueAt']) if (key in p) item[key] = p[key];
      if ('unitPrice' in p) {
        check(
          p.unitPrice === null || (Number.isFinite(p.unitPrice) && p.unitPrice >= 0),
          'Cena musí být nezáporná.',
        );
        if (item.unitPrice !== p.unitPrice) history(item, 'Aktualizována nabídnutá cena za kus.');
        item.unitPrice = p.unitPrice;
      }
      if (p.checks)
        item.checks = p.checks.filter((k) =>
          ['image', 'touch', 'frame', 'clean', 'pack'].includes(k),
        );
      history(item, 'Uloženy údaje servisní zakázky.');
    } else if (action.type === 'order.update') {
      check(action.ids?.length, 'Vyberte objednávky.');
      for (const id of action.ids) {
        const item = record(state, 'orders', id),
          p = action.patch;
        if (p.status && p.status !== item.status) {
          check(
            orderStatuses[p.status] && !['shipped', 'done'].includes(p.status),
            'Odeslání a dokončení nastavte přes zásilku.',
          );
          check(
            !['shipped', 'done', 'cancelled'].includes(item.status),
            'Uzavřenou objednávku nelze vrátit do zpracování.',
          );
          item.status = p.status;
          history(item, `Stav objednávky: ${orderStatuses[p.status]}.`);
          if (p.status === 'cancelled')
            state.shipments = state.shipments.filter(
              (s) =>
                !(
                  s.sourceType === 'order' &&
                  s.sourceId === id &&
                  ['ready', 'labeled'].includes(s.status)
                ),
            );
        }
        if (p.payment) {
          check(['paid', 'pending', 'refunded'].includes(p.payment), 'Neplatný stav platby.');
          item.payment = p.payment;
          history(
            item,
            `Platba: ${p.payment === 'paid' ? 'zaplaceno' : p.payment === 'pending' ? 'čeká na úhradu' : 'vráceno'} (demo).`,
          );
        }
      }
    } else if (action.type === 'note.add') {
      check(['repairs', 'orders'].includes(action.collection), 'Neplatný typ záznamu.');
      check(action.text?.trim(), 'Napište poznámku.');
      const item = record(state, action.collection, action.id);
      item.notes.unshift({ at, text: action.text.trim().slice(0, 3000), actor });
      history(item, 'Přidána interní poznámka.');
    } else if (action.type === 'shipment.create') {
      check(action.sources?.length, 'Vyberte zakázku nebo objednávku.');
      for (const source of action.sources) {
        check(['order', 'repair'].includes(source.type), 'Neplatný typ zásilky.');
        const item = record(state, source.type === 'order' ? 'orders' : 'repairs', source.id);
        check(
          item.status === 'ready',
          `${item.id}: nejprve změňte stav na ${source.type === 'order' ? 'K expedici' : 'K odeslání'}.`,
        );
        if (state.shipments.some((s) => s.sourceType === source.type && s.sourceId === source.id))
          continue;
        const id = nextId('BAL');
        state.shipments.unshift({
          id,
          sourceType: source.type,
          sourceId: item.id,
          customerId: item.customerId,
          carrier: item.carrier || state.settings.defaultCarrier,
          status: 'ready',
          weight: 0.5,
          createdAt: at,
          tracking: 'DEMO-' + state.counter,
          note: '',
        });
        history(item, `Založena zásilka ${id}.`);
      }
    } else if (action.type === 'shipment.update') {
      const item = record(state, 'shipments', action.id);
      check(['ready', 'labeled'].includes(item.status), 'Odeslanou zásilku již nelze upravit.');
      check(
        carriers.includes(action.carrier) &&
          Number.isFinite(action.weight) &&
          action.weight > 0 &&
          action.weight <= 50,
        'Vyberte přepravce a hmotnost od 0 do 50 kg.',
      );
      item.carrier = action.carrier;
      const source = record(
        state,
        item.sourceType === 'order' ? 'orders' : 'repairs',
        item.sourceId,
      );
      source.carrier = action.carrier;
      history(source, `Aktualizována zásilka ${item.id}: ${action.carrier}.`);
      item.weight = action.weight;
      item.note = (action.note || '').slice(0, 1000);
    } else if (['shipment.pack', 'shipment.dispatch', 'shipment.deliver'].includes(action.type)) {
      check(action.ids?.length, 'Vyberte zásilky.');
      for (const id of [...new Set(action.ids)]) {
        const shipment = record(state, 'shipments', id),
          source = record(
            state,
            shipment.sourceType === 'order' ? 'orders' : 'repairs',
            shipment.sourceId,
          );
        if (action.type === 'shipment.pack') {
          if (shipment.status === 'labeled') continue;
          check(shipment.status === 'ready', 'Zabalit lze pouze připravenou zásilku.');
          shipment.status = 'labeled';
          history(source, 'Zásilka zabalena.');
        } else if (action.type === 'shipment.dispatch') {
          if (['shipped', 'delivered'].includes(shipment.status)) continue;
          check(shipment.status === 'labeled', 'Před odesláním označte zásilku jako zabalenou.');
          check(source.status === 'ready', 'Zakázka nebo objednávka není připravena k odeslání.');
          if (shipment.sourceType === 'order') {
            check(
              source.payment === 'paid' || source.paymentMethod === 'Dobírka',
              'Objednávka čeká na úhradu.',
            );
            const quantities = new Map();
            for (const line of source.lines)
              quantities.set(line.productId, (quantities.get(line.productId) || 0) + line.quantity);
            for (const [productId, quantity] of quantities) {
              const line = { productId, quantity };
              const stock = state.inventory.find((i) => i.productId === line.productId);
              check(stock, 'Produkt nemá skladovou kartu.');
              check(
                stock.onHand >= reserved(state, line.productId),
                'Nedostatek kusů na skladě pro rezervované objednávky.',
              );
              stock.onHand -= line.quantity;
              state.movements.unshift({
                id: nextId('POH'),
                at,
                productId: line.productId,
                quantity: -line.quantity,
                reason: `Expedice ${source.id}`,
                actor,
              });
            }
          }
          shipment.status = 'shipped';
          source.status = 'shipped';
          shipment.shippedAt = at;
          history(source, `Zásilka ${shipment.id} předána přepravci (demo).`);
        } else {
          if (shipment.status === 'delivered') continue;
          check(shipment.status === 'shipped', 'Doručit lze odeslanou zásilku.');
          shipment.status = 'delivered';
          source.status = 'done';
          history(source, 'Zásilka doručena, případ dokončen (demo).');
        }
      }
    } else if (action.type === 'inventory.adjust') {
      const item = state.inventory.find((i) => i.productId === action.productId);
      check(item, 'Skladová karta nebyla nalezena.');
      check(integer(action.quantity), 'Zadejte kladný celý počet kusů.');
      check(['receive', 'issue'].includes(action.kind), 'Neplatný skladový pohyb.');
      check(action.reason?.trim(), 'Doplňte důvod pohybu.');
      const delta = action.kind === 'receive' ? action.quantity : -action.quantity;
      check(
        item.onHand + delta >= reserved(state, item.productId),
        'Výdej by zasáhl do rezervací otevřených objednávek.',
      );
      item.onHand += delta;
      state.movements.unshift({
        id: nextId('POH'),
        productId: item.productId,
        quantity: delta,
        at,
        reason: action.reason.trim(),
        actor,
      });
    } else if (action.type === 'settings.update') {
      check(
        action.patch.company?.trim() && carriers.includes(action.patch.defaultCarrier),
        'Vyplňte název a výchozího přepravce.',
      );
      state.settings = { ...state.settings, ...action.patch };
    } else throw Error('Neznámá operace.');
    return state;
  }
  const api = {
    reduce,
    reserved,
    orderTotal,
    repairTotal,
    repairStatuses,
    orderStatuses,
    shipmentStatuses,
    carriers,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.operationsCore = api;
})(globalThis);
