import { useState, useRef } from 'react';
import { sb } from '../lib/supabase';
import type { Member, Trip, Currency, SplitId } from '../types';

const CURRENCY_OPTIONS: { code: Currency; label: string }[] = [
  { code: 'GBP', label: '£ GBP' },
  { code: 'INR', label: '₹ INR' },
  { code: 'EUR', label: '€ EUR' },
  { code: 'USD', label: '$ USD' },
];

const SPLIT_PRESETS: { id: SplitId; label: string; sub: string }[] = [
  { id: 'everyone', label: 'EVERYONE',  sub: 'Split equally between all members' },
  { id: 'just-me',  label: 'JUST PAYER', sub: 'No split, payer covers it' },
];

interface NoTripScreenProps {
  familyId: string;
  members: Member[];
  pastTrips?: Trip[];
  onComplete: () => void | Promise<void>;
  onSignOut: () => void;
  cancelLabel?: string;
}

export function NoTripScreen({
  familyId, members, pastTrips,
  onComplete, onSignOut, cancelLabel = 'sign out instead',
}: NoTripScreenProps) {
  const memberCount = (members && members.length) || 0;
  const safePastTrips: Trip[] = pastTrips || [];

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const weekOut = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  const [tripName, setTripName] = useState('');
  const [shortName, setShortName] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate]     = useState(weekOut);
  const [currency, setCurrency]   = useState<Currency>('GBP');
  const [defaultSplit, setDefaultSplit] = useState<SplitId>('everyone');
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState<string | null>(null);
  const submitLock = useRef(false);

  const canFinish = !!familyId && tripName.trim().length > 0 && startDate <= endDate;

  async function finish() {
    if (submitLock.current) return;
    if (!canFinish) return;
    if (!familyId) { setErr('No family loaded. Sign out and back in.'); return; }
    submitLock.current = true;
    setBusy(true); setErr(null);
    try {
      const { error } = await sb.from('trips').insert({
        family_id: familyId,
        name: tripName.trim(),
        short_name: (shortName.trim() || tripName.trim().split(/\s+/)[0]).toUpperCase().slice(0, 16),
        start_date: startDate, end_date: endDate,
        primary_currency: currency, default_split: defaultSplit,
      });
      if (error) throw error;
      await onComplete();
    } catch (e: any) { setErr(String(e?.message || e)); }
    finally { submitLock.current = false; setBusy(false); }
  }

  return (
    <div className="wiz-stage">
      <div className="wiz-head">
        <div className="wiz-head-title">DAD PAID</div>
        <div className="wiz-head-sub">No active trip · let's start one</div>
      </div>
      <div className="wiz-body">
        <div className="wiz-prompt">Start a new trip</div>
        <div className="wiz-help">
          Welcome back. You've got {memberCount} family member{memberCount === 1 ? '' : 's'} set up. Just need a trip to start logging.
        </div>

        <div className="wiz-label">Trip name</div>
        <input
          autoFocus
          className="wiz-input"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          placeholder="e.g. London Dec '25"
        />

        <div className="wiz-label">Short tag</div>
        <input
          className="wiz-input"
          value={shortName}
          onChange={(e) => setShortName(e.target.value.toUpperCase().slice(0, 16))}
          placeholder={(tripName.split(/\s+/)[0] || 'TRIP').toUpperCase()}
        />

        <div className="wiz-label">Dates</div>
        <div className="wiz-date-row">
          <input type="date" className="wiz-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="wiz-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <div className="wiz-label">Primary currency</div>
        <div className="wiz-select-row">
          {CURRENCY_OPTIONS.map((c) => (
            <div key={c.code} className={`wiz-radio ${currency === c.code ? 'active' : ''}`} onClick={() => setCurrency(c.code)}>{c.label}</div>
          ))}
        </div>

        <div className="wiz-label">Default split</div>
        <div className="wiz-select-row">
          {SPLIT_PRESETS.map((s) => (
            <div key={s.id} className={`wiz-radio ${defaultSplit === s.id ? 'active' : ''}`} onClick={() => setDefaultSplit(s.id)}>
              {s.label}
              <span className="sub">{s.sub}</span>
            </div>
          ))}
        </div>

        {err && <div className="login-err" style={{ marginTop: 16 }}>{err}</div>}

        {safePastTrips.length > 0 && (
          <>
            <div className="wiz-label" style={{ marginTop: 32 }}>Past trips · {safePastTrips.length}</div>
            {safePastTrips.slice(0, 6).map((t) => (
              <div key={t.id} className="past-trip">
                <div>
                  <div className="nm">{t.name || 'untitled trip'}</div>
                  <div className="dt">{t.start_date} → {t.end_date} · {t.primary_currency}</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(14,14,14,0.4)' }}>ENDED</div>
              </div>
            ))}
          </>
        )}

        <button
          onClick={onSignOut}
          style={{
            marginTop: 32, background: 'transparent', border: 'none',
            color: 'rgba(14,14,14,0.4)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
            padding: 12, width: '100%',
          }}
        >{cancelLabel}</button>
      </div>
      <div className="wiz-foot">
        <button className="wiz-btn primary" disabled={!canFinish || busy} onClick={finish}>
          {busy ? 'CREATING…' : 'START TRIP ›'}
        </button>
      </div>
    </div>
  );
}
