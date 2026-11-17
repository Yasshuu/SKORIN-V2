/* PTN Impian (murid) — pilih 2 PTN + jurusan dari 20 PTN terbaik. Tersimpan di data siswa. */
(() => {
  'use strict';
  if (!SS.ui.ready) return;
  const { $, esc, toast } = SS.ui;
  const user = SS.auth.current();
  const me = SS.student(user.studentId);
  const view = $('view');
  if (!me) { view.innerHTML = '<div class="panel"><p class="empty">Data siswa tidak ditemukan. Hubungi gurumu.</p></div>'; return; }

  const ptnOpts = sel => '<option value="">— Pilih PTN —</option>' +
    SS.PTN.map(p => `<option value="${p.id}"${p.id === sel ? ' selected' : ''}>#${p.rank} ${esc(p.nama)} (${esc(p.kota)})</option>`).join('');

  const DEMO = '<div class="demo-warn"><i>⚠️</i><div><b>ESTIMASI DEMO — bukan prediksi resmi</b>Angka kecocokan hanya hitungan sederhana dari nilai akhirmu dan peringkat PTN. Seleksi PTN sebenarnya memakai banyak faktor (UTBK, rapor, prestasi, kuota, daya tampung) yang tidak dihitung di sini.' +
    '<details style="margin-top:8px"><summary>Lihat rumusnya</summary><small>Patokan nilai = 93 − 0,85 × (peringkat PTN − 1) + penyesuaian jurusan (Kedokteran +5, Informatika/Ilmu Komputer +3, jurusan pendidikan −3, dll). Peluang = 100 ÷ (1 + e^(−(nilai akhirmu − patokan) ÷ 3,2)), dibatasi 3–97%.</small></details></div></div>';
  const card = i => `<div class="card ptn-card"><div class="stat-head"><span>Pilihan ${i + 1}</span><i class="stat-icon">${i + 1}</i></div>` +
    `<div class="field" style="margin-top:14px"><label>PTN<select id="ptn${i}">${ptnOpts(me.ptn[i] && me.ptn[i].ptn)}</select></label></div>` +
    `<div class="field" style="margin-top:14px"><label>Jurusan<select id="jur${i}"></select></label></div>` +
    `<p class="muted" id="info${i}" style="margin-top:12px"></p><div id="match${i}"></div></div>`;

  view.innerHTML =
    '<div class="hero"><div><h2>PTN impian kamu</h2><p>Pilih dua PTN dan jurusan yang ingin kamu tuju. Pilihan ini bisa dilihat gurumu di menu PTN Impian, jadi bisa dibantu persiapannya.</p></div></div>' +
    `<div class="recommend two-col">${card(0)}${card(1)}</div>` +
    '<p class="form-error" id="ptnError" role="alert"></p>' +
    '<div style="margin-top:18px"><button class="primary" type="button" id="savePtn">Simpan PTN Impian →</button></div>' +
    DEMO + '<div class="insight" id="ptnNote"><div class="spark">🎓</div><div><b>Tentang daftar ini</b><p>20 PTN diurutkan berdasarkan peringkat nasional Webometrics 2026. Jurusan yang tampil adalah jurusan populer, bukan daftar lengkap — cek portal SNPMB atau kampus untuk program studi resmi tahun ini.</p></div></div>';

  function fillJur(i, keep) {
    const p = SS.ptnById($('ptn' + i).value);
    const sel = $('jur' + i);
    sel.disabled = !p;
    sel.innerHTML = p
      ? '<option value="">— Pilih jurusan —</option>' + p.jurusan.map(j => `<option value="${esc(j)}"${j === keep ? ' selected' : ''}>${esc(j)}</option>`).join('')
      : '<option value="">Pilih PTN dulu</option>';
    $('info' + i).textContent = p ? `#${p.rank} Webometrics 2026 • ${p.kota}` : '';
    showMatch(i);
  }
  function showMatch(i) {
    const m = SS.ptnMatch(me, { ptn: $('ptn' + i).value, jurusan: $('jur' + i).value });
    $('match' + i).innerHTML = m ? `<div class="match tone-${m.tone}"><div class="match-ring" style="--p:${m.pct}"><b>${m.pct}%</b></div><div><b class="lbl">${esc(m.label)}</b><span class="d">Nilai akhirmu ${String(m.score).replace('.', ',')} vs patokan ${String(m.req).replace('.', ',')}${m.need ? `. Butuh sekitar +${m.need} poin lagi.` : '. Sudah di atas patokan.'}</span><span class="mchip">ESTIMASI DEMO</span></div></div>` : '';
  }
  [0, 1].forEach(i => {
    fillJur(i, me.ptn[i] && me.ptn[i].jurusan);
    $('ptn' + i).addEventListener('change', () => fillJur(i));
    $('jur' + i).addEventListener('change', () => showMatch(i));
  });

  $('savePtn').addEventListener('click', () => {
    const pilihan = [0, 1].map(i => ({ ptn: $('ptn' + i).value, jurusan: $('jur' + i).value }));
    const res = SS.setPtn(me.id, pilihan);
    $('ptnError').textContent = res.ok ? '' : res.error;
    if (res.ok) toast('PTN impian tersimpan.');
  });
})();
