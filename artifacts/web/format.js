// format.js - query, currency, and RGS helpers
export function getQuery(){
  const q = new URLSearchParams(location.search);
  const obj = Object.create(null);
  for (const [k,v] of q) obj[k] = v; return obj;
}
export function pickBaseUrl(){
  const q = getQuery();
  const rgs = q.rgs_url; // Stake RGS param
  if (rgs && /^https?:\/\//i.test(rgs)) return rgs.replace(/\/$/,'');
  return '';
}
export const languages = {
  ar:{name:'Arabic',t:(s)=>s},de:{name:'German',t:(s)=>s},en:{name:'English',t:(s)=>s},es:{name:'Spanish',t:(s)=>s},fi:{name:'Finnish',t:(s)=>s},fr:{name:'French',t:(s)=>s},hi:{name:'Hindi',t:(s)=>s},id:{name:'Indonesian',t:(s)=>s},ja:{name:'Japanese',t:(s)=>s},ko:{name:'Korean',t:(s)=>s},pl:{name:'Polish',t:(s)=>s},pt:{name:'Portuguese',t:(s)=>s},ru:{name:'Russian',t:(s)=>s},tr:{name:'Turkish',t:(s)=>s},vi:{name:'Vietnamese',t:(s)=>s},zh:{name:'Chinese',t:(s)=>s}
};
export const supportedCurrencies = ['USD','CAD','JPY','EUR','RUB','CNY','PHP','INR','IDR','KRW','BRL','MXN','DKK','PLN','VND','TRY','CLP','ARS','PEN','XGC','XSC'];
export const CurrencyMeta = {
  USD:{symbol:'$',decimals:2}, CAD:{symbol:'CA$',decimals:2}, JPY:{symbol:'¥',decimals:0}, EUR:{symbol:'€',decimals:2}, RUB:{symbol:'₽',decimals:2}, CNY:{symbol:'CN¥',decimals:2}, PHP:{symbol:'₱',decimals:2}, INR:{symbol:'₹',decimals:2}, IDR:{symbol:'Rp',decimals:0}, KRW:{symbol:'₩',decimals:0}, BRL:{symbol:'R$',decimals:2}, MXN:{symbol:'MX$',decimals:2}, DKK:{symbol:'KR',decimals:2,symbolAfter:true}, PLN:{symbol:'zł',decimals:2,symbolAfter:true}, VND:{symbol:'₫',decimals:0,symbolAfter:true}, TRY:{symbol:'₺',decimals:2}, CLP:{symbol:'CLP',decimals:0,symbolAfter:true}, ARS:{symbol:'ARS',decimals:2,symbolAfter:true}, PEN:{symbol:'S/',decimals:2,symbolAfter:true}, XGC:{symbol:'GC',decimals:2}, XSC:{symbol:'SC',decimals:2}
};
export const MICRO = 1000000;
export function microToNumber(m){ return (Number(m)||0) / MICRO; }
export function numberToMicro(n){ return Math.round((Number(n)||0) * MICRO); }
export function formatCurrencyMicro(amountMicro, currency='USD'){
  const meta = CurrencyMeta[currency] || { symbol: currency, decimals: 2, symbolAfter: true };
  const n = microToNumber(amountMicro);
  const fixed = n.toFixed(meta.decimals);
  return meta.symbolAfter ? (fixed + ' ' + (meta.symbol||'')) : ((meta.symbol||'') + fixed);
}
export function formatAmount(x, currency='USD'){
  const meta = CurrencyMeta[currency] || CurrencyMeta.USD;
  const n = Number(x)||0;
  const fixed = n.toFixed(meta.decimals);
  return meta.symbolAfter ? (fixed + ' ' + (meta.symbol||'')) : ((meta.symbol||'') + fixed);
}
