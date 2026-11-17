/* Kartu & Level (murid) — kartu pemain gaya FUT, level/XP, streak, badge. */
(() => {
  'use strict';
  if (!SS.ui.ready) return;
  const { $, esc, initials } = SS.ui;
  const me = SS.student(SS.auth.current().studentId);
  const view = $('view');
  const g = me && SS.gamify(me);
  if (!g) { view.innerHTML = '<div class="panel"><p class="empty">Nilaimu belum lengkap, jadi kartu belum bisa dibuat. Tunggu gurumu menginput nilai.</p></div>'; return; }
  const TIER = { icon: 'ICON', gold: 'GOLD', silver: 'SILVER', bronze: 'BRONZE' };
  const first = me.name.split(' ');
  const attr = a => `<div><b>${a.v}</b><span>${a.k}</span></div>`;
  const earned = g.badges.filter(b => b.earned).length;
  const d = g.delta;

  view.innerHTML =
    '<div class="hero"><div><h2>Kartu & Level kamu</h2><p>Nilai akhir jadi rating kartu, komponen nilai jadi atribut. Makin tinggi nilaimu, makin langka kartunya. Gerakkan kursor di atas kartu!</p></div></div>' +
    '<div class="kartu-layout">' +
      `<div class="fut-stage"><div class="fut-wrap"><div class="fut tier-${g.tier}" id="fut">` +
        '<div class="fut-top"><div class="fut-rating" id="futRating">0</div><div class="fut-meta"><span class="fut-pos">' + esc(me.kelas) + '</span><span class="fut-tier">' + TIER[g.tier] + '</span></div></div>' +
        `<div class="fut-avatar"><span>${esc(initials(me.name))}</span></div>` +
        `<div class="fut-name">${esc(first[first.length - 1])}</div><div class="fut-sep"></div>` +
        '<div class="fut-attrs">' + g.attrs.map(attr).join('') + '</div>' +
        '<div class="fut-foot">SKORIN • 2026/27</div><div class="fut-shine"></div></div></div></div>' +
      '<div class="kartu-side">' +
        '<div class="panel"><div class="lv-head"><div class="lv-badge">' + g.level + '</div><div><h3>Level ' + g.level + ' • ' + g.title + '</h3><p>' + g.xp + ' XP total</p></div></div>' +
        '<div class="xp-bar"><span id="xpFill"></span></div>' +
        `<div class="xp-meta"><span>${g.xpInLevel} / ${g.xpPerLevel} XP</span><span>${g.xpPerLevel - g.xpInLevel} XP lagi ke Level ${g.level + 1}</span></div></div>` +
        '<div class="mini-stats">' +
          `<div class="mini-stat"><b>🔥 ${g.streak}</b><span>Streak semester tuntas</span></div>` +
          `<div class="mini-stat"><b>#${g.rank || '-'}</b><span>Peringkat di ${esc(me.kelas)} (dari ${g.classSize})</span></div>` +
          `<div class="mini-stat"><b class="${d > 0 ? 'up' : ''}">${d === null ? '-' : (d > 0 ? '+' : '') + String(d).replace('.', ',')}</b><span>Perubahan nilai vs semester lalu</span></div>` +
        '</div>' +
      '</div>' +
    '</div>' +
    `<div class="panel"><div class="panel-head"><div><h3>Badge (${earned}/${g.badges.length})</h3><p>Yang terang sudah kamu dapat, yang gelap masih terkunci.</p></div></div>` +
    '<div class="bdg-grid">' + g.badges.map(b => `<div class="bdg ${b.earned ? 'earned' : 'locked'}"><i>${b.earned ? b.icon : '🔒'}</i><div><b>${esc(b.name)}</b><span>${esc(b.desc)}</span></div></div>`).join('') + '</div></div>' +
    '<div class="panel rules" style="margin-top:18px"><details><summary>Cara hitung rating, atribut, dan XP</summary><ul>' +
      '<li><b>Rating</b> = nilai akhir (dibulatkan). ≥90 Icon, ≥85 Gold, ≥75 Silver, di bawahnya Bronze.</li>' +
      '<li><b>TGS / UH / UTS / UAS</b> = nilai komponenmu.</li>' +
      '<li><b>TRN</b> (tren) = 60 + 4 × perubahan nilai akhir dari semester lalu.</li>' +
      '<li><b>KON</b> (konsistensi) = 100 − 3 × simpangan baku keempat komponen. Makin merata makin tinggi.</li>' +
      '<li><b>XP</b> = 5 × nilai akhir tiap semester + 150 per semester tuntas + 100 per kenaikan nilai. Tiap 500 XP naik 1 level.</li>' +
    '</ul></details></div>';

  // animasi rating & XP
  const rt = $('futRating'); const t0 = performance.now();
  (function tick(n) { const k = Math.min(1, (n - t0) / 1100); rt.textContent = Math.round(g.rating * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); })(t0);
  setTimeout(() => { $('xpFill').style.width = (g.xpInLevel / g.xpPerLevel * 100) + '%'; }, 150);

  // tilt + kilau
  const f = $('fut');
  f.addEventListener('pointermove', e => {
    const r = f.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    f.style.setProperty('--ry', ((x - .5) * 22) + 'deg'); f.style.setProperty('--rx', ((.5 - y) * 22) + 'deg');
    f.style.setProperty('--mx', (x * 100) + '%'); f.style.setProperty('--my', (y * 100) + '%');
  });
  f.addEventListener('pointerleave', () => { f.style.setProperty('--rx', '0deg'); f.style.setProperty('--ry', '0deg'); });
})();
