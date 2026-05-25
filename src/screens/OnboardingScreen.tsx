import { useState, useRef } from 'react';
import { sb } from '../lib/supabase';
import { initialFor, uid } from '../lib/helpers';
import { MEMBER_COLORS } from '../components/Avatar';

interface OnboardingScreenProps {
  familyId: string;
  userEmail?: string | null;
  onComplete: () => void | Promise<void>;
  onSignOut: () => void;
}

interface CardDraft { nick: string; last4: string; }

export function OnboardingScreen({ familyId, userEmail, onComplete, onSignOut }: OnboardingScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submitLock = useRef(false);

  const defaultName = userEmail ? userEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';
  const [myName, setMyName] = useState(defaultName);
  const [myColor, setMyColor] = useState<string>(MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)]);
  const [cards, setCards] = useState<CardDraft[]>([]);

  function addCard()           { setCards((p) => [...p, { nick: '', last4: '' }]); }
  function updateCard(i: number, patch: Partial<CardDraft>) {
    setCards((p) => p.map((c, ix) => (ix === i ? { ...c, ...patch } : c)));
  }
  function removeCard(i: number) { setCards((p) => p.filter((_, ix) => ix !== i)); }

  const canContinue1 = true;
  const canContinue2 = myName.trim().length > 0;

  async function finish() {
    if (submitLock.current) return;
    submitLock.current = true;
    setBusy(true); setErr(null);
    try {
      if (!familyId) throw new Error('Family not loaded. Sign out and back in.');

      const { error: fErr } = await sb.from('families').update({ name: myName.trim() }).eq('id', familyId);
      if (fErr) throw new Error('family update failed: ' + fErr.message);

      const { data: existingMembers, error: emErr } = await sb.from('family_members')
        .select('id').eq('family_id', familyId);
      if (emErr) throw new Error('members lookup failed: ' + emErr.message);

      let myMemberId: string;
      if (existingMembers && existingMembers.length > 0) {
        myMemberId = existingMembers[0].id;
        await sb.from('family_members').update({
          name: myName.trim(), initial: initialFor(myName), color: myColor,
        }).eq('id', myMemberId);
      } else {
        myMemberId = uid('mem');
        const { error: mErr } = await sb.from('family_members').insert([{
          id: myMemberId, family_id: familyId,
          name: myName.trim(), initial: initialFor(myName),
          color: myColor, position: 0,
        }]);
        if (mErr) throw new Error('member insert failed: ' + mErr.message);
      }

      const { data: existingCards } = await sb.from('family_cards').select('nick').eq('family_id', familyId);
      const existingCardNicks = new Set((existingCards || []).map((c) => c.nick));
      const cardRows = cards
        .filter((c) => c.nick.trim() && !existingCardNicks.has(c.nick.trim()))
        .map((c, i) => ({
          id: uid('card'),
          family_id: familyId,
          owner_member_id: myMemberId,
          nick: c.nick.trim(),
          last4: c.last4.trim() || null,
          position: i,
        }));
      if (cardRows.length) {
        const { error: cErr } = await sb.from('family_cards').insert(cardRows);
        if (cErr) throw new Error('card insert failed: ' + cErr.message);
      }

      await onComplete();
    } catch (e: any) {
      console.error('onboarding finish failed', e);
      setErr(String(e?.message || e));
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }

  function renderWelcome() {
    return (
      <>
        <div className="wiz-prompt">Welcome to Dad Paid.</div>
        <div className="wiz-help" style={{ marginBottom: 18 }}>
          The family travel expense tracker. Mild guilt, lightly tracked.
        </div>

        <div className="wiz-label">How it works</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
          {[
            'Start a trip. Hit the keypad. Each expense logs in about 8 seconds.',
            'Invite family or friends with a share link. Each person uses their own email.',
            'At trip end we compute who owes whom. Settle outside the app, however you usually do.',
            "Works offline. Add expenses on the Tube, syncs when you're back.",
          ].map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div className="wiz-initial" style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, paddingTop: 4 }}>{line}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: 12, background: '#f1ecdf', border: '2px solid #0e0e0e', borderRadius: 4, fontSize: 12, lineHeight: 1.5, color: 'rgba(14,14,14,0.7)' }}>
          Next: set up your profile. Then the hub appears and you can either start a new trip or join one with a code.
        </div>
      </>
    );
  }

  function renderProfile() {
    return (
      <>
        <div className="wiz-prompt">Who are you?</div>
        <div className="wiz-help">
          Just your name and a color. Each person uses their own email. Friends and family join your trips with their own accounts via an invite link.
        </div>

        <div className="wiz-label">Your name</div>
        <div className="wiz-member-row">
          <div className="wiz-initial" style={{ background: myColor, color: '#0e0e0e' }}>
            {initialFor(myName) || '?'}
          </div>
          <input
            autoFocus
            className="wiz-input-sm"
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
            placeholder="e.g. Sahil"
          />
        </div>

        <div className="wiz-label" style={{ marginTop: 24 }}>Your color</div>
        <div className="color-row">
          {MEMBER_COLORS.map((c) => (
            <div
              key={c}
              className={`swatch ${myColor === c ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setMyColor(c)}
              aria-label={`color ${c}`}
            />
          ))}
        </div>
      </>
    );
  }

  function renderCards() {
    return (
      <>
        <div className="wiz-prompt">Your payment cards?</div>
        <div className="wiz-help">
          Optional. Last 4 digits help you remember which card paid for something later. You can add more from Settings.
        </div>

        {cards.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'rgba(14,14,14,0.5)', fontSize: 13 }}>
            No cards yet. That's fine. Cash works for everything.
          </div>
        )}

        {cards.map((c, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div className="wiz-card-row">
              <input
                className="wiz-input-sm"
                value={c.nick}
                onChange={(e) => updateCard(i, { nick: e.target.value })}
                placeholder="Nickname (e.g. HDFC Forex)"
                style={{ flex: 2 }}
              />
              <input
                className="wiz-input-sm"
                value={c.last4}
                onChange={(e) => updateCard(i, { last4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="Last 4"
                style={{ maxWidth: 80 }}
                inputMode="numeric"
              />
              <button className="wiz-remove" onClick={() => removeCard(i)} aria-label="remove">×</button>
            </div>
          </div>
        ))}

        <button className="wiz-add" onClick={addCard}>+ ADD CARD</button>
      </>
    );
  }

  const stepTitle = step === 1 ? 'Step 1 of 3 · Welcome'
                  : step === 2 ? 'Step 2 of 3 · You'
                  : 'Step 3 of 3 · Cards';

  return (
    <div className="wiz-stage">
      <div className="wiz-head">
        <div className="wiz-head-title">SETUP</div>
        <div className="wiz-head-sub">{stepTitle}</div>
        <div className="wiz-steps">
          <div className={`wiz-step-dot ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`} />
          <div className={`wiz-step-dot ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`} />
          <div className={`wiz-step-dot ${step === 3 ? 'active' : ''}`} />
        </div>
      </div>

      <div className="wiz-body">
        {step === 1 && renderWelcome()}
        {step === 2 && renderProfile()}
        {step === 3 && renderCards()}

        {err && <div className="login-err" style={{ marginTop: 16 }}>{err}</div>}

        {step === 1 && (
          <button
            onClick={onSignOut}
            style={{
              marginTop: 32, background: 'transparent', border: 'none',
              color: 'rgba(14,14,14,0.4)', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
              padding: 12, width: '100%',
            }}
          >sign out instead</button>
        )}
      </div>

      <div className="wiz-foot">
        {step > 1 && (
          <button className="wiz-btn ghost" onClick={() => setStep((step - 1) as 1 | 2 | 3)}>← BACK</button>
        )}
        {step < 3 && (
          <button
            className="wiz-btn primary"
            disabled={step === 1 ? !canContinue1 : !canContinue2}
            onClick={() => setStep((step + 1) as 1 | 2 | 3)}
          >CONTINUE →</button>
        )}
        {step === 3 && (
          <button
            className="wiz-btn primary"
            disabled={busy}
            onClick={finish}
            style={{ flex: 1 }}
          >
            {busy ? 'SAVING…' : 'FINISH SETUP'}
          </button>
        )}
      </div>
    </div>
  );
}
