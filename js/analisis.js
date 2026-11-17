/* Analisis nilai kelas — dihitung dari data siswa. */
(() => {
  'use strict';
  if (!SS.ui.ready) return;
  const { $, fmt, esc, lineChart } = SS.ui;
  const st = SS.stats();
  const aCount = st.distribusi.find(d => d.kode === 'A').jumlah;

  $('statAvg').textContent = fmt(st.avg);
  $('statTuntas').textContent = st.count ? fmt(st.pctTuntas) + '%' : '—';
  $('statTuntasNote').textContent = `${st.tuntas} dari ${st.count} siswa`;
  $('statA').textContent = aCount;
  $('statRisk').textContent = st.perhatian.length;

  $('distBody').innerHTML = st.distribusi.map(d =>
    `<tr><td>${d.kode}</td><td>${d.range}</td><td>${d.jumlah}</td>` +
    `<td>${st.count ? fmt(d.jumlah / st.count * 100) + '%' : '—'}</td><td>${d.arti}</td></tr>`).join('');

  $('compBody').innerHTML = SS.COMPONENTS.map((c, i) => {
    const avg = st.avgByComp[i];
    return `<tr><td>${c.full}</td><td>${Math.round(c.weight * 100)}%</td><td>${fmt(avg)}</td>` +
      `<td><div class="bar" aria-hidden="true"><span style="width:${avg || 0}%"></span></div></td></tr>`;
  }).join('');

  if (!st.count) {
    $('insightText').textContent = 'Belum ada siswa yang dinilai.';
  } else {
    $('insightText').textContent =
      `Rata-rata kelas ${fmt(st.avg)}; ${st.tuntas} dari ${st.count} siswa tuntas (KKM ${st.kkm}). ` +
      `${st.perhatian.length} siswa berada di bawah KKM. Komponen terendah: ${st.weakest.label} (${fmt(st.weakest.avg)}).`;
  }

  /* ---------- Tren per semester ---------- */
  const dc = $('distClass'); if (dc) dc.textContent = 'kelas ' + SS.classLabel(SS.activeClass());
  const sel = $('trendStudent');
  sel.innerHTML = '<option value="">Rata-rata kelas saja</option>' +
    SS.students().filter(SS.isGraded).map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
  function drawTrend() {
    const ct = SS.classTrend();
    const series = [{ name: 'Rata-rata ' + SS.classLabel(SS.activeClass()), values: ct.map(t => t.avg) }];
    let labels = ct.map(t => t.sem), note = '';
    if (sel.value) {
      const s = SS.student(sel.value), tr = SS.trendOf(s);
      labels = tr.map(t => t.sem);
      series[0] = { name: 'Rata-rata ' + s.kelas, values: tr.map(t => t.avg) };
      series.push({ name: s.name, values: tr.map(t => t.n) });
      if (tr.length > 1) {
        const d = Math.round((tr[tr.length - 1].n - tr[0].n) * 10) / 10;
        note = `${s.name}: ${d >= 0 ? 'naik' : 'turun'} ${fmt(Math.abs(d))} poin sejak ${tr[0].sem}.`;
      }
    } else if (ct.length > 1) {
      const d = Math.round((ct[ct.length - 1].avg - ct[0].avg) * 10) / 10;
      note = `Rata-rata kelas ${d >= 0 ? 'naik' : 'turun'} ${fmt(Math.abs(d))} poin sejak ${ct[0].sem}.`;
    }
    lineChart($('trendChart'), { labels, series, ref: { value: st.kkm, label: `KKM ${st.kkm}` }, label: 'Tren nilai per semester' });
    $('trendNote').textContent = note;
  }
  sel.addEventListener('change', drawTrend);
  drawTrend();
})();
