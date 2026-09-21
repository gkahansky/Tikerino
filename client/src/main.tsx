import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/index.css';

const root = createRoot(document.getElementById('root')!);

// Upgrade bridge: old root-scoped service workers used the learner shell as a
// navigation fallback for every path, including the later server-owned /ops
// surface. A client that was already open under that worker can therefore show
// the learner UI at an /ops URL. Never render that mismatch: ask the root worker
// to update, then perform one network reload so the server can return owner auth.
if (location.pathname === '/ops' || location.pathname.startsWith('/ops/')) {
  void navigator.serviceWorker?.getRegistration('/').then(async (registration) => {
    await registration?.update().catch(() => undefined);
    const key = 'tikerino_ops_upgrade_reload';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      location.reload();
    }
  });
}

/**
 * The content pack is validated the moment ./content is imported. If it fails,
 * the app refuses to run and says why, rather than rendering a curriculum that
 * does not match the schema.
 */
async function start(): Promise<void> {
  try {
    const [{ App }, { AppStateProvider }] = await Promise.all([
      import('./App'),
      import('./app-state'),
    ]);
    root.render(
      <StrictMode>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </StrictMode>,
    );
  } catch (error) {
    root.render(
      <main style={{ maxWidth: 430, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: 22 }}>Tikerino cannot start</h1>
        <p style={{ fontSize: 18, lineHeight: 1.6 }}>
          The content pack did not pass validation, so the app stopped instead of showing a
          curriculum that does not match the schema.
        </p>
        <pre
          style={{
            fontSize: 16,
            whiteSpace: 'pre-wrap',
            background: '#FFF',
            border: '1px solid #E8E4DB',
            borderRadius: 12,
            padding: 12,
          }}
        >
          {(error as Error).message}
        </pre>
      </main>,
    );
  }
}

void start();
