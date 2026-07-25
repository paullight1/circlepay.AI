/* =====================================================================
   CirclePay AI — landing interactions
   Progressive enhancement: content is fully visible without JS.
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------- current year ---------------------------- */
  var yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* --------------------------- sticky header ---------------------------- */
  var header = $("#siteHeader");
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------------------- mobile menu ----------------------------- */
  var toggle = $("#menuToggle");
  var menu = $("#mobileMenu");
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.hidden = !open;
      menu.classList.toggle("show", open);
    };
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setMenu(false); toggle.focus(); }
    });
  }

  /* --------------------- reveal on scroll (enhance) --------------------- */
  var revealEls = $$(".reveal, .reveal-child");
  if (revealEls.length && "IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* --------------------------- number count-up -------------------------- */
  var countEls = $$("[data-count]");
  var runCount = function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var dur = 1400, start = null;
    var step = function (ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (countEls.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    countEls.forEach(function (el) { cio.observe(el); });
  } else {
    countEls.forEach(function (el) { el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || ""); });
  }

  /* ----------------------------- trust gauge ---------------------------- */
  var gaugeFill = $("#gaugeFill");
  if (gaugeFill) {
    var len = 0;
    try { len = gaugeFill.getTotalLength(); } catch (e) { len = 314; }
    var pct = 0.85; /* 720 on a 300-850 scale, visually ~85% sweep */
    gaugeFill.style.strokeDasharray = len;
    if (reduceMotion) {
      gaugeFill.style.strokeDashoffset = len * (1 - pct);
    } else {
      gaugeFill.style.strokeDashoffset = len;
      gaugeFill.style.transition = "stroke-dashoffset 1.6s cubic-bezier(.25,1,.5,1)";
      var gio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { gaugeFill.style.strokeDashoffset = len * (1 - pct); gio.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      gio.observe(gaugeFill);
    }
  }

  /* ------------------------ the rotating circle ------------------------- */
  var ring = $("#ring");
  if (ring) {
    var members = [
      { name: "Tunde O.", init: "TO", c: "#4B27D4" },
      { name: "Godfrey O.", init: "GO", c: "#1BA87A" },
      { name: "Blessing A.", init: "BA", c: "#E0930F" },
      { name: "Chidi M.", init: "CM", c: "#E23D6B" },
      { name: "Aisha K.", init: "AK", c: "#2E7CF6" },
      { name: "Emeka N.", init: "EN", c: "#8E44AD" },
      { name: "Ruth I.", init: "RI", c: "#16A085" },
      { name: "Segun B.", init: "SB", c: "#D35400" },
      { name: "Joy E.", init: "JE", c: "#4B27D4" },
      { name: "Daniel U.", init: "DU", c: "#2C3E50" }
    ];
    var R = 42; /* percent radius for node placement */
    var nodes = members.map(function (m, i) {
      var ang = (i / members.length) * Math.PI * 2 - Math.PI / 2;
      var x = (50 + R * Math.cos(ang)) - 50;
      var y = (50 + R * Math.sin(ang)) - 50;
      var el = document.createElement("div");
      el.className = "ring-node";
      el.style.setProperty("--x", "calc(" + x + " * var(--size) / 100)");
      el.style.setProperty("--y", "calc(" + y + " * var(--size) / 100)");
      el.style.setProperty("--nc", m.c);
      el.innerHTML = m.init + '<span class="rn-status" aria-hidden="true"></span>';
      ring.appendChild(el);
      return el;
    });

    var amtEl = $("#ringAmt"), nameEl = $("#ringName"), weekEl = $("#ringWeek");
    var pool = "₦100,000";
    var cur = 0;
    var paint = function () {
      nodes.forEach(function (el, i) {
        el.classList.remove("is-active", "is-paid", "is-pending");
        var st = $(".rn-status", el);
        if (i === cur) { el.classList.add("is-active"); if (st) st.textContent = "★"; }
        else if (i < cur) { el.classList.add("is-paid"); if (st) st.textContent = "✓"; }
        else { el.classList.add("is-pending"); if (st) st.textContent = ""; }
      });
      if (amtEl) amtEl.textContent = pool;
      if (nameEl) nameEl.textContent = members[cur].name;
      if (weekEl) weekEl.textContent = "Week " + (cur + 1) + " of " + members.length;
    };
    paint();

    if (!reduceMotion) {
      var advance = function () { cur = (cur + 1) % members.length; paint(); };
      var timer = null;
      var start = function () { if (!timer) timer = setInterval(advance, 2200); };
      var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
      if ("IntersectionObserver" in window) {
        var rio = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
        }, { threshold: 0.25 });
        rio.observe(ring);
      } else { start(); }
      document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    }
  }

  /* --------------------------- FAQ single-open -------------------------- */
  var faqItems = $$("#faqList .faq-item");
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) faqItems.forEach(function (o) { if (o !== item) o.open = false; });
    });
  });

  /* ---------------------------- waitlist form --------------------------- */
  var form = $("#waitlist");
  if (form) {
    var input = $("#wl-email", form);
    var msg = $("#wlMsg");
    var valid = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = (input.value || "").trim();
      if (!valid(v)) {
        input.classList.add("invalid");
        msg.textContent = "Please enter a valid email so we can reach you at launch.";
        msg.className = "waitlist-msg err";
        input.focus();
        return;
      }
      input.classList.remove("invalid");
      // No backend yet (pre-launch). Persist locally so the intent isn't lost.
      try {
        var list = JSON.parse(localStorage.getItem("cp_waitlist") || "[]");
        if (list.indexOf(v) === -1) list.push(v);
        localStorage.setItem("cp_waitlist", JSON.stringify(list));
      } catch (err) { /* storage unavailable — non-fatal */ }
      form.reset();
      msg.textContent = "You're on the list. We'll email " + v + " the moment CirclePay goes live.";
      msg.className = "waitlist-msg ok";
    });
    input.addEventListener("input", function () { input.classList.remove("invalid"); });
  }

  /* --------------------- generic local forms (.js-form) ----------------- */
  var isEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  $$(".js-form").forEach(function (f) {
    var msg = $(".form-msg", f);
    var required = $$("[required]", f);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      required.forEach(function (el) {
        var bad = !String(el.value).trim() || (el.type === "email" && !isEmail(el.value));
        el.classList.toggle("invalid", bad);
        if (bad && ok) { el.focus(); ok = false; }
      });
      if (!ok) { if (msg) { msg.textContent = "Please complete the highlighted fields with valid details."; msg.className = "form-msg err"; } return; }
      f.reset();
      if (msg) { msg.textContent = f.getAttribute("data-success") || "Thanks — we'll be in touch shortly."; msg.className = "form-msg ok"; }
    });
    required.forEach(function (el) { el.addEventListener("input", function () { el.classList.remove("invalid"); }); });
  });
})();
