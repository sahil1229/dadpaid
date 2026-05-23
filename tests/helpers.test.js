// Unit tests for lib/helpers.js — pure functions only.
// Run: `npm test`  (or `node --test tests/`)
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../lib/helpers.js');

/* ════════════════════════════════════════════════════════════════════
   symbols
   ════════════════════════════════════════════════════════════════════ */
test('symbol: all four supported currencies', () => {
  assert.equal(H.symbol('GBP'), '£');
  assert.equal(H.symbol('INR'), '₹');
  assert.equal(H.symbol('EUR'), '€');
  assert.equal(H.symbol('USD'), '$');
});

test('symbol: unknown currency falls back to the code', () => {
  assert.equal(H.symbol('JPY'), 'JPY');
  assert.equal(H.symbol(''), '');
  assert.equal(H.symbol(null), '');
  assert.equal(H.symbol(undefined), '');
});

/* ════════════════════════════════════════════════════════════════════
   number formatting
   ════════════════════════════════════════════════════════════════════ */
test('fmtMajor: GBP western grouping', () => {
  assert.equal(H.fmtMajor(0, 'GBP'), '0');
  assert.equal(H.fmtMajor(100, 'GBP'), '1');
  assert.equal(H.fmtMajor(99, 'GBP'), '0');
  assert.equal(H.fmtMajor(123456, 'GBP'), '1,234');     // 1234.56 pounds
  assert.equal(H.fmtMajor(100000000, 'GBP'), '1,000,000');
});

test('fmtMajor: INR Indian grouping (lakhs)', () => {
  assert.equal(H.fmtMajor(100, 'INR'), '1');
  assert.equal(H.fmtMajor(100000, 'INR'), '1,000');             // 1000 rupees
  assert.equal(H.fmtMajor(10000000, 'INR'), '1,00,000');        // 1 lakh
  assert.equal(H.fmtMajor(1000000000, 'INR'), '1,00,00,000');   // 1 crore
  assert.equal(H.fmtMajor(12345600, 'INR'), '1,23,456');
});

test('fmtMajor: EUR and USD use western grouping', () => {
  assert.equal(H.fmtMajor(123456, 'EUR'), '1,234');
  assert.equal(H.fmtMajor(123456, 'USD'), '1,234');
});

test('fmtMajor: handles negatives (returns positive)', () => {
  assert.equal(H.fmtMajor(-500, 'GBP'), '5');
});

test('fmtMajor: handles non-numeric input', () => {
  assert.equal(H.fmtMajor(undefined, 'GBP'), '0');
  assert.equal(H.fmtMajor(null, 'GBP'), '0');
  assert.equal(H.fmtMajor('NaN', 'GBP'), '0');
});

test('fmtMinor: pads to two digits', () => {
  assert.equal(H.fmtMinor(0), '00');
  assert.equal(H.fmtMinor(5), '05');
  assert.equal(H.fmtMinor(50), '50');
  assert.equal(H.fmtMinor(100), '00');
  assert.equal(H.fmtMinor(155), '55');
});

test('fmtFull: symbol + major + minor', () => {
  assert.equal(H.fmtFull(12345, 'GBP'), '£123.45');
  assert.equal(H.fmtFull(0, 'GBP'), '£0.00');
  assert.equal(H.fmtFull(100, 'INR'), '₹1.00');
  assert.equal(H.fmtFull(12345600, 'INR'), '₹1,23,456.00');
});

test('fmtFull: compact omits trailing .00', () => {
  assert.equal(H.fmtFull(1200, 'GBP', { compact: true }), '£12');
  assert.equal(H.fmtFull(1234, 'GBP', { compact: true }), '£12.34');
});

/* ════════════════════════════════════════════════════════════════════
   dates
   ════════════════════════════════════════════════════════════════════ */
test('dayLabel: TODAY and YESTERDAY', () => {
  assert.equal(H.dayLabel('2025-12-18', '2025-12-18'), 'TODAY');
  assert.equal(H.dayLabel('2025-12-17', '2025-12-18'), 'YESTERDAY');
});

test('dayLabel: older days return weekday + date', () => {
  const result = H.dayLabel('2025-12-15', '2025-12-18');
  // weekday string varies by locale but should include "15" and not be UNKNOWN
  assert.match(result, /15$/);
  assert.notEqual(result, 'UNKNOWN');
});

test('dayLabel: invalid input returns UNKNOWN', () => {
  assert.equal(H.dayLabel(null, '2025-12-18'), 'UNKNOWN');
  assert.equal(H.dayLabel('garbage', '2025-12-18'), 'UNKNOWN');
  assert.equal(H.dayLabel('2025-12-18', null), 'UNKNOWN');
});

test('formatDateShort: yields lowercase short string', () => {
  const out = H.formatDateShort('2025-12-15');
  assert.match(out, /15/);
  assert.match(out, /dec/);
  assert.match(out, /25/);
});

test('formatDateShort: handles falsy and invalid', () => {
  assert.equal(H.formatDateShort(''), '');
  assert.equal(H.formatDateShort(null), '');
  assert.equal(H.formatDateShort('not-a-date'), 'not-a-date');
});

test('pickGreeting: covers every hour bucket', () => {
  assert.equal(H.pickGreeting(2),  'logging expenses after midnight. dedicated of you.');
  assert.equal(H.pickGreeting(9),  "morning. someone's buying breakfast.");
  assert.equal(H.pickGreeting(14), 'afternoon. small charges add up.');
  assert.equal(H.pickGreeting(19), 'evening. dinner round, probably.');
  assert.equal(H.pickGreeting(23), "late. someone's still adding up the tube card.");
});

/* ════════════════════════════════════════════════════════════════════
   identity helpers
   ════════════════════════════════════════════════════════════════════ */
test('initialFor: first letter, uppercased', () => {
  assert.equal(H.initialFor('Ami'), 'A');
  assert.equal(H.initialFor('sahil shah'), 'S');
  assert.equal(H.initialFor('  ketan'), 'K');
  assert.equal(H.initialFor(''), '?');
  assert.equal(H.initialFor(null), '?');
});

test('uid: produces unique IDs', () => {
  const a = H.uid('mem');
  const b = H.uid('mem');
  assert.notEqual(a, b);
  assert.match(a, /^mem_/);
});

test('uid: works without a prefix', () => {
  const a = H.uid();
  assert.equal(typeof a, 'string');
  assert.ok(a.length > 8);
});

/* ════════════════════════════════════════════════════════════════════
   totalFor
   ════════════════════════════════════════════════════════════════════ */
const SEED = [
  { id: 'a', date: '2025-12-15', preTrip: false, payer: 'm1', amount: 1000, currency: 'GBP', category: 'Food' },
  { id: 'b', date: '2025-12-15', preTrip: false, payer: 'm2', amount: 2000, currency: 'GBP', category: 'Travel' },
  { id: 'c', date: '2025-12-16', preTrip: false, payer: 'm1', amount: 500,  currency: 'INR', category: 'Food' },
  { id: 'd', date: '2025-10-12', preTrip: true,  payer: 'm1', amount: 8000, currency: 'GBP', category: 'Hotel' },
];

test('totalFor: no filters sums all', () => {
  assert.equal(H.totalFor(SEED), 1000 + 2000 + 500 + 8000);
});

test('totalFor: by currency', () => {
  assert.equal(H.totalFor(SEED, { currency: 'GBP' }), 1000 + 2000 + 8000);
  assert.equal(H.totalFor(SEED, { currency: 'INR' }), 500);
  assert.equal(H.totalFor(SEED, { currency: 'EUR' }), 0);
});

test('totalFor: by payer', () => {
  assert.equal(H.totalFor(SEED, { payer: 'm1' }), 1000 + 500 + 8000);
  assert.equal(H.totalFor(SEED, { payer: 'm2' }), 2000);
  assert.equal(H.totalFor(SEED, { payer: 'nope' }), 0);
});

test('totalFor: by category', () => {
  assert.equal(H.totalFor(SEED, { category: 'Food' }), 1000 + 500);
  assert.equal(H.totalFor(SEED, { category: 'Hotel' }), 8000);
});

test('totalFor: preTrip true/false', () => {
  assert.equal(H.totalFor(SEED, { preTrip: true }),  8000);
  assert.equal(H.totalFor(SEED, { preTrip: false }), 1000 + 2000 + 500);
});

test('totalFor: by date', () => {
  assert.equal(H.totalFor(SEED, { date: '2025-12-15' }), 3000);
});

test('totalFor: chained filters', () => {
  assert.equal(H.totalFor(SEED, { currency: 'GBP', payer: 'm1', preTrip: false }), 1000);
});

test('totalFor: gracefully handles undefined input', () => {
  assert.equal(H.totalFor(), 0);
  assert.equal(H.totalFor(null), 0);
});

test('distinctCurrencies: returns unique', () => {
  assert.deepEqual(H.distinctCurrencies(SEED).sort(), ['GBP', 'INR']);
  assert.deepEqual(H.distinctCurrencies([]), []);
});

/* ════════════════════════════════════════════════════════════════════
   DB ↔ client mappers
   ════════════════════════════════════════════════════════════════════ */
test('expenseFromDB: shape conversion', () => {
  const dbRow = {
    id: 'x1', date: '2025-12-15', pre_trip: true, payer_id: 'mem_abc', card_id: 'card_1',
    amount: 1234, currency: 'GBP', title: 'Hotel', category: 'Hotel', split: 'everyone',
    has_photo: true, photo_path: 'fam/x1.jpg', ts: 1000,
  };
  const e = H.expenseFromDB(dbRow);
  assert.equal(e.id, 'x1');
  assert.equal(e.preTrip, true);
  assert.equal(e.payer, 'mem_abc');
  assert.equal(e.card, 'card_1');
  assert.equal(e.hasPhoto, true);
  assert.equal(e.photoPath, 'fam/x1.jpg');
  assert.equal(e.synced, true);
});

test('expenseFromDB: null/undefined input returns null', () => {
  assert.equal(H.expenseFromDB(null), null);
  assert.equal(H.expenseFromDB(undefined), null);
});

test('expenseToDB: shape conversion', () => {
  const e = {
    id: 'x1', date: '2025-12-15', preTrip: true, payer: 'mem_abc', card: 'card_1',
    amount: 1234, currency: 'GBP', title: 'Hotel', category: 'Hotel', split: 'everyone',
    photo: 'data:image/jpeg;base64,...', hasPhoto: true, photoPath: 'fam/x1.jpg', ts: 1000,
  };
  const db = H.expenseToDB(e, 'TRIP_UUID');
  assert.equal(db.trip_id, 'TRIP_UUID');
  assert.equal(db.pre_trip, true);
  assert.equal(db.payer_id, 'mem_abc');
  assert.equal(db.card_id, 'card_1');
  assert.equal(db.has_photo, true);
  assert.equal(db.photo_path, 'fam/x1.jpg');
});

test('expenseToDB: defaults', () => {
  const e = { id: 'x', date: 'd', payer: 'p', amount: 100, currency: 'GBP' };
  const db = H.expenseToDB(e, 'T');
  assert.equal(db.split, 'everyone');
  assert.equal(db.has_photo, false);
  assert.equal(db.card_id, null);
});

test('expense round-trip preserves data', () => {
  const original = {
    id: 'x1', date: '2025-12-15', preTrip: false, payer: 'mem_a', card: 'card_x',
    amount: 4200, currency: 'GBP', title: 'Lunch', category: 'Food', split: 'just-me',
    hasPhoto: false, photoPath: null, ts: 12345,
  };
  const db = H.expenseToDB(original, 'T1');
  const back = H.expenseFromDB({ ...db, ts: 12345 });
  for (const k of ['id', 'date', 'preTrip', 'payer', 'card', 'amount', 'currency', 'title', 'category', 'split', 'hasPhoto', 'ts']) {
    assert.equal(back[k], original[k], `field ${k} differs`);
  }
});

test('event mappers: round-trip', () => {
  const v = { id: 'v1', date: '2025-12-19', time: '13:00', title: 'Dishoom', tag: 'BOOKED', done: false };
  const db = H.eventToDB(v, 'T1');
  assert.equal(db.trip_id, 'T1');
  const back = H.eventFromDB(db);
  assert.equal(back.title, v.title);
  assert.equal(back.tag, v.tag);
  assert.equal(back.done, false);
});

/* ════════════════════════════════════════════════════════════════════
   invite parsing
   ════════════════════════════════════════════════════════════════════ */
test('extractInviteCode: from full URL', () => {
  assert.equal(H.extractInviteCode('https://dadpaid.vercel.app/?invite=abc123def456'), 'abc123def456');
});

test('extractInviteCode: from URL with extra params', () => {
  assert.equal(H.extractInviteCode('https://app/?foo=1&invite=ZZ99&bar=2'), 'ZZ99');
});

test('extractInviteCode: bare code passes through', () => {
  assert.equal(H.extractInviteCode('abc123def456'), 'abc123def456');
});

test('extractInviteCode: strips non-alphanumeric from bare input', () => {
  assert.equal(H.extractInviteCode('  abc 123-def_456  '), 'abc123def456');
});

test('extractInviteCode: empty/null input', () => {
  assert.equal(H.extractInviteCode(''), '');
  assert.equal(H.extractInviteCode(null), '');
  assert.equal(H.extractInviteCode(undefined), '');
});

/* ════════════════════════════════════════════════════════════════════
   family-aware lookups
   ════════════════════════════════════════════════════════════════════ */
const FAM = {
  members: [
    { id: 'mem_a', name: 'Ami',   color: '#e9c44b' },
    { id: 'mem_b', name: 'Sahil', color: '#3ba982' },
    { id: 'mem_c', name: 'Ketan', color: '#5da9e6' },
  ],
  cards: [
    { id: 'card_1', owner: 'mem_a', nick: 'Amex', last4: '0001' },
    { id: 'card_2', owner: 'mem_a', nick: 'Cash', last4: '' },
    { id: 'card_3', owner: 'mem_c', nick: 'HDFC', last4: '4521' },
  ],
};

test('memberOfIn: returns the member or undefined', () => {
  assert.equal(H.memberOfIn(FAM, 'mem_a').name, 'Ami');
  assert.equal(H.memberOfIn(FAM, 'nope'), undefined);
});

test('cardOfIn / cardsOfIn', () => {
  assert.equal(H.cardOfIn(FAM, 'card_3').nick, 'HDFC');
  assert.deepEqual(H.cardsOfIn(FAM, 'mem_a').map((c) => c.id), ['card_1', 'card_2']);
  assert.deepEqual(H.cardsOfIn(FAM, 'mem_b'), []);
});

test('memberOfIn: defensive against empty family', () => {
  assert.equal(H.memberOfIn(null, 'mem_a'), undefined);
  assert.equal(H.memberOfIn({}, 'mem_a'), undefined);
});

/* ════════════════════════════════════════════════════════════════════
   settlement — the big one
   ════════════════════════════════════════════════════════════════════ */
const THREE = FAM.members;

test('settleTrip: empty input returns no transfers', () => {
  assert.deepEqual(H.settleTrip([], THREE), []);
});

test('settleTrip: empty members returns no transfers', () => {
  assert.deepEqual(H.settleTrip([{ payer: 'x', amount: 100, currency: 'GBP', split: 'everyone' }], []), []);
});

test('settleTrip: one expense split 3 ways', () => {
  const ex = [{ id: 'e1', payer: 'mem_a', amount: 3000, currency: 'GBP', split: 'everyone' }];
  const t = H.settleTrip(ex, THREE);
  // Ami paid 3000; each owes 1000. Sahil owes Ami 1000, Ketan owes Ami 1000.
  assert.equal(t.length, 2);
  for (const tr of t) {
    assert.equal(tr.to, 'mem_a');
    assert.equal(tr.amount, 1000);
    assert.equal(tr.currency, 'GBP');
  }
  const debtorsByFrom = t.map((tr) => tr.from).sort();
  assert.deepEqual(debtorsByFrom, ['mem_b', 'mem_c']);
});

test('settleTrip: just-me split creates no debt', () => {
  const ex = [{ payer: 'mem_a', amount: 500, currency: 'GBP', split: 'just-me' }];
  assert.deepEqual(H.settleTrip(ex, THREE), []);
});

test('settleTrip: balanced expenses net to zero', () => {
  const ex = [
    { payer: 'mem_a', amount: 3000, currency: 'GBP', split: 'everyone' },
    { payer: 'mem_b', amount: 3000, currency: 'GBP', split: 'everyone' },
    { payer: 'mem_c', amount: 3000, currency: 'GBP', split: 'everyone' },
  ];
  assert.deepEqual(H.settleTrip(ex, THREE), []);
});

test('settleTrip: handles multi-currency independently', () => {
  const ex = [
    { payer: 'mem_a', amount: 3000, currency: 'GBP', split: 'everyone' },
    { payer: 'mem_b', amount: 3000, currency: 'INR', split: 'everyone' },
    { payer: 'mem_a', amount: 6000, currency: 'EUR', split: 'everyone' },
  ];
  const t = H.settleTrip(ex, THREE);
  const byCur = t.reduce((acc, x) => { acc[x.currency] = (acc[x.currency] || []).concat(x); return acc; }, {});
  assert.ok(byCur.GBP && byCur.GBP.length > 0);
  assert.ok(byCur.INR && byCur.INR.length > 0);
  assert.ok(byCur.EUR && byCur.EUR.length > 0);
});

test('settleTrip: works with any custom member IDs (not the old slugs)', () => {
  const fakeMembers = [
    { id: 'alice' }, { id: 'bob' }, { id: 'carol' }, { id: 'dave' },
  ];
  const ex = [
    { payer: 'alice', amount: 4000, currency: 'USD', split: 'everyone' },
  ];
  const t = H.settleTrip(ex, fakeMembers);
  // alice paid 4000, each of 4 owes 1000.
  assert.equal(t.length, 3);
  for (const tr of t) {
    assert.equal(tr.to, 'alice');
    assert.equal(tr.amount, 1000);
    assert.equal(tr.currency, 'USD');
  }
});

test('settleTrip: ignores orphan payer (not a member)', () => {
  const ex = [{ payer: 'ghost', amount: 1000, currency: 'GBP', split: 'everyone' }];
  assert.deepEqual(H.settleTrip(ex, THREE), []);
});

test('settleTrip: supports legacy named splits via opts', () => {
  const fam = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
  const ex = [{ payer: 'A', amount: 3000, currency: 'GBP', split: 'parents' }];
  const t = H.settleTrip(ex, fam, {
    splitBeneficiaries: { parents: ['A', 'C'] },
  });
  // A paid 3000, A & C split (1500 each), B owes nothing.
  // A net: +3000 - 1500 = +1500. C net: -1500. B net: 0.
  assert.equal(t.length, 1);
  assert.equal(t[0].from, 'C');
  assert.equal(t[0].to,   'A');
  assert.equal(t[0].amount, 1500);
});

test('settleTrip: small noise (<1 minor unit) does not generate transfers', () => {
  // Three-way of 100 → 33.33 each. Rounding could leave 0.01 residual; min-cash-flow ignores <1.
  const ex = [{ payer: 'mem_a', amount: 100, currency: 'GBP', split: 'everyone' }];
  const t = H.settleTrip(ex, THREE);
  // mem_a paid 100, owed back ~66.67 from b and c
  const total = t.reduce((s, x) => s + x.amount, 0);
  assert.ok(total >= 65 && total <= 67, `total ${total}`);
});
