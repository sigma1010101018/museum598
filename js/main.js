(function () {
  'use strict';

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(.2, .8, .2, 1)';
  function $(s, root) { return (root || document).querySelector(s); }
  function $$(s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------- Шапка, меню, полоса прокрутки ---------- */
  var top = $('#top'), bar = $('.progress i'), menuBtn = $('.menu-btn'), nav = $('#nav');
  var ticking = false, scrollFns = [];
  function onScroll() {
    ticking = false;
    var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    top.classList.toggle('is-stuck', y > 40);
    bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
    for (var i = 0; i < scrollFns.length; i++) scrollFns[i](y);
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) { nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- Появление блоков ---------- */
  (function () {
    var els = $$('[data-r]');
    if (!els.length) return;
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Сцена первого экрана: небо, город, прожектора, снег ---------- */
  (function () {
    var cv = $('#scene');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    if (!ctx) return;
    var W = 0, H = 0, dpr = 1, city = null, flakes = [], stars = [];
    var mx = 0, my = 0, tx = 0, ty = 0, visible = true, raf = 0;
    var seed = 598;
    function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }

    var BEAMS = [
      { x: 0.07, a: -0.42, amp: 0.34, sp: 0.21, ph: 0.3 },
      { x: 0.29, a: 0.30, amp: 0.30, sp: 0.17, ph: 2.1 },
      { x: 0.5, a: -0.10, amp: 0.42, sp: 0.13, ph: 4.0 },
      { x: 0.73, a: 0.36, amp: 0.30, sp: 0.19, ph: 1.2 },
      { x: 0.93, a: -0.30, amp: 0.36, sp: 0.15, ph: 5.2 }
    ];

    function roofs(c, color, base, minH, maxH, s) {
      c.fillStyle = color;
      var x = -30;
      while (x < W + 30) {
        var w = (26 + rnd() * 70) * s, h = (minH + rnd() * (maxH - minH)) * s;
        c.fillRect(x, base - h, w + 1, h + 4);
        if (rnd() > 0.55) c.fillRect(x + w * (0.2 + rnd() * 0.5), base - h - 9 * s, 5 * s, 10 * s);
        if (rnd() > 0.8) { c.beginPath(); c.moveTo(x, base - h); c.lineTo(x + w / 2, base - h - 12 * s); c.lineTo(x + w, base - h); c.fill(); }
        x += w;
      }
    }
    function tri(c, x, y, w, h) { c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x, y - h); c.lineTo(x + w / 2, y); c.fill(); }
    function dome(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, Math.PI, 0); c.fill(); }
    function cross(c, x, y, s) { c.fillRect(x - 0.8 * s, y - 12 * s, 1.6 * s, 12 * s); c.fillRect(x - 4 * s, y - 9 * s, 8 * s, 1.6 * s); }
    // Петропавловский собор
    function fortress(c, x, b, s) {
      c.fillRect(x - 46 * s, b - 46 * s, 120 * s, 50 * s);
      c.fillRect(x - 18 * s, b - 104 * s, 36 * s, 62 * s);
      c.fillRect(x - 13 * s, b - 146 * s, 26 * s, 44 * s);
      c.fillRect(x - 9 * s, b - 176 * s, 18 * s, 32 * s);
      dome(c, x, b - 176 * s, 10 * s, 12 * s);
      tri(c, x, b - 184 * s, 9 * s, 150 * s);
      cross(c, x, b - 332 * s, s);
      dome(c, x + 50 * s, b - 46 * s, 16 * s, 20 * s);
    }
    // Исаакиевский собор
    function isaac(c, x, b, s) {
      c.fillRect(x - 118 * s, b - 66 * s, 236 * s, 70 * s);
      tri(c, x, b - 66 * s, 116 * s, 22 * s);
      c.fillRect(x - 50 * s, b - 124 * s, 100 * s, 60 * s);
      dome(c, x, b - 124 * s, 52 * s, 62 * s);
      c.fillRect(x - 8 * s, b - 204 * s, 16 * s, 22 * s);
      dome(c, x, b - 204 * s, 9 * s, 11 * s);
      cross(c, x, b - 213 * s, s);
      [-88, 88].forEach(function (d) { c.fillRect(x + (d - 12) * s, b - 96 * s, 24 * s, 32 * s); dome(c, x + d * s, b - 96 * s, 13 * s, 16 * s); });
    }
    // Адмиралтейство
    function admiralty(c, x, b, s) {
      c.fillRect(x - 130 * s, b - 38 * s, 260 * s, 42 * s);
      c.fillRect(x - 27 * s, b - 88 * s, 54 * s, 52 * s);
      c.fillRect(x - 19 * s, b - 122 * s, 38 * s, 36 * s);
      dome(c, x, b - 122 * s, 17 * s, 20 * s);
      tri(c, x, b - 138 * s, 7 * s, 118 * s);
      c.fillRect(x - 5 * s, b - 262 * s, 10 * s, 3 * s);
    }
    // Ростральная колонна
    function rostral(c, x, b, s) {
      c.beginPath(); c.moveTo(x - 8 * s, b); c.lineTo(x - 5 * s, b - 104 * s); c.lineTo(x + 5 * s, b - 104 * s); c.lineTo(x + 8 * s, b); c.fill();
      c.fillRect(x - 11 * s, b - 110 * s, 22 * s, 6 * s);
      c.fillRect(x - 14 * s, b - 14 * s, 28 * s, 14 * s);
    }

    function buildCity() {
      city = document.createElement('canvas');
      city.width = cv.width; city.height = cv.height;
      var c = city.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      var base = H * 0.9, s = Math.min(H / 880, W / 760);
      seed = 598;
      roofs(c, '#5b5937', base - 6 * s, 26, 70, s);
      c.fillStyle = '#5b5937';
      if (W > 760) { rostral(c, W * 0.40, base - 6 * s, s * 0.9); rostral(c, W * 0.46, base - 6 * s, s * 0.9); }
      seed = 1941;
      roofs(c, '#262818', base, 14, 46, s);
      c.fillStyle = '#262818';
      fortress(c, W * (W > 760 ? 0.2 : 0.2), base, s);
      isaac(c, W * (W > 760 ? 0.66 : 0.72), base, s);
      if (W > 760) admiralty(c, W * 0.9, base, s);
      c.fillRect(0, base, W, H - base);
    }

    function resize() {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var n = Math.round(clamp(W * H / 6500, 70, 260));
      flakes = [];
      for (var i = 0; i < n; i++) flakes.push({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.8, v: 14 + Math.random() * 34, d: Math.random() * 6.28, a: 0.25 + Math.random() * 0.55 });
      stars = [];
      for (var k = 0; k < 60; k++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.5, r: Math.random() * 1.1 + 0.2, a: Math.random() * 0.5 + 0.1 });
    }

    function beam(ox, oy, ang, len, half, alpha) {
      var dx = Math.sin(ang), dy = -Math.cos(ang), ex = ox + dx * len, ey = oy + dy * len;
      var px = -dy, py = dx, w = Math.tan(half) * len;
      var g = ctx.createLinearGradient(ox, oy, ex, ey);
      g.addColorStop(0, 'rgba(255,244,210,' + alpha + ')');
      g.addColorStop(0.55, 'rgba(255,244,210,' + alpha * 0.4 + ')');
      g.addColorStop(1, 'rgba(255,244,210,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ox - px * 2, oy - py * 2); ctx.lineTo(ex - px * w, ey - py * w);
      ctx.lineTo(ex + px * w, ey + py * w); ctx.lineTo(ox + px * 2, oy + py * 2);
      ctx.fill();
    }

    var last = 0;
    function frame(now) {
      raf = 0;
      var t = now / 1000, dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var base = H * 0.9;

      ctx.clearRect(0, 0, W, H);

      // Лучи прожекторов поверх фотографии
      ctx.globalCompositeOperation = 'lighter';
      var len = Math.max(W, H) * 1.3;
      for (var b = 0; b < BEAMS.length; b++) {
        var B = BEAMS[b], ang = B.a + B.amp * Math.sin(t * B.sp + B.ph), ox = W * B.x + mx * 14;
        beam(ox, H + 40, ang, len, 0.085, 0.045);
        beam(ox, H + 40, ang, len, 0.022, 0.12);
      }
      ctx.globalCompositeOperation = 'source-over';

      // Снег
      ctx.fillStyle = '#fbf5e2';
      for (var f = 0; f < flakes.length; f++) {
        var fl = flakes[f];
        fl.y += fl.v * dt; fl.x += (Math.sin(t * 0.7 + fl.d) * 10 + 9) * dt;
        if (fl.y > H + 4) { fl.y = -4; fl.x = Math.random() * W; }
        if (fl.x > W + 4) fl.x = -4;
        ctx.globalAlpha = fl.a;
        ctx.beginPath(); ctx.arc(fl.x + mx * fl.r * 9, fl.y + my * fl.r * 5, fl.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (visible && !reduced && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) raf = requestAnimationFrame(frame); }

    resize();
    start();
    var rt;
    addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { resize(); start(); }, 150); });
    addEventListener('pointermove', function (e) { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
    document.addEventListener('visibilitychange', start);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(cv);
  })();

  /* ---------- Ленты: бесшовный повтор ---------- */
  $$('.tape__row, .wall__row').forEach(function (row) {
    $$(':scope > *', row).forEach(function (el) {
      var c = el.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      if (c.tagName === 'A') c.tabIndex = -1;
      row.appendChild(c);
    });
  });

  /* ---------- Счётчики ---------- */
  (function () {
    var els = $$('[data-count]');
    if (!els.length || reduced) return;
    els.forEach(function (el) {
      var end = +el.getAttribute('data-count'), t0 = 0;
      el.textContent = '0';
      setTimeout(function () {
        requestAnimationFrame(function step(now) {
          if (!t0) t0 = now;
          var p = clamp((now - t0) / 1600, 0, 1), e = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(end * e);
          if (p < 1) requestAnimationFrame(step);
        });
      }, 900);
    });
  })();

  /* ---------- Текст о проекте проступает по мере чтения ---------- */
  (function () {
    var st = $('#statement');
    if (!st || reduced) return;
    var words = [];
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span');
            w.className = 'w'; w.textContent = part;
            frag.appendChild(w); words.push(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) split(n);
      });
    })(st);
    var shown = -1;
    function update() {
      var r = st.getBoundingClientRect(), vh = innerHeight;
      var start = vh * 0.86, end = vh * 0.46;
      var p = clamp((start - r.top) / (r.height + start - end), 0, 1);
      var n = Math.round(p * (words.length + 4));
      if (n === shown) return;
      shown = n;
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
    }
    scrollFns.push(update);
    update();
  })();

  /* ---------- Параллакс фотографий ---------- */
  (function () {
    var els = $$('[data-par]');
    if (!els.length || reduced) return;
    function update() {
      var vh = innerHeight;
      els.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var c = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.setProperty('--py', (-c * +el.getAttribute('data-par') * vh).toFixed(1) + 'px');
      });
    }
    scrollFns.push(update);
    update();
  })();

  /* ---------- Блик на стеклянных карточках ---------- */
  $$('.glass').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Анкета героя ---------- */
  (function () {
    var form = $('#anketa');
    if (!form) return;
    var note = $('#anketa-note'), KEY = 'anketa598';
    var fields = $$('input, textarea', form);
    try {
      var saved = JSON.parse(sessionStorage.getItem(KEY) || '{}');
      fields.forEach(function (f) { if (saved[f.name]) f.value = saved[f.name]; });
    } catch (e) {}
    form.addEventListener('input', function () {
      var data = {};
      fields.forEach(function (f) { if (f.value) data[f.name] = f.value; });
      try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
      note.textContent = '';
    });
    function text() {
      return 'Анкета героя\n\n' + fields.map(function (f) {
        return f.getAttribute('data-label') + ': ' + (f.value.trim() || '—');
      }).join('\n');
    }
    function legacy(t) {
      var ta = document.createElement('textarea');
      ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      return ok;
    }
    function copy(done) {
      var t = text();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(function () { done(true); }, function () { done(legacy(t)); });
      } else done(legacy(t));
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (fields.every(function (f) { return !f.value.trim(); })) { note.textContent = 'Заполните хотя бы ФИО героя'; fields[0].focus(); return; }
      var mail = form.getAttribute('data-mail');
      var subject = 'Бессмертный полк: ' + (fields[0].value.trim() || 'анкета героя');
      var body = text() + '\n\nФотографии и документы приложены к письму.';
      // Длинный текст почтовые программы обрезают, поэтому он уходит через буфер обмена
      if (encodeURIComponent(body).length > 1700) {
        copy(function (ok) {
          note.textContent = ok ? 'Анкета длинная: текст скопирован, вставьте его в письмо' : 'Анкета длинная: скопируйте текст кнопкой и вставьте в письмо';
          location.href = 'mailto:' + mail + '?subject=' + encodeURIComponent(subject);
        });
      } else {
        note.textContent = 'Открываем почтовую программу. Не забудьте приложить фотографии';
        location.href = 'mailto:' + mail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      }
    });
    $('[data-act="copy"]', form).addEventListener('click', function () {
      copy(function (ok) { note.textContent = ok ? 'Текст анкеты скопирован' : 'Не получилось скопировать, выделите текст вручную'; });
    });
    $('[data-act="print"]', form).addEventListener('click', function () { window.print(); });
  })();

  /* ---------- Страница «Полк»: поиск и листы ---------- */
  (function () {
    var grid = $('#grid');
    if (!grid) return;
    var cards = $$('.card', grid), input = $('#find'), abc = $('#abc'), count = $('#count'), empty = $('#empty');
    var letter = '';
    function norm(s) { return s.toLowerCase().replace(/ё/g, 'е').trim(); }
    function plural(n) {
      var a = n % 10, b = n % 100;
      if (a === 1 && b !== 11) return n + ' герой';
      if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return n + ' героя';
      return n + ' героев';
    }
    function visible() { return cards.filter(function (c) { return !c.hidden; }); }
    function apply() {
      var q = norm(input.value), before = new Map();
      if (!reduced) visible().forEach(function (c) { before.set(c, c.getBoundingClientRect()); });
      cards.forEach(function (c) {
        c.hidden = !((!q || norm(c.getAttribute('data-name')).indexOf(q) !== -1) && (!letter || c.getAttribute('data-letter') === letter));
      });
      var list = visible();
      count.textContent = (q || letter) ? 'Найдено: ' + plural(list.length) : plural(list.length);
      empty.hidden = list.length > 0;
      if (reduced || !grid.animate) return;
      list.forEach(function (c, i) {
        var a = before.get(c), b = c.getBoundingClientRect();
        if (!a) { c.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: Math.min(i, 12) * 30, easing: EASE, fill: 'backwards' }); return; }
        var dx = a.left - b.left, dy = a.top - b.top;
        if (dx || dy) c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 480, easing: EASE });
      });
    }
    input.addEventListener('input', apply);
    abc.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      letter = b.getAttribute('data-letter');
      $$('button', abc).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      apply();
    });
    $('button', empty).addEventListener('click', function () {
      input.value = ''; letter = '';
      $$('button', abc).forEach(function (x, i) { x.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); });
      apply(); input.focus();
    });
    // Карточки появляются волной при первой загрузке
    if (!reduced && grid.animate) cards.forEach(function (c, i) {
      c.animate([{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 250 + Math.min(i, 17) * 40, easing: EASE, fill: 'backwards' });
    });

    var dlg = $('#sheet-view');
    if (!dlg.showModal) return;
    var sheets = $$('.sheet', dlg), front = sheets[0], back = sheets[1];
    var vNo = $('.v__no', dlg), vName = $('.v__name', dlg), vPos = $('.v__pos', dlg);
    var current = null, anim = null;
    back.hidden = true;

    function label(card) {
      var list = visible();
      vNo.textContent = '№ ' + card.getAttribute('data-no');
      vName.textContent = card.getAttribute('data-name');
      vPos.textContent = (list.indexOf(card) + 1) + ' / ' + list.length;
    }
    function preload(card) { if (card) { var i = new Image(); i.src = card.getAttribute('href'); } }
    function neighbours() {
      var list = visible(), i = list.indexOf(current);
      if (i < 0) return;
      preload(list[(i + 1) % list.length]); preload(list[(i - 1 + list.length) % list.length]);
    }
    // Листы перелистываются, как страницы альбома
    function turn(card, dir) {
      if (anim) anim.finish();
      current = card; label(card);
      var src = card.getAttribute('href'), alt = 'Лист Бессмертного полка: ' + card.getAttribute('data-name');
      if (!dir || reduced || !front.animate) { front.src = src; front.alt = alt; neighbours(); return; }
      back.src = src; back.alt = alt; back.hidden = false;
      var a = front, b = back;
      var done = function () { a.hidden = true; a.style.zIndex = ''; b.style.zIndex = ''; front = b; back = a; anim = null; neighbours(); };
      if (dir > 0) {
        a.style.zIndex = 2; b.style.zIndex = 1;
        anim = a.animate([
          { transform: 'rotateY(0)', filter: 'brightness(1)', opacity: 1 },
          { transform: 'rotateY(-88deg)', filter: 'brightness(.7)', opacity: 1, offset: 0.85 },
          { transform: 'rotateY(-96deg)', filter: 'brightness(.7)', opacity: 0 }
        ], { duration: 480, easing: 'cubic-bezier(.45, 0, .7, .6)' });
      } else {
        a.style.zIndex = 1; b.style.zIndex = 2;
        anim = b.animate([
          { transform: 'rotateY(-96deg)', filter: 'brightness(.7)', opacity: 0 },
          { transform: 'rotateY(-88deg)', filter: 'brightness(.7)', opacity: 1, offset: 0.15 },
          { transform: 'rotateY(0)', filter: 'brightness(1)', opacity: 1 }
        ], { duration: 480, easing: 'cubic-bezier(.2, .5, .3, 1)' });
      }
      anim.onfinish = done;
    }
    function step(d) {
      var list = visible(), i = list.indexOf(current);
      if (i < 0 || list.length < 2) return;
      turn(list[(i + d + list.length) % list.length], d);
    }
    function open(card) { turn(card, 0); if (!dlg.open) dlg.showModal(); }
    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.card');
      if (!card) return;
      e.preventDefault(); open(card);
    });
    $('[data-act="prev"]', dlg).addEventListener('click', function () { step(-1); });
    $('[data-act="next"]', dlg).addEventListener('click', function () { step(1); });
    $('[data-act="close"]', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('v__stage')) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
    var sx = 0;
    dlg.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 56) step(dx < 0 ? 1 : -1);
    });
    dlg.addEventListener('close', function () { if (current) current.focus({ preventScroll: true }); });

    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target && target.classList.contains('card')) { target.scrollIntoView({ block: 'center' }); open(target); }
    }
  })();

  /* ---------- Видеоистории ---------- */
  (function () {
    var dlg = $('#video-view');
    if (!dlg || !dlg.showModal) return;
    var frame = $('.v__frame', dlg), name = $('.v__name', dlg), link = $('.v__foot a', dlg), opener = null;
    document.addEventListener('click', function (e) {
      var row = e.target.closest('[data-embed]');
      if (!row) return;
      e.preventDefault();
      opener = row;
      name.textContent = row.getAttribute('data-title');
      link.href = row.getAttribute('href');
      var f = document.createElement('iframe');
      f.src = row.getAttribute('data-embed');
      f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      f.allowFullscreen = true;
      f.title = 'Видеоистория: ' + row.getAttribute('data-title');
      frame.textContent = '';
      frame.appendChild(f);
      dlg.showModal();
    });
    $('[data-act="close"]', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('v__stage')) dlg.close(); });
    dlg.addEventListener('close', function () { frame.textContent = ''; if (opener) opener.focus({ preventScroll: true }); });
  })();

  onScroll();
})();
