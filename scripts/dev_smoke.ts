/*
Starts the local server on a free port, waits for /healthz, runs smoke, and exits with code of smoke.
*/
import { spawn } from "node:child_process";
import http from "node:http";

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pickPort(start = 5180, end = 5200): Promise<number> {
  for (let p = start; p <= end; p++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const s = http.createServer(() => {
          /* noop */
        });
        s.once("error", reject);
        s.listen(p, "127.0.0.1", () => s.close(() => resolve()));
      });
      return p;
    } catch {
      /* in use */
    }
  }
  throw new Error("No free port found");
}

async function waitForHealth(base: string, tries = 40): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    try {
      const ok = await new Promise<boolean>((resolve) => {
        const req = http.request(base + "/healthz", (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(c as any));
          res.on("end", () => {
            try {
              const j = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
              resolve(!!j?.ok);
            } catch {
              resolve(false);
            }
          });
        });
        req.on("error", () => resolve(false));
        req.end();
      });
      if (ok) return true;
    } catch {}
    await wait(250);
  }
  return false;
}

async function main() {
  const port = await pickPort();
  const base = `http://127.0.0.1:${port}`;
  console.log(`[dev:smoke] starting server on ${base}`);
  const server = spawn(process.execPath, ["dist-run/scripts/server.js", `--port=${port}`], {
    stdio: "inherit",
  });

  const healthy = await waitForHealth(base);
  if (!healthy) {
    console.error("[dev:smoke] server failed to become healthy");
    server.kill("SIGINT");
    process.exit(1);
  }
  console.log("[dev:smoke] server healthy, running smoke");

  const env = { ...process.env, BASE_URL: base };
  const smoke = spawn(process.execPath, ["dist-run/scripts/smoke_http.js"], {
    stdio: "inherit",
    env,
  });
  const code: number = await new Promise((resolve) => smoke.on("close", (c) => resolve(c ?? 1)));

  server.kill("SIGINT");
  process.exit(code);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
