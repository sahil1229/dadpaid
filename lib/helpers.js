/* dadpaid · pure helpers
 *
 * Single source of truth for formatting, mapping, and settlement logic.
 * Loaded by index.html before the React/Babel bundle so all components see
 * the same definitions, and required by the Node test suite for verification.
 *
 * Everything in this file MUST be pure (no React, no DOM, no Supabase, no
 * mutable global state). Pass data in, get data out.
 */
(function (g) {
  'use strict';

  /* ────────────── currencies ────────────── */
  const SUPPORTED_CURRENCIES = ['GBP', 'INR', 'EUR', 'USD'];
  const CURRENCY_SYMBOLS = { GBP: '£', INR: '₹', EUR: '€', USD: '$' };

  function symbol(c) {
    return CURRENCY_SYMBOLS[c] || c || '';
  }

  /* ────────────── formatting ────────────── */
  /** Convert minor-units integer into the major-part string (no decimals, no symbol).
   *  INR uses Indian grouping (1,23,456). Everything else uses western 3-digit grouping.
   *  Negatives are returned as positive strings (caller adds a sign).
   */
  function fmtMajor(integerMinor, currency) {
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

  function fmtMinor(integerMinor) {
    return (Math.abs(Math.trunc(Number(integerMinor) || 0)) % 100)
      .toString().padStart(2, '0');
  }

  function fmtFull(minorAmount, currency, opts = {}) {
    const sym = symbol(currency);
    const maj = fmtMajor(minorAmount, currency);
    const min = fmtMinor(minorAmount);
    if (opts.compact && min === '00') return `${sym}${maj}`;
    return `${sym}${maj}.${min}`;
  }

  /* ────────────── dates ────────────── */
  function dayLabel(dateStr, currentDateStr) {
    if (!dateStr || !currentDateStr) return 'UNKNOWN';
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date(currentDateStr + 'T00:00:00');
    if (isNaN(d) || isNaN(today)) return 'UNKNOWN';
    const diff = Math.round((today - d) / 86400000);
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'YESTERDAY';
    return d.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase() + ' ' + d.getDate();
  }

  function formatDateShort(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).toLowerCase();
  }

  function pickGreeting(hour) {
    const h = typeof hour === 'number' ? hour : new Date().getHours();
    if (h < 6)  return "logging expenses after midnight. dedicated of you.";
    if (h < 12) return "morning. someone's buying breakfast.";
    if (h < 17) return "afternoon. small charges add up.";
    if (h < 21) return "evening. dinner round, probably.";
    return "late. someone's still adding up the tube card.";
  }

  /* ────────────── identity / ids ────────────── */
  function initialFor(name) {
    const t = (name || '').trim();
    return (t[0] || '?').toUpperCase();
  }

  function uid(prefix = '') {
    const raw = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return prefix ? `${prefix}_${raw}` : raw;
  }

  /* ────────────── filters ────────────── */
  function totalFor(expenses, opts = {}) {
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

  function distinctCurrencies(expenses) {
    const set = new Set();
    for (const e of expenses || []) if (e.currency) set.add(e.currency);
    return Array.from(set);
  }

  /* ────────────── DB ↔ client mappers ────────────── */
  function expenseFromDB(e) {
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

  function expenseToDB(e, tripId) {
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

  function eventFromDB(v) {
    if (!v) return null;
    return { id: v.id, date: v.date, time: v.time, title: v.title, tag: v.tag, done: !!v.done, synced: true };
  }

  function eventToDB(v, tripId) {
    if (!v) return null;
    return { id: v.id, trip_id: tripId, date: v.date, time: v.time || null, title: v.title, tag: v.tag || null, done: !!v.done };
  }

  /* ────────────── invite URL parsing ────────────── */
  function extractInviteCode(input) {
    if (!input) return '';
    const trimmed = String(input).trim();
    const m = trimmed.match(/[?&]invite=([A-Za-z0-9]+)/);
    if (m) return m[1];
    return trimmed.replace(/[^A-Za-z0-9]/g, '');
  }

  /* ────────────── family-aware lookups ──────────────
   * Pure versions: caller passes the family in.
   */
  function memberOfIn(family, id) {
    return (family?.members || []).find((m) => m.id === id);
  }
  function cardOfIn(family, cardId) {
    return (family?.cards || []).find((c) => c.id === cardId);
  }
  function cardsOfIn(family, payerId) {
    return (family?.cards || []).filter((c) => c.owner === payerId);
  }

  /* ────────────── settlement ──────────────
   * Compute who owes whom, per currency, given expenses and the trip's members.
   * `members` is an array of objects with at least { id }.
   * Each expense has: payer, amount, currency, split.
   * `split` is the id of a split preset:
   *   - 'everyone'  → all members split equally
   *   - 'just-me'   → only the payer benefits (no debt)
   *   - any other custom key → falls back to 'everyone' if benefit list not provided
   *
   * Returns an array of transfers: [{ from, to, amount, currency }]
   */
  function settleTrip(expenses, members, opts = {}) {
    const memberIds = (members || []).map((m) => m.id);
    if (memberIds.length === 0) return [];

    const SPLIT_BENEFICIARIES = (splitId, payerId) => {
      if (splitId === 'just-me') return [payerId];
      if (splitId === 'everyone') return memberIds;
      // custom split table provided by caller (e.g. legacy 'dad', 'parents')
      if (opts.splitBeneficiaries && opts.splitBeneficiaries[splitId]) {
        return opts.splitBeneficiaries[splitId];
      }
      return memberIds; // safe default
    };

    const currencies = distinctCurrencies(expenses);
    const transfers = [];

    for (const cur of currencies) {
      const net = Object.fromEntries(memberIds.map((id) => [id, 0]));

      for (const e of expenses) {
        if (e.currency !== cur) continue;
        if (!(e.payer in net)) continue;          // payer not a member (orphan)
        const benefs = SPLIT_BENEFICIARIES(e.split || 'everyone', e.payer)
          .filter((b) => b in net);
        if (benefs.length === 0) continue;
        const perHead = e.amount / benefs.length;
        net[e.payer] += e.amount;
        for (const b of benefs) net[b] -= perHead;
      }

      const debtors = [];
      const creditors = [];
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

  /* ────────────── exports ────────────── */
  const api = {
    SUPPORTED_CURRENCIES,
    CURRENCY_SYMBOLS,
    symbol,
    fmtMajor, fmtMinor, fmtFull,
    dayLabel, formatDateShort, pickGreeting,
    initialFor, uid,
    totalFor, distinctCurrencies,
    expenseFromDB, expenseToDB, eventFromDB, eventToDB,
    extractInviteCode,
    memberOfIn, cardOfIn, cardsOfIn,
    settleTrip,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  // Attach to global so the React bundle can use them as bare names.
  for (const k of Object.keys(api)) g[k] = api[k];
})(typeof globalThis !== 'undefined' ? globalThis : this);
