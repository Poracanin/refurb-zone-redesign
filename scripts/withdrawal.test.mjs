import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const form = require('../src/js/withdrawal-document.js');
const sample = {
  name: 'Žaneta Černá',
  street: 'Příčná 12',
  city: 'Říčany',
  zip: '251 01',
  device: 'iPhone 15 Pro',
  withdrawalDate: '2026-09-15',
};

test('withdrawal requires sender, address, device and notice date but not login or optional contact', () => {
  assert.deepEqual(form.validate(sample).errors, {});
  assert.deepEqual(
    Object.keys(form.validate({}).errors).sort(),
    ['name', 'street', 'city', 'zip', 'device', 'withdrawalDate'].sort(),
  );
});
test('withdrawal validates actual calendar dates, including leap years', () => {
  for (const date of ['2026-02-29', '2026-02-31', '2026-13-01', '2026-09-00', '15.9.2026'])
    assert.ok(form.validate({ ...sample, orderDate: date }).errors.orderDate, date);
  assert.deepEqual(form.validate({ ...sample, orderDate: '2024-02-29' }).errors, {});
  assert.equal(form.date('2026-09-15'), '15. 9. 2026');
});
test('withdrawal accepts optional decimal amounts and rejects invalid prices and emails', () => {
  for (const price of ['0', '2300.50', '2300,50'])
    assert.deepEqual(form.validate({ ...sample, price }).errors, {});
  for (const price of ['-10', 'abc', 'Infinity'])
    assert.ok(form.validate({ ...sample, price }).errors.price);
  assert.ok(form.validate({ ...sample, email: 'invalid@' }).errors.email);
  assert.deepEqual(form.validate({ ...sample, email: 'test@example.com' }).errors, {});
  assert.equal(form.amount('2300.5').replace(/\s/g, ' '), '2 300,50 Kč');
});
test('withdrawal preserves Czech text and bounds pasted data before PDF generation', () => {
  const f = form.clean({
    ...sample,
    name: '  Z\u030caneta Černá\u0000 ',
    service: 'ěščřž'.repeat(300),
    price: '0',
  });
  assert.equal(f.name, 'Žaneta Černá');
  assert.equal(f.service.length, 800);
  assert.equal(f.price, '0');
});
