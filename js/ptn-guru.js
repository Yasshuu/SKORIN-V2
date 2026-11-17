/* PTN Impian (guru) — daftar murid, PTN & jurusan pilihan mereka, plus ringkasan peminat. */
(() => {
  'use strict';
  if (!SS.ui.ready) return;
  const { $, esc } = SS.ui;
  const students = SS.students();

  const choices = students.flatMap(s => s.ptn.filter(Boolean));
  const count = (arr, keyFn) => arr.reduce((m, c) => { const k = keyFn(c); m[k] = (m[k] || 0) + 1; return m; }, {});
  const top = obj => Object.entries(obj).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

  const byPtn = count(choices, c => c.ptn);
  const byJur = count(choices, c => `${SS.ptnById(c.ptn).singkat} — ${c.jurusan}`);
  const done = students.filter(s => s.ptn[0] && s.ptn[1]).length;
  const topP = top(byPtn), topJ = top(byJur);

  $('statDone').textContent = `${done}/${students.length}`;
  $('statDoneNote').textContent = done === students.length ? 'semua murid sudah memilih' : `${students.length - done} murid belum memilih`;
  $('statTopPtn').textContent = topP ? SS.ptnById(topP[0]).singkat : '—';
  $('statTopPtnNote').textContent = topP ? `${topP[1]} pilihan • ${SS.ptnById(topP[0]).nama}` : 'belum ada data';
  $('statTopJur').textContent = topJ ? topJ[0].split(' — ')[1] : '—';
  $('statTopJurNote').textContent = topJ ? `${topJ[0].split(' — ')[0]} • ${topJ[1]} pilihan` : 'belum ada data';
  $('statVariety').textContent = Object.keys(byPtn).length;

  // Grafik batang peminat per PTN (urut terbanyak)
  const maxC = Math.max(1, ...Object.values(byPtn));
  const bars = Object.entries(byPtn).sort((a, b) => b[1] - a[1]).slice(0, 10);
  $('ptnBars').innerHTML = bars.length ? bars.map(([id, n]) => {
    const p = SS.ptnById(id);
    return `<div class="ptn-bar-row"><span class="ptn-bar-label"><b>${esc(p.singkat)}</b><small>#${p.rank} Webometrics</small></span>` +
      `<div class="bar" aria-hidden="true"><span style="width:${(n / maxC) * 100}%"></span></div><b class="ptn-bar-n">${n}</b></div>`;
  }).join('') : '<p class="empty">Belum ada murid yang memilih PTN.</p>';

  // Tabel murid + pencarian
  const cell = (c, st) => {
    const l = SS.ptnLabel(c), m = st && SS.ptnMatch(st, c);
    return l ? `<b>${esc(l.ptn)}</b><br><span class="muted">${esc(l.jurusan)} • ${esc(l.singkat)} #${l.rank}</span>` + (m ? `<br><span class="mchip tone-${m.tone}">${m.pct}% • ${esc(m.label)} (estimasi demo)</span>` : '')
             : '<span class="muted">Belum memilih</span>';
  };
  const flat = s => [s.name, s.kelas, ...s.ptn.map(c => { const l = SS.ptnLabel(c); return l ? `${l.ptn} ${l.singkat} ${l.jurusan}` : ''; })].join(' ').toLowerCase();

  function render() {
    const term = $('q').value.trim().toLowerCase();
    const list = students.filter(s => flat(s).includes(term));
    $('countInfo').textContent = `${list.length} dari ${students.length} murid`;
    $('rows').innerHTML = list.length
      ? list.map(s => `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.kelas)}</td><td>${cell(s.ptn[0], s)}</td><td>${cell(s.ptn[1], s)}</td></tr>`).join('')
      : '<tr><td colspan="4" class="empty">Tidak ada yang cocok.</td></tr>';
  }
  $('q').addEventListener('input', render);
  render();
})();

(() => {
  const t = document.getElementById('rows'); const panel = t && t.closest('.panel'); if (!panel) return;
  panel.insertAdjacentHTML('beforebegin', '<div class="demo-warn" style="margin:0 0 18px"><i>⚠️</i><div><b>Kecocokan PTN = ESTIMASI DEMO</b>Persentase di tabel hanya hitungan sederhana dari nilai akhir murid vs peringkat PTN dan jurusan. Bukan prediksi resmi dan tidak menggantikan seleksi nyata (UTBK, rapor, prestasi, kuota).<small>Rumus: patokan = 93 − 0,85 × (peringkat − 1) + penyesuaian jurusan; peluang = logistik(nilai akhir − patokan).</small></div></div>');
})();
