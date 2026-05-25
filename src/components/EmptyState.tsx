import type { ReactNode } from 'react';

interface EmptyStateProps {
  glyph?: ReactNode;
  line: ReactNode;
  sub?: ReactNode;
  cta?: string;
  onCta?: () => void;
}

export function EmptyState({ glyph, line, sub, cta, onCta }: EmptyStateProps) {
  return (
    <div className="empty">
      {glyph && <div className="empty-glyph">{glyph}</div>}
      <div className="empty-line">{line}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {cta && <button className="empty-cta" onClick={onCta}>{cta}</button>}
    </div>
  );
}
