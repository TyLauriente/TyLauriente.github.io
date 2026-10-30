/* Static demo of the portfolio dashboard (Olbiro) for GitHub Pages.
   The real app gets its data from its own server over a WebSocket. Here that socket is replaced by one that replays a
   recording of the app's demo mode (made-up holdings, public market data), and the page's clock runs at the time of
   the recording so prices read as fresh. The recording loops. Anything the page sends (search, settings) gets no
   answer, since there is no server. REC_START is filled in by the site build. */
(function () {
  "use strict";
  var REC_START = 1793341480234;            // epoch ms of the recording's first message
  var RealDate = Date, off = REC_START - RealDate.now();
  function FakeDate() {
    var a = Array.prototype.slice.call(arguments);
    var d = a.length ? new (Function.prototype.bind.apply(RealDate, [null].concat(a)))() : new RealDate(RealDate.now() + off);
    Object.setPrototypeOf(d, FakeDate.prototype);
    return d;
  }
  FakeDate.prototype = Object.create(RealDate.prototype, { constructor: { value: FakeDate } });
  Object.setPrototypeOf(FakeDate, RealDate);
  FakeDate.now = function () { return RealDate.now() + off; };
  FakeDate.parse = RealDate.parse; FakeDate.UTC = RealDate.UTC;
  window.Date = FakeDate;

  var data = fetch("./demo-data.json").then(function (r) { return r.json(); });

  function ReplaySocket(url) {
    var self = this;
    this.url = url; this.readyState = 0; this.protocol = ""; this.extensions = ""; this.bufferedAmount = 0;
    this.binaryType = "blob"; this.onopen = this.onmessage = this.onclose = this.onerror = null;
    this._t = [];
    var et = new EventTarget();
    this.addEventListener = et.addEventListener.bind(et);
    this.removeEventListener = et.removeEventListener.bind(et);
    this._et = et;
    data.then(function (d) {
      if (self.readyState !== 0) return;
      self.readyState = 1;
      self._emit("open", new Event("open"));
      self._play(d.messages);
    });
  }
  ReplaySocket.prototype._emit = function (type, ev) {
    var h = this["on" + type];
    if (h) h.call(this, ev);
    this._et.dispatchEvent(ev);
  };
  ReplaySocket.prototype._play = function (msgs) {
    var self = this, span = msgs[msgs.length - 1].dt;
    function send(m) { if (self.readyState === 1) self._emit("message", new MessageEvent("message", { data: m.data })); }
    function loop() {
      off = REC_START - RealDate.now();      // the clock starts again at the recording's start
      send(msgs[0]);
      for (var i = 1; i < msgs.length; i++) (function (m) { self._t.push(setTimeout(function () { send(m); }, m.dt * 1000)); })(msgs[i]);
      self._t.push(setTimeout(loop, (span + 1) * 1000));
    }
    loop();
  };
  ReplaySocket.prototype.send = function () {};
  ReplaySocket.prototype.close = function () {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this._t.forEach(clearTimeout);
    this._emit("close", new CloseEvent("close", { code: 1000, wasClean: true }));
  };
  ReplaySocket.CONNECTING = 0; ReplaySocket.OPEN = 1; ReplaySocket.CLOSING = 2; ReplaySocket.CLOSED = 3;
  window.WebSocket = ReplaySocket;

  // the app's other server calls (phone pairing, LAN info) answer "not available" instead of a 404 page
  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var u = typeof input === "string" ? input : (input && input.url) || "";
    if (/^\/api\//.test(u) || /\/ping$/.test(u)) return Promise.resolve(new Response("{}", { status: 503, headers: { "Content-Type": "application/json" } }));
    return realFetch(input, init);
  };
  if (navigator.serviceWorker) navigator.serviceWorker.register = function () { return Promise.reject(new Error("no service worker in the static demo")); };

  // a small, honest label on every page of the demo
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.createElement("a");
    b.href = "../";
    b.textContent = "Demo: made-up holdings, market data recorded " + new RealDate(REC_START).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) + " · back to resume";
    b.setAttribute("style", "position:fixed;left:8px;bottom:8px;z-index:2147483647;font:500 11px/1.2 system-ui,sans-serif;" +
      "background:rgba(20,20,20,.86);color:#fff;padding:6px 9px;border-radius:6px;text-decoration:none;max-width:calc(100vw - 16px)");
    document.body.appendChild(b);
  });
})();
