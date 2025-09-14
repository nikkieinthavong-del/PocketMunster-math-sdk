type AnyObj = Record<string, any>;

function pretty(v: unknown) {
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

window.addEventListener("unhandledrejection", (ev) => {
  const r: AnyObj = ev.reason || {};
  if (r?.url || r?.status) {
    console.error(`API Request failed: ${r.method ?? "GET"} ${r.url} - ${r.status ?? ""} ${r.statusText ?? ""}`, r);
  } else {
    console.error("Unhandled rejection:", pretty(r));
  }
});

window.addEventListener("error", (ev) => {
  const e = ev?.error as AnyObj;
  if (e && (e.url || e.status)) {
    console.error(`API Error: ${e.method ?? "GET"} ${e.url} - ${e.status ?? ""} ${e.statusText ?? ""}`, e);
  }
});