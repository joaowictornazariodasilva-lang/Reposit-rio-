import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { compress } from 'hono/compress';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from '@hono/node-server/serve-static';
import { PricingError } from '@nazario/shared';
import { config } from './config';
import { PaymentError, type PaymentProvider } from './payments';
import type { Repositories } from './repositories/types';
import { adminRoutes } from './routes/admin';
import { publicRoutes } from './routes/public';
import { webhookRoutes } from './routes/webhooks';
import { createOrderService, DomainError } from './services/orders';

export function createApp(repos: Repositories, payments: PaymentProvider) {
  const app = new Hono();
  const orders = createOrderService(repos, payments);
  const uploadsDir = join(dirname(config.dataFile), 'uploads');

  app.use(
    '*',
    secureHeaders({
      crossOriginResourcePolicy: 'same-origin',
      referrerPolicy: 'strict-origin-when-cross-origin',
      contentSecurityPolicy: buildCsp(config.webDist),
    }),
  );
  app.use('*', compress());
  if (config.corsOrigin) {
    app.use('/api/*', cors({ origin: config.corsOrigin, credentials: true }));
  }
  app.use('/api/*', bodyLimit({ maxSize: 4 * 1024 * 1024 }));

  app.get('/api/health', (c) => c.json({ ok: true }));
  app.route('/api', publicRoutes(repos, orders, payments));
  app.route('/api/admin', adminRoutes(repos, orders, uploadsDir));
  app.route('/api/webhooks', webhookRoutes(repos, orders));

  // Unknown API routes are JSON 404s, never the SPA shell.
  app.all('/api/*', (c) => c.json({ error: 'Não encontrado.' }, 404));

  app.use(
    '/uploads/*',
    serveStatic({
      root: uploadsDir,
      rewriteRequestPath: (path) => path.replace(/^\/uploads/, ''),
      onFound: (_path, c) => c.header('Cache-Control', 'public, max-age=31536000, immutable'),
    }),
  );

  if (config.webDist) {
    const webDist = config.webDist;
    app.use(
      '/assets/*',
      serveStatic({ root: webDist, onFound: (_p, c) => c.header('Cache-Control', 'public, max-age=31536000, immutable') }),
    );
    app.use(
      '/images/*',
      serveStatic({ root: webDist, onFound: (_p, c) => c.header('Cache-Control', 'public, max-age=2592000') }),
    );
    app.use('*', serveStatic({ root: webDist }));
    // Missing files are real 404s; only extension-less paths fall back to the SPA.
    app.get('/assets/*', (c) => c.text('Not found', 404));
    app.get('/images/*', (c) => c.text('Not found', 404));
    app.get('*', async (c, next) => (/\.[a-z0-9]{2,5}$/i.test(c.req.path) ? c.text('Not found', 404) : next()));
    app.get('*', serveStatic({ root: webDist, path: 'index.html' }));
  }

  app.notFound((c) => c.json({ error: 'Não encontrado.' }, 404));

  app.onError((error, c) => {
    if (error instanceof DomainError) return c.json({ error: error.message }, error.status);
    if (error instanceof PricingError) return c.json({ error: error.message, code: error.code }, 422);
    if (error instanceof PaymentError) return c.json({ error: error.message }, 502);
    console.error(error);
    return c.json({ error: 'Erro inesperado. Tente novamente.' }, 500);
  });

  return app;
}

/**
 * Strict CSP. Inline <script> blocks in the built index.html (the LCP preload
 * hint) are allowed by hash, so no 'unsafe-inline' is needed for scripts.
 */
function buildCsp(webDist?: string) {
  const scriptHashes: string[] = [];
  if (webDist) {
    try {
      const html = readFileSync(join(webDist, 'index.html'), 'utf8');
      for (const match of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)) {
        scriptHashes.push(`'sha256-${createHash('sha256').update(match[1] ?? '').digest('base64')}'`);
      }
    } catch {
      /* dev: no built index.html */
    }
  }
  return {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", ...scriptHashes],
    // Motion writes inline style attributes for transforms.
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    fontSrc: ["'self'"],
    connectSrc: ["'self'", 'https://viacep.com.br'],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
  };
}
