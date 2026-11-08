/* =========================================================
   АКСИС — магнитное крепление номера
   © 2026 Полунин Лев. Все права защищены.
   ========================================================= */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;

  /* ---------- header + floating CTA ---------- */
  var hdr = document.querySelector('.hdr');
  var fab = document.querySelector('.fab');
  var order = document.getElementById('order');
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || doc.scrollTop;
    hdr.classList.toggle('is-solid', y > 20);
    var showFab = y > window.innerHeight * 0.8;
    if (order) {
      var r = order.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) showFab = false;
    }
    fab.classList.toggle('is-on', showFab);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- burger ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  var scrollY = 0;
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    hdr.classList.toggle('menu-open', open);
    if (open) {
      scrollY = window.pageYOffset;
      document.body.style.position = 'fixed';
      document.body.style.top = -scrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollY);
    }
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a || burger.getAttribute('aria-expanded') !== 'true') return;
    var href = a.getAttribute('href');
    setMenu(false);
    if (href && href.charAt(0) === '#') {
      e.preventDefault();
      var t = document.querySelector(href);
      if (t) setTimeout(function () { t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }, 30);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 920 && nav.classList.contains('is-open')) setMenu(false);
  });

  /* ---------- hero background video (lazy, skip on save-data / reduced motion) ---------- */
  var hv = document.getElementById('heroVideo');
  if (hv && !reduce && !saveData) {
    var start = function () {
      hv.src = hv.getAttribute('data-src');
      var p = hv.play();
      if (p && p.catch) p.catch(function () {});
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 1500 });
    else setTimeout(start, 600);
  }

  /* ---------- reveal on scroll ---------- */
  var revealSel = '.h2, .txt, .hero__copy > *, .vid, .ctable, .explode, .parts li, .rnd__img, .rnd__copy, .tcard, .steps li, .rev, .order__copy, .faq__list details';
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(revealSel));
  var observed = [document.getElementById('race'), document.getElementById('law')].concat(Array.prototype.slice.call(document.querySelectorAll('.steps li')));

  if ('IntersectionObserver' in window) {
    revealEls.forEach(function (el, i) {
      el.classList.add('rv');
      el.style.transitionDelay = (i % 4) * 0.06 + 's';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealEls.concat(observed).forEach(function (el) { if (el) io.observe(el); });
  } else {
    observed.forEach(function (el) { if (el) el.classList.add('is-in'); });
  }

  /* ---------- video players ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.vid'), function (fig) {
    var v = fig.querySelector('video');
    var b = fig.querySelector('.vid__play');
    if (!v || !b) return;
    v.removeAttribute('controls');
    b.addEventListener('click', function () {
      // pause other videos
      Array.prototype.forEach.call(document.querySelectorAll('.vid video'), function (o) { if (o !== v) o.pause(); });
      v.setAttribute('controls', '');
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
    v.addEventListener('play', function () { fig.classList.add('is-playing'); });
    v.addEventListener('ended', function () { fig.classList.remove('is-playing'); });
  });

  /* ---------- construction pins ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.pin'), function (pin) {
    var target = document.getElementById(pin.getAttribute('aria-describedby'));
    if (!target) return;
    var on = function () { target.classList.add('is-hl'); };
    var off = function () { target.classList.remove('is-hl'); };
    pin.addEventListener('mouseenter', on);
    pin.addEventListener('mouseleave', off);
    pin.addEventListener('focus', on);
    pin.addEventListener('blur', off);
    pin.addEventListener('click', function () {
      on();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
      setTimeout(off, 1600);
    });
  });

  /* ---------- magnetic snap demo ---------- */
  (function () {
    var stage = document.getElementById('snap');
    var plate = document.getElementById('plate');
    var hint = document.getElementById('snapHint');
    var reset = document.getElementById('snapReset');
    var bumper = stage && stage.querySelector('.snap__bumper');
    if (!stage || !plate || !bumper) return;

    var locked = false, dragging = false, sx = 0, sy = 0, dx = 0, dy = 0, target = { x: 0, y: 0 };
    var HINT_IDLE = 'Потяните номер к магнитам ↑';
    var HINT_LOCK = 'Щёлк. Номер на месте — ровно и намертво.';

    plate.classList.add('hint-wiggle');

    function computeTarget() {
      // target offset = difference between bumper center and plate's resting center
      var sr = stage.getBoundingClientRect();
      var br = bumper.getBoundingClientRect();
      var restTop = plate.offsetTop, restH = plate.offsetHeight;
      target.x = 0;
      target.y = (br.top - sr.top + br.height / 2) - (restTop + restH / 2);
    }
    function set(x, y, rot) {
      plate.style.setProperty('--tx-x', x + 'px');
      plate.style.setProperty('--tx-y', y + 'px');
      plate.style.setProperty('--rot', rot + 'deg');
    }
    function lock() {
      computeTarget();
      locked = true;
      plate.classList.remove('hint-wiggle');
      plate.classList.add('is-anim');
      set(target.x, target.y, 0);
      stage.classList.add('is-locked');
      hint.textContent = HINT_LOCK;
      reset.hidden = false;
      plate.setAttribute('aria-label', 'Номерной знак установлен. Нажмите, чтобы снять');
      if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) {} }
    }
    function release() {
      locked = false;
      plate.classList.add('is-anim');
      set(0, 0, -7);
      stage.classList.remove('is-locked');
      hint.textContent = HINT_IDLE;
      reset.hidden = true;
      plate.setAttribute('aria-label', 'Номерной знак. Перетащите или нажмите, чтобы установить');
    }

    function down(e) {
      if (e.button !== undefined && e.button !== 0) return;
      computeTarget();
      dragging = true;
      plate.classList.remove('hint-wiggle', 'is-anim');
      plate.classList.add('is-drag');
      var cur = locked ? target : { x: 0, y: 0 };
      sx = e.clientX - cur.x; sy = e.clientY - cur.y;
      dx = cur.x; dy = cur.y;
      if (plate.setPointerCapture && e.pointerId !== undefined) { try { plate.setPointerCapture(e.pointerId); } catch (er) {} }
      stage.classList.remove('is-locked');
      e.preventDefault();
    }
    function move(e) {
      if (!dragging) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      var prog = Math.max(0, Math.min(1, dy / (target.y || -1)));
      // magnetic pull when close
      var dist = Math.hypot(dx - target.x, dy - target.y);
      var pull = dist < 60 ? (1 - dist / 60) * 0.5 : 0;
      set(dx + (target.x - dx) * pull, dy + (target.y - dy) * pull, -7 * (1 - prog));
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      plate.classList.remove('is-drag');
      var moved = Math.hypot(dx - (locked ? target.x : 0), dy - (locked ? target.y : 0));
      if (moved < 6) { // treat as click
        if (locked) release(); else lock();
        return;
      }
      var dist = Math.hypot(dx - target.x, dy - target.y);
      if (dist < Math.abs(target.y) * 0.45) lock(); else release();
    }

    if (window.PointerEvent) {
      plate.addEventListener('pointerdown', down);
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    } else {
      // very old Safari fallback
      plate.addEventListener('touchstart', function (e) { down(e.touches[0]); }, { passive: true });
      window.addEventListener('touchmove', function (e) { move(e.touches[0]); }, { passive: true });
      window.addEventListener('touchend', up);
      plate.addEventListener('mousedown', down);
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    }
    plate.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (locked) release(); else lock(); }
    });
    reset.addEventListener('click', release);
    window.addEventListener('resize', function () { if (locked) { computeTarget(); set(target.x, target.y, 0); } });
  })();

  /* ---------- reviews slider ---------- */
  (function () {
    var slider = document.getElementById('slider');
    var dotsWrap = document.getElementById('dots');
    if (!slider) return;
    var slides = slider.querySelectorAll('.rev');
    var prev = document.querySelector('.sbtn[data-dir="-1"]');
    var next = document.querySelector('.sbtn[data-dir="1"]');
    var dots = [];
    var timer = null, userTouched = false;

    function step() { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : slider.clientWidth; }
    function maxScroll() { return slider.scrollWidth - slider.clientWidth; }
    function index() { return Math.round(slider.scrollLeft / step()); }
    function go(i) {
      var s = step();
      var x = Math.max(0, Math.min(i * s, maxScroll()));
      if (slider.scrollTo) slider.scrollTo({ left: x, behavior: reduce ? 'auto' : 'smooth' });
      else slider.scrollLeft = x;
    }
    function pages() { return Math.max(1, Math.round(maxScroll() / step()) + 1); }

    function buildDots() {
      dotsWrap.innerHTML = '';
      dots = [];
      for (var i = 0; i < pages(); i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Отзыв ' + (i + 1));
        (function (n) { b.addEventListener('click', function () { userTouched = true; go(n); }); })(i);
        dotsWrap.appendChild(b);
        dots.push(b);
      }
      update();
    }
    function update() {
      var i = Math.min(index(), dots.length - 1);
      dots.forEach(function (d, n) { d.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
      if (prev) prev.disabled = slider.scrollLeft <= 2;
      if (next) next.disabled = slider.scrollLeft >= maxScroll() - 2;
    }
    var raf = null;
    slider.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = null; update(); });
    }, { passive: true });
    [prev, next].forEach(function (b) {
      if (!b) return;
      b.addEventListener('click', function () { userTouched = true; go(index() + Number(b.getAttribute('data-dir'))); });
    });
    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { userTouched = true; go(index() + 1); }
      if (e.key === 'ArrowLeft') { userTouched = true; go(index() - 1); }
    });
    ['pointerdown', 'touchstart', 'wheel'].forEach(function (ev) {
      slider.addEventListener(ev, function () { userTouched = true; }, { passive: true });
    });

    // autoplay only while visible and until user interacts
    function tick() {
      if (userTouched || document.hidden) return;
      var i = index() + 1;
      go(i >= pages() ? 0 : i);
    }
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { if (!timer) timer = setInterval(tick, 5000); }
        else { clearInterval(timer); timer = null; }
      }, { threshold: 0.4 }).observe(slider);
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(buildDots, 150); });
    buildDots();
  })();
})();
