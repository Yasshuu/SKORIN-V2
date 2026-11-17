/* SKORIN v3 — efek visual (3D, tilt, count-up).
   Murni presentasi: tidak mengubah data/logika. Dimuat PALING AKHIR.
   Tanpa library eksternal → jalan offline. */
(() => {
  'use strict';
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasSS = typeof SS !== 'undefined';
  const ready = !hasSS || SS.ui.ready || document.body.classList.contains('auth-body');
  if (!ready) return; // halaman sedang di-redirect oleh penjaga akses

  /* ---------- 1. Latar 3D di halaman login ---------- */
  if (document.body.classList.contains('auth-body')) {
    const bg = document.createElement('div');
    bg.className = 'bg3d';
    const cubes = [
      { s: 70, c: '#8b5cf6', l: '8%',  t: '58%', d: 22 },
      { s: 44, c: '#22d3ee', l: '30%', t: '78%', d: 16 },
      { s: 90, c: '#f472b6', l: '46%', t: '16%', d: 28 },
      { s: 54, c: '#a3e635', l: '88%', t: '70%', d: 19 },
      { s: 36, c: '#22d3ee', l: '60%', t: '84%', d: 14 },
      { s: 62, c: '#8b5cf6', l: '93%', t: '12%', d: 25 }
    ];
    bg.innerHTML = '<div class="sun"></div><div class="floor"></div>' + cubes.map(q =>
      `<div class="cube" style="--s:${q.s}px;--c:${q.c};--t:${q.d}s;left:${q.l};top:${q.t}">${'<i></i>'.repeat(6)}</div>`).join('');
    document.body.prepend(bg);
  }

  /* ---------- 2. Menara nilai 3D (bar chart CSS 3D, bisa di-drag) ---------- */
  const PALETTE = [
    { c1: '#a78bfa', c2: '#6d28d9', glow: 'rgba(139,92,246,.7)' },
    { c1: '#67e8f9', c2: '#0e7490', glow: 'rgba(34,211,238,.7)' },
    { c1: '#f9a8d4', c2: '#be185d', glow: 'rgba(244,114,182,.7)' },
    { c1: '#bef264', c2: '#4d7c0f', glow: 'rgba(163,230,53,.7)' }
  ];

  function bars3d(host, items, kkm) {
    const W = 78, GAP = 130, MAXH = 250, n = items.length;
    const world = document.createElement('div');
    world.className = 'b3-world';
    const kh = (kkm / 100) * MAXH;
    world.style.setProperty('--kkm', kh + 'px');
    world.innerHTML = '<div class="b3-floor"></div><div class="b3-kkm"></div>' +
      `<div class="b3-kkm-label">KKM ${kkm}</div>` +
      items.map((it, i) => {
        const p = PALETTE[i % PALETTE.length];
        const h = Math.max(8, (it.value / 100) * MAXH);
        const x = (i - (n - 1) / 2) * GAP;
        return `<div class="b3-bar" style="--x:${x}px;--w:${W}px;--h:${h}px;--c1:${p.c1};--c2:${p.c2};--glow:${p.glow};--delay:${i * 0.15}s">` +
          '<div class="b3-front"></div><div class="b3-back"></div><div class="b3-left"></div><div class="b3-right"></div><div class="b3-top"></div>' +
          `<div class="b3-val">${String(it.value).replace('.', ',')}</div>` +
          `<div class="b3-lab">${it.label}<small>${it.sub || ''}</small></div></div>`;
      }).join('');
    host.appendChild(world);

    // animasi tumbuh
    requestAnimationFrame(() => requestAnimationFrame(() =>
      world.querySelectorAll('.b3-bar').forEach(b => b.classList.add('on'))));

    // putar otomatis pelan + drag untuk memutar
    let drag = false, startX = 0, offset = 0, base = 0;
    const apply = () => world.style.setProperty('--ry', (-25 + base + offset) + 'deg');
    apply();
    host.addEventListener('pointerdown', e => { drag = true; startX = e.clientX - offset * 2; host.setPointerCapture(e.pointerId); });
    host.addEventListener('pointermove', e => { if (drag) { offset = (e.clientX - startX) / 2; apply(); } });
    const end = () => { drag = false; };
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);
    if (!reduce) {
      const t0 = performance.now();
      (function loop(t) {
        if (!drag) { base = Math.sin((t - t0) / 2600) * 14; apply(); }
        requestAnimationFrame(loop);
      })(t0);
    }
  }

  function addShowcase(title, sub, items, kkm) {
    const anchor = document.querySelector('.grid');
    if (!anchor || document.getElementById('bars3d')) return;
    const panel = document.createElement('div');
    panel.className = 'panel showcase';
    panel.innerHTML =
      `<div class="panel-head"><div><h3>${title}</h3><p>${sub}</p></div>` +
      '<span class="b3-hint" aria-hidden="true">⟲ geser untuk memutar</span></div>' +
      '<div class="b3-stage" id="bars3d" role="img" aria-label="Grafik batang 3D: ' +
      items.map(i => `${i.label} ${i.value}`).join(', ') + '"></div>';
    anchor.parentNode.insertBefore(panel, anchor);
    bars3d(panel.querySelector('#bars3d'), items, kkm);
  }

  if (hasSS && SS.ui.ready) {
    const page = document.body.dataset.page, role = document.body.dataset.role;
    const st = SS.stats();
    const r1 = v => Math.round(v * 10) / 10;
    if (role === 'guru' && page === 'dashboard' && st.count) {
      addShowcase('Menara Nilai 3D', 'Rata-rata kelas per komponen • garis merah = KKM',
        SS.COMPONENTS.map((c, i) => ({ label: c.label, sub: Math.round(c.weight * 100) + '%', value: r1(st.avgByComp[i]) })), st.kkm);
    }
    if (role === 'murid' && page === 'dashboard') {
      const user = SS.auth.current(), me = SS.student(user.studentId);
      if (me && SS.isGraded(me)) {
        addShowcase('Menara Nilai Saya', 'Nilai tiap komponen • garis merah = KKM',
          SS.COMPONENTS.map(c => ({ label: c.label, sub: Math.round(c.weight * 100) + '%', value: me[c.key] })), st.kkm);
      }
    }
  }

  /* ---------- 3. Count-up angka statistik ---------- */
  if (!reduce) {
    document.querySelectorAll('.card h3, .mini-insights b').forEach(el => {
      const m = /^(-?\d+(?:[.,]\d+)?)(.*)$/.exec(el.textContent.trim());
      if (!m) return;
      const dec = (m[1].split(/[.,]/)[1] || '').length, target = parseFloat(m[1].replace(',', '.')), tail = m[2];
      const t0 = performance.now(), dur = 1000;
      (function tick(t) {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = (target * e).toFixed(dec).replace('.', ',') + tail;
        if (k < 1) requestAnimationFrame(tick); else el.textContent = m[1] + tail;
      })(t0);
    });
  }

  /* ---------- 4. Tilt 3D mengikuti kursor pada kartu ---------- */
  if (!reduce) {
    document.querySelectorAll('.card, .action').forEach(el => {
      el.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--ry', (px * 12).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-py * 12).toFixed(2) + 'deg');
        el.classList.add('tilting');
      });
      el.addEventListener('pointerleave', () => el.classList.remove('tilting'));
    });
  }
})();
