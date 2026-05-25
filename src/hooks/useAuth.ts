import { useState, useEffect } from 'react';
import { sb } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email?: string | null;
}

export function useAuth(): { user: AuthUser | null; loading: boolean } {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUser((data.session?.user as AuthUser | undefined) || null);
      setLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setUser((session?.user as AuthUser | undefined) || null);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);
  return { user, loading };
}
