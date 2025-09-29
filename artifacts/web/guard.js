/* Minimal runtime network guard (ES5). Active only on localhost/file to avoid interfering with CDN. */
(function(){
  function isAbsolute(url){
    return /^https?:\/\//i.test(String(url));
  }
  function sameOrigin(url){
    try {
      var a = document.createElement('a'); a.href = url;
      var b = document.createElement('a'); b.href = window.location.href;
      return (a.protocol === b.protocol) && (a.host === b.host);
    } catch (e) { return false; }
  }
  var host = (window.location && window.location.hostname) || '';
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '' ;
  if (!isLocal) { return; }
  if (typeof window.fetch === 'function') {
    var origFetch = window.fetch;
    window.fetch = function(input, init){
      var url = (typeof input === 'string') ? input : (input && input.url);
      if (url && isAbsolute(url) && !sameOrigin(url)) {
        if (window.console && console.warn) console.warn('[networkGuard] blocked fetch to', url);
        return Promise.reject(new Error('External network blocked by guard'));
      }
      return origFetch.apply(this, arguments);
    };
  }
  if (typeof window.XMLHttpRequest === 'function') {
    var OrigXHR = window.XMLHttpRequest;
    var open = OrigXHR.prototype.open;
    OrigXHR.prototype.open = function(method, url, async){
      try {
        if (url && isAbsolute(url) && !sameOrigin(url)) {
          if (window.console && console.warn) console.warn('[networkGuard] blocked XHR to', url);
          throw new Error('External network blocked by guard');
        }
      } catch (e) { if (window.console && console.error) console.error(e); throw e; }
      return open.apply(this, arguments);
    };
  }
})();
