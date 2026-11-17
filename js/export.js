/* SKORIN — Export nilai ke Excel (.xlsx asli) dan PDF.
   Tanpa library: .xlsx dibuat langsung (ZIP tanpa kompresi + XML), PDF lewat dialog cetak browser ("Simpan sebagai PDF"). */
(() => {
  'use strict';
  if (!SS.ui.ready) return;
  const { esc, fmt, toast } = SS.ui;
  const page = document.body.dataset.page;

  /* ---------- Data baris ---------- */
  const sems = SS.SEMESTERS;
  const list = () => SS.students();
  const ptnText = c => { const l = SS.ptnLabel(c); return l ? [l.ptn, l.jurusan] : ['', '']; };

  function nilaiRows() {
    const head = ['No', 'Nama', 'Kelas', 'Tugas', 'UH', 'UTS', 'UAS', 'Nilai Akhir', 'Predikat', 'Status'];
    return [head, ...list().map((s, i) => {
      const n = SS.finalScore(s);
      return [i + 1, s.name, s.kelas, s.tugas, s.uh, s.uts, s.uas, n, n === null ? '' : SS.predikat(n).kode, n === null ? 'Belum dinilai' : SS.status(n)];
    })];
  }
  function riwayatRows() {
    return [['No', 'Nama', 'Kelas', ...sems.map(x => 'Nilai akhir ' + x)], ...list().map((s, i) =>
      [i + 1, s.name, s.kelas, ...sems.map(sem => SS.finalScore(SS.scoresOf(s, sem)))])];
  }
  function ptnRows() {
    return [['No', 'Nama', 'Kelas', 'Pilihan 1 - PTN', 'Pilihan 1 - Jurusan', 'Pilihan 2 - PTN', 'Pilihan 2 - Jurusan'],
      ...list().map((s, i) => [i + 1, s.name, s.kelas, ...ptnText(s.ptn[0]), ...ptnText(s.ptn[1])])];
  }

  /* ---------- Penulis .xlsx minimal ---------- */
  const enc = new TextEncoder();
  const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const u16 = v => [v & 255, (v >>> 8) & 255];
  const u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];

  function zipStore(files) {
    const parts = [], central = [];
    let offset = 0;
    files.forEach(f => {
      const name = enc.encode(f.name), data = enc.encode(f.text), c = crc32(data);
      const local = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
        ...u32(c), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...name]);
      parts.push(local, data);
      central.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
        ...u32(c), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
        ...u32(0), ...u32(offset), ...name]));
      offset += local.length + data.length;
    });
    const cSize = central.reduce((t, x) => t + x.length, 0);
    const end = new Uint8Array([0x50, 0x4b, 5, 6, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length),
      ...u32(cSize), ...u32(offset), ...u16(0)]);
    return new Blob([...parts, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  const xe = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  const colName = i => { let s = '', n = i + 1; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

  function sheetXml(rows) {
    const widths = rows[0].map((_, ci) => Math.min(48, Math.max(8, ...rows.map(r => String(r[ci] ?? '').length)) + 3));
    const cols = '<cols>' + widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('') + '</cols>';
    const data = rows.map((r, ri) => `<row r="${ri + 1}">` + r.map((v, ci) => {
      const ref = colName(ci) + (ri + 1), st = ri === 0 ? ' s="1"' : '';
      if (v === null || v === undefined || v === '') return `<c r="${ref}"${st}/>`;
      if (typeof v === 'number') return `<c r="${ref}"${st}><v>${v}</v></c>`;
      return `<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${xe(v)}</t></is></c>`;
    }).join('') + '</row>').join('');
    return XML + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0">' +
      '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' + cols + `<sheetData>${data}</sheetData></worksheet>`;
  }

  function buildXlsx(sheets) { // sheets: [{name, rows}]
    const n = sheets.length;
    const files = [
      { name: '[Content_Types].xml', text: XML + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>' },
      { name: '_rels/.rels', text: XML + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', text: XML + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        sheets.map((s, i) => `<sheet name="${xe(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', text: XML + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name: 'xl/styles.xml', text: XML + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF6D28D9"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>' },
      ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, text: sheetXml(s.rows) }))
    ];
    return zipStore(files);
  }

  const stamp = () => new Date().toISOString().slice(0, 10);
  const slug = () => SS.activeClass() === 'ALL' ? 'SemuaKelas' : SS.activeClass();
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function exportXlsx() {
    if (!list().length) return toast('Tidak ada data untuk diexport.');
    const blob = buildXlsx([
      { name: 'Nilai', rows: nilaiRows() },
      { name: 'Riwayat Semester', rows: riwayatRows() },
      { name: 'PTN Impian', rows: ptnRows() }
    ]);
    download(blob, `SKORIN_${slug()}_${stamp()}.xlsx`);
    toast('File Excel diunduh.');
  }

  /* ---------- Laporan PDF (dialog cetak → Simpan sebagai PDF) ---------- */
  function table(rows, cls = '') {
    const [h, ...b] = rows;
    return `<table class="${cls}"><thead><tr>${h.map(x => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>` +
      b.map(r => `<tr>${r.map(v => `<td>${v === null || v === undefined ? '' : esc(typeof v === 'number' ? String(v).replace('.', ',') : v)}</td>`).join('')}</tr>`).join('') +
      '</tbody></table>';
  }

  function buildReport(kind = page === 'ptn' ? 'ptn' : 'nilai') {
    const user = SS.auth.current();
    let box = document.getElementById('printReport');
    if (!box) { box = document.createElement('div'); box.id = 'printReport'; document.body.appendChild(box); }
    const st = SS.stats();
    let body;
    if (kind === 'ptn') {
      body = '<h2>Daftar PTN Impian Murid</h2>' + table(ptnRows());
    } else {
      const merged = nilaiRows().map((r, i) => {
        const s = list()[i - 1];
        return i === 0 ? [...r, ...sems.slice(0, -1).map(x => x)] : [...r, ...sems.slice(0, -1).map(sem => SS.finalScore(SS.scoresOf(s, sem)))];
      });
      body = '<h2>Rekap Nilai Akhir</h2>' + table(merged) +
        `<p class="meta">Rumus: Tugas 20% + UH 25% + UTS 25% + UAS 30%. Predikat A ≥ 90, B+ ≥ 80, B ≥ 75, C ≥ 70, D &lt; 70. Tuntas jika nilai akhir ≥ KKM ${st.kkm}. ` +
        `Rata-rata ${fmt(st.avg)} • Ketuntasan ${st.count ? fmt(st.pctTuntas) + '%' : '—'} (${st.tuntas} dari ${st.count} siswa).</p>`;
    }
    box.innerHTML = `<header><h1>SKORIN — Laporan ${kind === 'ptn' ? 'PTN Impian' : 'Nilai'}</h1>` +
      `<p class="meta">${esc(SS.classLabel(SS.activeClass()))} • Semester ${esc(SS.CURRENT_SEM)} • KKM ${st.kkm} • Dicetak ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p></header>` +
      body + `<footer><div>Mengetahui,<br><br><br><b>${esc(user ? user.name : 'Guru')}</b><br>Guru Informatika</div></footer>`;
    return box;
  }

  function exportPdf() {
    if (!list().length) return toast('Tidak ada data untuk dicetak.');
    buildReport();
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 50);
    toast('Di dialog cetak, pilih “Simpan sebagai PDF”.');
  }

  window.SSExport = { xlsx: exportXlsx, pdf: exportPdf, buildReport, buildXlsx, nilaiRows, riwayatRows, ptnRows };
  const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
  bind('exportXlsx', exportXlsx);
  bind('exportPdf', exportPdf);
})();
