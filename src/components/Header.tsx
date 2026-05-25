import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  sub?: string;
  right?: string;
  rightSub?: string;
  onGear?: () => void;
  onBack?: () => void;
  onHome?: () => void;
  offline?: boolean;
  extraLeft?: ReactNode;
  syncLive?: boolean;
}

export function Header({
  title, sub, right, rightSub,
  onGear, onBack, onHome, offline, extraLeft, syncLive,
}: HeaderProps) {
  return (
    <div className="header">
      {onBack && (
        <button className="h-back" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          BACK
        </button>
      )}
      <div className="header-row">
        <div>
          <div className="h-title">{title}</div>
          {sub && <div className="h-sub">{sub}</div>}
          {offline && (
            <div className="h-offline"><span className="pulse" />OFFLINE</div>
          )}
          {!offline && syncLive && (
            <div className="h-sync"><span className="dot" /> LIVE</div>
          )}
        </div>
        {right && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <div>
              <div className="h-right">{right}</div>
              {rightSub && <div className="h-right-sub">{rightSub}</div>}
            </div>
            {extraLeft}
            {onHome && (
              <button className="h-home" onClick={onHome} aria-label="home">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </button>
            )}
            {onGear && (
              <button className="h-gear" onClick={onGear} aria-label="settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
