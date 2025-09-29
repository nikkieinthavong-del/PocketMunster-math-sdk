import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spin } from '../src/js/engine/engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, '..', '..', 'config.json');
let CONFIG: any = JSON.parse(readFileSync(configPath, 'utf-8'));

type Balance = { amount: number; currency: string };
type Round = {
  id: string;
  active: boolean;
  amount: number;         // bet in micro units (1e6)
  mode: 'BASE';
  result?: any;           // SpinResult
  payoutAmount?: number;  // micro units
  createdAt: number;
};

type SessionState = {
  balance: Balance;
  round?: Round;
  lastEvent?: string;
};

const SESSIONS = new Map<string, SessionState>();

// Game config for UI (example values; adjust as needed or load from CONFIG)
const GAME_CFG = {
  minBet: 100000,             // $0.10
  maxBet: 1000000000,         // $1000
  stepBet: 100000,            // $0.10 steps
  defaultBetLevel: 1000000,   // $1.00
  betLevels: [
    100000, 200000, 400000, 600000, 800000,
    1000000, 2000000, 5000000, 10000000, 20000000, 1000000000,
  ],
  jurisdiction: {
    socialCasino: false,
    disabledFullscreen: false,
    disabledTurbo: false,
  },
};

function ok(res: ServerResponse, data: any) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function err(res: ServerResponse, status: number, code: string, message: string) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ code, message }));
}

async function readJson<T = any>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf-8') || '{}';
  try { return JSON.parse(raw); } catch {
    throw new Error('Invalid JSON');
  }
}

function getOrInitSession(sessionID: string): SessionState {
  let s = SESSIONS.get(sessionID);
  if (!s) {
    // Seed demo balance at $100.00 in micro units
    s = { balance: { amount: 100_000_000, currency: 'USD' } };
    SESSIONS.set(sessionID, s);
  }
  return s;
}

// Convert engine result totalWinX (in bet units) to micro currency payout
function payoutFromTotalWinX(amountMicro: number, totalWinX: number): number {
  // totalWinX is “bet units” multiplier; payout (micro) = totalWinX * bet(micro)
  const val = Math.round(totalWinX * amountMicro);
  return Math.max(0, val);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const { pathname } = url;

    if (req.method === 'GET' && pathname === '/healthz') return ok(res, { ok: true });

    if (req.method === 'POST' && pathname === '/reload-config') {
      CONFIG = JSON.parse(readFileSync(configPath, 'utf-8'));
      return ok(res, { ok: true });
    }

    // Wallet: authenticate
    if (req.method === 'POST' && pathname === '/wallet/authenticate') {
      const body = await readJson<{ sessionID?: string }>(req);
      const sessionID = body.sessionID?.trim();
      if (!sessionID) return err(res, 400, 'ERR_VAL', 'Missing sessionID');

      const s = getOrInitSession(sessionID);
      return ok(res, {
        balance: s.balance,
        config: GAME_CFG,
        round: s.round ?? null,
      });
    }

    // Wallet: balance
    if (req.method === 'POST' && pathname === '/wallet/balance') {
      const body = await readJson<{ sessionID?: string }>(req);
      const sessionID = body.sessionID?.trim();
      if (!sessionID) return err(res, 400, 'ERR_VAL', 'Missing sessionID');
      const s = SESSIONS.get(sessionID);
      if (!s) return err(res, 400, 'ERR_IS', 'Invalid session');

      return ok(res, { balance: s.balance });
    }

    // Wallet: play (debit and perform a base spin)
    if (req.method === 'POST' && pathname === '/wallet/play') {
      const body = await readJson<{ sessionID?: string; amount?: number; mode?: string }>(req);
      const sessionID = body.sessionID?.trim();
      const amount = Number(body.amount ?? 0);
      const mode = (body.mode ?? 'BASE').toUpperCase();

      if (!sessionID) return err(res, 400, 'ERR_VAL', 'Missing sessionID');
      if (!Number.isFinite(amount) || amount <= 0) return err(res, 400, 'ERR_VAL', 'Invalid amount');
      if (mode !== 'BASE') return err(res, 400, 'ERR_VAL', 'Unsupported mode');

      const s = getOrInitSession(sessionID);

      // Validate bet constraints
      if (amount < GAME_CFG.minBet || amount > GAME_CFG.maxBet) {
        return err(res, 400, 'ERR_VAL', 'Bet outside limits');
      }
      if ((amount - GAME_CFG.minBet) % GAME_CFG.stepBet !== 0) {
        return err(res, 400, 'ERR_VAL', 'Bet not divisible by stepBet');
      }

      // Check balance
      if (s.balance.amount < amount) return err(res, 400, 'ERR_IPB', 'Insufficient balance');

      // Debit
      s.balance.amount -= amount;

      // Do a base spin at bet=1 (engine’s totalWinX is in bet units)
      const seed = Math.floor(Math.random() * 0xffffffff) >>> 0;
      const result = spin(CONFIG, 1, { seed });

      // Track round; payout is credited on end-round
      const round: Round = {
        id: randomUUID(),
        active: true,
        amount,
        mode: 'BASE',
        result,
        createdAt: Date.now(),
      };
      s.round = round;

      return ok(res, {
        balance: s.balance,
        round: {
          id: round.id,
          active: round.active,
          amount: round.amount,
          mode: round.mode,
          result: round.result,
        },
      });
    }

    // Wallet: end-round (credit payout and close round)
    if (req.method === 'POST' && pathname === '/wallet/end-round') {
      const body = await readJson<{ sessionID?: string }>(req);
      const sessionID = body.sessionID?.trim();
      if (!sessionID) return err(res, 400, 'ERR_VAL', 'Missing sessionID');

      const s = SESSIONS.get(sessionID);
      if (!s) return err(res, 400, 'ERR_IS', 'Invalid session');

      const r = s.round;
      if (!r || !r.active) {
        // No active round: return current balance
        return ok(res, { balance: s.balance });
      }

      // Compute payout
      const totalWinX = Number(r.result?.totalWinX ?? 0);
      const payout = payoutFromTotalWinX(r.amount, totalWinX);
      r.payoutAmount = payout;
      r.active = false;

      // Credit payout
      s.balance.amount += payout;

      return ok(res, {
        balance: s.balance,
        round: {
          id: r.id,
          active: r.active,
          amount: r.amount,
          payoutAmount: r.payoutAmount,
          mode: r.mode,
        },
      });
    }

    // Bet event (store last event string; useful for resume)
    if (req.method === 'POST' && pathname === '/bet/event') {
      const body = await readJson<{ sessionID?: string; event?: string }>(req);
      const sessionID = body.sessionID?.trim();
      const event = String(body.event ?? '');
      if (!sessionID) return err(res, 400, 'ERR_VAL', 'Missing sessionID');
      const s = SESSIONS.get(sessionID);
      if (!s) return err(res, 400, 'ERR_IS', 'Invalid session');
      s.lastEvent = event;
      return ok(res, { event });
    }

    // Not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 'ERR_VAL', message: 'Not Found' }));
  } catch (e: any) {
    err(res, 500, 'ERR_GEN', e?.message ?? 'Server error');
  }
});

const PORT = Number(process.env.PORT ?? 8787);
server.listen(PORT, () => {
  console.log(`Math service listening on http://localhost:${PORT}`);
});
