// Minimal local RGS mock for authenticate → play → end-round
// This is purely for smoke testing the frontend flow; it does not implement RNG or math.

import http from "node:http";
import { parse } from "node:url";

const PORT = Number(process.env.RGS_PORT || 8089);
const HOST = process.env.RGS_HOST || "127.0.0.1";

function json(res: http.ServerResponse, status: number, obj: unknown) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body).toString(),
    "access-control-allow-origin": "*",
  });
  res.end(body);
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

let balanceMicro = 1_000_000_000; // 1000.000000 units
const MODES = {
  base: { min: 1, max: 100, winRange: [0, 10000] },
  high: { min: 10, max: 1000, winRange: [100, 50000] },
};

const server = http.createServer(async (req, res) => {
  const method = (req.method || "GET").toUpperCase();
  const url = parse(req.url || "/", true);
  const path = (url.pathname || "/").replace(/\\/g, "/");

  if (method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
    });
    return res.end();
  }

  if (method === "POST" && path === "/wallet/authenticate") {
    return json(res, 200, {
      ok: true,
      currency: "USD",
      precision: 6,
      balance: balanceMicro,
      config: { minBet: 1, maxBet: 10000, step: 1, betLevels: [1, 2, 5, 10], jurisdiction: "mock" },
    });
  }

  if (method === "POST" && path === "/wallet/play") {
    const body = await parseBody(req);
    const amount = Math.max(1, Number(body?.amount || 0));
    const modeRaw = typeof body?.mode === "string" ? body.mode : "base";
    const mode: keyof typeof MODES = (modeRaw in MODES ? modeRaw : "base") as keyof typeof MODES;
    const winRange = MODES[mode].winRange;
    // Simulate a random win amount in micro units
    const winAmount = Math.floor(Math.random() * (winRange[1] - winRange[0] + 1)) + winRange[0];
    balanceMicro -= amount;
    balanceMicro += winAmount;
    // minimal event structure consistent with our frontend expectations
    const events = [
      { type: "spinStart", payload: { betMicro: amount, mode } },
      { type: "win", payload: { symbol: "A", size: 5, multiplier: 1, winAmount, positions: [] } },
      { type: "spinEnd", payload: {} },
    ];
    return json(res, 200, {
      ok: true,
      balance: balanceMicro,
      events,
      totalWinMicro: winAmount,
      mode,
    });
  }

  if (method === "POST" && path === "/wallet/end-round") {
    return json(res, 200, { ok: true });
  }

  json(res, 404, { ok: false, error: "not found" });
});

server.on("error", (err) => {
  const error = err as NodeJS.ErrnoException;
  if (error.code === "EADDRINUSE") {
    console.error(
      `[rgs-mock] Port ${PORT} in use. Try a different port: npm run rgs:mock:port --port=8099`
    );
  } else {
    console.error("[rgs-mock] Server error:", err);
  }
});
server.on("request", (req, res) => {
  console.log(`[rgs-mock] ${req.method} ${req.url}`);
});
server.listen(PORT, HOST, () => {
  console.log(`[rgs-mock] listening on ${HOST}:${PORT}`);
});
