/* dadpaid pure helpers — single source of truth for formatting, mapping,
 * settlement math, and demo data. No React, no DOM, no Supabase. */

import type {
  Currency, Expense, EventItem, Family, Member, Card, VaultItem,
  SplitId, Transfer, SyncStatusKind, Trip,
} from '../types';

/* ────────────── currencies ────────────── */
export const SUPPORTED_CURRENCIES: readonly Currency[] = ['GBP', 'INR', 'EUR', 'USD'];
export const CURRENCY_SYMBOLS: Record<Currency, string> = { GBP: '£', INR: '₹', EUR: '€', USD: '$' };

export function symbol(c: Currency | string | null | undefined): string {
  if (!c) return '';
  return (CURRENCY_SYMBOLS as Record<string, string>)[c] || c;
}

/* ────────────── formatting ────────────── */
export function fmtMajor(integerMinor: number | string | null | undefined, currency: Currency | string): string {
  const n = Math.abs(Math.trunc(Number(integerMinor) || 0));
  const major = Math.floor(n / 100);
  if (currency === 'INR') {
    const s = major.toString();
    if (s.length <= 3) return s;
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  return major.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function fmtMinor(integerMinor: number | string | null | undefined): string {
  return (Math.abs(Math.trunc(Number(integerMinor) || 0)) % 100)
    .toString().padStart(2, '0');
}

export function fmtFull(minorAmount: number, currency: Currency | string, opts: { compact?: boolean } = {}): string {
  const sym = symbol(currency);
  const maj = fmtMajor(minorAmount, currency);
  const min = fmtMinor(minorAmount);
  if (opts.compact && min === '00') return `${sym}${maj}`;
  return `${sym}${maj}.${min}`;
}

/* ────────────── dates ────────────── */
export function dayLabel(dateStr?: string | null, currentDateStr?: string | null): string {
  if (!dateStr || !currentDateStr) return 'UNKNOWN';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(currentDateStr + 'T00:00:00');
  if (isNaN(d.getTime()) || isNaN(today.getTime())) return 'UNKNOWN';
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'YESTERDAY';
  return d.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase() + ' ' + d.getDate();
}

export function formatDateShort(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).toLowerCase();
}

export function pickGreeting(hour?: number): string {
  const h = typeof hour === 'number' ? hour : new Date().getHours();
  if (h < 6)  return 'logging expenses after midnight. dedicated of you.';
  if (h < 12) return "morning. someone's buying breakfast.";
  if (h < 17) return 'afternoon. small charges add up.';
  if (h < 21) return 'evening. dinner round, probably.';
  return "late. someone's still adding up the tube card.";
}

/* ────────────── identity / ids ────────────── */
export function initialFor(name?: string | null): string {
  const t = (name || '').trim();
  return (t[0] || '?').toUpperCase();
}

export function uid(prefix = ''): string {
  const raw = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${raw}` : raw;
}

/* ────────────── filters ────────────── */
export interface TotalForOpts {
  currency?: Currency;
  payer?: string;
  category?: string;
  preTrip?: boolean;
  date?: string;
}

export function totalFor(expenses: Expense[] | null | undefined, opts: TotalForOpts = {}): number {
  let total = 0;
  for (const e of expenses || []) {
    if (opts.currency && e.currency !== opts.currency) continue;
    if (opts.payer && e.payer !== opts.payer) continue;
    if (opts.category && e.category !== opts.category) continue;
    if (opts.preTrip === true && !e.preTrip) continue;
    if (opts.preTrip === false && e.preTrip) continue;
    if (opts.date && e.date !== opts.date) continue;
    total += Math.trunc(Number(e.amount) || 0);
  }
  return total;
}

export function distinctCurrencies(expenses: Expense[] | null | undefined): Currency[] {
  const set = new Set<Currency>();
  for (const e of expenses || []) if (e.currency) set.add(e.currency);
  return Array.from(set);
}

/* ────────────── DB ↔ client mappers ────────────── */
export function expenseFromDB(e: any): Expense | null {
  if (!e) return null;
  return {
    id: e.id,
    date: e.date,
    preTrip: !!e.pre_trip,
    payer: e.payer_id,
    card: e.card_id,
    amount: e.amount,
    currency: e.currency,
    title: e.title,
    category: e.category,
    split: e.split,
    hasPhoto: !!e.has_photo,
    photoPath: e.photo_path,
    ts: e.ts,
    synced: true,
  };
}

export function expenseToDB(e: Expense | null, tripId: string): any | null {
  if (!e) return null;
  return {
    id: e.id,
    trip_id: tripId,
    date: e.date,
    pre_trip: !!e.preTrip,
    payer_id: e.payer,
    card_id: e.card || null,
    amount: e.amount,
    currency: e.currency,
    title: e.title || null,
    category: e.category || null,
    split: e.split || 'everyone',
    has_photo: !!(e.photo || e.hasPhoto),
    photo_path: e.photoPath || null,
    ts: e.ts || null,
  };
}

export function eventFromDB(v: any): EventItem | null {
  if (!v) return null;
  return { id: v.id, date: v.date, time: v.time, title: v.title, tag: v.tag, done: !!v.done, synced: true };
}

export function eventToDB(v: EventItem | null, tripId: string): any | null {
  if (!v) return null;
  return { id: v.id, trip_id: tripId, date: v.date, time: v.time || null, title: v.title, tag: v.tag || null, done: !!v.done };
}

/* ────────────── invite URL parsing ────────────── */
export function extractInviteCode(input?: string | null): string {
  if (!input) return '';
  const trimmed = String(input).trim();
  const m = trimmed.match(/[?&]invite=([A-Za-z0-9]+)/);
  if (m) return m[1];
  return trimmed.replace(/[^A-Za-z0-9]/g, '');
}

/* ────────────── family-aware lookups ────────────── */
export function memberOfIn(family: { members?: Member[] } | null | undefined, id: string): Member | undefined {
  return (family?.members || []).find((m) => m.id === id);
}
export function cardOfIn(family: { cards?: Card[] } | null | undefined, cardId: string): Card | undefined {
  return (family?.cards || []).find((c) => c.id === cardId);
}
export function cardsOfIn(family: { cards?: Card[] } | null | undefined, payerId: string): Card[] {
  return (family?.cards || []).filter((c) => c.owner === payerId);
}

/* ────────────── settlement ────────────── */
export interface SettleOpts {
  splitBeneficiaries?: Record<string, string[]>;
  priorSettlements?: Array<{ from: string; to: string; amount: number; currency: Currency }>;
}

export function settleTrip(
  expenses: Expense[] | null | undefined,
  members: { id: string }[] | null | undefined,
  opts: SettleOpts = {},
): Transfer[] {
  const memberIds = (members || []).map((m) => m.id);
  if (memberIds.length === 0) return [];

  const SPLIT_BENEFICIARIES = (splitId: SplitId, payerId: string): string[] => {
    if (splitId === 'just-me') return [payerId];
    if (splitId === 'everyone') return memberIds;
    if (opts.splitBeneficiaries && opts.splitBeneficiaries[splitId]) {
      return opts.splitBeneficiaries[splitId];
    }
    return memberIds;
  };

  const currencies = distinctCurrencies(expenses);
  for (const s of opts.priorSettlements || []) {
    if (s.currency && !currencies.includes(s.currency)) currencies.push(s.currency);
  }

  const transfers: Transfer[] = [];

  for (const cur of currencies) {
    const net: Record<string, number> = Object.fromEntries(memberIds.map((id) => [id, 0]));

    for (const e of expenses || []) {
      if (e.currency !== cur) continue;
      if (!(e.payer in net)) continue;
      const benefs = SPLIT_BENEFICIARIES((e.split as SplitId) || 'everyone', e.payer)
        .filter((b) => b in net);
      if (benefs.length === 0) continue;
      const perHead = e.amount / benefs.length;
      net[e.payer] += e.amount;
      for (const b of benefs) net[b] -= perHead;
    }

    for (const s of opts.priorSettlements || []) {
      if (s.currency !== cur) continue;
      if (!(s.from in net) || !(s.to in net)) continue;
      net[s.from] += s.amount;
      net[s.to]   -= s.amount;
    }

    const debtors: Array<{ id: string; v: number }> = [];
    const creditors: Array<{ id: string; v: number }> = [];
    for (const id of memberIds) {
      if (net[id] < -1)      debtors.push({ id, v: -net[id] });
      else if (net[id] > 1)  creditors.push({ id, v: net[id] });
    }
    debtors.sort((a, b) => b.v - a.v);
    creditors.sort((a, b) => b.v - a.v);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amt = Math.min(debtors[i].v, creditors[j].v);
      transfers.push({ from: debtors[i].id, to: creditors[j].id, amount: Math.round(amt), currency: cur });
      debtors[i].v -= amt;
      creditors[j].v -= amt;
      if (debtors[i].v < 1) i++;
      if (creditors[j].v < 1) j++;
    }
  }

  return transfers;
}

/* ────────────── search ────────────── */
export function filterExpenses(
  expenses: Expense[] | null | undefined,
  query?: string | null,
  nameById: Record<string, string> = {},
): Expense[] {
  const q = (query || '').trim().toLowerCase();
  if (!q) return expenses || [];
  return (expenses || []).filter((e) => {
    if (e.title && e.title.toLowerCase().includes(q)) return true;
    if (e.category && e.category.toLowerCase().includes(q)) return true;
    const payerName = (nameById[e.payer] || '').toLowerCase();
    if (payerName.includes(q)) return true;
    const amt = String(e.amount || 0);
    const amtMajor = String(Math.floor(Math.abs(e.amount || 0) / 100));
    if (amt.includes(q) || amtMajor.includes(q)) return true;
    return false;
  });
}

/* ────────────── sync status ────────────── */
export function syncStatus(
  now: number,
  lastSyncedAt: number | null | undefined,
  online: boolean,
  liveWindowMs = 30000,
): SyncStatusKind {
  if (!online) return 'offline';
  if (!lastSyncedAt) return 'unknown';
  return (now - lastSyncedAt) <= liveWindowMs ? 'live' : 'stale';
}

/* ────────────── demo data ────────────── */
export function buildDemoSnapshot(now?: number | string): {
  family: Family; members: Member[]; cards: Card[]; trip: Trip; expenses: any[]; events: EventItem[]; vault: VaultItem[]; participants: any[];
} {
  const t = now ? new Date(now) : new Date();
  const today = t.toISOString().slice(0, 10);
  const startDate = new Date(t.getTime() - 4 * 86400000).toISOString().slice(0, 10);
  const endDate   = new Date(t.getTime() + 3 * 86400000).toISOString().slice(0, 10);

  const family: Family = { id: 'demo-fam', name: 'Sample' };
  const members: Member[] = [
    { id: 'demo-m1', family_id: 'demo-fam', name: 'Sam',  initial: 'S', color: '#e9c44b', position: 0 },
    { id: 'demo-m2', family_id: 'demo-fam', name: 'Alex', initial: 'A', color: '#3ba982', position: 1 },
    { id: 'demo-m3', family_id: 'demo-fam', name: 'Riya', initial: 'R', color: '#e8746a', position: 2 },
  ];
  const cards: Card[] = [
    { id: 'demo-c1', family_id: 'demo-fam', owner: 'demo-m1', nick: 'Cash', last4: '' },
    { id: 'demo-c2', family_id: 'demo-fam', owner: 'demo-m2', nick: 'HDFC', last4: '4521' },
    { id: 'demo-c3', family_id: 'demo-fam', owner: 'demo-m3', nick: 'Amex', last4: '8832' },
  ];
  const trip: Trip = {
    id: 'demo-trip', family_id: 'demo-fam',
    name: "SAMPLE · Lisbon Spring", short_name: 'LISBON',
    start_date: startDate, end_date: endDate,
    primary_currency: 'EUR', default_split: 'everyone', status: 'active',
  };
  const expenses = [
    { id: 'dx1', trip_id: 'demo-trip', date: startDate, pre_trip: true,  payer_id: 'demo-m2', card_id: 'demo-c2', amount: 24000, currency: 'EUR', title: 'Apartment, 4 nights', category: 'Hotel',   split: 'everyone', ts: 1 },
    { id: 'dx2', trip_id: 'demo-trip', date: startDate, pre_trip: false, payer_id: 'demo-m1', card_id: 'demo-c1', amount: 850,   currency: 'EUR', title: 'Tram tickets',         category: 'Travel',  split: 'everyone', ts: 2 },
    { id: 'dx3', trip_id: 'demo-trip', date: today,     pre_trip: false, payer_id: 'demo-m3', card_id: 'demo-c3', amount: 4200,  currency: 'EUR', title: 'Pastéis de Belém',     category: 'Food',    split: 'everyone', ts: 3 },
    { id: 'dx4', trip_id: 'demo-trip', date: today,     pre_trip: false, payer_id: 'demo-m2', card_id: 'demo-c2', amount: 1800,  currency: 'EUR', title: 'Time Out Market',      category: 'Food',    split: 'everyone', ts: 4 },
    { id: 'dx5', trip_id: 'demo-trip', date: today,     pre_trip: false, payer_id: 'demo-m1', card_id: 'demo-c1', amount: 1200,  currency: 'EUR', title: 'Fado tickets',         category: 'Tickets', split: 'everyone', ts: 5 },
  ];
  return { family, members, cards, trip, expenses, events: [], vault: [], participants: [] };
}

