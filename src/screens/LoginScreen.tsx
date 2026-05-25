import { useState } from 'react';
import { sb } from '../lib/supabase';

type Mode = 'signup' | 'login';

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email.trim()) return;
    setBusy(true); setErr(null);
    try {
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: mode === 'signup',
          emailRedirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (mode === 'login' && (msg.includes('not found') || msg.includes('signups not allowed') || msg.includes('signup is disabled'))) {
          setErr('No account with that email. Tap SIGN UP to create one.');
        } else {
          setErr(error.message);
        }
      } else {
        setSent(true);
      }
    } catch (e: any) { setErr(String(e?.message || e)); }
    setBusy(false);
  }

  async function googleSignIn() {
    setGoogleBusy(true); setErr(null);
    try {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) { setErr(error.message); setGoogleBusy(false); }
    } catch (e: any) {
      setErr(String(e?.message || e));
      setGoogleBusy(false);
    }
  }

  return (
    <div className="login-stage">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-title">DAD PAID</div>
          <div className="login-tagline">Because on every trip, dad paid.</div>
          <div className="login-tagline" style={{ marginTop: 4, color: 'rgba(14,14,14,0.4)', fontSize: 10 }}>
            (and someone had to log it)
          </div>
        </div>

        {sent ? (
          <div className="login-sent">
            <div className="login-sent-line">CHECK YOUR EMAIL</div>
            <div className="login-sent-meta">We sent a magic link to<br /><strong>{email}</strong></div>
            <button className="login-back" onClick={() => setSent(false)}>USE A DIFFERENT EMAIL</button>
          </div>
        ) : (
          <form className="login-form" onSubmit={submit}>
            <div className="login-tabs">
              <button type="button" className={`login-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setErr(null); }}>SIGN UP</button>
              <button type="button" className={`login-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setErr(null); }}>LOG IN</button>
            </div>

            <button type="button" className="login-google" onClick={googleSignIn} disabled={googleBusy || busy}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{googleBusy ? 'OPENING…' : (mode === 'signup' ? 'SIGN UP WITH GOOGLE' : 'LOG IN WITH GOOGLE')}</span>
            </button>

            <div className="login-divider">or</div>

            <label className="login-label">EMAIL</label>
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {err && <div className="login-err">{err}</div>}
            <button type="submit" className="login-cta" disabled={busy || !email.trim()}>
              {busy ? 'SENDING…' : mode === 'signup' ? 'CREATE ACCOUNT ›' : 'SEND LOGIN LINK ›'}
            </button>
            <div className="login-help">
              {mode === 'signup'
                ? "New here. We'll mail you a one-tap link to finish signing up. No password."
                : "Welcome back. We'll mail you a one-tap login link. No password to remember."}
            </div>
          </form>
        )}

        {!sent && (
          <>
            <div className="login-jokes">
              <div className="qa">
                <div className="q">Is this Splitwise?</div>
                <div>No. Splitwise is for roommates arguing over rent. Dad Paid is for trips.</div>
              </div>
              <div className="qa">
                <div className="q">Do I need to be a dad?</div>
                <div>No. The name is mostly aspirational. The math doesn't check.</div>
              </div>
              <div className="qa">
                <div className="q">Will my data be sold?</div>
                <div>No. We're not big enough to be evil yet.</div>
              </div>
            </div>

            <div className="login-foot">
              <a href="/about.html">About &amp; Privacy</a>
              <span className="sep">·</span>
              <span>v0.3</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
