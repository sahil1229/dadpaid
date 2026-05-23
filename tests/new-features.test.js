// Unit tests for the four new features: demo snapshot, prior settlements,
// search filter, sync status indicator.
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../lib/helpers.js');

/* ════════════════════════════════════════════════════════════════════
   FEATURE 1 — sample / demo snapshot
   ════════════════════════════════════════════════════════════════════ */
test('buildDemoSnapshot: returns a coherent fake trip', () => {
  const snap = H.buildDemoSnapshot('2025-12-18T12:00:00Z');
  assert.ok(snap.family && snap.family.id);
  assert.equal(snap.members.length, 3);
  assert.equal(snap.cards.length, 3);
  assert.ok(snap.trip.id);
  assert.equal(snap.trip.status, 'active');
  assert.equal(snap.trip.primary_currency, 'EUR');
});

test('buildDemoSnapshot: expenses reference real members and a real card', () => {
  const snap = H.buildDemoSnapshot();
  const memberIds = new Set(snap.members.map((m) => m.id));
  const cardIds   = new Set(snap.cards.map((c) => c.id));
  for (const e of snap.expenses) {
    assert.ok(memberIds.has(e.payer_id), `payer ${e.payer_id} not in members`);
    assert.ok(cardIds.has(e.card_id),     `card ${e.card_id} not in cards`);
    assert.ok(e.amount > 0, 'amount positive');
    assert.equal(e.currency, 'EUR');
  }
});

test('buildDemoSnapshot: dates straddle today', () => {
  const snap = H.buildDemoSnapshot('2025-12-18T12:00:00Z');
  assert.ok(snap.trip.start_date < '2025-12-18');
  assert.ok(snap.trip.end_date > '2025-12-18');
});

test('buildDemoSnapshot: at least one pre-trip expense for the "before trip" UI', () => {
  const snap = H.buildDemoSnapshot();
  const pre = snap.expenses.filter((e) => e.pre_trip);
  assert.ok(pre.length >= 1);
});

/* ════════════════════════════════════════════════════════════════════
   FEATURE 3 — prior settlements offset gross debts
   ════════════════════════════════════════════════════════════════════ */
const THREE = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];

test('settleTrip: prior settlement reduces outstanding debt', () => {
  // A pays 3000, B and C each owe 1000.
  const ex = [{ payer: 'A', amount: 3000, currency: 'GBP', split: 'everyone' }];
  const settled = [{ from: 'B', to: 'A', amount: 1000, currency: 'GBP' }];
  const t = H.settleTrip(ex, THREE, { priorSettlements: settled });
  // Only C still owes A 1000.
  assert.equal(t.length, 1);
  assert.equal(t[0].from, 'C');
  assert.equal(t[0].to,   'A');
  assert.equal(t[0].amount, 1000);
});

test('settleTrip: fully-settled trip yields no transfers', () => {
  const ex = [{ payer: 'A', amount: 3000, currency: 'GBP', split: 'everyone' }];
  const settled = [
    { from: 'B', to: 'A', amount: 1000, currency: 'GBP' },
    { from: 'C', to: 'A', amount: 1000, currency: 'GBP' },
  ];
  assert.deepEqual(H.settleTrip(ex, THREE, { priorSettlements: settled }), []);
});

test('settleTrip: settlement currencies are isolated', () => {
  const ex = [
    { payer: 'A', amount: 3000, currency: 'GBP', split: 'everyone' },
    { payer: 'A', amount: 3000, currency: 'INR', split: 'everyone' },
  ];
  // Settle the GBP debts only.
  const settled = [
    { from: 'B', to: 'A', amount: 1000, currency: 'GBP' },
    { from: 'C', to: 'A', amount: 1000, currency: 'GBP' },
  ];
  const t = H.settleTrip(ex, THREE, { priorSettlements: settled });
  // GBP should be cleared; INR remains: B and C each owe A 1000.
  assert.equal(t.length, 2);
  assert.ok(t.every((tr) => tr.currency === 'INR'));
});

test('settleTrip: settlement for non-member is ignored', () => {
  const ex = [{ payer: 'A', amount: 3000, currency: 'GBP', split: 'everyone' }];
  const settled = [{ from: 'ZZ', to: 'A', amount: 1000, currency: 'GBP' }];
  const t = H.settleTrip(ex, THREE, { priorSettlements: settled });
  // Settlement ignored; B and C each still owe 1000.
  assert.equal(t.length, 2);
});

/* ════════════════════════════════════════════════════════════════════
   FEATURE 4 — filterExpenses (search)
   ════════════════════════════════════════════════════════════════════ */
const SAMPLE = [
  { id: 'e1', payer: 'mA', amount: 14700, currency: 'GBP', title: 'Dishoom Shoreditch', category: 'Food' },
  { id: 'e2', payer: 'mB', amount:  2800, currency: 'GBP', title: 'Tube single',        category: 'Travel' },
  { id: 'e3', payer: 'mA', amount: 84000, currency: 'GBP', title: 'The Hoxton hotel',   category: 'Hotel' },
  { id: 'e4', payer: 'mC', amount:  4200, currency: 'EUR', title: null,                 category: 'Food' },
];
const NAMES = { mA: 'Ami', mB: 'Sahil', mC: 'Ketan' };

test('filterExpenses: empty query returns input', () => {
  assert.equal(H.filterExpenses(SAMPLE, '', NAMES).length, 4);
  assert.equal(H.filterExpenses(SAMPLE, '   ', NAMES).length, 4);
});

test('filterExpenses: matches title substring', () => {
  const r = H.filterExpenses(SAMPLE, 'dishoom', NAMES);
  assert.equal(r.length, 1);
  assert.equal(r[0].id, 'e1');
});

test('filterExpenses: matches category', () => {
  const r = H.filterExpenses(SAMPLE, 'travel', NAMES);
  assert.equal(r.length, 1);
  assert.equal(r[0].id, 'e2');
});

test('filterExpenses: matches payer name', () => {
  const r = H.filterExpenses(SAMPLE, 'ami', NAMES);
  assert.equal(r.length, 2);  // e1 and e3 are both Ami's
  assert.deepEqual(r.map((x) => x.id).sort(), ['e1', 'e3']);
});

test('filterExpenses: matches amount in minor units', () => {
  const r = H.filterExpenses(SAMPLE, '14700', NAMES);
  assert.equal(r.length, 1);
  assert.equal(r[0].id, 'e1');
});

test('filterExpenses: matches amount in major units', () => {
  // 4200 minor = £42.00. Search "42" should hit it.
  const r = H.filterExpenses(SAMPLE, '42', NAMES);
  assert.ok(r.some((x) => x.id === 'e4'));
});

test('filterExpenses: case-insensitive', () => {
  assert.equal(H.filterExpenses(SAMPLE, 'HOTEL', NAMES).length, 1);
  assert.equal(H.filterExpenses(SAMPLE, 'Hotel', NAMES).length, 1);
});

test('filterExpenses: empty/null input is safe', () => {
  assert.deepEqual(H.filterExpenses(null, 'x'), []);
  assert.deepEqual(H.filterExpenses(undefined, 'x'), []);
  assert.deepEqual(H.filterExpenses([], 'x'), []);
});

test('filterExpenses: missing payer name does not crash', () => {
  const r = H.filterExpenses([{ payer: 'unknown', amount: 0, title: 'x' }], 'x', {});
  assert.equal(r.length, 1);
});

/* ════════════════════════════════════════════════════════════════════
   FEATURE 5 — sync status
   ════════════════════════════════════════════════════════════════════ */
test('syncStatus: offline overrides everything', () => {
  assert.equal(H.syncStatus(10000, 5000, false), 'offline');
  assert.equal(H.syncStatus(10000, null, false), 'offline');
});

test('syncStatus: live when last sync was within the window', () => {
  // now = 100s, last = 80s (20s ago), default window 30s
  assert.equal(H.syncStatus(100000, 80000, true), 'live');
});

test('syncStatus: stale when last sync exceeds the window', () => {
  // now = 100s, last = 30s (70s ago), default window 30s
  assert.equal(H.syncStatus(100000, 30000, true), 'stale');
});

test('syncStatus: unknown when online but never synced', () => {
  assert.equal(H.syncStatus(100000, null, true), 'unknown');
  assert.equal(H.syncStatus(100000, undefined, true), 'unknown');
});

test('syncStatus: custom window honored', () => {
  // 60s ago with default 30s = stale; with 90s = live
  assert.equal(H.syncStatus(100000, 40000, true), 'stale');
  assert.equal(H.syncStatus(100000, 40000, true, 90000), 'live');
});

test('syncStatus: boundary exactly at the window edge is still live', () => {
  // 100s now - 70s last = 30s exactly → live
  assert.equal(H.syncStatus(100000, 70000, true), 'live');
});
