/* ================================================================
   Daf Yomi Hub — WordPress script
   Only handles what can't be typed into WordPress:
   - today's daf + progress bar (computed from the date)
   - the bookshelf (read / reading now / next)
   - background images on Study opportunities
   - the sage pop-up, which reads its text from the page
   All words live in the WordPress blocks; nothing here is content.
   ================================================================ */
(function () {
  'use strict';

  var IMG_BASE = 'https://daf-yomi-red.vercel.app/images/';
  var SUBSCRIBE_URL = 'https://www.myjewishlearning.com/get-your-daily-dose-of-talmud/';
  var CYCLE_START = new Date('2020-01-05T00:00:00');
  var CYCLE_TOTAL_DAYS = 2711;

  // 14th cycle schedule: name, number of daily pages, spine color, MJL archive
  var TRACTATES = [
    ['Berakhot', 63, 'wine', 'berakhot/'],
    ['Shabbat', 156, 'navy', 'shabbat-jewish-texts/'],
    ['Eruvin', 104, 'navy', 'talmud/talmud-tractate-eruvin/'],
    ['Pesachim', 120, 'navy', 'talmud/tractate-pesachim/'],
    ['Shekalim', 21, 'navy', 'talmud/tractate-shekalim/'],
    ['Yoma', 87, 'navy', 'talmud/tractate-yoma/'],
    ['Sukkah', 55, 'navy', 'talmud/tractate-sukkah/'],
    ['Beitzah', 39, 'navy', 'talmud/tractate-beitzah/'],
    ['Rosh Hashanah', 34, 'navy', 'talmud/tractate-rosh-hashanah/'],
    ['Taanit', 30, 'navy', 'talmud/tractate-taanit/'],
    ['Megillah', 31, 'navy', 'talmud/tractate-megillah/'],
    ['Moed Katan', 28, 'navy', 'talmud/tractate-moed-katan/'],
    ['Chagigah', 26, 'navy', 'talmud/tractate-chagigah/'],
    ['Yevamot', 121, 'forest', 'talmud/tractate-yevamot/'],
    ['Ketubot', 111, 'forest', 'talmud/tractate-ketubot/'],
    ['Nedarim', 90, 'forest', 'talmud/tractate-nedarim/'],
    ['Nazir', 65, 'forest', 'talmud/tractate-nazir/'],
    ['Sotah', 48, 'forest', 'talmud/tractate-sotah/'],
    ['Gittin', 89, 'forest', 'talmud/tractate-gittin/'],
    ['Kiddushin', 81, 'forest', 'talmud/tractate-kiddushin/'],
    ['Bava Kamma', 118, 'wine', 'talmud/tractate-bava-kamma/'],
    ['Bava Metzia', 118, 'wine', 'talmud/tractate-bava-metzia/'],
    ['Bava Batra', 175, 'wine', 'talmud/tractate-bava-batra/'],
    ['Sanhedrin', 112, 'wine', 'talmud/tractate-sanhedrin/'],
    ['Makkot', 23, 'wine', 'talmud/tractate-makkot/'],
    ['Shevuot', 48, 'wine', 'talmud/tractate-shevuot/'],
    ['Avodah Zarah', 75, 'wine', 'talmud/tractate-avodah-zarah/'],
    ['Horayot', 13, 'wine', 'talmud/tractate-horayot/'],
    ['Zevachim', 119, 'navy', 'talmud/tractate-zevachim/'],
    ['Menachot', 109, 'navy', 'talmud/tractate-menachot/'],
    ['Chullin', 141, 'navy', null],
    ['Bekhorot', 60, 'navy', null],
    ['Arakhin', 33, 'navy', null],
    ['Temurah', 33, 'navy', null],
    ['Keritot', 27, 'navy', null],
    ['Meilah', 21, 'navy', null],
    ['Niddah', 72, 'amber', null]
  ];

  var DAF_IMAGES = ['brakhot_2a.jpg', 'brakhot_10a.jpg', 'brakhot_61b.jpg',
    'chabbath_31a.jpg', 'baba-metsia_59b.jpg', 'baba-metsia_84a.jpg'];

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtShort(d) { return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function fmtLong(d) { return fmtShort(d) + ', ' + d.getFullYear(); }

  function buildSchedule() {
    var cumulative = 0;
    return TRACTATES.map(function (t) {
      var start = new Date(CYCLE_START);
      start.setDate(start.getDate() + cumulative);
      var entry = {
        name: t[0], days: t[1], color: t[2],
        url: t[3] ? 'https://www.myjewishlearning.com/category/study/jewish-texts/' + t[3] : null,
        startDay: cumulative + 1, endDay: cumulative + t[1], startDate: start
      };
      cumulative += t[1];
      return entry;
    });
  }

  function todayState() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var cycleDay = Math.floor((today - CYCLE_START) / 86400000) + 1;
    var map = buildSchedule();
    var current = null, next = null;
    for (var i = 0; i < map.length; i++) {
      if (cycleDay >= map[i].startDay && cycleDay <= map[i].endDay) {
        current = { tractate: map[i], daf: cycleDay - map[i].startDay + 2 };
        next = map[i + 1] || null;
        break;
      }
    }
    return { today: today, cycleDay: cycleDay, map: map, current: current, next: next };
  }

  function setText(root, sel, text) {
    var el = root.querySelector(sel);
    if (el) el.textContent = text;
  }

  /* Today's daf + progress bar */
  function renderToday(hub, s) {
    var box = hub.querySelector('.dy-today');
    if (!box) return;
    setText(box, '[data-dy="eyebrow"]', 'Today on Daf Yomi · ' + fmtLong(s.today));
    setText(box, '[data-dy="title"]', s.current
      ? 'Tractate ' + s.current.tractate.name + ' · Daf ' + s.current.daf
      : 'The 14th cycle is complete');
    var pct = Math.max(0, Math.min(100, Math.round(s.cycleDay / CYCLE_TOTAL_DAYS * 100)));
    setText(box, '[data-dy="sub"]', 'Day ' + s.cycleDay.toLocaleString() + ' of ' +
      CYCLE_TOTAL_DAYS.toLocaleString() + ' · ' + pct + '% through the 14th cycle');
    setText(box, '[data-dy="pct"]', pct + '% complete');
    var fill = box.querySelector('.bar-fill');
    if (fill) fill.style.width = pct + '%';
    // Point "Read today's dose" at the current tractate's archive when there is one
    var cta = hub.querySelector('.dy-read-today a');
    if (cta && s.current && s.current.tractate.url) cta.href = s.current.tractate.url;
  }

  /* Bookshelf */
  function renderShelf(hub, s) {
    var rows = hub.querySelectorAll('.shelf-row');
    if (!rows.length) return;
    var curName = s.current ? s.current.tractate.name : null;
    var curStart = s.current ? s.current.tractate.startDay : Infinity;
    var books = s.map.map(function (t) {
      var state = t.name === curName ? 'cur'
        : (s.next && t.name === s.next.name) ? 'next'
        : t.endDay < curStart ? 'done' : 'soon';
      var a = document.createElement('a');
      a.href = t.url || SUBSCRIBE_URL;
      a.className = 'book b-' + t.color + ' b-' + state;
      a.style.width = Math.max(20, Math.min(56, Math.round(t.days * 0.32 + 18))) + 'px';
      a.title = t.name;
      var spine = document.createElement('span');
      spine.className = 'book-spine';
      spine.textContent = t.name;
      a.appendChild(spine);
      if (state === 'next') {
        var flag = document.createElement('span');
        flag.className = 'next-flag';
        flag.textContent = fmtShort(t.startDate);
        a.appendChild(flag);
      }
      return a;
    });
    var per = Math.ceil(books.length / rows.length);
    Array.prototype.forEach.call(rows, function (row, i) {
      row.innerHTML = '';
      books.slice(i * per, (i + 1) * per).forEach(function (b) { row.appendChild(b); });
    });
    if (s.next) setText(hub, '[data-dy="next"]', 'Next · ' + fmtShort(s.next.startDate));
  }

  /* Study opportunities: rotating page scan + per-row hover scans */
  function initUpcoming(hub) {
    var box = hub.querySelector('.upcoming');
    if (!box) return;
    box.querySelectorAll('.upcoming-event').forEach(function (ev, i) {
      var bg = document.createElement('div');
      bg.className = 'upcoming-event-bg';
      bg.style.backgroundImage = "url('" + IMG_BASE + DAF_IMAGES[(i + 3) % DAF_IMAGES.length] + "')";
      ev.insertBefore(bg, ev.firstChild);
    });
    var bg = document.createElement('div');
    bg.className = 'upcoming-bg';
    box.insertBefore(bg, box.firstChild);
    var idx = Math.floor(Math.random() * DAF_IMAGES.length);
    bg.style.backgroundImage = "url('" + IMG_BASE + DAF_IMAGES[idx] + "')";
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) box.classList.add('in-view');
      }, { threshold: 0.15 }).observe(box);
    } else {
      box.classList.add('in-view');
    }
    setInterval(function () {
      idx = (idx + 1) % DAF_IMAGES.length;
      bg.style.opacity = '0';
      setTimeout(function () {
        bg.style.backgroundImage = "url('" + IMG_BASE + DAF_IMAGES[idx] + "')";
        bg.style.opacity = '';
      }, 1600);
    }, 9000);
  }

  /* Sage pop-up: reads each card's hidden details from the page */
  var FIELDS = [
    ['period', 'Period', false], ['basedin', 'Based in', false],
    ['knownfor', 'Known for', true], ['debates', 'Debates with', true]
  ];

  function detail(card, key) {
    var p = card.querySelector('.sd-' + key);
    if (!p) return '';
    var clone = p.cloneNode(true);
    var label = clone.querySelector('strong');
    if (label) label.remove();
    return clone.textContent.trim();
  }

  function buildModal() {
    var overlay = document.createElement('div');
    overlay.className = 'dy-sage-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    var grid = FIELDS.map(function (f) {
      return '<div class="sage-field' + (f[2] ? ' sage-field-full' : '') + '">' +
        '<div class="sage-label">' + f[1] + '</div><div class="sage-value" data-f="' + f[0] + '"></div></div>';
    }).join('');
    overlay.innerHTML =
      '<div class="sage-card">' +
        '<button class="sage-close" type="button" aria-label="Close">✕</button>' +
        '<div class="sage-portrait"><img alt=""><div class="sage-portrait-fade"></div>' +
          '<div class="sage-portrait-name"><div class="sage-card-name"></div><div class="sage-card-era"></div></div></div>' +
        '<div class="sage-body">' +
          '<div class="sage-grid">' + grid + '</div>' +
          '<div class="sage-teaching"><div class="sage-label">A teaching</div><p class="sage-quote" data-f="teaching"></p></div>' +
          '<div class="sage-tip"><div class="sage-label">On the page</div><div class="sage-value" data-f="onpage"></div></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function initSages(hub) {
    var cards = hub.querySelectorAll('.person.sage');
    if (!cards.length) return;
    var overlay = buildModal();
    var lastFocus = null;

    function close() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    function open(card) {
      lastFocus = card;
      var img = card.querySelector('.avatar img');
      var portrait = overlay.querySelector('.sage-portrait img');
      portrait.src = img ? img.currentSrc || img.src : '';
      portrait.alt = img ? img.alt : '';
      setText(overlay, '.sage-card-name', (card.querySelector('.person-name') || {}).textContent || '');
      setText(overlay, '.sage-card-era', (card.querySelector('.person-meta') || {}).textContent || '');
      overlay.querySelectorAll('[data-f]').forEach(function (el) {
        el.textContent = detail(card, el.getAttribute('data-f'));
      });
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      overlay.querySelector('.sage-close').focus();
    }

    cards.forEach(function (card) {
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', function () { open(card); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
      });
    });
    overlay.querySelector('.sage-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
  }

  function init() {
    var hub = document.querySelector('.dy-hub');
    if (!hub) return;
    var s = todayState();
    renderToday(hub, s);
    renderShelf(hub, s);
    initUpcoming(hub);
    initSages(hub);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
