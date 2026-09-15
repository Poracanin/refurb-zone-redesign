import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import shipping from '../src/js/shipping-countdown.js';

const settings = JSON.parse(await readFile(new URL('../data/delivery.json', import.meta.url)));
const cases = [
  ['one second before cutoff', '2026-09-15T15:44:59Z', '2026-09-15T15:45:00Z', true, '00:00:01'],
  ['at cutoff', '2026-09-15T15:45:00Z', '2026-09-16T15:45:00Z', false, '1 d 00:00:00'],
  ['Friday evening', '2026-09-18T16:00:00Z', '2026-09-21T15:45:00Z', false, '2 d 23:45:00'],
  ['Saturday', '2026-09-19T08:00:00Z', '2026-09-21T15:45:00Z', false, '2 d 07:45:00'],
  ['Sunday', '2026-09-20T08:00:00Z', '2026-09-21T15:45:00Z', false, '1 d 07:45:00'],
  ['Czech midnight', '2026-09-20T22:00:00Z', '2026-09-21T15:45:00Z', true, '17:45:00'],
  ['winter offset', '2026-01-12T15:45:00Z', '2026-01-12T16:45:00Z', true, '01:00:00'],
  ['spring DST weekend', '2026-03-27T17:00:00Z', '2026-03-30T15:45:00Z', false, '2 d 22:45:00'],
  ['autumn DST weekend', '2026-10-23T16:00:00Z', '2026-10-26T16:45:00Z', false, '3 d 00:45:00'],
];
for (const [name, now, deadline, isToday, text] of cases) {
  test(name, () => {
    const state = shipping.stateAt(Date.parse(now), settings);
    assert.equal(new Date(state.deadline).toISOString(), new Date(deadline).toISOString());
    assert.equal(state.isToday, isToday);
    assert.equal(state.text, text);
    assert(state.seconds > 0);
  });
}
test('uses cutoff from JSON configuration', () => {
  const state = shipping.stateAt(Date.parse('2026-09-15T15:00:00Z'), {
    ...settings,
    cutoff: '18:00',
  });
  assert.equal(state.text, '01:00:00');
});
