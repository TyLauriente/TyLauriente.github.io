/* Resume site: phone tabs, and skills that point at their evidence (hover, focus or tap a skill to light up the
   bullets and projects that show it). */
(function () {
  "use strict";
  var cols = Array.prototype.slice.call(document.querySelectorAll(".col"));
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tabs a"));

  function show(id) {
    cols.forEach(function (c) { c.classList.toggle("on", c.id === id); });
    tabs.forEach(function (t) { t.classList.toggle("on", t.dataset.tab === id); });
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function (e) { e.preventDefault(); show(t.dataset.tab); history.replaceState(null, "", "#" + t.dataset.tab); });
  });
  var start = location.hash.slice(1);
  show(cols.some(function (c) { return c.id === start; }) ? start : "about");

  // each skill chip carries a pattern; count and light the places it shows up
  var targets = Array.prototype.slice.call(document.querySelectorAll("#work li, #projects .proj"));
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-match]"));
  chips.forEach(function (chip) {
    var re = new RegExp(chip.dataset.match, "i");
    var hits = targets.filter(function (t) { return re.test(t.textContent); });
    if (!hits.length) return;
    chip.dataset.hits = hits.length;
    chip.tabIndex = 0;
    chip.setAttribute("role", "button");
    chip.setAttribute("aria-label", chip.textContent + ": shows up in " + hits.length + (hits.length === 1 ? " place" : " places"));
    function on() { chip.classList.add("on"); hits.forEach(function (h) { h.classList.add("lit"); }); }
    function off() { chip.classList.remove("on"); hits.forEach(function (h) { h.classList.remove("lit"); }); }
    chip.addEventListener("mouseenter", on);
    chip.addEventListener("mouseleave", off);
    chip.addEventListener("focus", on);
    chip.addEventListener("blur", off);
    chip.addEventListener("click", function () {
      var was = chip.classList.contains("on");
      chips.forEach(function (c) { c.classList.remove("on"); });
      targets.forEach(function (t) { t.classList.remove("lit"); });
      if (!was) {
        on();
        // on a phone, jump to the first place it shows up
        if (window.matchMedia("(max-width: 860px), (max-aspect-ratio: 4/5)").matches) {
          var col = hits[0].closest(".col");
          show(col.id);
          hits[0].scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }
    });
  });
})();
