import { describe, expect, it } from 'vitest';

import { cacheControlFor } from '../server/src/static-cache';

describe('static cache headers', () => {
  it('lets hashed assets and versioned fonts cache for a year', () => {
    expect(cacheControlFor('/app/client/dist/assets/index-C9V4uVpb.js')).toBe('public, max-age=31536000, immutable');
    expect(cacheControlFor('/app/client/dist/fonts/nunito-v32-latin.woff2')).toBe('public, max-age=31536000, immutable');
  });

  it('makes the shell, service worker and manifest revalidate so deploys land', () => {
    for (const p of ['/app/client/dist/index.html', '/app/client/dist/sw.js', '/app/client/dist/registerSW.js', '/app/client/dist/manifest.webmanifest']) {
      expect(cacheControlFor(p)).toBe('no-cache');
    }
  });
});
