// Simple runtime guard against external network calls.
// In production (mode: 'block'), we throw on external URLs; in dev (mode: 'warn'), we log warnings.
// Idempotent: safe to call multiple times.

type GuardMode = 'warn' | 'block';

interface NetworkGuardOptions {
  mode?: GuardMode;
  // Optional allowlist of host patterns or full regexes to allow external calls
  allowlist?: (string | RegExp)[];
}

function isHttpLikeProtocol(protocol: string) {
  return protocol === 'http:' || protocol === 'https:' || protocol === 'ws:' || protocol === 'wss:';
}

function isDataLikeProtocol(protocol: string) {
  return protocol === 'data:' || protocol === 'blob:' || protocol === 'file:';
}

function toURL(input: any): URL | null {
  try {
    if (typeof input === 'string') return new URL(input, window.location.href);
    if (input && typeof input === 'object') {
      // Request object for fetch
      if ('url' in input && typeof (input as any).url === 'string') {
        return new URL((input as any).url, window.location.href);
      }
    }
  } catch {
    // fallthrough
  }
  return null;
}

function hostMatchesAllowlist(host: string, allowlist: (string | RegExp)[]) {
  return allowlist.some((p) => {
    if (typeof p === 'string') return host === p;
    try { return p.test(host); } catch { return false; }
  });
}

function shouldAllow(url: URL, options: Required<NetworkGuardOptions>) {
  // Always allow same-origin and non-http protocols
  if (!isHttpLikeProtocol(url.protocol)) return true;

  const sameOrigin = url.host === window.location.host;
  if (sameOrigin) return true;

  // Dev allowances: localhost/127.0.0.1 are warned but allowed by default in warn mode
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (options.mode === 'warn' && isLocalhost) return true;

  // Explicit allowlist
  if (options.allowlist.length > 0 && hostMatchesAllowlist(url.host, options.allowlist)) return true;

  return false;
}

function handleViolation(kind: string, raw: any, url: URL | null, options: Required<NetworkGuardOptions>) {
  const where = url ? `${url.protocol}//${url.host}${url.pathname}` : String(raw);
  const msg = `[networkGuard] ${kind} to external URL blocked${options.mode === 'warn' ? ' (warn only)' : ''}: ${where}`;
  if (options.mode === 'block') throw new Error(msg);
  // eslint-disable-next-line no-console
  console.warn(msg);
}

let installed = false;

export function initNetworkGuard(opts?: NetworkGuardOptions) {
  if (installed) return; // idempotent
  installed = true;

  const options: Required<NetworkGuardOptions> = {
    mode: opts?.mode ?? 'warn',
    allowlist: opts?.allowlist ?? [],
  };

  // fetch
  const origFetch = window.fetch.bind(window);
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const url = toURL(input);
    if (url && isHttpLikeProtocol(url.protocol) && !isDataLikeProtocol(url.protocol) && !shouldAllow(url, options)) {
      handleViolation('fetch', input, url, options);
    }
    return origFetch(input as any, init);
  } as typeof window.fetch;

  // XMLHttpRequest
  const origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(this: XMLHttpRequest, method: string, url: string | URL, isAsync?: boolean, user?: string | null, password?: string | null) {
    const u = toURL(url);
    if (u && isHttpLikeProtocol(u.protocol) && !isDataLikeProtocol(u.protocol) && !shouldAllow(u, options)) {
      handleViolation('XMLHttpRequest.open', url, u, options);
    }
    return origXHROpen.call(this, method, url as any, isAsync as any, user as any, password as any);
  } as any;

  // navigator.sendBeacon
  if (navigator.sendBeacon) {
    const origBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function(url: string | URL, data?: BodyInit | null) {
      const u = toURL(url);
      if (u && isHttpLikeProtocol(u.protocol) && !isDataLikeProtocol(u.protocol) && !shouldAllow(u, options)) {
        handleViolation('navigator.sendBeacon', url, u, options);
      }
      return origBeacon(url as any, data as any);
    } as typeof navigator.sendBeacon;
  }

  // WebSocket
  const OrigWS = window.WebSocket;
  if (OrigWS) {
    const PatchedWS = function(url: string | URL, protocols?: string | string[]) {
      const u = toURL(url);
      if (u && isHttpLikeProtocol(u.protocol) && !shouldAllow(u, options)) {
        handleViolation('WebSocket', url, u, options);
      }
      // @ts-ignore - construct original
      return new OrigWS(url as any, protocols as any);
    } as unknown as typeof WebSocket;
    PatchedWS.prototype = OrigWS.prototype;
    // @ts-ignore - assign constructor
    window.WebSocket = PatchedWS;
  }

  // EventSource
  const OrigES = window.EventSource as any;
  if (OrigES) {
    const PatchedES: any = function(url: string | URL, eventSourceInitDict?: EventSourceInit) {
      const u = toURL(url);
      if (u && isHttpLikeProtocol(u.protocol) && !shouldAllow(u, options)) {
        handleViolation('EventSource', url, u, options);
      }
      return new OrigES(url, eventSourceInitDict);
    };
    (PatchedES as any).prototype = OrigES.prototype;
    // @ts-ignore
    window.EventSource = PatchedES as any;
  }

  // Element src/href setters for common media/resources
  function patchSetter<T extends object, K extends keyof T & string>(proto: T, prop: K, kind: string) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (!desc || !desc.set) return;
    const origSet = desc.set;
    Object.defineProperty(proto, prop, {
      configurable: true,
      enumerable: desc.enumerable ?? true,
      get: desc.get,
      set: function(value: any) {
        const u = toURL(value);
        if (u && isHttpLikeProtocol(u.protocol) && !isDataLikeProtocol(u.protocol) && !shouldAllow(u, options)) {
          handleViolation(`${kind}.${String(prop)}`, value, u, options);
        }
        // @ts-ignore
        return origSet!.call(this, value);
      },
    });
  }

  // Images, audio/video
  if ((window as any).HTMLImageElement) patchSetter(HTMLImageElement.prototype as any, 'src', 'HTMLImageElement');
  if ((window as any).HTMLScriptElement) patchSetter(HTMLScriptElement.prototype as any, 'src', 'HTMLScriptElement');
  if ((window as any).HTMLLinkElement) patchSetter(HTMLLinkElement.prototype as any, 'href', 'HTMLLinkElement');
  if ((window as any).HTMLAudioElement) patchSetter(HTMLAudioElement.prototype as any, 'src', 'HTMLAudioElement');
  if ((window as any).HTMLVideoElement) patchSetter(HTMLVideoElement.prototype as any, 'src', 'HTMLVideoElement');
}

// Convenience initializer using Vite env by default
export function initDefaultNetworkGuard() {
  const isProd = (import.meta as any).env?.PROD ?? false;
  initNetworkGuard({ mode: isProd ? 'block' : 'warn' });
}
