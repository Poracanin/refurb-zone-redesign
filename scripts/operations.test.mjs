import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import core from '../src/js/operations-core.js';
const seed = JSON.parse(await readFile(new URL('../data/operations-demo.json', import.meta.url)));
const copy = () => structuredClone(seed);
const act = (s, a) => core.reduce(s, { ...a, at: '2026-09-15T10:00:00Z' });
test('demo records have unique identities and valid product, customer and shipment links', async () => {
  const products = JSON.parse(await readFile(new URL('../data/products.json', import.meta.url)));
  const productIds = new Set(products.map((p) => p.id)),
    customerIds = new Set(seed.customers.map((c) => c.id));
  for (const collection of ['customers', 'orders', 'repairs', 'shipments', 'movements'])
    assert.equal(
      new Set(seed[collection].map((r) => r.id)).size,
      seed[collection].length,
      collection,
    );
  assert.equal(new Set(seed.inventory.map((r) => r.productId)).size, seed.inventory.length);
  for (const o of seed.orders) {
    assert(customerIds.has(o.customerId));
    for (const l of o.lines) {
      assert(productIds.has(l.productId));
      assert(Number.isInteger(l.quantity) && l.quantity > 0);
    }
  }
  for (const r of seed.repairs) {
    assert(customerIds.has(r.customerId));
    assert(core.repairStatuses[r.status]);
    assert(r.unitPrice === null || r.unitPrice >= 0);
  }
  for (const s of seed.shipments) {
    assert(
      (s.sourceType === 'order' ? seed.orders : seed.repairs).some((r) => r.id === s.sourceId),
    );
    assert(customerIds.has(s.customerId));
    assert(core.shipmentStatuses[s.status]);
  }
  for (const i of seed.inventory) assert(productIds.has(i.productId));
});
test('dispatch aggregates repeated product lines without double-checking already deducted stock', () => {
  let s = copy();
  const shipment = s.shipments.find((x) => x.sourceType === 'order' && x.status === 'labeled');
  const order = s.orders.find((o) => o.id === shipment.sourceId),
    line = order.lines[0];
  order.lines.push({ ...line });
  const stock = s.inventory.find((i) => i.productId === line.productId);
  stock.onHand = core.reserved(s, line.productId);
  const before = stock.onHand;
  s = act(s, { type: 'shipment.dispatch', ids: [shipment.id] });
  assert.equal(
    s.inventory.find((i) => i.productId === line.productId).onHand,
    before - 2 * line.quantity,
  );
});
test('changing the parcel carrier updates its source and records history', () => {
  const s = copy(),
    parcel = s.shipments.find((x) => x.status === 'ready');
  const next = act(s, {
    type: 'shipment.update',
    id: parcel.id,
    carrier: 'Wolt Drive',
    weight: 1,
    note: 'Expres',
  });
  const source = (parcel.sourceType === 'order' ? next.orders : next.repairs).find(
    (r) => r.id === parcel.sourceId,
  );
  assert.equal(source.carrier, 'Wolt Drive');
  assert.match(source.history[0].text, /Wolt Drive/);
});
const request = {
  service: 'repase',
  family: 'iphone',
  model: 'iPhone 15 Pro',
  quantity: 2,
  unitPrice: 2600,
  basePrice: 2600,
  surcharge: 0,
  carrier: 'PPL',
  description: 'Prasklé sklo a funkční dotyk.',
  contact: {
    name: 'Demo Klient',
    company: 'Test servis',
    email: 'new@example.com',
    phone: '+420 000 000 000',
    street: 'Ukázková 1',
    city: 'Praha',
    zip: '100 00',
  },
};
test('sample inventory covers every open reservation', () => {
  for (const i of seed.inventory) assert(i.onHand >= core.reserved(seed, i.productId));
});
test('request creates a linked customer and a new service record without mutating input', () => {
  const s = copy(),
    next = act(s, { type: 'request.create', payload: request });
  assert.equal(s.repairs.length, seed.repairs.length);
  assert.equal(next.repairs.length, s.repairs.length + 1);
  const r = next.repairs[0];
  assert.equal(r.ownerId, 'demo-client');
  assert.equal(r.status, 'new');
  assert(next.customers.some((c) => c.id === r.customerId));
  assert.equal(core.repairTotal(r), 5200);
});
test('request rejects fractional quantity and missing delivery address', () => {
  assert.throws(
    () => act(copy(), { type: 'request.create', payload: { ...request, quantity: 1.5 } }),
    /celé číslo/,
  );
  assert.throws(
    () =>
      act(copy(), {
        type: 'request.create',
        payload: { ...request, contact: { ...request.contact, street: '' } },
      }),
    /adresu/,
  );
});
test('null buyback price stays unquoted', () => {
  const next = act(copy(), {
    type: 'request.create',
    payload: { ...request, service: 'vykup', unitPrice: null },
  });
  assert.equal(core.repairTotal(next.repairs[0]), null);
});
test('cancelling an order releases reservations and removes an unshipped parcel', () => {
  const s = copy(),
    o = s.orders.find((o) => o.status === 'ready'),
    product = o.lines[0].productId,
    quantity = o.lines[0].quantity,
    before = core.reserved(s, product);
  const next = act(s, { type: 'order.update', ids: [o.id], patch: { status: 'cancelled' } });
  assert.equal(core.reserved(next, product), before - quantity);
  assert(!next.shipments.some((x) => x.sourceId === o.id));
});
test('shipment creation is idempotent', () => {
  const s = copy(),
    o = s.orders.find((o) => o.status === 'processing');
  let next = act(s, { type: 'order.update', ids: [o.id], patch: { status: 'ready' } });
  next = act(next, { type: 'shipment.create', sources: [{ type: 'order', id: o.id }] });
  const count = next.shipments.length;
  next = act(next, { type: 'shipment.create', sources: [{ type: 'order', id: o.id }] });
  assert.equal(next.shipments.length, count);
});
test('dispatch requires packing and does not mutate stock on failure', () => {
  const s = copy(),
    shipment = s.shipments.find((x) => x.status === 'ready');
  assert.throws(() => act(s, { type: 'shipment.dispatch', ids: [shipment.id] }), /zabalenou/);
  assert.deepEqual(s.inventory, seed.inventory);
});
test('dispatch consumes stock exactly once and delivery closes the order', () => {
  let s = copy();
  const shipment = s.shipments.find((x) => x.sourceType === 'order' && x.status === 'labeled'),
    order = s.orders.find((o) => o.id === shipment.sourceId),
    line = order.lines[0],
    before = s.inventory.find((i) => i.productId === line.productId).onHand;
  s = act(s, { type: 'shipment.dispatch', ids: [shipment.id] });
  assert.equal(
    s.inventory.find((i) => i.productId === line.productId).onHand,
    before - line.quantity,
  );
  const once = structuredClone(s.inventory);
  s = act(s, { type: 'shipment.dispatch', ids: [shipment.id] });
  assert.deepEqual(s.inventory, once);
  s = act(s, { type: 'shipment.deliver', ids: [shipment.id] });
  assert.equal(s.orders.find((o) => o.id === order.id).status, 'done');
});
test('stock receipt records a movement; issuing reserved stock is rejected', () => {
  const s = copy(),
    i = s.inventory.find((i) => core.reserved(s, i.productId) > 0);
  const next = act(s, {
    type: 'inventory.adjust',
    kind: 'receive',
    productId: i.productId,
    quantity: 5,
    reason: 'Test příjemky',
  });
  assert.equal(next.inventory.find((x) => x.productId === i.productId).onHand, i.onHand + 5);
  assert.equal(next.movements[0].quantity, 5);
  assert.throws(
    () =>
      act(s, {
        type: 'inventory.adjust',
        kind: 'issue',
        productId: i.productId,
        quantity: i.onHand,
        reason: 'Test',
      }),
    /rezervací/,
  );
});
test('bulk failure is atomic', () => {
  const s = copy(),
    ready = s.orders.find((o) => o.status === 'ready'),
    processing = s.orders.find((o) => o.status === 'processing');
  assert.throws(
    () =>
      act(s, {
        type: 'shipment.create',
        sources: [
          { type: 'order', id: ready.id },
          { type: 'order', id: processing.id },
        ],
      }),
    /nejprve/,
  );
  assert.deepEqual(s, seed);
});
test('repair quote, checks and notes persist as separate operations', () => {
  let s = copy(),
    r = s.repairs.find((r) => r.status === 'repair');
  s = act(s, {
    type: 'repair.update',
    id: r.id,
    patch: { status: 'quality', unitPrice: 1900, checks: ['image', 'touch'] },
  });
  s = act(s, { type: 'note.add', collection: 'repairs', id: r.id, text: 'Panel je v pořádku.' });
  r = s.repairs.find((x) => x.id === r.id);
  assert.equal(r.status, 'quality');
  assert.equal(r.unitPrice, 1900);
  assert.deepEqual(r.checks, ['image', 'touch']);
  assert.equal(r.notes[0].text, 'Panel je v pořádku.');
});
