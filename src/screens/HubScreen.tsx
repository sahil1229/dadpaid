import type { Family, Trip, Expense, Currency } from '../types';
import { pickGreeting, formatDateShort, symbol, fmtMajor } from '../lib/helpers';

interface HubScreenProps {
  family: Family | null;
  userFamily: Family | null;
  activeTrip: Trip | null;
  pastTrips: Trip[];
  expenses: Expense[];
  online: boolean;
  onOpenTrip: () => void;
  onNewTrip: () => void;
  onJoinInvite: () => void;
  onSignOut: () => void;
}

export function HubScreen({
  family, userFamily, activeTrip, pastTrips, expenses,
  onOpenTrip, onNewTrip, onJoinInvite, onSignOut,
}: HubScreenProps) {
  const isJoinedTrip = (t: Trip | null) =>
    !!t && (!userFamily || t.family_id !== userFamily.id);

  const greeting = pickGreeting();

  const tripCurrency: Currency = (activeTrip?.primary_currency || 'GBP') as Currency;
  const activeTotal = activeTrip
    ? expenses.reduce((sum, e) => e.currency === tripCurrency ? sum + e.amount : sum, 0)
    : 0;
  const activeDays = activeTrip
    ? Math.max(1, Math.round((new Date(activeTrip.end_date).getTime() - new Date(activeTrip.start_date).getTime()) / 86400000) + 1)
    : 0;
  const activeCurrent = activeTrip
    ? Math.max(1, Math.min(activeDays, Math.floor((Date.now() - new Date(activeTrip.start_date).getTime()) / 86400000) + 1))
    : 0;

  const familyName = family?.name || 'family';

  return (
    <div className="hub-stage">
      <div className="hub-head">
        <div className="hub-brand">DAD PAID</div>
        <div className="hub-brand-sub">{familyName}'s travel ledger. mild guilt, lightly tracked.</div>
      </div>

      <div className="hub-body">
        <div className="hub-greeting">{greeting}</div>

        {activeTrip && (
          <div className="hub-active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="hub-active-tag">currently in</div>
              {isJoinedTrip(activeTrip) && <span className="joined-badge">JOINED</span>}
            </div>
            <div className="hub-active-name">{activeTrip.name}</div>
            <div className="hub-active-meta">
              day {activeCurrent} of {activeDays} · {symbol(tripCurrency)}{fmtMajor(activeTotal, tripCurrency)} so far
            </div>
            <button className="hub-active-cta" onClick={onOpenTrip}>open trip ›</button>
          </div>
        )}

        <div className="hub-actions">
          <button className="hub-actionbtn" onClick={onNewTrip}>+ new trip</button>
          <button className="hub-actionbtn" onClick={onJoinInvite}>join with code</button>
        </div>

        {pastTrips.length > 0 && (
          <>
            <div className="hub-section">
              <span>the archive</span>
              <span className="ct">{pastTrips.length}</span>
            </div>
            {pastTrips.map((t) => (
              <div key={t.id} className="hub-trip-card">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="nm">{t.name}</div>
                  <div className="dt">
                    {formatDateShort(t.start_date)} to {formatDateShort(t.end_date)} · {t.primary_currency}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {isJoinedTrip(t) && <span className="joined-badge">JOINED</span>}
                  <div className="badge">ended</div>
                </div>
              </div>
            ))}
          </>
        )}

        {pastTrips.length === 0 && !activeTrip && (
          <div className="hub-empty">
            <div className="big">no trips yet.</div>
            it's quiet. shiny new keypad,<br />vague sense of optimism.
          </div>
        )}

        <button className="hub-signout" onClick={onSignOut}>sign out</button>
      </div>
    </div>
  );
}
