/* Leaderboard — per kelas & antar kelas, dengan animasi naik/turun peringkat (semester lalu → sekarang). */
(() => {
  'use strict';
  if (!SS.ui.ready) return;
  const { $, esc, initials } = SS.ui;
  const user = SS.auth.current();
  const meId = user.role === 'murid' ? user.studentId : null;
  const me = meId ? SS.student(meId) : null;
  const view = $('view');
  const PITCH = 70, TC = { 'XII-A': '#f472b6', 'XII-B': '#22d3ee' };
  const f1 = n => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
  let scope = me ? me.kelas : 'ALL';

  view.innerHTML =
    '<div class="hero"><div><h2>Leaderboard</h2><p>Peringkat berdasarkan nilai akhir semester ini. Panah menunjukkan naik atau turunnya peringkat dibanding semester lalu.</p></div>' +
    '<div class="toolbar"><button class="secondary" type="button" id="replay">↻ Putar ulang animasi</button></div></div>' +
    '<div id="duel"></div><div class="panel"><div class="panel-head"><div><h3>Peringkat</h3><p id="lbSub"></p></div>' +
    '<div class="tabs" id="tabs"></div></div><div id="myRank"></div><div class="podium" id="podium"></div><div class="lb-list" id="list"></div></div>';

  function duel() {
    const d = SS.classDuel(); if (d.length < 2) return;
    const [a, b] = d, win = a.avg >= b.avg ? a : b;
    const team = t => `<div class="team ${t === win ? 'win' : ''}" style="--tc:${TC[t.kelas] || '#8b5cf6'}"><h4>${esc(t.kelas)}${t === win ? '<span class="crown">👑</span>' : ''}</h4><p>${t.count} murid • juara: ${t.top ? esc(t.top.s.name) : '-'}</p><div class="big">${f1(t.avg)}</div><p>rata-rata nilai akhir</p></div>`;
    const row = (label, va, vb, max, fmt) => `<div class="duel-row"><div class="duel-side left"><b>${fmt(va)}</b><div class="bar tc" style="--tc:${TC[a.kelas]}"><span data-w="${va / max * 100}"></span></div></div><div class="duel-label">${label}</div><div class="duel-side"><b>${fmt(vb)}</b><div class="bar tc" style="--tc:${TC[b.kelas]}"><span data-w="${vb / max * 100}"></span></div></div></div>`;
    $('duel').innerHTML = '<div class="duel">' + team(a) + '<div class="vs">VS</div>' + team(b) + '</div>' +
      '<div class="panel duel-rows"><div class="panel-head"><div><h3>Adu antar kelas</h3><p>Siapa yang unggul di tiap kategori</p></div></div>' +
      row('Rata-rata', a.avg, b.avg, 100, f1) + row('% Tuntas', a.pctTuntas, b.pctTuntas, 100, v => Math.round(v) + '%') +
      row('Jumlah nilai A', a.jumlahA, b.jumlahA, Math.max(a.jumlahA, b.jumlahA, 1), v => v) + '</div>';
    setTimeout(() => document.querySelectorAll('#duel [data-w]').forEach(e => e.style.width = e.dataset.w + '%'), 200);
  }

  const tier = n => n >= 90 ? 'icon' : n >= 85 ? 'gold' : n >= 75 ? 'silver' : 'bronze';
  const chip = r => r.delta === null ? '<span class="dchip new">baru</span>'
    : r.delta > 0 ? `<span class="dchip up">▲ ${r.delta}</span>` : r.delta < 0 ? `<span class="dchip down">▼ ${-r.delta}</span>` : '<span class="dchip same">–</span>';

  function render(animate = true) {
    const rows = SS.leaderboard(scope);
    $('lbSub').textContent = scope === 'ALL' ? `Semua kelas • ${rows.length} murid` : `${scope} • ${rows.length} murid`;
    $('tabs').innerHTML = ['ALL', ...Object.keys(SS.KELAS)].map(k => `<button type="button" class="tab ${k === scope ? 'active' : ''}" data-k="${k}">${k === 'ALL' ? 'Semua' : k}</button>`).join('');
    const mine = rows.find(r => r.s.id === meId);
    $('myRank').innerHTML = mine ? `<div class="my-rank">📍 Kamu di peringkat <b>#${mine.rank}</b> dari ${rows.length} ${chip(mine)}</div>` : '';
    const top = rows.slice(0, 3), order = [top[1], top[0], top[2]].filter(Boolean), medal = { 1: '🥇', 2: '🥈', 3: '🥉' };
    $('podium').innerHTML = order.map(r => `<div class="pod"><div class="pav">${esc(initials(r.s.name))}</div><b>${esc(r.s.name)}</b><small>${esc(r.s.kelas)}</small><div class="rate">${Math.round(r.n)}</div><div class="step">${medal[r.rank]}</div></div>`).join('');

    const list = $('list'); list.style.height = rows.length * PITCH + 'px';
    // posisi awal = urutan semester lalu (yang baru masuk di bawah), lalu geser ke posisi sekarang
    const prevOrder = rows.map((r, i) => ({ r, p: r.prevRank === null ? 1e6 + i : r.prevRank })).sort((x, y) => x.p - y.p);
    const startIdx = new Map(prevOrder.map((o, i) => [o.r.s.id, i]));
    list.innerHTML = rows.map(r => `<div class="lb-row ${r.s.id === meId ? 'me' : ''} ${r.delta > 0 ? 'up' : r.delta < 0 ? 'down' : ''}" data-id="${r.s.id}" style="top:${(animate ? startIdx.get(r.s.id) : r.rank - 1) * PITCH}px">` +
      `<div class="lb-rank">${r.rank}</div><div class="lb-av">${esc(initials(r.s.name))}</div><div class="lb-name"><b>${esc(r.s.name)}</b><span>${esc(r.s.kelas)}</span></div>` +
      `<div class="rate-pill ${tier(r.n)}">${Math.round(r.n)}</div>${chip(r)}</div>`).join('');
    if (animate) setTimeout(() => {
      list.querySelectorAll('.lb-row').forEach((el, i) => { el.style.top = i * PITCH + 'px'; if (el.classList.contains('up') || el.classList.contains('down')) el.classList.add('flash'); });
      const meEl = list.querySelector('.me'); if (meEl && !matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(() => meEl.scrollIntoView({ block: 'center', behavior: 'smooth' }), 1500);
    }, 700);
  }

  $('tabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) { scope = b.dataset.k; render(true); } });
  $('replay').addEventListener('click', () => render(true));
  duel(); render(true);
})();
