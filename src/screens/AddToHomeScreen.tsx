import { useState } from 'react';

export function detectPlatform(): 'installed' | 'ios' | 'android' | 'desktop' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  if (isStandalone) return 'installed';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

let deferredInstallPrompt: any = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });
}

interface AddToHomeScreenProps { onDone: () => void; }

export function AddToHomeScreen({ onDone }: AddToHomeScreenProps) {
  const platform = detectPlatform();
  const [busy, setBusy] = useState(false);

  async function nativeInstall() {
    if (!deferredInstallPrompt) return;
    setBusy(true);
    try {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      onDone();
    } finally { setBusy(false); }
  }

  return (
    <div className="a2hs-stage">
      <div className="a2hs-head">
        <div className="wiz-head-title">ALMOST DONE</div>
        <div className="wiz-head-sub">One last optional thing</div>
      </div>

      <div className="a2hs-icon-wrap">
        <div className="a2hs-icon"><img src="/apple-touch-icon.png" alt="Dad Paid icon" /></div>
      </div>

      <div className="a2hs-body">
        <div className="a2hs-prompt">Add Dad Paid to your Home Screen</div>
        <div className="a2hs-help">
          Opens like a native app. No URL bar, full screen, faster load. Works fully offline once installed. Optional.
        </div>

        {platform === 'ios' && (
          <>
            {([
              <>Tap the <strong>Share</strong> button at the bottom of Safari</>,
              <>Scroll and tap <strong>Add to Home Screen</strong></>,
              <>Tap <strong>Add</strong> in the top-right</>,
              <>Open Dad Paid from your home screen. Done.</>,
            ] as React.ReactNode[]).map((line, i) => (
              <div key={i} className="a2hs-step">
                <div className="a2hs-step-num">{i + 1}</div>
                <div className="a2hs-step-body">{line}</div>
              </div>
            ))}
          </>
        )}

        {platform === 'android' && (
          deferredInstallPrompt ? (
            <div className="a2hs-step" style={{ justifyContent: 'center' }}>
              <div className="a2hs-step-body" style={{ textAlign: 'center', flex: 1 }}>
                Tap <strong>Install</strong> below. Chrome will show its install prompt.
              </div>
            </div>
          ) : (
            ([
              <>Tap the menu <strong>⋮</strong> in the top-right of Chrome</>,
              <>Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>)</>,
              <>Confirm <strong>Install</strong></>,
            ] as React.ReactNode[]).map((line, i) => (
              <div key={i} className="a2hs-step">
                <div className="a2hs-step-num">{i + 1}</div>
                <div className="a2hs-step-body">{line}</div>
              </div>
            ))
          )
        )}

        {platform === 'desktop' && (
          <div className="a2hs-step" style={{ background: '#f1ecdf' }}>
            <div className="a2hs-step-body" style={{ flex: 1, color: 'rgba(14,14,14,0.55)', fontSize: 12 }}>
              Most users will install on their phone instead. Open <strong>dadpaid.vercel.app</strong> in mobile Safari or Chrome to get the best experience.
            </div>
          </div>
        )}
      </div>

      <div className="a2hs-foot">
        <button className="skip" onClick={onDone}>SKIP</button>
        {platform === 'android' && deferredInstallPrompt && (
          <button className="primary" onClick={nativeInstall} disabled={busy}>
            {busy ? 'INSTALLING…' : 'INSTALL →'}
          </button>
        )}
        {(!deferredInstallPrompt || platform !== 'android') && (
          <button className="primary" onClick={onDone}>GOT IT →</button>
        )}
      </div>
    </div>
  );
}
