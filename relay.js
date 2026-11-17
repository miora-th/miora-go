// Relay page logic: read the ad code from the URL, send the pixel events and
// open the LINE chat with a prefilled message. The pure functions are also
// loaded by tests/relay.test.js (Node), so they must not touch the DOM.
(function (root) {
  'use strict';

  /** 'A01_AURA_macroA' -> 'A01'; anything else -> ''. */
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

  /**
   * Click handler for the LINE button. Contact is sent once per page view;
   * LINE opens delayMs after it so the event can leave the page. Taps while
   * waiting are ignored; taps after that (back from LINE) open LINE at once.
   * @param {Object} o { track(), go(), later(fn, ms), delayMs }
   */
  function makeOpener(o) {
    var state = 'idle'; // idle -> waiting -> done
    return function () {
      if (state === 'waiting') return;
      if (state === 'done') { o.go(); return; }
      state = 'waiting';
      try { o.track(); } catch (e) { /* the pixel must never block LINE */ }
      o.later(function () { state = 'done'; o.go(); }, o.delayMs);
    };
  }

  var api = { adCodeFrom: adCodeFrom, messageFor: messageFor, lineUrl: lineUrl, makeOpener: makeOpener };
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

  var openLine = makeOpener({
    track: function () { if (root.fbq) root.fbq('track', 'Contact'); },
    go: function () { root.location.href = url; },
    later: function (fn, ms) { root.setTimeout(fn, ms); },
    delayMs: config.openDelayMs || 300,
  });

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

  /** QR of the same LINE link (for a second phone or a computer). */
  function drawQr() {
    var box = document.getElementById('qr');
    if (!box) return;
    try {
      var qr = root.qrcode(0, 'L');
      qr.addData(url);
      qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } catch (e) {
      var wrap = document.getElementById('qr-wrap');
      if (wrap) wrap.style.display = 'none';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var go = document.getElementById('go');
    go.href = url; // works even if the script below fails
    go.addEventListener('click', function (ev) { ev.preventDefault(); openLine(); });
    document.getElementById('line-id').textContent = config.lineId;
    document.getElementById('copy').addEventListener('click', copyId);
    drawQr();
  });
})(typeof window !== 'undefined' ? window : this);
