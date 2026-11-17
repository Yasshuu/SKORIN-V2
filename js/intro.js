/* SKORIN — layar pembuka sinematik.
   Layar putih kosong → peniup seruling berjalan dari tepi kiri ke tepi kanan sambil bermain;
   setiap melewati sebuah elemen halaman login, elemen itu "dipanggil" muncul dengan percikan sihir.
   Lewati: tombol "Lewati", klik, Esc/Spasi, atau buka index.html?nointro. Suara: lewat tombol "Putar ulang" (browser memblokir suara otomatis). */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const noIntro = /[?&]nointro\b/.test(location.search);

  const FRAME_W = 360, FRAME_H = 420, FRAMES = 8, DURATION = 7600, HOLD = 600;
  const COLORS = ['#8b5cf6', '#22d3ee', '#f472b6', '#a3e635', '#fbbf24'];
  const NOTES = ['♪', '♫', '♩', '♬', '✦'];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const mk = (tag, cls) => { const e = document.createElement(tag); e.className = cls; return e; };

  let running = false, raf = 0, stopFn = null, replayBtn = null;

  /* ---------- Suara seruling (WebAudio, nada dorian ala abad pertengahan) ---------- */
  function startAudio() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      const master = ctx.createGain(); master.gain.value = 0.2; master.connect(ctx.destination);
      const dly = ctx.createDelay(); dly.delayTime.value = 0.23;
      const fb = ctx.createGain(); fb.gain.value = 0.32;
      const wet = ctx.createGain(); wet.gain.value = 0.35;
      dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(ctx.destination);
      master.connect(dly);
      const beat = 0.475; // = satu langkah (sinkron dengan animasi jalan)
      const song = [[880, 1], [784, 1], [698, 1], [659, 1], [587, 2], [698, 1], [659, 1], [587, 2], [880, 1], [784, 1], [698, 1], [587, 3]];
      let t = ctx.currentTime + HOLD / 1000;
      song.forEach(([f, b]) => {
        const dur = b * beat;
        const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
        o1.type = 'sine'; o2.type = 'triangle'; o1.frequency.value = f; o2.frequency.value = f * 2;
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = 5.5; lg.gain.value = f * 0.007; lfo.connect(lg); lg.connect(o1.frequency);
        const g2 = ctx.createGain(); g2.gain.value = 0.15; o2.connect(g2); g2.connect(g);
        o1.connect(g); g.connect(master);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.9, t + 0.06);
        g.gain.setValueAtTime(0.8, t + dur - 0.14);
        g.gain.linearRampToValueAtTime(0, t + dur - 0.02);
        [o1, o2, lfo].forEach(o => { o.start(t); o.stop(t + dur); });
        t += dur;
      });
      return ctx;
    } catch (e) { return null; }
  }

  /* ---------- Efek partikel ---------- */
  function spawnNote(x, w, h, vh) {
    const n = mk('span', 'intro-note');
    n.textContent = pick(NOTES);
    n.style.color = pick(COLORS);
    n.style.fontSize = rand(22, 38) + 'px';
    n.style.left = (x + w * 0.2 + rand(-8, 8)) + 'px';          // keluar dari corong seruling
    n.style.top = (vh - vh * 0.07 - h * 0.52 + rand(-10, 10)) + 'px';
    n.style.setProperty('--dx', rand(-200, -60) + 'px');
    n.style.setProperty('--dy', rand(-240, -90) + 'px');
    n.style.setProperty('--r', rand(-40, 40) + 'deg');
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2100);
  }
  function burst(cx, cy, count) {
    for (let i = 0; i < count; i++) {
      const s = mk('span', 'intro-spark');
      s.textContent = pick(['✦', '✧', '•', '♪']);
      s.style.color = pick(COLORS);
      s.style.fontSize = rand(12, 26) + 'px';
      const a = rand(0, Math.PI * 2), r = rand(40, 130);
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      s.style.setProperty('--dx', Math.cos(a) * r + 'px');
      s.style.setProperty('--dy', Math.sin(a) * r + 'px');
      s.style.setProperty('--r', rand(-90, 90) + 'deg');
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }

  /* ---------- Elemen yang akan "dipanggil" ---------- */
  function collectTargets() {
    const vw = innerWidth, items = [];
    const visible = el => el.getClientRects().length > 0;
    const add = (sel, kind, fixedX) => document.querySelectorAll(sel).forEach(el => {
      if (!visible(el)) return;
      const r = el.getBoundingClientRect();
      items.push({ el, kind, x: fixedX != null ? fixedX : r.left + r.width / 2, cx: r.left + r.width / 2, cy: r.top + r.height / 2, big: kind === 'pop' });
    });
    add('.bg3d .floor', 'fade', vw * 0.03);
    add('.bg3d .sun', 'fade');
    add('.bg3d .cube', 'fade');
    add('.auth-visual .brand, .mobile-brand', 'pop');
    add('.visual-copy .eyebrow', 'pop');
    add('.visual-copy h1', 'pop');
    add('.mini-insights > div', 'pop');
    add('.auth-card', 'pop');
    add('.theme-fab', 'pop');
    return items.sort((a, b) => a.x - b.x);
  }

  /* ---------- Pemutar ---------- */
  function play(opts = {}) {
    if (running) return;
    running = true;
    if (replayBtn) replayBtn.hidden = true;
    const vw = innerWidth, vh = innerHeight;
    const items = collectTargets();
    items.forEach(it => it.el.classList.add('magic', it.kind === 'pop' ? 'magic-pop' : 'magic-fade'));

    const curtain = mk('div', 'intro-curtain'), veil = mk('div', 'intro-veil'), trail = mk('div', 'intro-trail');
    const ph = Math.min(vh * 0.46, 430), pw = ph * FRAME_W / FRAME_H;
    const piper = mk('div', 'intro-piper'), bob = mk('div', 'intro-bob'), sprite = mk('div', 'intro-sprite'), shadow = mk('div', 'intro-shadow');
    piper.style.width = pw + 'px'; piper.style.height = ph + 'px'; piper.style.setProperty('--fw', pw + 'px');
    bob.appendChild(sprite); piper.append(bob, shadow);
    const skip = mk('button', 'intro-skip'); skip.type = 'button'; skip.textContent = 'Lewati ▸';
    document.body.append(curtain, veil, trail, piper, skip);
    root.classList.add('intro-playing');
    root.classList.remove('intro-on'); // tutup putih CSS digantikan elemen curtain (frame yang sama)

    const audio = opts.sound ? startAudio() : null;
    let pending = items.slice(), nextNote = 0, finished = false;
    const t0 = performance.now() + HOLD;

    function summon(it) {
      it.el.classList.add('on');
      burst(Math.min(Math.max(it.cx, 20), vw - 20), Math.min(Math.max(it.cy, 20), vh - 20), it.big ? 12 : 5);
    }

    function end() {
      if (finished) return; finished = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      pending.forEach(it => it.el.classList.add('on'));
      curtain.style.transition = 'opacity .5s'; curtain.style.opacity = '0';
      [veil, trail, piper, skip].forEach(e => e.remove());
      if (audio) setTimeout(() => audio.close && audio.close().catch(() => {}), 600);
      setTimeout(() => {
        curtain.remove();
        items.forEach(it => it.el.classList.remove('magic', 'magic-pop', 'magic-fade', 'on'));
        root.classList.remove('intro-playing');
        running = false; stopFn = null;
        if (replayBtn) replayBtn.hidden = false;
      }, 1000);
    }
    stopFn = end;

    function frame(now) {
      const t = (now - t0) / DURATION;
      const k = Math.max(0, Math.min(1, t));
      const x = -pw + k * (vw + pw * 1.1);            // tepi kiri sprite: mulai di luar layar kiri, selesai di luar kanan
      const cx = x + pw * 0.5;
      piper.style.transform = `translateX(${x}px)`;
      curtain.style.clipPath = `inset(0 0 0 ${Math.max(0, cx)}px)`;
      veil.style.transform = `translateX(${cx - 260}px)`;
      trail.style.width = Math.max(0, cx) + 'px';
      while (pending.length && cx > pending[0].x + 10) summon(pending.shift());
      if (t > 0 && now >= nextNote && cx > -pw * 0.3 && x < vw) { spawnNote(x, pw, ph, vh); nextNote = now + rand(190, 320); }
      if (k < 1) raf = requestAnimationFrame(frame); else end();
    }
    raf = requestAnimationFrame(frame);

    skip.addEventListener('click', end);
    curtain.style.pointerEvents = 'auto';
    curtain.addEventListener('click', end);
    function onKey(e) { if (e.key === 'Escape' || e.key === ' ') { e.preventDefault(); end(); } }
    document.addEventListener('keydown', onKey);
  }

  function init() {
    replayBtn = mk('button', 'intro-replay');
    replayBtn.type = 'button';
    replayBtn.textContent = '🎵 Putar ulang intro';
    replayBtn.title = 'Putar ulang dengan suara seruling';
    replayBtn.hidden = true;
    replayBtn.addEventListener('click', () => play({ sound: true }));
    document.body.appendChild(replayBtn);

    if (reduce || noIntro) { root.classList.remove('intro-on'); if (!reduce) replayBtn.hidden = false; return; }
    play();
  }

  window.SKORINIntro = { play, skip: () => stopFn && stopFn() };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
