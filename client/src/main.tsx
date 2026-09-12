import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/index.css';

const root = createRoot(document.getElementById('root')!);

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
