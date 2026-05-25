import { describe, test, expect } from 'vitest';
import * as H from './helpers';

describe('symbol', () => {
  test('all four supported currencies', () => {
    expect(H.symbol('GBP')).toBe('£');
    expect(H.symbol('INR')).toBe('₹');
    expect(H.symbol('EUR')).toBe('€');
    expect(H.symbol('USD')).toBe('$');
  });
  test('falls back', () => {
    expect(H.symbol('JPY')).toBe('JPY');
    expect(H.symbol('')).toBe('');
    expect(H.symbol(null)).toBe('');
  });
});

describe('fmtMajor', () => {
  test('GBP western grouping', () => {
    expect(H.fmtMajor(0, 'GBP')).toBe('0');
    expect(H.fmtMajor(123456, 'GBP')).toBe('1,234');
    expect(H.fmtMajor(100000000, 'GBP')).toBe('1,000,000');
  });
  test('INR Indian grouping', () => {
    expect(H.fmtMajor(100, 'INR')).toBe('1');
    expect(H.fmtMajor(10000000, 'INR')).toBe('1,00,000');
    expect(H.fmtMajor(12345600, 'INR')).toBe('1,23,456');
  });
  test('EUR/USD western', () => {
    expect(H.fmtMajor(123456, 'EUR')).toBe('1,234');
    expect(H.fmtMajor(123456, 'USD')).toBe('1,234');
  });
  test('non-numeric input', () => {
    expect(H.fmtMajor(undefined, 'GBP')).toBe('0');
    expect(H.fmtMajor(null, 'GBP')).toBe('0');
    expect(H.fmtMajor('NaN', 'GBP')).toBe('0');
  });
});

describe('fmtMinor', () => {
  test('padding', () => {
    expect(H.fmtMinor(0)).toBe('00');
    expect(H.fmtMinor(5)).toBe('05');
    expect(H.fmtMinor(155)).toBe('55');
  });
});

describe('fmtFull', () => {
  test('basic', () => {
    expect(H.fmtFull(12345, 'GBP')).toBe('£123.45');
    expect(H.fmtFull(100, 'INR')).toBe('₹1.00');
  });
  test('compact', () => {
    expect(H.fmtFull(1200, 'GBP', { compact: true })).toBe('£12');
    expect(H.fmtFull(1234, 'GBP', { compact: true })).toBe('£12.34');
  });
});

describe('dayLabel', () => {
  test('today/yesterday', () => {
    expect(H.dayLabel('2025-12-18', '2025-12-18')).toBe('TODAY');
    expect(H.dayLabel('2025-12-17', '2025-12-18')).toBe('YESTERDAY');
  });
  test('older days', () => {
    expect(H.dayLabel('2025-12-15', '2025-12-18')).toMatch(/15$/);
  });
  test('invalid', () => {
    expect(H.dayLabel(null, '2025-12-18')).toBe('UNKNOWN');
    expect(H.dayLabel('garbage', '2025-12-18')).toBe('UNKNOWN');
  });
});

describe('initialFor', () => {
  test('first letter uppercased', () => {
    expect(H.initialFor('Ami')).toBe('A');
    expect(H.initialFor('  ketan')).toBe('K');
    expect(H.initialFor('')).toBe('?');
    expect(H.initialFor(null)).toBe('?');
  });
});

describe('uid', () => {
  test('unique', () => {
    expect(H.uid('mem')).not.toBe(H.uid('mem'));
    expect(H.uid('mem')).toMatch(/^mem_/);
  });
});

const SEED = [
  { id: 'a', date: '2025-12-15', preTrip: false, payer: 'm1', amount: 1000, currency: 'GBP' as const, category: 'Food' },
  { id: 'b', date: '2025-12-15', preTrip: false, payer: 'm2', amount: 2000, currency: 'GBP' as const, category: 'Travel' },
  { id: 'c', date: '2025-12-16', preTrip: false, payer: 'm1', amount: 500,  currency: 'INR' as const, category: 'Food' },
  { id: 'd', date: '2025-10-12', preTrip: true,  payer: 'm1', amount: 8000, currency: 'GBP' as const, category: 'Hotel' },
];

describe('totalFor', () => {
  test('no filters', () => { expect(H.totalFor(SEED)).toBe(11500); });
  test('by currency', () => {
    expect(H.totalFor(SEED, { currency: 'GBP' })).toBe(11000);
    expect(H.totalFor(SEED, { currency: 'INR' })).toBe(500);
    expect(H.totalFor(SEED, { currency: 'EUR' })).toBe(0);
  });
  test('by payer', () => {
    expect(H.totalFor(SEED, { payer: 'm1' })).toBe(9500);
  });
  test('preTrip filter', () => {
    expect(H.totalFor(SEED, { preTrip: true })).toBe(8000);
    expect(H.totalFor(SEED, { preTrip: false })).toBe(3500);
  });
  test('undefined input', () => { expect(H.totalFor(undefined)).toBe(0); });
});

describe('distinctCurrencies', () => {
  test('unique', () => {
    expect(H.distinctCurrencies(SEED).sort()).toEqual(['GBP', 'INR']);
    expect(H.distinctCurrencies([])).toEqual([]);
  });
});

describe('expense mappers', () => {
  test('round-trip', () => {
    const original = {
      id: 'x1', date: '2025-12-15', preTrip: false, payer: 'mem_a', card: 'card_x',
      amount: 4200, currency: 'GBP' as const, title: 'Lunch', category: 'Food',
      split: 'just-me' as const, hasPhoto: false, photoPath: null, ts: 12345,
    };
    const db = H.expenseToDB(original, 'T1');
    const back = H.expenseFromDB({ ...db, ts: 12345 });
    expect(back?.id).toBe(original.id);
    expect(back?.payer).toBe(original.payer);
    expect(back?.split).toBe(original.split);
  });
  test('null input', () => {
    expect(H.expenseFromDB(null)).toBe(null);
    expect(H.expenseToDB(null, 'T1')).toBe(null);
  });
});

describe('extractInviteCode', () => {
  test('from URL', () => {
    expect(H.extractInviteCode('https://dadpaid.vercel.app/?invite=abc123def456')).toBe('abc123def456');
  });
  test('bare code', () => {
    expect(H.extractInviteCode('abc123def456')).toBe('abc123def456');
  });
  test('strips noise', () => {
    expect(H.extractInviteCode('  abc 123-def_456  ')).toBe('abc123def456');
  });
});

const FAM = {
  members: [
    { id: 'mem_a', name: 'Ami',   color: '#e9c44b', initial: 'A' },
    { id: 'mem_b', name: 'Sahil', color: '#3ba982', initial: 'S' },
    { id: 'mem_c', name: 'Ketan', color: '#5da9e6', initial: 'K' },
  ],
  cards: [
    { id: 'card_1', owner: 'mem_a', nick: 'Amex', last4: '0001' },
    { id: 'card_2', owner: 'mem_a', nick: 'Cash', last4: '' },
    { id: 'card_3', owner: 'mem_c', nick: 'HDFC', last4: '4521' },
  ],
};
const THREE = FAM.members;

describe('memberOfIn / cardOfIn / cardsOfIn', () => {
  test('lookups', () => {
    expect(H.memberOfIn(FAM, 'mem_a')?.name).toBe('Ami');
    expect(H.memberOfIn(FAM, 'nope')).toBeUndefined();
    expect(H.cardOfIn(FAM, 'card_3')?.nick).toBe('HDFC');
    expect(H.cardsOfIn(FAM, 'mem_a').map((c) => c.id)).toEqual(['card_1', 'card_2']);
    expect(H.cardsOfIn(FAM, 'mem_b')).toEqual([]);
  });
  test('null safe', () => {
    expect(H.memberOfIn(null, 'mem_a')).toBeUndefined();
    expect(H.memberOfIn({} as any, 'mem_a')).toBeUndefined();
  });
});

describe('settleTrip', () => {
  test('empty input', () => {
    expect(H.settleTrip([], THREE)).toEqual([]);
  });
  test('3-way split, one expense', () => {
    const ex = [{ id: 'e1', date: '2025-01-01', payer: 'mem_a', amount: 3000, currency: 'GBP' as const, split: 'everyone' as const }];
    const t = H.settleTrip(ex, THREE);
    expect(t.length).toBe(2);
    for (const tr of t) {
      expect(tr.to).toBe('mem_a');
      expect(tr.amount).toBe(1000);
      expect(tr.currency).toBe('GBP');
    }
  });
  test('just-me no debt', () => {
    const ex = [{ id: 'e1', date: '2025-01-01', payer: 'mem_a', amount: 500, currency: 'GBP' as const, split: 'just-me' as const }];
    expect(H.settleTrip(ex, THREE)).toEqual([]);
  });
  test('prior settlement offsets debt', () => {
    const ex = [{ id: 'e1', date: '2025-01-01', payer: 'mem_a', amount: 3000, currency: 'GBP' as const, split: 'everyone' as const }];
    const settled = [{ from: 'mem_b', to: 'mem_a', amount: 1000, currency: 'GBP' as const }];
    const t = H.settleTrip(ex, THREE, { priorSettlements: settled });
    expect(t.length).toBe(1);
    expect(t[0].from).toBe('mem_c');
    expect(t[0].to).toBe('mem_a');
  });
  test('multi-currency isolated', () => {
    const ex = [
      { id: 'e1', date: '2025-01-01', payer: 'mem_a', amount: 3000, currency: 'GBP' as const, split: 'everyone' as const },
      { id: 'e2', date: '2025-01-02', payer: 'mem_b', amount: 3000, currency: 'INR' as const, split: 'everyone' as const },
    ];
    const t = H.settleTrip(ex, THREE);
    expect(new Set(t.map((x) => x.currency))).toEqual(new Set(['GBP', 'INR']));
  });
});

describe('filterExpenses', () => {
  const SAMPLE = [
    { id: 'e1', date: '2025-01-01', payer: 'mA', amount: 14700, currency: 'GBP' as const, title: 'Dishoom', category: 'Food' },
    { id: 'e2', date: '2025-01-02', payer: 'mB', amount: 2800,  currency: 'GBP' as const, title: 'Tube',    category: 'Travel' },
    { id: 'e3', date: '2025-01-03', payer: 'mA', amount: 4200,  currency: 'EUR' as const, title: null,      category: 'Food' },
  ];
  const NAMES = { mA: 'Ami', mB: 'Sahil' };

  test('empty query returns input', () => {
    expect(H.filterExpenses(SAMPLE, '', NAMES).length).toBe(3);
  });
  test('matches title', () => {
    expect(H.filterExpenses(SAMPLE, 'dishoom', NAMES)[0].id).toBe('e1');
  });
  test('matches payer name', () => {
    expect(H.filterExpenses(SAMPLE, 'ami', NAMES).length).toBe(2);
  });
  test('matches amount', () => {
    expect(H.filterExpenses(SAMPLE, '14700', NAMES)[0].id).toBe('e1');
  });
  test('null safe', () => {
    expect(H.filterExpenses(null, 'x')).toEqual([]);
  });
});

describe('syncStatus', () => {
  test('offline beats everything', () => {
    expect(H.syncStatus(10000, 5000, false)).toBe('offline');
  });
  test('live window', () => {
    expect(H.syncStatus(100000, 80000, true)).toBe('live');
  });
  test('stale beyond window', () => {
    expect(H.syncStatus(100000, 30000, true)).toBe('stale');
  });
  test('unknown when never synced', () => {
    expect(H.syncStatus(100000, null, true)).toBe('unknown');
  });
});

describe('buildDemoSnapshot', () => {
  test('coherent', () => {
    const snap = H.buildDemoSnapshot('2025-12-18T12:00:00Z');
    expect(snap.family.id).toBe('demo-fam');
    expect(snap.members.length).toBe(3);
    expect(snap.cards.length).toBe(3);
    expect(snap.trip.primary_currency).toBe('EUR');
    expect(snap.trip.status).toBe('active');
  });
  test('FK integrity', () => {
    const snap = H.buildDemoSnapshot();
    const memberIds = new Set(snap.members.map((m) => m.id));
    const cardIds = new Set(snap.cards.map((c) => c.id));
    for (const e of snap.expenses) {
      expect(memberIds.has(e.payer_id)).toBe(true);
      expect(cardIds.has(e.card_id)).toBe(true);
    }
  });
});
