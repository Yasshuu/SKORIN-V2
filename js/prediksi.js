/* Peringatan Dini (guru) — proyeksi nilai semester depan untuk semua murid. */
(() => {
  'use strict';
  if (!SS.ui.ready) return;
  const { $, esc, predictChart, predictStatusText, predictStatus } = SS.ui;
  const f1 = n => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
  const rows = SS.students().map(s => ({ s, p: SS.predict(s) })).filter(r => r.p).sort((a, b) => a.p.next - b.p.next);
  const by = k => rows.filter(r => r.p.status === k);
  const bahaya = by('bahaya'), waspada = by('waspada'), aman = by('aman');
  let sel = (bahaya[0] || rows[0] || {}).s;
  const view = $('view');
  if (!rows.length) { view.innerHTML = '<div class="panel"><p class="empty">Belum ada murid dengan riwayat nilai yang cukup.</p></div>'; return; }
  const card = (label, n, note, cls) => `<div class="card"><div class="stat-head"><span>${label}</span></div><h3 class="${cls || ''}">${n}</h3><p>${note}</p></div>`;
  const alertItem = r => `<div class="alert ${r.p.status}"><i>${r.p.status === 'bahaya' ? '🚨' : '⚠️'}</i><div><b>${esc(predictStatusText(r.s, r.p))}</b><span>${esc(r.s.kelas)} • tren ${r.p.slope >= 0 ? '+' : ''}${f1(r.p.slope)} poin/semester • nilai sekarang ${f1(r.p.points[r.p.points.length - 1])}</span></div><button class="secondary" type="button" data-id="${r.s.id}">Lihat grafik</button></div>`;

  view.innerHTML =
    `<div class="hero"><div><h2>Peringatan Dini</h2><p>Proyeksi nilai akhir ${rows[0].p.label} dari tren semester sebelumnya (regresi linier sederhana). Ini perkiraan untuk membantu guru bertindak lebih awal, bukan kepastian.</p></div></div>` +
    '<div class="stats">' + card('Berpotensi tidak tuntas', bahaya.length, 'proyeksi di bawah KKM', 'trend-down') + card('Perlu waspada', waspada.length, 'rentang menyentuh KKM') + card('Aman', aman.length, 'proyeksi di atas KKM', 'up') + card('Murid dianalisis', rows.length, 'dalam filter kelas aktif') + '</div>' +
    `<div class="panel" style="margin-bottom:18px"><div class="panel-head"><div><h3>Peringatan</h3><p>${bahaya.length + waspada.length} murid butuh perhatian</p></div></div><div class="alert-list">` +
    ([...bahaya, ...waspada].slice(0, 8).map(alertItem).join('') || '<p class="empty">Tidak ada peringatan. Semua murid diproyeksikan tuntas 🎉</p>') + '</div></div>' +
    '<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:18px"><div class="panel"><div class="panel-head"><div><h3 id="selName"></h3><p id="selNote"></p></div></div><div id="pc"></div>' +
    '<p class="muted" style="margin-top:10px">Garis tegas = riwayat • putus-putus = proyeksi • pita merah muda = rentang ketidakpastian • garis merah = KKM.</p></div>' +
    '<div class="panel"><div class="panel-head"><div><h3>Semua murid</h3><p>Diurutkan dari proyeksi terendah</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Murid</th><th>Proyeksi</th><th>Status</th></tr></thead><tbody id="rows"></tbody></table></div></div></div>' +
    '<div class="insight"><div class="spark">ℹ</div><div><b>Cara kerja</b><p>Garis lurus dicocokkan ke nilai akhir tiap semester, lalu diperpanjang satu semester. Pita ketidakpastian = selisih rata-rata data dari garis (minimal ±2). Status: <b>bahaya</b> bila proyeksi &lt; KKM, <b>waspada</b> bila batas bawah pita &lt; KKM.</p></div></div>';

  $('rows').innerHTML = rows.map(r => `<tr class="row-click" data-id="${r.s.id}"><td><b>${esc(r.s.name)}</b><br><span class="muted">${esc(r.s.kelas)}</span></td><td><b>${f1(r.p.next)}</b></td><td><span class="chip ${r.p.status}">${predictStatus[r.p.status][0]}</span></td></tr>`).join('');

  function show(id) {
    sel = rows.find(r => r.s.id === id).s;
    const p = predictChart($('pc'), sel);
    $('selName').textContent = sel.name;
    $('selNote').textContent = predictStatusText(sel, p);
    document.querySelectorAll('#rows tr').forEach(tr => tr.classList.toggle('sel', tr.dataset.id === id));
  }
  view.addEventListener('click', e => {
    const t = e.target.closest('[data-id]'); if (!t) return;
    show(t.dataset.id); if (t.tagName === 'BUTTON') $('pc').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  show(sel.id);
})();
