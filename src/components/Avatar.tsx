import type { Member } from '../types';
import { memberOfIn } from '../lib/helpers';

interface AvatarProps {
  id: string;
  family?: { members?: Member[] };
  size?: 'sm' | 'lg';
  selected?: boolean;
}

export function Avatar({ id, family, size = 'sm', selected = false }: AvatarProps) {
  const m = memberOfIn(family, id);
  const color = m?.color || '#e9c44b';
  const isLg = size === 'lg';

  const style: React.CSSProperties = isLg && !selected
    ? { background: 'transparent', color: '#0e0e0e', border: `2px solid ${color}` }
    : { background: color, color: '#0e0e0e' };

  return (
    <div className={`ava ${isLg ? 'ava-lg' : ''}`} style={style}>
      {m?.initial || '?'}
    </div>
  );
}

export const MEMBER_COLORS = [
  '#e9c44b', '#e8746a', '#3ba982', '#d6ad32',
  '#d97ec9', '#5da9e6', '#8b9d3f', '#9c6df5',
] as const;
