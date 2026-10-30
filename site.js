/* Resume site: phone tabs; skills that point at their evidence (hover, focus or tap a skill: the bullets and projects
   that show it light up and a line is drawn to each one on screen); numbers that count up; bullets that rise into
   view as their column scrolls; a cursor light on project cards; and the story, nine scenes moved by wheel, swipe,
   keys or the rail, in a full-window layer so the page itself never scrolls. Reduced motion: no motion at all. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var phone = window.matchMedia("(max-width: 860px), (max-aspect-ratio: 4/5)");

  // ---- phone tabs
  var cols = $$(".col"), tabs = $$(".tabs a");
  function show(id) {
    cols.forEach(function (c) { c.classList.toggle("on", c.id === id); });
    tabs.forEach(function (t) { t.classList.toggle("on", t.dataset.tab === id); if (t.dataset.tab === id) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current"); });
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function (e) { e.preventDefault(); show(t.dataset.tab); history.replaceState(null, "", "#" + t.dataset.tab); });
  });
  var start = location.hash.slice(1);
  show(cols.some(function (c) { return c.id === start; }) ? start : "about");

  // ---- numbers that count up once
  $$(".glance dt").forEach(function (dt, i) {
    var m = dt.textContent.match(/^(\D*)(\d+)(.*)$/);
    if (!m || still) return;
    var end = +m[2], t0 = null, dur = 900 + i * 120;
    dt.textContent = m[1] + "0" + m[3];
    function step(t) {
      if (t0 === null) t0 = t + 500;
      var k = Math.min(1, Math.max(0, (t - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      dt.textContent = m[1] + Math.round(end * e) + m[3];
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });

  // ---- bullets rise into view as their own column scrolls (the page never scrolls)
  if (!still && "IntersectionObserver" in window) {
    cols.forEach(function (col) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { root: col, rootMargin: "0px 0px -4% 0px" });
      $$("li, .proj, .glance div", col).forEach(function (el, i) {
        el.classList.add("reveal");
        el.style.transitionDelay = Math.min(i, 8) * 45 + 700 + "ms";
        io.observe(el);
        setTimeout(function () { el.style.transitionDelay = ""; }, 2200);
      });
    });
  }

  // ---- cursor light on project cards
  $$(".proj").forEach(function (p) {
    p.addEventListener("pointermove", function (e) {
      var r = p.getBoundingClientRect();
      p.style.setProperty("--mx", e.clientX - r.left + "px");
      p.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  // ---- skills point at their evidence
  var wires = $(".wires"), NS = "http://www.w3.org/2000/svg";
  var targets = $$("#work li, #projects .proj");
  var chips = $$(".chip[data-match]");
  function clearWires() { while (wires.firstChild) wires.removeChild(wires.firstChild); }
  function drawWires(chip, hits) {
    clearWires();
    if (phone.matches) return;
    var a = chip.getBoundingClientRect(), x0 = a.right + 4, y0 = a.top + a.height / 2;
    hits.forEach(function (h, i) {
      var b = h.getBoundingClientRect(), col = h.closest(".col").getBoundingClientRect();
      if (b.bottom < col.top || b.top > col.bottom) return;          // scrolled out of its column
      var x1 = b.left - 6, y1 = Math.max(col.top + 6, Math.min(col.bottom - 6, b.top + Math.min(14, b.height / 2)));
      var dx = Math.max(40, (x1 - x0) / 2);
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", "M" + x0 + "," + y0 + " C" + (x0 + dx) + "," + y0 + " " + (x1 - dx) + "," + y1 + " " + x1 + "," + y1);
      wires.appendChild(p);
      var len = p.getTotalLength();
      p.style.setProperty("--len", len);
      p.style.animationDelay = i * 60 + "ms";
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x1); c.setAttribute("cy", y1); c.setAttribute("r", 2.6);
      wires.appendChild(c);
    });
  }
  chips.forEach(function (chip) {
    var re = new RegExp(chip.dataset.match, "i");
    var hits = targets.filter(function (t) { return re.test(t.textContent); });
    if (!hits.length) return;
    chip.dataset.hits = hits.length;
    chip.tabIndex = 0;
    chip.setAttribute("role", "button");
    chip.setAttribute("aria-label", chip.textContent + ": shows up in " + hits.length + (hits.length === 1 ? " place" : " places"));
    function on() {
      chip.classList.add("on");
      hits.forEach(function (h) { h.classList.add("lit"); h.classList.add("in"); });
      drawWires(chip, hits);
    }
    function off() { chip.classList.remove("on"); hits.forEach(function (h) { h.classList.remove("lit"); }); clearWires(); }
    chip.addEventListener("mouseenter", on);
    chip.addEventListener("mouseleave", off);
    chip.addEventListener("focus", on);
    chip.addEventListener("blur", off);
    chip.addEventListener("click", function () {
      var was = chip.classList.contains("on") && phone.matches;
      chips.forEach(function (c) { c.classList.remove("on"); });
      targets.forEach(function (t) { t.classList.remove("lit"); });
      if (was) return;
      on();
      if (phone.matches) {
        show(hits[0].closest(".col").id);
        hits[0].scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
      }
    });
  });
  cols.forEach(function (c) { c.addEventListener("scroll", clearWires, { passive: true }); });
  window.addEventListener("resize", clearWires);

  // ---- the story
  var story = $(".story"), scenes = $$(".scene", story), rail = $(".story__rail", story);
  var count = $(".story__count b", story), bar = $(".story__progress i", story);
  var cur = -1, lock = 0, opener = null, sparkStop = null;
  scenes.forEach(function (s, i) {
    var li = document.createElement("li"), b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Scene " + (i + 1) + ": " + s.dataset.title);
    b.addEventListener("click", function () { go(i); });
    li.appendChild(b);
    rail.appendChild(li);
  });
  var dots = $$("button", rail);
  function go(i) {
    i = Math.max(0, Math.min(scenes.length - 1, i));
    if (i === cur) return;
    var back = i < cur;
    scenes.forEach(function (s, k) {
      s.classList.toggle("on", k === i);
      s.classList.toggle("up", !back && k < i || back && k < i);
      s.setAttribute("aria-hidden", k === i ? "false" : "true");
      if (k !== i) s.inert = true; else s.inert = false;
    });
    dots.forEach(function (d, k) { if (k === i) d.setAttribute("aria-current", "step"); else d.removeAttribute("aria-current"); });
    count.textContent = i + 1;
    bar.style.width = (i + 1) / scenes.length * 100 + "%";
    cur = i;
    if (sparkStop) { sparkStop(); sparkStop = null; }
    if (scenes[i].classList.contains("s-money")) sparkStop = spark(scenes[i]);
  }
  function open() {
    opener = document.activeElement;
    story.hidden = false;
    requestAnimationFrame(function () { story.classList.add("open"); });
    cur = -1;
    go(0);
    story.tabIndex = -1;
    story.focus({ preventScroll: true });
    document.addEventListener("keydown", keys);
  }
  function close() {
    story.classList.remove("open");
    document.removeEventListener("keydown", keys);
    if (sparkStop) { sparkStop(); sparkStop = null; }
    setTimeout(function () { story.hidden = true; }, still ? 0 : 350);
    if (opener) opener.focus();
  }
  function keys(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (["ArrowDown", "ArrowRight", "PageDown", " "].indexOf(e.key) >= 0) { e.preventDefault(); go(cur + 1); }
    else if (["ArrowUp", "ArrowLeft", "PageUp"].indexOf(e.key) >= 0) { e.preventDefault(); go(cur - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End") { e.preventDefault(); go(scenes.length - 1); }
    else if (e.key === "Tab") {                                   // keep focus inside the dialog
      var f = $$("button, a[href]", story).filter(function (el) { return !el.closest("[inert]") && el.offsetParent; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  }
  story.addEventListener("wheel", function (e) {
    e.preventDefault();
    var now = Date.now();
    if (now < lock || Math.abs(e.deltaY) < 8) return;
    lock = now + (still ? 250 : 750);
    go(cur + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });
  var ty = null;
  story.addEventListener("touchstart", function (e) { ty = e.touches[0].clientY; }, { passive: true });
  story.addEventListener("touchend", function (e) {
    if (ty === null) return;
    var d = ty - e.changedTouches[0].clientY;
    if (Math.abs(d) > 40) go(cur + (d > 0 ? 1 : -1));
    ty = null;
  }, { passive: true });
  $$("[data-story-open]").forEach(function (b) { b.addEventListener("click", open); });
  $$("[data-story-close]").forEach(function (b) { b.addEventListener("click", close); });

  // scene 07: bitcoin from the demo's recording, replayed; the price turns amber when it goes unconfirmed
  var sparkData = null;
  function spark(scene) {
    var fig = $(".spark", scene), line = $(".spark__line", scene), dot = $(".spark__dot", scene);
    var px = $(".spark__px", scene), age = $(".spark__age", scene), stopped = false, timer = null;
    function run(pts) {
      var k0 = 0;
      while (k0 < pts.length - 2 && pts[k0 + 1] === pts[0]) k0++;      // skip a flat start (bars carried forward)
      pts = pts.slice(k0);
      var svg = line.ownerSVGElement, W = svg.clientWidth || 600, H = svg.clientHeight || 150;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var n = pts.length, lo = Math.min.apply(null, pts), hi = Math.max.apply(null, pts);
      var X = function (i) { return i / (n - 1) * W; }, Y = function (v) { return H - (v - lo) / (hi - lo || 1) * (H - 10) - 5; };
      var i = still ? n - 1 : Math.floor(n * .35), quiet = 0;
      function draw() {
        var d = "M0," + Y(pts[0]);
        for (var k = 1; k <= i; k++) d += " L" + X(k) + "," + Y(pts[k]);
        line.setAttribute("d", d);
        dot.setAttribute("cx", X(i)); dot.setAttribute("cy", Y(pts[i]));
        px.textContent = "BTC $" + Math.round(pts[i]).toLocaleString("en-US");
      }
      function tick() {
        if (stopped) return;
        if (i < n - 1 && quiet === 0) { i++; draw(); age.textContent = "confirmed 0 s ago"; fig.classList.remove("stale"); if (i === n - 1) quiet = 1; }
        else {                                   // the feed went quiet: count up to amber at 75 s, then start again
          quiet += 5;
          age.textContent = quiet >= 75 ? "no source has confirmed it for " + quiet + " s" : "confirmed " + quiet + " s ago";
          fig.classList.toggle("stale", quiet >= 75);
          if (quiet > 95) { i = Math.floor(n * .35); quiet = 0; }
        }
        timer = setTimeout(tick, quiet ? 160 : 45);
      }
      draw();
      if (!still) tick();
    }
    if (sparkData) run(sparkData);
    else fetch("spark.json").then(function (r) { return r.json(); }).then(function (d) { sparkData = d.close; if (!stopped) run(sparkData); }).catch(function () {});
    return function () { stopped = true; clearTimeout(timer); };
  }
})();
