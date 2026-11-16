// Relay page logic: read the ad code from the URL, send the pixel events and
// open the LINE chat with a prefilled message. The pure functions are also
// loaded by tests/relay.test.js (Node), so they must not touch the DOM.
(function (root) {
  'use strict';

  /** 'A01_AURA_tester' -> 'A01'; anything else -> ''. */
  function adCodeFrom(adName) {
    var m = /^([A-Z]\d{2})_/.exec(String(adName || '').trim());
    return m ? m[1] : '';
  }

  /** Text for the LINE chat: the code's own message (or the default) + ' #A01'. */
  function messageFor(code, config) {
    var own = code && config.messages && config.messages[code];
    var text = String(own || config.defaultMessage || '').trim();
    return code ? text + ' #' + code : text;
  }

  /**
   * https://line.me/R/oaMessage/{LINE ID}/?{text}, both percent-encoded in
   * UTF-8 (LINE URL scheme docs, checked 2026-11-15).
   */
  function lineUrl(lineId, text) {
    return 'https://line.me/R/oaMessage/' + encodeURIComponent(lineId) + '/?' + encodeURIComponent(text);
  }

  var api = { adCodeFrom: adCodeFrom, messageFor: messageFor, lineUrl: lineUrl };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  // ---------------------------------------------------------------- browser
  var config = root.MIORA_CONFIG || {};
  var params = new URLSearchParams(root.location.search);
  var code = adCodeFrom(params.get('ad'));
  var url = lineUrl(config.lineId, messageFor(code, config));

  if (config.pixelId) {
    /* Meta Pixel base code (developers.facebook.com/docs/meta-pixel/get-started) */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(root, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    root.fbq('init', config.pixelId);
    root.fbq('track', 'PageView');
  }

  function openLine(ev) {
    ev.preventDefault();
    if (root.fbq) root.fbq('track', 'Contact');
    root.setTimeout(function () { root.location.href = url; }, config.openDelayMs || 300);
  }

  function copyId() {
    var btn = document.getElementById('copy');
    var done = function () { btn.textContent = btn.getAttribute('data-done'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(config.lineId).then(done, fallback);
    } else {
      fallback();
    }
    function fallback() {
      var t = document.createElement('textarea');
      t.value = config.lineId;
      t.setAttribute('readonly', '');
      t.style.position = 'absolute'; t.style.left = '-9999px';
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* user can still read the ID */ }
      document.body.removeChild(t);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var go = document.getElementById('go');
    go.href = url; // works even if the script below fails
    go.addEventListener('click', openLine);
    document.getElementById('line-id').textContent = config.lineId;
    document.getElementById('copy').addEventListener('click', copyId);
  });
})(typeof window !== 'undefined' ? window : this);
