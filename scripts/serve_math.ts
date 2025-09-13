import http from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spin } from '../src/js/engine/engine.js';
import { enterFreeSpins, stepFreeSpins } from '../src/js/features/freespins.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, '..', '..', 'config.json');
let CONFIG: any = JSON.parse(readFileSync(configPath, 'utf-8'));

function readJson(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function send(res: http.ServerResponse, code: number, body: any) {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(json);
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) return send(res, 404, { error: 'not_found' });
    if (req.method === 'POST' && req.url === '/spin') {
      const body = await readJson(req);
      const bet = Number(body?.bet ?? 1);
      const seed = body?.seed >>> 0;
      const initMultiplierMap = body?.initMultiplierMap;
      const result = spin(CONFIG, bet, { seed, initMultiplierMap });
      return send(res, 200, { ok: true, result });
    }
    if (req.method === 'POST' && req.url === '/feature/freespins/enter') {
      const body = await readJson(req);
      const scatters = Number(body?.pikachuScatters ?? 0);
      const seed = body?.seed >>> 0;
      const state = enterFreeSpins(CONFIG, scatters, seed);
      return send(res, 200, { ok: true, state });
    }
    if (req.method === 'POST' && req.url === '/feature/freespins/step') {
      const body = await readJson(req);
      const state = stepFreeSpins(body?.state, CONFIG);
      return send(res, 200, { ok: true, state });
    }
    if (req.method === 'POST' && req.url === '/reload-config') {
      CONFIG = JSON.parse(readFileSync(configPath, 'utf-8'));
      return send(res, 200, { ok: true });
    }
    if (req.method === 'GET' && req.url === '/healthz') {
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: 'not_found' });
  } catch (err: any) {
    return send(res, 500, { ok: false, error: String(err?.message ?? err) });
  }
});

const port = Number(process.env.PORT ?? 8787);
server.listen(port, () => {
  console.log(JSON.stringify({ listening: true, port }, null, 2));
});
