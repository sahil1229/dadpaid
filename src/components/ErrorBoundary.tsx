import React from 'react';

interface ErrorBoundaryProps { children: React.ReactNode; }
interface ErrorBoundaryState { error: Error | null; info: React.ErrorInfo | null; }

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[dadpaid] crash:', error);
    console.error('[dadpaid] component stack:', info?.componentStack);
    this.setState({ info });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', background: '#fffaf0', color: '#0e0e0e',
        padding: '32px 22px max(40px, env(safe-area-inset-bottom))',
        fontFamily: '"IBM Plex Mono", Menlo, monospace', fontSize: 12, lineHeight: 1.6,
      }}>
        <div style={{
          background: '#c0392b', color: '#fffaf0', padding: '12px 16px',
          border: '2px solid #0e0e0e', boxShadow: '4px 4px 0 #0e0e0e',
          marginBottom: 24,
          fontFamily: '"Funnel Display", sans-serif', fontWeight: 800,
          fontSize: 18, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>Something broke</div>

        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
          {String(this.state.error?.message || this.state.error)}
        </div>

        <details style={{
          margin: '12px 0', padding: '10px 12px',
          background: '#f1ecdf', border: '1.5px solid #0e0e0e',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>stack trace</summary>
          <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(14,14,14,0.7)' }}>
            {String(this.state.error?.stack || '')}
            {this.state.info?.componentStack || ''}
          </div>
        </details>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={() => this.setState({ error: null, info: null })}
            style={{
              flex: 1, padding: 14, background: '#e9c44b', color: '#0e0e0e',
              border: '2px solid #0e0e0e', boxShadow: '4px 4px 0 #0e0e0e',
              fontFamily: '"Funnel Display", sans-serif', fontWeight: 800, fontSize: 13,
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >RETRY</button>
          <button
            onClick={() => window.location.reload()}
            style={{
              flex: 1, padding: 14, background: 'transparent', color: '#0e0e0e',
              border: '2px solid #0e0e0e',
              fontFamily: '"Funnel Display", sans-serif', fontWeight: 800, fontSize: 13,
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >RELOAD</button>
        </div>
      </div>
    );
  }
}
