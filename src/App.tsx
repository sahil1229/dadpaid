/* Placeholder App during migration.
 *
 * The production app is still served by /index.html (the legacy monolith)
 * until the Vite/TypeScript port is complete screen-by-screen. This file
 * exists so the new build pipeline type-checks and vite build works, and
 * is where each migrated screen will land.
 */
import { useAuth } from './hooks/useAuth';

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0e0e0e', color: '#e9c44b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Funnel Display", sans-serif', fontWeight: 800,
        letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 14,
      }}>loading…</div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#fffaf0', color: '#0e0e0e',
      padding: 32, fontFamily: '"Funnel Sans", system-ui, sans-serif',
    }}>
      <h1 style={{
        fontFamily: '"Funnel Display", sans-serif', fontWeight: 900,
        background: '#e9c44b', display: 'inline-block', padding: '8px 14px',
        border: '2px solid #0e0e0e', boxShadow: '4px 4px 0 #0e0e0e',
        fontSize: 24, margin: 0,
      }}>DAD PAID · v0.3 build</h1>
      <p style={{ marginTop: 24, fontSize: 14, lineHeight: 1.6 }}>
        Vite + TypeScript scaffold is live. Production traffic still served by
        the legacy monolith at <code>/index.html</code> while each screen is
        ported here.
      </p>
      <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(14,14,14,0.6)' }}>
        Signed in as: <strong>{user?.email || 'not signed in'}</strong>
      </p>
    </div>
  );
}
