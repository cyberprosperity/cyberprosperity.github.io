/* =========================================================
   CFXPros – Promo Berhadiah Nataru 2026
   Semua pengaturan yang perlu kamu ubah ada di blok CONFIG.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- CONFIG ---------- */
  var CONFIG = {
    // TODO: ganti dengan URL halaman daftar/deposit CFXPros.
    // Selama masih "#daftar", tombol hanya menggulir ke bagian bawah halaman.
    depositUrl: '#daftar',

    // Periode promo, waktu WIB (UTC+7).
    promoStart: '2026-11-01T00:00:00+07:00',
    promoEnd: '2026-12-31T23:59:59+07:00',

    // Teruskan parameter UTM/ref dari URL landing page ke link deposit.
    passThroughParams: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref']
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return document.getElementById(id); }
  function pad(n) { return String(n).padStart(2, '0'); }

  /* ---------- 1. Link tombol CTA ---------- */
  function buildDepositUrl() {
    var url = CONFIG.depositUrl;
    if (url.charAt(0) === '#') return url;
    try {
      var target = new URL(url, location.href);
      var current = new URLSearchParams(location.search);
      CONFIG.passThroughParams.forEach(function (k) {
        if (current.has(k) && !target.searchParams.has(k)) target.searchParams.set(k, current.get(k));
      });
      return target.toString();
    } catch (e) { return url; }
  }
  var depositUrl = buildDepositUrl();
  Array.prototype.forEach.call(document.querySelectorAll('[data-cta]'), function (a) {
    a.setAttribute('href', depositUrl);
    if (depositUrl.charAt(0) !== '#') {
      a.setAttribute('rel', 'noopener');
      a.addEventListener('click', function () {
        // Hook analitik opsional (GTM / dataLayer).
        if (window.dataLayer) window.dataLayer.push({ event: 'promo_cta_click', position: a.getAttribute('data-cta') });
      });
    }
  });

  /* ---------- 2. Header solid & tombol sticky mobile ---------- */
  var header = $('top'), sticky = $('sticky');
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('solid', y > 40);
    if (sticky) sticky.classList.toggle('show', y > 520);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. Hitung mundur ---------- */
  var START = new Date(CONFIG.promoStart), END = new Date(CONFIG.promoEnd);
  var cd = { d: $('cdD'), h: $('cdH'), m: $('cdM'), s: $('cdS'), label: $('cdLabel') };

  function tick() {
    if (!cd.d) return;
    var now = new Date(), target, label;
    if (now < START) { target = START; label = 'Promo dimulai dalam'; }
    else if (now < END) { target = END; label = 'Promo berakhir dalam'; }
    else {
      cd.label.textContent = 'Promo telah berakhir';
      cd.d.textContent = cd.h.textContent = cd.m.textContent = cd.s.textContent = '00';
      clearInterval(timer);
      return;
    }
    var t = Math.floor((target - now) / 1000);
    cd.label.textContent = label;
    cd.d.textContent = pad(Math.floor(t / 86400));
    cd.h.textContent = pad(Math.floor((t % 86400) / 3600));
    cd.m.textContent = pad(Math.floor((t % 3600) / 60));
    cd.s.textContent = pad(t % 60);
  }
  var timer = setInterval(tick, 1000);
  tick();

  /* ---------- 4. Salju, serpihan emas & kembang api ---------- */
  (function festive() {
    var canvas = $('snow');
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, flakes = [], sparks = [], visible = true;
    var COLORS = ['255,224,138', '255,255,255', '110,170,255', '255,120,138'];

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeFlake(initial) {
      var gold = Math.random() < 0.14;
      return {
        x: Math.random() * W,
        y: initial ? Math.random() * H : -10,
        r: gold ? 2 + Math.random() * 2.2 : 0.8 + Math.random() * 2.4,
        v: 0.4 + Math.random() * 1.1,
        d: Math.random() * Math.PI * 2,
        gold: gold
      };
    }

    function burst() {
      var n = W < 700 ? 28 : 48;
      var bx = W * (0.52 + Math.random() * 0.42);
      var by = H * (0.1 + Math.random() * 0.3);
      var color = COLORS[(Math.random() * COLORS.length) | 0];
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 + Math.random() * 0.2;
        var s = 1.1 + Math.random() * 2.1;
        sparks.push({ x: bx, y: by, vx: Math.cos(a) * s, vy: Math.sin(a) * s, a: 1, c: color });
      }
    }

    function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);

      flakes.forEach(function (p, i) {
        p.y += p.v; p.d += 0.012; p.x += Math.sin(p.d) * 0.5;
        if (p.y > H + 10) { flakes[i] = makeFlake(false); return; }
        ctx.beginPath();
        if (p.gold) {
          ctx.fillStyle = 'rgba(246,196,82,.85)';
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.d * 2);
          ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
          ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + p.r / 5) + ')';
          ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        }
      });

      sparks = sparks.filter(function (s) { return s.a > 0; });
      sparks.forEach(function (s) {
        s.x += s.vx; s.y += s.vy;
        s.vx *= 0.975; s.vy = s.vy * 0.975 + 0.035; s.a -= 0.013;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + s.c + ',' + Math.max(s.a, 0) * 0.85 + ')';
        ctx.arc(s.x, s.y, 1.7, 0, 6.283); ctx.fill();
      });
    }

    resize();
    var count = Math.round(Math.min(120, W / 10));
    for (var i = 0; i < count; i++) flakes.push(makeFlake(true));
    window.addEventListener('resize', resize);
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(canvas);

    setTimeout(burst, 1200);
    setInterval(function () { if (visible) burst(); }, 2800);
    frame();
  })();
})();