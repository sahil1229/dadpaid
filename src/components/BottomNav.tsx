import type { Tab } from '../types';

interface BottomNavProps {
  tab: Tab;
  onTab: (t: Tab) => void;
}

export function BottomNav({ tab, onTab }: BottomNavProps) {
  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: 'add', label: 'ADD',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
    },
    {
      id: 'log', label: 'LOG',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
    {
      id: 'summary', label: 'SUMMARY',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="18" />
          <rect x="14" y="3" width="7" height="9" />
        </svg>
      ),
    },
    {
      id: 'next', label: 'NEXT',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15 9 22 9 17 14 18 22 12 18 6 22 7 14 2 9 9 9 12 2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="nav">
      {tabs.map((t) => (
        <button key={t.id} className={`nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => onTab(t.id)}>
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
