import type { FastifyReply } from 'fastify';

/**
 * Cache headers for the built client.
 *
 * Vite names everything under /assets/ by content hash, and the self-hosted
 * fonts carry their upstream version in the filename, so a returning learner on
 * slow 4G never needs to re-check them: a change ships under a new name.
 * Everything else - index.html, the service worker, the manifest - must be
 * revalidated every time, or a deploy would not reach people.
 */
const IMMUTABLE = 'public, max-age=31536000, immutable';
const REVALIDATE = 'no-cache';

export function cacheControlFor(path: string): string {
  const p = path.replaceAll('\\', '/');
  if (p.includes('/assets/') || p.includes('/fonts/')) return IMMUTABLE;
  return REVALIDATE;
}

export function setStaticCacheHeaders(reply: FastifyReply, path: string): void {
  reply.header('Cache-Control', cacheControlFor(path));
}
