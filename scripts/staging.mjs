#!/usr/bin/env node
/**
 * Staging: the deployment shape, runnable from a clone.
 *
 * The README describes the default deployment as one origin - static
 * `client/dist` with the same host proxying `/api` to the server - and until
 * now that shape existed only as something someone assembled by hand for a
 * particular check. A shape nobody can re-create is not a thing you can point a
 * reviewer at, so this is it as a script:
 *
 *   npm run staging        # builds the client, starts the server, serves both on :4173
 *
 * Three things it deliberately does the way a deployment does them:
 *
 * - **It runs on Postgres.** A deployment sets DATABASE_URL; the JSONL store is
 *   single-process by construction. Staging without it would be exercising a
 *   different audit store than the one that records real answers, so the script
 *   refuses rather than quietly downgrading. `--jsonl` says so out loud for the
 *   case where you only want to look at screens.
 * - **It waits on the real readiness check.** There is no health endpoint on
 *   purpose (the spec locks the server to two), so readiness is
 *   GET /api/exercises/ex-001/window - content loading plus chart generation,
 *   not a bare 200.
 * - **127.0.0.1 is a secure context**, so the service worker registers and the
 *   PWA shell is actually testable here. Over http on any other host it will
 *   not, which is the one thing staging cannot tell you about production.
 */
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const dist = join(root, 'client', 'dist');

const edgePort = Number(process.env.STAGING_PORT ?? 4173);
const apiPort = Number(process.env.PORT ?? 8787);
const apiHost = '127.0.0.1';
const apiOrigin = `http://${apiHost}:${apiPort}`;

const allowJsonl = process.argv.includes('--jsonl');

if (!process.env.DATABASE_URL && !allowJsonl) {
  console.error(
    [
      'staging: DATABASE_URL is not set.',
      '',
      'A deployment runs the Postgres audit store; the JSONL file is single-process',
      'by construction, so staging on it would prove the wrong store. Set DATABASE_URL',
      '(it is a secret - take it from your secret store, do not paste it into a file',
      'in the repo), or pass --jsonl to accept the file-backed store for a screens-only',
      'pass.',
    ].join('\n'),
  );
  process.exit(1);
}

const distStat = await stat(dist).catch(() => null);
if (!distStat?.isDirectory()) {
  console.error(`staging: no built client at ${dist}. Run: npm run build --workspace @tikerino/client`);
  process.exit(1);
}

const TYPES = new Map(
  Object.entries({
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
    '.woff2': 'font/woff2',
  }),
);

// What a static host gets right and a naive one does not: the entry document and
// the service worker must never be served from cache, or a deploy is invisible
// until the browser decides otherwise. Everything Vite fingerprints can be
// cached forever, because its name changes when its bytes do.
function cacheControl(pathname) {
  if (pathname === '/' || pathname.endsWith('.html')) return 'no-cache';
  if (pathname.endsWith('sw.js') || pathname.endsWith('registerSW.js')) return 'no-cache';
  if (pathname.endsWith('.webmanifest')) return 'no-cache';
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  return 'public, max-age=3600';
}

async function serveStatic(req, res, pathname) {
  // decodeURIComponent throws on a malformed escape ("/%"), which a crawler or a
  // fuzzer will send within the hour. Unhandled, it takes the whole edge down.
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Bad request path\n');
    return;
  }

  // normalize() before join() so ../ in a request cannot climb out of dist.
  const rel = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  let file = join(dist, rel);
  let info = await stat(file).catch(() => null);

  if (info?.isDirectory()) {
    file = join(file, 'index.html');
    info = await stat(file).catch(() => null);
  }

  if (!info?.isFile()) {
    // navigateFallback, the same rule the service worker uses: a path with no
    // file behind it is a route, not a 404 - unless it looks like an asset, in
    // which case answering with the app shell would turn a missing file into a
    // baffling MIME error.
    if (extname(rel) !== '') {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found\n');
      return;
    }
    file = join(dist, 'index.html');
    info = await stat(file).catch(() => null);
    if (!info?.isFile()) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('No index.html in client/dist\n');
      return;
    }
    pathname = '/index.html';
  }

  res.writeHead(200, {
    'content-type': TYPES.get(extname(file)) ?? 'application/octet-stream',
    'content-length': info.size,
    'cache-control': cacheControl(pathname),
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
}

async function proxyApi(req, res, url) {
  const body =
    req.method === 'GET' || req.method === 'HEAD'
      ? undefined
      : await new Promise((done, fail) => {
          const chunks = [];
          req.on('data', (c) => chunks.push(c));
          req.on('end', () => done(Buffer.concat(chunks)));
          req.on('error', fail);
        });

  try {
    const upstream = await fetch(apiOrigin + url.pathname + url.search, {
      method: req.method,
      headers: { ...(req.headers['content-type'] ? { 'content-type': req.headers['content-type'] } : {}) },
      body,
    });
    const payload = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      'content-type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
      'content-length': payload.length,
      // Grades and chart windows are never cacheable at the edge.
      'cache-control': 'no-store',
    });
    res.end(payload);
  } catch (error) {
    // The learner-visible failure mode of a dead API is "you appear to be
    // offline", which is worth distinguishing from a real network problem.
    console.error(`staging: /api upstream unreachable: ${error.message}`);
    res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'staging edge could not reach the API' }));
  }
}

const server = spawn('npm', ['run', 'start', '--workspace', '@tikerino/server'], {
  cwd: root,
  stdio: ['ignore', 'inherit', 'inherit'],
  env: { ...process.env, HOST: apiHost, PORT: String(apiPort) },
});

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  server.kill('SIGTERM');
  edge.close(() => process.exit(code));
  // The server drains its pool on SIGTERM; do not wait forever if it does not.
  setTimeout(() => process.exit(code), 5000).unref();
}

server.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`staging: the server exited (${code}) - nothing to stage.`);
    shutdown(code ?? 1);
  }
});

const edge = createServer((req, res) => {
  // One catch around both handlers: a staging edge that dies on one bad request
  // wastes a reviewer's afternoon, and the failure looks like "staging is down"
  // rather than like the request that caused it.
  const handled = (async () => {
    const url = new URL(req.url, `http://127.0.0.1:${edgePort}`);
    if (url.pathname.startsWith('/api/')) {
      await proxyApi(req, res, url);
      return;
    }
    await serveStatic(req, res, url.pathname);
  })();

  handled.catch((error) => {
    console.error(`staging: ${req.method} ${req.url} failed: ${error.message}`);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Staging edge error\n');
  });
});

edge.listen(edgePort, '127.0.0.1', async () => {
  const ready = await waitForApi();
  if (!ready) {
    console.error('staging: the API did not become ready in 60s.');
    shutdown(1);
    return;
  }
  console.log(
    [
      '',
      `  Tikerino staging on http://127.0.0.1:${edgePort}`,
      `  one origin: client/dist served here, /api proxied to ${apiOrigin}`,
      `  audit store: ${process.env.DATABASE_URL ? 'Postgres' : 'JSONL (--jsonl)'}`,
      '',
    ].join('\n'),
  );
});

async function waitForApi() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const probe = await fetch(`${apiOrigin}/api/exercises/ex-001/window`);
      if (probe.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((done) => setTimeout(done, 1000));
  }
  return false;
}

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => shutdown(0));
