/* Grafik prediksi nilai: riwayat (garis tegas) + proyeksi semester depan (putus-putus) + pita ketidakpastian + garis KKM. */
(() => {
  'use strict';
  if (typeof SS === "undefined" || !SS.ui || !SS.ui.ready) return;
  const f1 = n => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
  const STATUS = { aman: ['AMAN', 'Proyeksi masih di atas KKM'], waspada: ['WASPADA', 'Proyeksi dekat KKM, bisa jatuh jika tren memburuk'], bahaya: ['BERPOTENSI TIDAK TUNTAS', 'Proyeksi di bawah KKM'] };

  function predictChart(host, s) {
    const p = SS.predict(s);
    if (!p) { host.innerHTML = '<p class="empty">Butuh minimal 2 semester riwayat untuk prediksi.</p>'; return null; }
    const W = 640, H = 300, L = 66, R = 62, T = 24, B = 44;
    const all = [...p.points, p.lo, p.hi, p.kkm];
    const lo = Math.max(0, Math.floor((Math.min(...all) - 6) / 5) * 5), hi = Math.min(100, Math.ceil((Math.max(...all) + 4) / 5) * 5);
    const n = p.points.length, X = i => L + i * (W - L - R) / n, Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
    const labels = [...p.sems, p.label];
    let g = '';
    for (let v = lo; v <= hi; v += 5) g += `<line class="pc-grid" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="pc-t" x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
    const hist = p.points.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
    const band = `${X(n - 1)},${Y(p.points[n - 1])} ${X(n)},${Y(p.hi)} ${X(n)},${Y(p.lo)}`;
    host.innerHTML = `<div class="pc-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik prediksi nilai ${s.name}">${g}` +
      `<line class="pc-kkm" x1="${L}" x2="${W - R}" y1="${Y(p.kkm)}" y2="${Y(p.kkm)}"/><text class="pc-kt" x="${W - R}" y="${Y(p.kkm) - 6}" text-anchor="end">KKM ${p.kkm}</text>` +
      `<polygon class="pc-band" points="${band}"/>` +
      `<polyline class="pc-proj" points="${X(n - 1)},${Y(p.points[n - 1])} ${X(n)},${Y(p.next)}"/>` +
      `<polyline class="pc-line" points="${hist}"/>` +
      p.points.map((v, i) => `<circle class="pc-dot" cx="${X(i)}" cy="${Y(v)}" r="6"/><text class="pc-v" x="${X(i) + (i === 0 ? 16 : 0)}" y="${Y(v) - 14}" text-anchor="middle">${f1(v)}</text>`).join('') +
      `<circle class="pc-dot proj" cx="${X(n)}" cy="${Y(p.next)}" r="7"/><text class="pc-v" x="${X(n)}" y="${Y(p.hi) - 10}" text-anchor="middle">${f1(p.next)}</text>` +
      labels.map((l, i) => `<text class="pc-t" x="${X(i)}" y="${H - 14}" text-anchor="middle">${l}</text>`).join('') +
      '</svg></div>';
    return p;
  }

  function statusText(s, p, self) {
    const who = self ? 'Kamu' : s.name;
    if (p.status === 'bahaya') return `${who} berpotensi tidak tuntas di ${p.label}: proyeksi ${f1(p.next)} (KKM ${p.kkm}).`;
    if (p.status === 'waspada') return `${who} perlu waspada di ${p.label}: proyeksi ${f1(p.next)}, rentang ${f1(p.lo)}–${f1(p.hi)} menyentuh KKM ${p.kkm}.`;
    return `${who} diproyeksikan tetap tuntas di ${p.label}: ${f1(p.next)} (rentang ${f1(p.lo)}–${f1(p.hi)}).`;
  }

  Object.assign(SS.ui, { predictChart, predictStatusText: statusText, predictStatus: STATUS });
})();
