// Simple Node 20+ fetch-based smoke test for the local server
const base = process.env.BASE_URL || 'http://127.0.0.1:5173';

async function main(){
  try {
    const h = await fetch(base + '/healthz');
    const hJson = await h.json();
    console.log('[healthz]', h.status, hJson);
  } catch (e){
    console.error('[healthz] failed', e);
  }

  try {
    const s = await fetch(base + '/api/spin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bet: 1 })
    });
    const sJson = await s.json();
    console.log('[spin]', s.status, sJson && sJson.ok !== undefined ? { ok: sJson.ok, win: sJson.result?.totalWinX } : sJson);
  } catch (e){
    console.error('[spin] failed', e);
  }

  try {
    const p = await fetch(base + '/api/paytable');
    if (p.ok){
      const pJson = await p.json();
      console.log('[paytable]', p.status, Object.keys(pJson || {}).slice(0, 5));
    } else {
      console.log('[paytable]', p.status);
    }
  } catch (e){
    console.error('[paytable] failed', e);
  }
}

main();
