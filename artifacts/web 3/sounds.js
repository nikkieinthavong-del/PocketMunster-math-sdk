// sounds.js - WebAudio + HTMLAudio helper (ES5-compatible)
var ctx = new (window.AudioContext||window.webkitAudioContext)();
var muted = false; var unlocked = false;
function unlock(){ if (!unlocked){ try{ var b = ctx.createBuffer(1,1,22050); var src = ctx.createBufferSource(); src.buffer=b; src.connect(ctx.destination); try{ src.start(0); }catch(e){} unlocked=true; }catch(e){} } }
export function setMuted(v){ muted = !!v; try{ if (muted) sfx.stopMusic(); }catch(e){} }
export function isMuted(){ return muted; }
export function resume(){ try { if (ctx.state==='suspended') ctx.resume(); } catch (e) {} unlock(); }
function beep(freq, dur, type, gain){ if (muted) return; freq=freq||880; dur=dur==null?0.12:dur; type=type||'sine'; gain=gain==null?0.03:gain; var o=ctx.createOscillator(); var g=ctx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=gain; o.connect(g); g.connect(ctx.destination); var t=ctx.currentTime; o.start(t); o.stop(t+dur); }
var BASE = (window.PocketMunsters && window.PocketMunsters.ASSETS_BASE) || './assets/';
var SOUND_BASE = (BASE && BASE.charAt(BASE.length-1)==='/') ? (BASE + 'sounds/') : (BASE + '/sounds/');
// Support multiple filename fallbacks (e.g., 'background.mp3' vs legacy 'backgound.mp3')
var files = { clusterWin: 'Cluster tumble wins.mp3', moreHits: '2orMoreHits.mp3', background: ['backgound.mp3','background.mp3'] };
function makeUrl(name){ try { return encodeURI(SOUND_BASE + name); } catch (e) { return SOUND_BASE + name; } }
function asArray(x){ return Array.isArray(x)? x : [x]; }
function AudioSample(namesOrUrl, opts){
  opts=opts||{};
  this._names = asArray(namesOrUrl);
  this._index = 0;
  this._urls = this._names.map(function(n){ return makeUrl(n); });
  this.url = this._urls[0] || '';
  this.el = new Audio(this.url);
  this.el.preload='auto'; this.el.loop=!!opts.loop; this.el.volume=(opts.volume!=null? opts.volume:0.8);
  this.loaded=false; this.failed=false; this._bind();
}
AudioSample.prototype._bind=function(){
  var self=this;
  this.el.addEventListener('canplaythrough', function(){ self.loaded=true; }, { once:true });
  this.el.addEventListener('error', function(){
    // Try next fallback if any; mark failed only when all options exhausted
    try{
      if (self._index < (self._urls.length - 1)){
        self._index++;
        var next = self._urls[self._index];
        self.el.src = next; // triggers new load
        self.el.load();
        return;
      }
    } catch (e) {}
    self.failed=true;
  });
};
AudioSample.prototype.play=function(){ if (muted) return; try { resume(); this.el.currentTime = 0; this.el.play(); } catch (e) {} };
AudioSample.prototype.stop=function(){ try { this.el.pause(); this.el.currentTime = 0; } catch (e) {} };
AudioSample.prototype.setLoop=function(v){ this.el.loop = !!v; };
AudioSample.prototype.setVolume=function(v){ v=Number(v); if (!isFinite(v)) v=0; if (v<0) v=0; if (v>1) v=1; this.el.volume=v; };
var samples = {
  clusterWin: new AudioSample(asArray(files.clusterWin), { loop:false, volume:0.75 }),
  moreHits: new AudioSample(asArray(files.moreHits), { loop:false, volume:0.70 }),
  music: new AudioSample(asArray(files.background), { loop:true, volume:0.25 })
};
function playClusterWin(){ if (!samples.clusterWin || samples.clusterWin.failed){ beep(1320, .18, 'square', .05); setTimeout(function(){ beep(1760,.18,'square',.05); }, 120); return; } samples.clusterWin.play(); }
function playMoreHits(){ if (!samples.moreHits || samples.moreHits.failed){ beep(1480, .14, 'triangle', .045); return; } samples.moreHits.play(); }
var MUSIC_FADE_MS = 600;
function fadeVolume(el, to, ms){ try{ var from = Number(el.volume)||0; var dur = (ms==null?MUSIC_FADE_MS:ms); var start = performance.now(); function step(t){ var p=Math.min(1,(t-start)/dur); var v = from + (to-from)*p; if (muted){ el.volume = 0; return; } el.volume = v; if (p<1) requestAnimationFrame(step); } requestAnimationFrame(step); }catch(e){} }
function startMusic(){ if (!samples.music || samples.music.failed) return; if (muted) return; try{ resume(); var el = samples.music.el; el.loop = true; var target = samples.music.el.volume!=null ? samples.music.el.volume : 0.25; el.volume = 0; el.play(); fadeVolume(el, target, MUSIC_FADE_MS); }catch(e){} }
function stopMusic(){ try{ samples.music && samples.music.stop && samples.music.stop(); }catch(e){} }
export function configureAudio(opts){ try{ opts=opts||{}; function num(x){ var v=Number(x); return (isFinite(v)? v: null); }
  if (opts.clusterWin!=null){ var v=num(opts.clusterWin); if (v!=null){ if (v<0) v=0; if (v>1) v=1; samples.clusterWin && samples.clusterWin.setVolume && samples.clusterWin.setVolume(v); } }
  if (opts.moreHits!=null){ var v2=num(opts.moreHits); if (v2!=null){ if (v2<0) v2=0; if (v2>1) v2=1; samples.moreHits && samples.moreHits.setVolume && samples.moreHits.setVolume(v2); } }
  if (opts.music!=null){ var v3=num(opts.music); if (v3!=null){ if (v3<0) v3=0; if (v3>1) v3=1; samples.music && samples.music.setVolume && samples.music.setVolume(v3); } }
  if (opts.musicFadeMs!=null){ var mf=num(opts.musicFadeMs); if (mf!=null && mf>=0){ MUSIC_FADE_MS = mf; } }
}catch(e){} }
export var sfx = { click:function(){ beep(600, .06, 'square', .04); }, spin:function(){ beep(440, .08, 'sawtooth', .03); }, tick:function(){ beep(880, .04, 'triangle', .02); }, win:function(){ playClusterWin(); }, bigWin:function(){ beep(880,.2,'sawtooth',.06); setTimeout(function(){ beep(1320,.2,'sawtooth',.06); },160); setTimeout(function(){ beep(1760,.25,'sawtooth',.06); },320); }, clusterWin:function(){ playClusterWin(); }, moreHits:function(){ playMoreHits(); }, startMusic:function(){ startMusic(); }, stopMusic:function(){ stopMusic(); } };
window.__SOUNDS__ = { setMuted: setMuted, isMuted: isMuted, resume: resume, sfx: sfx, configureAudio: configureAudio };
