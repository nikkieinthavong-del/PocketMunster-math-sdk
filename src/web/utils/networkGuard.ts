// Simple runtime guard against external network calls.
// In production (mode: 'block'), we throw on external URLs; in dev (mode: 'warn'), we log warnings.
// Idempotent: safe to call multiple times.

export type NetworkGuardOptions = {
  allowlist?: string[];         // hostnames to allow (e.g., ["localhost"])
  mode?: "warn" | "block";      // dev=warn, prod=block by default
};

function isExternal(url: string): boolean {
  try {
    const u = new URL(url, window.location.origin);
    if (u.protocol === "blob:" || u.protocol === "data:" || u.protocol === "file:") return false;
    const sameOrigin = u.origin === window.location.origin;
    const isAbsoluteHttp = u.protocol === "http:" || u.protocol === "https:";
    return isAbsoluteHttp && !sameOrigin;
  } catch {
    // Relative or invalid URLs fall back to same-origin
    return false;
  }
}

export function initNetworkGuard(opts: NetworkGuardOptions = {}) {
  const allow = new Set((opts.allowlist ?? []).map(h => h.toLowerCase()));
  const mode: "warn" | "block" = opts.mode ?? (import.meta.env.PROD ? "block" : "warn");

  // Wrap fetch
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    const u = new URL(url, window.location.origin);

    if (isExternal(url) && !allow.has(u.hostname.toLowerCase())) {
      const msg = `External network blocked: ${u.href}`;
      if (mode === "block") {
        console.error(msg, { method: init?.method ?? "GET", url: u.href });
        throw new Error(msg);
      } else {
        console.warn(msg);
      }
    }
    return origFetch(input as any, init);
  };

  // Wrap XHR
  const OrigXHR = window.XMLHttpRequest;
  class GuardedXHR extends OrigXHR {
    open(method: string, url: string, async?: boolean, user?: string | null, password?: string | null) {
      try {
        const u = new URL(url, window.location.origin);
        if (isExternal(url) && !allow.has(u.hostname.toLowerCase())) {
          const msg = `External network blocked (XHR): ${u.href}`;
          if (mode === "block") {
            console.error(msg, { method, url: u.href });
            throw new Error(msg);
          } else {
            console.warn(msg);
          }
        }
      } catch {
        // ignore relative
      }
      return super.open(method as any, url, async as any, user as any, password as any);
    }
  }
  // @ts-ignore
  window.XMLHttpRequest = GuardedXHR;
}
