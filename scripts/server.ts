import http from 'node:http';
import { readFileSync, statSync, createReadStream, existsSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spin } from '../src/js/engine/engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const publicDir = resolve(root, 'dist-web');
const publishIndexPath = resolve(root, 'dist-publish', 'index.json');
const configPath = resolve(root, 'config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

function contentType(p: string): string {
  const ext = extname(p).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.ico': return 'image/x-icon';
    default: return 'application/octet-stream';
  }
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, obj: any) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body).toString(),
    'cache-control': 'no-store',
  });
  res.end(body);
}

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  let url = (req.url || '/').split('?')[0];
  if (url === '/') url = '/index.html';
  // prevent path traversal
  const cleaned = url.replace(/\\/g, '/').replace(/\.\.+/g, '');
  const filePath = join(publicDir, cleaned);
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  try {
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }
    res.writeHead(200, {
      'content-type': contentType(filePath),
      'content-length': stat.size.toString(),
    });
    createReadStream(filePath).pipe(res);
  } catch (e: any) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Internal server error');
  }
}

const server = http.createServer(async (req, res) => {
  const method = (req.method || 'GET').toUpperCase();
  const path = (req.url || '/').split('?')[0];

  // Simple security headers
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  if (method === 'GET' && path === '/healthz') {
    return sendJson(res, 200, { ok: true });
  }

  if (method === 'POST' && path === '/api/spin') {
    try {
      const body = (await parseBody(req)) || {};
      const betRaw = typeof body.bet === 'number' ? body.bet : Number(body.bet || 1);
      const bet = Number.isFinite(betRaw) && betRaw > 0 ? Math.floor(betRaw) : 1;
      const options = (body.options || {}) as { seed?: number; maxCascades?: number };
      const result = spin(config, bet, options);
      return sendJson(res, 200, { ok: true, result });
    } catch (e: any) {
      return sendJson(res, 500, { ok: false, error: e?.message || 'spin failed' });
    }
  }

  if (method === 'GET' && path === '/api/paytable') {
    if (existsSync(publishIndexPath)) {
      try {
        const text = readFileSync(publishIndexPath, 'utf-8');
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(text);
      } catch (e: any) {
        return sendJson(res, 500, { ok: false, error: 'failed to read paytable' });
      }
    } else {
      return sendJson(res, 404, { ok: false, error: 'paytable not found' });
    }
  }

  if (method === 'GET' || method === 'HEAD') {
    return serveStatic(req, res);
  }

  res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Method Not Allowed');
});

const args = new Map<string, string>();
process.argv.slice(2).forEach((a) => {
  const [k, v] = a.startsWith('--') ? a.slice(2).split('=') : [a, 'true'];
  args.set(k, v ?? 'true');
});

const host = args.get('host') ?? process.env.HOST ?? '127.0.0.1';

// Resolve env-like placeholders commonly used across shells to an actual env value
function resolveEnvLike(val: string | undefined): string | undefined {
  if (!val) return val;
  // PowerShell style: $env:PORT
  const ps = val.match(/^\$env:([A-Za-z_][A-Za-z0-9_]*)$/);
  if (ps) return process.env[ps[1]];
  // CMD style: %PORT%
  const cmd = val.match(/^%([A-Za-z_][A-Za-z0-9_]*)%$/);
  if (cmd) return process.env[cmd[1]];
  // POSIX style: $PORT or ${PORT}
  const posix1 = val.match(/^\$([A-Za-z_][A-Za-z0-9_]*)$/);
  if (posix1) return process.env[posix1[1]];
  const posix2 = val.match(/^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/);
  if (posix2) return process.env[posix2[1]];
  return val;
}

// Parse and sanitize port input from arg or env; fall back to default when invalid
function parsePort(v: unknown, fallback: number): number {
  let raw: unknown = v;
  if (typeof v === 'string') raw = resolveEnvLike(v);
  const n = typeof raw === 'string' && raw.length > 0 ? Number(raw) : typeof raw === 'number' ? raw : NaN;
  if (!Number.isFinite(n)) return fallback;
  const ni = Math.floor(n);
  if (ni < 0 || ni > 65535) return fallback;
  return ni;
}

const basePort = parsePort(args.get('port') ?? process.env.PORT, 5173);

function tryListen(startPort: number, attempts = 5) {
  let current = startPort;
  const onError = (err: any) => {
    if (err?.code === 'EADDRINUSE' && attempts > 1) {
      // eslint-disable-next-line no-console
      console.warn(`[server] Port ${current} in use, trying ${current + 1}...`);
      attempts -= 1;
      current += 1;
      server.off('error', onError);
      server.listen(current, host);
      server.on('error', onError);
    } else {
      // eslint-disable-next-line no-console
      console.error('[server] failed to start:', err?.code || err?.message || err);
      process.exit(1);
    }
  };
  server.on('error', onError);
  server.on('listening', () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on http://${host}:${current} serving ${publicDir}`);
  });
  server.listen(current, host);
}

tryListen(basePort);
