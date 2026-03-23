import { useState, useEffect, type ReactNode } from 'react';
import { getDatabase } from '@/lib/database';

interface Props {
  children: ReactNode;
}

/**
 * Wraps the app and ensures the SQLite database is initialized before
 * rendering children. Shows a loading spinner or error message with
 * inline styles (no dependency on CSS variables or Tailwind) so they
 * are always visible even if stylesheets fail to load.
 */
export default function AppInitializer({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        console.log('[AppInit] Starting database initialization...');
        await getDatabase();
        console.log('[AppInit] Database ready');
        setReady(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[AppInit] Database initialization failed:', message);
        setError(message);
      }
    }
    init();
  }, []);

  // --- Error state: always visible with inline styles ---
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F9FAFB',
          padding: '2rem',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '28rem',
            borderRadius: '1rem',
            backgroundColor: '#fff',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              margin: '0 auto 1rem',
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v2m0 4h.01" />
            </svg>
          </div>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '0.5rem',
            }}
          >
            Database Error
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#6366F1',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // --- Loading state: spinner with inline styles so it's always visible ---
  if (!ready) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F9FAFB',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              margin: '0 auto 1rem',
              width: '2.5rem',
              height: '2.5rem',
              border: '4px solid #E0E7FF',
              borderTopColor: '#6366F1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6B7280' }}>
            Loading Oh Right!...
          </p>
          {/* Inline keyframes for the spinner */}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
