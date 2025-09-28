// app.js - orchestrates UI + RGS + anims (with CDN/demo fallbacks)
import { getQuery, pickBaseUrl, formatAmount, formatCurrencyMicro, supportedCurrencies, languages, CurrencyMeta, MICRO, microToNumber, numberToMicro } from './format.js';
import { Animator } from './anim.js';
import { sfx, setMuted, isMuted, resume, configureAudio } from './sounds.js';
const $ = (sel) => document.querySelector(sel);
const stage = $('#stage');
const animator = new Animator(stage);
const q = getQuery();
const sessionID = q.sessionID || q.sessionId || '';
const baseUrl = pickBaseUrl();
const isRgs = !!(sessionID && baseUrl);
const state = { base: baseUrl, rgs: isRgs, sessionID, currency: (q.currency && supportedCurrencies.includes(q.currency) ? q.currency : 'USD'), lang: (q.lang && languages[q.lang] ? q.lang : 'en'), balanceMicro: numberToMicro(1000), betMicro: numberToMicro(1), auto: false, spinning: false, demo: !isRgs, seed: (Date.now()>>>0) ^ (Math.floor(Math.random()*1e9)>>>0), config: { minBet: MICRO, maxBet: 1000*MICRO, stepBet: MICRO, betLevels: [] } };
// Flexible API mapping + auth (query-configurable)
const api = {
  prefix: (q.apiPrefix || state.base || ''),
  // Default to Stake Engine RGS endpoints; allow override via query
  spinPath: (q.spinPath || '/wallet/play'),
  authPath: (q.authPath || '/wallet/authenticate'),
  endRoundPath: (q.endRoundPath || '/wallet/end-round'),
  buyPath: (q.buyPath || ''),
  token: (q.token || ''),
  tokenHeader: (q.tokenHeader || 'Authorization'),
  tokenType: (q.tokenType || 'Bearer')
};
function setApi(opts){
  if (!opts) return getApi();
  if (opts.prefix!=null) api.prefix = String(opts.prefix||'');
  if (opts.spinPath!=null) api.spinPath = String(opts.spinPath||'');
  if (opts.authPath!=null) api.authPath = String(opts.authPath||'');
  if (opts.endRoundPath!=null) api.endRoundPath = String(opts.endRoundPath||'');
  if (opts.buyPath!=null) api.buyPath = String(opts.buyPath||'');
  if (opts.token!=null) api.token = String(opts.token||'');
  if (opts.tokenHeader!=null) api.tokenHeader = String(opts.tokenHeader||'');
  if (opts.tokenType!=null) api.tokenType = String(opts.tokenType||'');
  return getApi();
}
function getApi(){ return { prefix: api.prefix, spinPath: api.spinPath, authPath: api.authPath, endRoundPath: api.endRoundPath, buyPath: api.buyPath, token: api.token, tokenHeader: api.tokenHeader, tokenType: api.tokenType }; }
// Expose runtime setter for hosts (classic embed-safe)
try {
  window.PocketMunsters = window.PocketMunsters || {};
  window.PocketMunsters.setApi = setApi;
  window.PocketMunsters.getApi = getApi;
} catch {}
// UI refs
const el = { balance: $('#balance'), win: $('#win'), bet: $('#bet'), betInc: $('#betInc'), betDec: $('#betDec'), spin: $('#spinBtn'), stop: $('#stopBtn'), auto: $('#autoBtn'), mute: $('#muteBtn'), rulesBtn: $('#rulesBtn'), payBtn: $('#paytableBtn'), buyBtn: $('#buyBtn'), loader: $('#loader'), msgs: $('#messages'), confirmAuto: $('#confirmAuto'), rules: $('#rulesModal'), rulesBody: $('#rulesBody'), pay: $('#paytableModal'), payBody: $('#paytableBody'), userBtn: $('#userMenuBtn'), userMenu: $('#userMenu'), currencySel: $('#currencySel'), langSel: $('#langSel') };
function setMsg(text){ const div=document.createElement('div'); div.className='msg'; div.textContent=text; el.msgs&&el.msgs.appendChild(div); setTimeout(()=>div.remove(), 3500); }
function setBalanceMicro(m){ state.balanceMicro=m; el.balance.textContent = formatCurrencyMicro(m, state.currency); }
function setBetMicro(m){ m = Math.max(state.config.minBet||MICRO, Math.min(m, state.config.maxBet||m)); if (!state.config.betLevels || state.config.betLevels.length===0){ const step = state.config.stepBet||MICRO; m = Math.round(m/step)*step; } state.betMicro = m; const meta = CurrencyMeta[state.currency] || { decimals: 2 }; const disp = microToNumber(m).toFixed(meta.decimals); if (el.bet) { el.bet.value = disp; el.bet.step = String((state.config.stepBet||MICRO)/MICRO); } }
function setWinDisplay(amount){ el.win.textContent = formatAmount(amount, state.currency); }
function setLoader(hide){ if (!el.loader) return; el.loader.setAttribute('aria-hidden', hide? 'true':'false'); if (hide){ el.loader.setAttribute('hidden',''); } else { el.loader.removeAttribute('hidden'); } }
function setCurrency(cur){ if (!supportedCurrencies.includes(cur)) return; state.currency = cur; if (el.currencySel) el.currencySel.value = cur; setBalanceMicro(state.balanceMicro); setWinDisplay(0); }
function setLanguage(lang){ if (!languages[lang]) return; state.lang = lang; if (el.langSel) el.langSel.value = lang; }
function toggleMute(){ const m = !isMuted(); setMuted(m); el.mute.setAttribute('aria-pressed', String(m)); el.mute.textContent = m? '🔈' : '🔊'; }
function toggleMenu(){ const isHidden = el.userMenu.hasAttribute('hidden'); if (isHidden){ el.userMenu.removeAttribute('hidden'); el.userBtn.setAttribute('aria-expanded','true'); } else { el.userMenu.setAttribute('hidden',''); el.userBtn.setAttribute('aria-expanded','false'); } }
function mulberry32(a){ return function(){ let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; } }
let rand = mulberry32(state.seed);
function reseed(){ state.seed = (state.seed + 0x9E3779B9) >>> 0; rand = mulberry32(state.seed); }
function withAuth(init){
  const out = Object.assign({}, init||{});
  const headers = Object.assign({}, init && init.headers || {});
  if (api.token){ headers[String(api.tokenHeader||'Authorization')] = api.tokenType ? (String(api.tokenType)+' '+String(api.token)) : String(api.token); }
  out.headers = headers;
  return out;
}
async function fetchJson(url, init){ try { const r = await fetch(url, withAuth(init)); const status = r.status; let data=null; try{ data = await r.json(); }catch{} if (!r.ok) return { ok:false, status, data }; return { ok:true, status, data }; } catch { return { ok:false, status:0, data:null }; } }
async function loadPaytable(){
  // In RGS mode, show Authenticate config instead of local paytable
  if (state.rgs){
    const r = await authenticate();
    if (r && r.config){ renderConfig(r); return r; }
    return null;
  }
  // Demo/non-RGS: try local bundled paytable (index.json with modes/rtp)
  const local = await fetchJson('index.json');
  if (local.ok && local.data){ state.demo = true; setMsg('Using offline paytable.'); renderPaytable(local.data); return local.data; }
  el.payBody.innerHTML = '<p>Paytable unavailable.</p>';
  return null;
}
async function authenticate(){
  if (!api.prefix || !api.authPath || !state.sessionID) return null;
  const url = (api.prefix||'') + (api.authPath||'/wallet/authenticate');
  const r = await fetchJson(url, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ sessionID: state.sessionID, language: state.lang }) });
  if (r.ok && r.data){
    try{
      if (r.data.balance && typeof r.data.balance.amount === 'number'){ setBalanceMicro(Number(r.data.balance.amount)||0); }
      if (r.data.balance && typeof r.data.balance.currency === 'string'){ setCurrency(r.data.balance.currency); }
      const cfg = r.data.config||{};
      if (cfg){
        state.config.minBet = Number(cfg.minBet||state.config.minBet)||state.config.minBet;
        state.config.maxBet = Number(cfg.maxBet||state.config.maxBet)||state.config.maxBet;
        state.config.stepBet = Number(cfg.stepBet||state.config.stepBet)||state.config.stepBet;
        if (Array.isArray(cfg.betLevels)) state.config.betLevels = cfg.betLevels.slice();
      }
    }catch{}
    return r.data;
  }
  return null;
}
function renderConfig(authData){
  try{
    const cfg = authData && authData.config || {};
    const ul = document.createElement('ul');
    const add = (label, val)=>{ const li=document.createElement('li'); li.innerHTML = '<strong>'+label+':</strong> '+String(val); ul.appendChild(li); };
    add('Currency', authData?.balance?.currency||state.currency);
    add('Balance', formatCurrencyMicro(authData?.balance?.amount??state.balanceMicro, authData?.balance?.currency||state.currency));
    add('minBet', cfg.minBet);
    add('maxBet', cfg.maxBet);
    add('stepBet', cfg.stepBet);
    add('betLevels', (cfg.betLevels && cfg.betLevels.length) ? cfg.betLevels.length+' levels' : 'n/a');
    const juris = cfg.jurisdiction || {};
    if (juris && typeof juris === 'object'){
      const keys = Object.keys(juris).slice(0,8);
      add('jurisdiction', keys.map(k=> k+': '+String(juris[k])).join(', '));
    }
    el.payBody.innerHTML = '';
    el.payBody.appendChild(ul);
  }catch{
    el.payBody.innerHTML = '<p>Unable to render config.</p>';
  }
}
function renderPaytable(j){ const rawModes = (j&&j.modes)||[]; const modes = Array.isArray(rawModes) ? rawModes : Object.keys(rawModes).map(k=>({ name:k, ...(rawModes[k]||{}) })); const table=document.createElement('table'); const thead=document.createElement('thead'); const thr=document.createElement('tr'); const th1=document.createElement('th'); th1.textContent='Mode'; const th2=document.createElement('th'); th2.textContent='RTP'; thr.appendChild(th1); thr.appendChild(th2); thead.appendChild(thr); const tbody=document.createElement('tbody'); modes.forEach(m=>{ const tr=document.createElement('tr'); const td1=document.createElement('td'); td1.textContent=String(m.name||m.key||''); const td2=document.createElement('td'); const r = (typeof m.rtp==='number') ? ((m.rtp*100).toFixed(2)+'%') : String(m.rtp??''); td2.textContent=r; tr.appendChild(td1); tr.appendChild(td2); tbody.appendChild(tr); }); table.appendChild(thead); table.appendChild(tbody); el.payBody.innerHTML=''; el.payBody.appendChild(table); }
function renderRules(){ el.rulesBody.innerHTML = '<ul><li>Basic RGS flow: authenticate → play → end-round</li><li>Autoplay queues spins until stopped</li><li>Animations are illustrative; math resolved by RGS</li></ul>'; }
function countUp(from, to, ms){ from=Number(from)||0; to=Number(to)||0; ms=Math.max(100, Number(ms)||600); const start=performance.now(); function step(t){ const p=Math.min(1,(t-start)/ms); const v=from+(to-from)*p; setWinDisplay(v); if (p<1) requestAnimationFrame(step); } requestAnimationFrame(step); }
function demoSpinResult(){
  const cols=6, rows=5; reseed();
  const tiers=['T1','T2','T3','T4','T5'];
  const weight=[5,4,3,2,1];
  const pick=()=>{ let s=0; for (let i=0;i<weight.length;i++) s+=weight[i]; let x=rand()*s; for (let i=0;i<tiers.length;i++){ x-=weight[i]; if (x<=0) return { id: tiers[i] }; } return { id: 'T1' }; };
  const grid = Array.from({length:rows},()=> Array.from({length:cols},()=> pick()));
  const cx = Math.floor(rand()*cols);
  const cy = Math.floor(rand()*rows);
  const winSym = grid[cy][cx].id;
  const winCells = [[cy,cx]];
  const events = [
    { type:'spinStart', payload:{} },
    { type:'win', payload:{ symbol:{ id: winSym }, size:1, multiplier:1, winAmount:1, positions:[], cells: winCells } },
    { type:'spinEnd', payload:{} }
  ];
  return { grid, multiplierMap: {}, totalWinX: 1, events, uiHints: {} };
}
async function spin(){
  if (state.spinning) return;
  state.spinning=true; setLoader(false);
  try {
    let result=null;
    if (state.rgs){
      const url = (api.prefix||'') + (api.spinPath||'/wallet/play') + '?sessionID=' + encodeURIComponent(state.sessionID);
      const payload = { amount: state.betMicro, mode: (q.mode || 'BASE') };
      const r = await fetchJson(url, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(payload) });
      if (r.ok && r.data) {
        // Update balance from response
        if (r.data.balance && typeof r.data.balance.amount === 'number'){ setBalanceMicro(Number(r.data.balance.amount)||0); }
        // Round result
        const round = r.data.round || {};
        const totalX = Number(round.payoutMultiplier||0);
        if (totalX>0){ const add = Math.round((totalX) * state.betMicro / MICRO) * MICRO; countUp(0, microToNumber(add), 600); }
        const events = Array.isArray(round.events)? round.events: [];
        result = { grid: round.board||round.grid||null, multiplierMap: {}, totalWinX: Number(round.payoutMultiplier||0), events, uiHints: {} };
        // End round to finalize payout and refresh balance
        await endRound();
      }
    }
    if (!result){ result = demoSpinResult(); setMsg('Offline demo spin.'); }
    const totalX2 = Number(result.totalWinX||0);
    if (totalX2>0 && !state.rgs){ const add = Math.round((totalX2) * state.betMicro / MICRO) * MICRO; state.balanceMicro += add; countUp(0, microToNumber(add), 600); }
    animator.enqueue(result.events||[], result);
  } catch (e) { setMsg('Spin failed'); }
  finally { setLoader(true); state.spinning=false; }
}
async function endRound(){
  try{
    if (!state.rgs) return;
    const url = (api.prefix||'') + (api.endRoundPath||'/wallet/end-round');
    const r = await fetchJson(url, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ sessionID: state.sessionID }) });
    if (r.ok && r.data && r.data.balance && typeof r.data.balance.amount === 'number'){
      setBalanceMicro(Number(r.data.balance.amount)||0);
    }
  }catch{}
}
async function buyFeature(){
  if (state.spinning) return;
  if (!api.prefix || !api.buyPath){ setMsg('Buy not available'); return; }
  state.spinning=true; setLoader(false);
  try {
    let result=null;
    const url = (api.prefix||'') + (api.buyPath||'/api/buy') + (state.sessionID? ('?sessionID='+encodeURIComponent(state.sessionID)) : '');
    const r = await fetchJson(url, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ bet: state.betMicro, seed: state.seed }) });
    if (r.ok && r.data) result = r.data;
    if (!result){ setMsg('Buy unavailable (demo)'); return; }
    const totalX = Number(result.totalWinX||0);
    if (totalX>0){ const add = Math.round((totalX) * state.betMicro / MICRO) * MICRO; state.balanceMicro += add; countUp(0, microToNumber(add), 600); }
    animator.enqueue(result.events||[], result);
  } catch (e) { setMsg('Buy failed'); }
  finally { setLoader(true); state.spinning=false; }
}
// --- UI wiring ---
el.spin.addEventListener('click', ()=>{ try{ resume(); sfx.startMusic&&sfx.startMusic(); }catch{} sfx.click(); spin(); });
el.stop && el.stop.addEventListener('click', ()=>{ try{ sfx.click(); }catch{} state.auto=false; try{ el.auto && el.auto.setAttribute('aria-pressed','false'); }catch{} try{ animator && animator.cancel && animator.cancel(); }catch{} });
el.auto.addEventListener('click', async ()=>{ try{ resume(); sfx.startMusic&&sfx.startMusic(); }catch{} sfx.click(); if (state.auto){ state.auto=false; el.auto.setAttribute('aria-pressed','false'); return; } const res = await el.confirmAuto.showModal(); if (res!==undefined) { state.auto=true; el.auto.setAttribute('aria-pressed','true'); while(state.auto){ await spin(); await new Promise(r=>setTimeout(r,300)); } } });
el.mute.addEventListener('click', ()=>{ try{ resume(); sfx.startMusic&&sfx.startMusic(); }catch{} sfx.click(); toggleMute(); });
el.betInc.addEventListener('click', ()=>{ sfx.click(); setBetMicro(state.betMicro + (state.config.stepBet||MICRO)); });
el.betDec.addEventListener('click', ()=>{ sfx.click(); setBetMicro(state.betMicro - (state.config.stepBet||MICRO)); });
el.currencySel.addEventListener('change', (e)=>{ setCurrency((e.target&&e.target.value)||'USD'); });
el.langSel.addEventListener('change', (e)=>{ setLanguage((e.target&&e.target.value)||'en'); });
el.rulesBtn.addEventListener('click', ()=>{ renderRules(); el.rules.showModal(); });
el.payBtn.addEventListener('click', async ()=>{ const p = await loadPaytable(); if (p) el.pay.showModal(); });
if (el.buyBtn){
  // Hide Buy when not configured
  const buyAvailable = !!(api.prefix && api.buyPath);
  if (!buyAvailable){ try{ el.buyBtn.style.display = 'none'; }catch{} }
  el.buyBtn.addEventListener('click', ()=>{ sfx.click(); buyFeature(); });
}
window.addEventListener('keydown', (e)=>{ if (e.code==='Space' && !e.repeat){ e.preventDefault(); spin(); } });
setCurrency(state.currency);
setBetMicro(state.betMicro);
setLoader(true);
// If RGS mode, authenticate on load to sync balance/config
if (state.rgs){
  authenticate();
}
// Query-based tuning: volumes and timings
try {
  const vol = {
    clusterWin: (q.clusterVol!=null? Number(q.clusterVol): null),
    moreHits: (q.moreHitsVol!=null? Number(q.moreHitsVol): null),
    music: (q.musicVol!=null? Number(q.musicVol): null),
    musicFadeMs: (q.musicFade!=null? Number(q.musicFade): null)
  };
  const anyVol = [vol.clusterWin, vol.moreHits, vol.music, vol.musicFadeMs].some(v=> v!=null && isFinite(v));
  if (anyVol) configureAudio(vol);
  const times = {
    gridOpacity: (q.gridOpacity!=null? Number(q.gridOpacity): null),
    glow: (q.glow!=null? Number(q.glow): null),
    pop: (q.pop!=null? Number(q.pop): null),
    popScale: (q.popScale!=null? Number(q.popScale): null),
    flash: (q.flash!=null? Number(q.flash): null),
    drop: (q.drop!=null? Number(q.drop): null),
    settle: (q.settle!=null? Number(q.settle): null)
  };
  const anyTime = Object.values(times).some(v=> v!=null && isFinite(v));
  if (anyTime) animator.configureTimings(times);
} catch {}
// Start background music after first interaction
window.addEventListener('pointerdown', ()=>{ try{ resume(); sfx.startMusic(); }catch{} }, { once:true });
