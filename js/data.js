/* SKORIN — lapisan data, perhitungan nilai, kelas, riwayat semester, PTN, dan autentikasi demo.
   Semua halaman memakai file ini sebagai SATU-SATUNYA sumber data. (Butuh js/ptn.js dimuat lebih dulu.) */
const SS = (() => {
  'use strict';

  const DATA_KEY = 'skorinData_v5';
  const SESSION_KEY = 'skorinSession_v5';
  const CLASS_KEY = 'skorinClass_v5';

  // Semester: urutan lama → baru. Yang terakhir = semester berjalan.
  const SEMESTERS = ['Ganjil 2025/26', 'Genap 2025/26', 'Ganjil 2026/27'];
  const CURRENT_SEM = SEMESTERS[SEMESTERS.length - 1];

  // Daftar kelas
  const KELAS = { 'XII-A': 'XII-A', 'XII-B': 'XII-B' };

  // Komponen penilaian + bobotnya (satu tempat saja, dipakai semua halaman)
  const COMPONENTS = [
    { key: 'tugas', label: 'Tugas', full: 'Tugas', weight: 0.20,
      advice: 'Kerjakan tugas lebih awal dan minta masukan guru sebelum dikumpulkan. Bobotnya 20% dan paling mudah dinaikkan.' },
    { key: 'uh', label: 'UH', full: 'Ulangan Harian', weight: 0.25,
      advice: 'Ulangi soal ulangan harian yang salah, lalu buat ringkasan satu halaman per bab.' },
    { key: 'uts', label: 'UTS', full: 'Ujian Tengah Semester', weight: 0.25,
      advice: 'Susun jadwal belajar mingguan dan latihan soal tipe UTS sebelum ujian.' },
    { key: 'uas', label: 'UAS', full: 'Ujian Akhir Semester', weight: 0.30,
      advice: 'Mulai review materi seluruh semester sejak awal dan kerjakan soal latihan UAS dengan batas waktu.' }
  ];

  const PREDIKAT = [
    { kode: 'A',  min: 90, range: '90–100', arti: 'Sangat baik' },
    { kode: 'B+', min: 80, range: '80–89',  arti: 'Baik' },
    { kode: 'B',  min: 75, range: '75–79',  arti: 'Cukup baik' },
    { kode: 'C',  min: 70, range: '70–74',  arti: 'Perlu penguatan' },
    { kode: 'D',  min: 0,  range: '< 70',   arti: 'Perlu bimbingan' }
  ];

  // Akun demo. (Password polos hanya boleh untuk demo; aplikasi nyata wajib pakai backend + hash.)
  const ACCOUNTS = [
    { username: 'guru01',  password: 'guru123',  role: 'guru',  name: 'Ibu Warnety' },
    { username: 'murid01', password: 'murid123', role: 'murid', name: 'Lamine Yamal',  studentId: 'b10' },
    { username: 'murid02', password: 'murid123', role: 'murid', name: 'Rayhan Hannan', studentId: 'a21' }
  ];

  /* ---------- Data awal: skuad 2026/27 (nilai fiktif untuk demo) ---------- */
  // [nama, level kemampuan 0-100] — nilai tiap komponen & riwayat semester dibangkitkan dari level ini
  const PERSIJA = [
    ['Aqil Savik', 82], ['Andritany Ardhiyasa', 88], ['Nadeo Argawinata', 79], ['Hafizh Rizkianur', 72],
    ['Ilham Rio Fahmi', 85], ['Rizky Ridho', 93], ['Jordi Amat', 90], ['Dia Syayid', 76, -5],
    ['Kerim Memija', 81], ['Shayne Pattynama', 84], ['Pratama Arhan', 68], ['Denis Kolinger', 87],
    ['Fajar Fathur Rahman', 74], ['Radovan Pankov', 86], ['Farhan Saipulloh', 71], ['Kyohei Yoshino', 91, 5],
    ['Fabio Calonego', 83], ['Stjepan Loncar', 89], ['Figo Dennis', 77, -4], ['Kwon Chang-hoon', 80],
    ['Rayhan Hannan', 66], ['Witan Sulaeman', 78], ['Victor Dethan', 73], ['Arlyansyah Abdulmanan', 69],
    ['Agi Firmansyah', 75], ['Alexander Jeremejeff', 92], ['Nathan Fariel', 64], ['Eksel Runtukahu', 70],
    ['Dony Tri Pamungkas', 79]
  ];
  const BARCA = [
    ['Joan Garcia', 90], ['João Cancelo', 84], ['Alejandro Balde', 86], ['Brian Fariñas', 67],
    ['Pau Cubarsí', 94], ['Gavi', 82, 6], ['Fermín López', 87, 7], ['Pedri', 95],
    ['Gabriel Jesus', 78], ['Lamine Yamal', 97], ['Raphinha', 91, 4], ['Xavi Espart', 72],
    ['Wojciech Szczęsny', 80], ['Karim Adeyemi', 76, -5], ['Andreas Christensen', 83], ['Rodrigo', 88],
    ['Anthony Gordon', 85], ['Gerard Martín', 79, -5], ['Roony Bardghji', 74], ['Dani Olmo', 89, -4],
    ['Frenkie de Jong', 92], ['Marc Bernal', 77], ['Jules Kounde', 88], ['Eric García', 81],
    ['Dominik Livaković', 75], ['Jesse Bisiwu', 69], ['Hamza Abdelkarim', 71]
  ];

  const round1 = n => Math.round(n * 10) / 10;
  const isNum = v => typeof v === 'number' && Number.isFinite(v);
  const clamp = v => Math.max(35, Math.min(100, Math.round(v)));

  // Pseudo-random deterministik (supaya data awal selalu sama)
  const rng = a => () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  function pickPtn(r) {
    const i1 = Math.floor(Math.pow(r(), 1.7) * PTN_DATA.length);
    let i2 = Math.floor(Math.pow(r(), 1.7) * PTN_DATA.length);
    if (i2 === i1) i2 = (i1 + 3) % PTN_DATA.length;
    return [i1, i2].map(i => {
      const p = PTN_DATA[i];
      return { ptn: p.id, jurusan: p.jurusan[Math.floor(r() * p.jurusan.length)] };
    });
  }

  function build(list, kelas, prefix, seed) {
    return list.map(([name, level, drift0], i) => {
      const r = rng(seed + i * 97);
      const jit = () => Math.round((r() - 0.5) * 10);
      const cur = { tugas: clamp(level + 4 + jit()), uh: clamp(level + jit()), uts: clamp(level - 1 + jit()), uas: clamp(level + 1 + jit()) };
      const drift1 = Math.round(r() * 9 - 3); // tren naik/turun per semester (-3 … +6)
      const drift = drift0 === undefined ? drift1 : drift0; // beberapa pemain diberi tren khusus untuk demo
      const back = k => COMPONENTS.reduce((o, c) => {
        o[c.key] = clamp(cur[c.key] - k * drift + Math.round((r() - 0.5) * 6));
        return o;
      }, {});
      return {
        id: prefix + String(i + 1).padStart(2, '0'), name, kelas, ...cur, target: 90,
        hist: { [SEMESTERS[1]]: back(1), [SEMESTERS[0]]: back(2) },
        ptn: pickPtn(r)
      };
    });
  }

  const seed = () => ({
    kkm: 75,
    students: [...build(PERSIJA, 'XII-A', 'a', 1101), ...build(BARCA, 'XII-B', 'b', 2202)]
  });

  /* ---------- Penyimpanan (localStorage) ---------- */
  let state = null;

  function load() {
    if (state) return state;
    try {
      const raw = localStorage.getItem(DATA_KEY);
      const parsed = raw && JSON.parse(raw);
      if (parsed && Array.isArray(parsed.students) && isNum(parsed.kkm) &&
          parsed.students.every(s => s && typeof s.hist === 'object' && Array.isArray(s.ptn))) {
        state = parsed;
        return state;
      }
    } catch (e) { /* data rusak → pakai data awal */ }
    state = seed();
    save();
    return state;
  }

  function save() {
    try { localStorage.setItem(DATA_KEY, JSON.stringify(state)); } catch (e) { /* storage penuh/diblokir */ }
  }

  /* ---------- Filter kelas ---------- */
  function activeClass() {
    const u = auth.current();
    if (u && u.role === 'murid') {
      const me = load().students.find(s => s.id === u.studentId);
      return me ? me.kelas : 'ALL';
    }
    try { const k = localStorage.getItem(CLASS_KEY); return (k === 'ALL' || KELAS[k]) ? k : 'ALL'; } catch (e) { return 'ALL'; }
  }
  function setClass(k) {
    try { localStorage.setItem(CLASS_KEY, k); } catch (e) { /* diblokir */ }
  }
  const inClass = (s, k) => k === 'ALL' || s.kelas === k;
  const classLabel = k => (k === 'ALL' ? 'Semua Kelas' : (KELAS[k] || k));

  /* ---------- Perhitungan nilai ---------- */
  const isGraded = s => !!s && COMPONENTS.every(c => isNum(s[c.key]));

  const finalScore = s =>
    isGraded(s) ? round1(COMPONENTS.reduce((t, c) => t + s[c.key] * c.weight, 0)) : null;

  const predikat = n => PREDIKAT.find(p => n >= p.min) || PREDIKAT[PREDIKAT.length - 1];

  const kkm = () => load().kkm;
  const status = (n, k = kkm()) => (n >= k ? 'Tuntas' : 'Belum Tuntas');

  // Risiko ditentukan dari seberapa jauh nilai di bawah KKM
  function risk(n, k = kkm()) {
    if (n >= k) return 'Aman';
    const gap = k - n;
    return gap > 10 ? 'Tinggi' : gap > 5 ? 'Sedang' : 'Rendah';
  }

  // Komponen terendah milik satu siswa
  function weakest(s) {
    return COMPONENTS
      .map(c => ({ key: c.key, label: c.label, value: s[c.key] }))
      .reduce((a, b) => (b.value < a.value ? b : a));
  }

  // Nilai UAS yang dibutuhkan agar nilai akhir mencapai target
  function neededUas(scores, target) {
    const uas = COMPONENTS.find(c => c.key === 'uas');
    const others = COMPONENTS.filter(c => c.key !== 'uas')
      .reduce((t, c) => t + scores[c.key] * c.weight, 0);
    return (target - others) / uas.weight;
  }

  // Validasi input nilai → null kalau valid, atau {field, text}
  function validateScores(scores) {
    for (const c of COMPONENTS) {
      const v = scores[c.key];
      if (!isNum(v)) return { field: c.key, text: `Nilai ${c.label} wajib diisi dengan angka.` };
      if (v < 0 || v > 100) return { field: c.key, text: `Nilai ${c.label} harus antara 0 dan 100.` };
    }
    return null;
  }

  /* ---------- Riwayat semester ---------- */
  // Nilai komponen siswa pada semester tertentu (semester berjalan = field langsung di siswa)
  const scoresOf = (s, sem = CURRENT_SEM) => (sem === CURRENT_SEM ? s : (s.hist && s.hist[sem]) || null);

  // Rata-rata nilai akhir satu kelas pada satu semester
  function classAvgAt(kelas, sem) {
    const list = load().students.filter(s => inClass(s, kelas)).map(s => scoresOf(s, sem)).filter(isGraded);
    return list.length ? round1(list.reduce((t, sc) => t + finalScore(sc), 0) / list.length) : null;
  }

  // Tren satu siswa: hanya semester yang punya nilai lengkap
  function trendOf(s) {
    return SEMESTERS
      .map(sem => ({ sem, n: finalScore(scoresOf(s, sem)), avg: classAvgAt(s.kelas, sem) }))
      .filter(t => t.n !== null);
  }

  // Tren rata-rata kelas (kelas aktif atau yang diminta)
  function classTrend(kelas = activeClass()) {
    return SEMESTERS.map(sem => ({ sem, avg: classAvgAt(kelas, sem) })).filter(t => t.avg !== null);
  }

  /* ---------- Statistik kelas (dihitung dari data, bukan diketik manual) ---------- */
  function stats(kelas = activeClass()) {
    const k = kkm();
    const all = load().students.filter(s => inClass(s, kelas));
    const graded = all.filter(isGraded).map(s => ({ s, n: finalScore(s) }));
    const count = graded.length;
    const tuntas = graded.filter(g => g.n >= k).length;
    const avgByComp = COMPONENTS.map(c =>
      count ? round1(graded.reduce((t, g) => t + g.s[c.key], 0) / count) : null);

    let weakestComp = null;
    if (count) {
      let idx = 0;
      avgByComp.forEach((v, i) => { if (v < avgByComp[idx]) idx = i; });
      weakestComp = { label: COMPONENTS[idx].label, avg: avgByComp[idx] };
    }

    return {
      kkm: k,
      kelas,
      total: all.length,
      count,
      avg: count ? round1(graded.reduce((t, g) => t + g.n, 0) / count) : null,
      tuntas,
      pctTuntas: count ? round1((tuntas / count) * 100) : null,
      avgByComp,
      weakest: weakestComp,
      distribusi: PREDIKAT.map(p => ({
        ...p, jumlah: graded.filter(g => predikat(g.n).kode === p.kode).length
      })),
      perhatian: graded.filter(g => g.n < k).sort((a, b) => a.n - b.n),
      pengayaan: graded.filter(g => g.n >= 90).sort((a, b) => b.n - a.n)
    };
  }

  /* ---------- PTN impian ---------- */
  const ptnById = id => PTN_DATA.find(p => p.id === id) || null;
  function ptnLabel(choice) {
    if (!choice) return null;
    const p = ptnById(choice.ptn);
    return p ? { ptn: p.nama, singkat: p.singkat, rank: p.rank, jurusan: choice.jurusan } : null;
  }
  // pilihan = [{ptn, jurusan}, {ptn, jurusan}]
  function setPtn(id, pilihan) {
    const s = load().students.find(x => x.id === id);
    if (!s) return { ok: false, error: 'Siswa tidak ditemukan.' };
    if (!Array.isArray(pilihan) || pilihan.length !== 2) return { ok: false, error: 'Harus ada 2 pilihan.' };
    for (let i = 0; i < 2; i++) {
      const c = pilihan[i], p = c && ptnById(c.ptn);
      if (!p) return { ok: false, error: `Pilih PTN untuk pilihan ${i + 1}.` };
      if (!p.jurusan.includes(c.jurusan)) return { ok: false, error: `Pilih jurusan untuk pilihan ${i + 1}.` };
    }
    if (pilihan[0].ptn === pilihan[1].ptn && pilihan[0].jurusan === pilihan[1].jurusan)
      return { ok: false, error: 'Pilihan 1 dan 2 tidak boleh sama persis.' };
    s.ptn = pilihan.map(c => ({ ptn: c.ptn, jurusan: c.jurusan }));
    save();
    return { ok: true };
  }

  /* ---------- Peringkat & leaderboard ---------- */
  const NEXT_SEM = 'Genap 2026/27';
  const clampR = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const stdev = arr => { const m = arr.reduce((t, x) => t + x, 0) / arr.length; return Math.sqrt(arr.reduce((t, x) => t + (x - m) * (x - m), 0) / arr.length); };

  // Peringkat pada satu semester. scope = 'ALL' atau nama kelas.
  function rankingAt(scope, sem) {
    return load().students
      .filter(s => inClass(s, scope))
      .map(s => ({ s, n: finalScore(scoresOf(s, sem)) }))
      .filter(r => r.n !== null)
      .sort((a, b) => b.n - a.n || a.s.name.localeCompare(b.s.name))
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  // Leaderboard semester ini + perubahan peringkat dibanding semester lalu (delta > 0 = naik)
  function leaderboard(scope = 'ALL') {
    const now = rankingAt(scope, CURRENT_SEM);
    const prev = new Map(rankingAt(scope, SEMESTERS[SEMESTERS.length - 2]).map(r => [r.s.id, r.rank]));
    return now.map(r => { const p = prev.has(r.s.id) ? prev.get(r.s.id) : null; return { ...r, prevRank: p, delta: p === null ? null : p - r.rank }; });
  }

  // Duel antar kelas
  function classDuel() {
    return Object.keys(KELAS).map(k => {
      const st = stats(k);
      return {
        kelas: k, count: st.count, avg: st.avg, pctTuntas: st.pctTuntas,
        jumlahA: st.distribusi.find(d => d.kode === 'A').jumlah,
        prevAvg: classAvgAt(k, SEMESTERS[SEMESTERS.length - 2]),
        top: rankingAt(k, CURRENT_SEM)[0] || null
      };
    });
  }

  /* ---------- Gamifikasi: kartu pemain, level/XP, streak, badge ---------- */
  const XP_PER_LEVEL = 500;
  const LEVEL_TITLES = ['Rookie', 'Rookie', 'Starter', 'Playmaker', 'Captain', 'Maestro', 'Legend'];

  function gamify(s) {
    if (!isGraded(s)) return null;
    const k = kkm(), n = finalScore(s);
    const tr = trendOf(s), finals = tr.map(t => t.n);
    const delta = finals.length > 1 ? round1(finals[finals.length - 1] - finals[finals.length - 2]) : null;
    const kons = Math.round(clampR(100 - stdev(COMPONENTS.map(c => s[c.key])) * 3, 30, 99));
    const trn = Math.round(clampR(60 + (delta || 0) * 4, 30, 99));
    const attrs = [
      { k: 'TGS', v: s.tugas, name: 'Tugas' }, { k: 'UH', v: s.uh, name: 'Ulangan Harian' },
      { k: 'UTS', v: s.uts, name: 'Ujian Tengah Semester' }, { k: 'UAS', v: s.uas, name: 'Ujian Akhir Semester' },
      { k: 'TRN', v: trn, name: 'Tren: naik/turun vs semester lalu' }, { k: 'KON', v: kons, name: 'Konsistensi: pemerataan 4 komponen' }
    ];
    const rating = Math.round(n);
    const tier = rating >= 90 ? 'icon' : rating >= 85 ? 'gold' : rating >= 75 ? 'silver' : 'bronze';

    // XP = 5 × nilai akhir tiap semester + 150 per semester tuntas + 100 per kenaikan antar semester
    let xp = finals.reduce((t, x) => t + Math.round(x * 5), 0) + 150 * finals.filter(x => x >= k).length;
    for (let i = 1; i < finals.length; i++) if (finals[i] > finals[i - 1]) xp += 100;
    const level = 1 + Math.floor(xp / XP_PER_LEVEL);
    let streak = 0;
    for (let i = finals.length - 1; i >= 0 && finals[i] >= k; i--) streak++;

    const rk = rankingAt(s.kelas, CURRENT_SEM).find(r => r.s.id === s.id);
    const rank = rk ? rk.rank : null;
    const up = delta !== null && delta >= 1;
    const badges = [
      { id: 'kkm', icon: '🎯', name: 'Lewat KKM!', desc: `Nilai akhir ≥ KKM ${k}`, earned: n >= k },
      { id: 'naik', icon: '📈', name: up ? `Naik ${String(delta).replace('.', ',')} poin!` : 'Naik Poin', desc: 'Nilai akhir naik dari semester lalu', earned: up },
      { id: 'lonjakan', icon: '🚀', name: 'Lonjakan +5', desc: 'Naik minimal 5 poin dalam satu semester', earned: delta !== null && delta >= 5 },
      { id: 'elite', icon: '👑', name: 'Elite A', desc: 'Nilai akhir ≥ 90', earned: n >= 90 },
      { id: 'streak', icon: '🔥', name: 'Konsisten 3 Semester', desc: 'Tuntas 3 semester berturut-turut', earned: streak >= 3 },
      { id: 'top3', icon: '🥇', name: 'Top 3 Kelas', desc: 'Peringkat 1–3 di kelasmu', earned: rank !== null && rank <= 3 },
      { id: 'juara', icon: '🏆', name: 'Juara Kelas', desc: 'Peringkat 1 di kelasmu', earned: rank === 1 },
      { id: 'sempurna', icon: '💯', name: 'Nilai Sempurna', desc: 'Ada komponen yang bernilai 100', earned: COMPONENTS.some(c => s[c.key] === 100) },
      { id: 'jagouas', icon: '🧠', name: 'Jago Ujian', desc: 'UAS ≥ 95', earned: s.uas >= 95 },
      { id: 'tujuan', icon: '🎓', name: 'Punya Tujuan', desc: 'Sudah memilih 2 PTN impian', earned: !!(s.ptn && s.ptn[0] && s.ptn[1]) }
    ];
    return {
      rating, tier, attrs, xp, level, title: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)],
      xpInLevel: xp % XP_PER_LEVEL, xpPerLevel: XP_PER_LEVEL, streak, delta, rank, classSize: rk ? rankingAt(s.kelas, CURRENT_SEM).length : 0, badges
    };
  }

  /* ---------- Prediksi nilai semester depan (regresi linier sederhana) ---------- */
  function predict(s) {
    const t = trendOf(s), pts = t.map(x => x.n), m = pts.length;
    if (m < 2) return null;
    const mx = (m - 1) / 2, my = pts.reduce((a, b) => a + b, 0) / m;
    const sxx = pts.reduce((tt, _, i) => tt + (i - mx) ** 2, 0);
    const sxy = pts.reduce((tt, y, i) => tt + (i - mx) * (y - my), 0);
    const b = sxy / sxx, a = my - b * mx;
    const rss = pts.reduce((tt, y, i) => tt + (y - (a + b * i)) ** 2, 0);
    const sd = Math.max(2, m > 2 ? Math.sqrt(rss / (m - 2)) : 2); // pita ketidakpastian minimal ±2
    const next = round1(clampR(a + b * m, 0, 100)), k = kkm();
    const status = next < k ? 'bahaya' : (next - sd < k ? 'waspada' : 'aman');
    return {
      sems: t.map(x => x.sem), points: pts, slope: round1(b), next, sd: round1(sd),
      lo: round1(clampR(next - sd, 0, 100)), hi: round1(clampR(next + sd, 0, 100)),
      status, fromAbove: pts[m - 1] >= k && next < k, kkm: k, label: NEXT_SEM
    };
  }

  /* ---------- Kecocokan PTN (ESTIMASI DEMO — bukan prediksi resmi) ----------
     patokan = 93 − 0,85 × (peringkat PTN − 1) + penyesuaian jurusan; peluang = logistik(selisih nilai akhir − patokan). */
  function majorAdj(j) {
    if (/^Pendidikan|PGSD|Guru SD/.test(j)) return -3;
    if (/^Kedokteran Gigi/.test(j)) return 4;
    if (/^Kedokteran Hewan/.test(j)) return 3;
    if (/^Kedokteran/.test(j)) return 5;
    if (/Ilmu Komputer|Informatika|Teknologi Informasi|Sains Data|Sistem Informasi/.test(j)) return 3;
    if (/Psikologi|Hukum|Farmasi|Teknik|Arsitektur|Akuntansi|Manajemen|Komunikasi|Hubungan Internasional/.test(j)) return 1;
    return 0;
  }
  function ptnMatch(s, choice) {
    const p = choice && ptnById(choice.ptn);
    if (!p || !isGraded(s)) return null;
    const score = finalScore(s);
    const req = round1(93 - (p.rank - 1) * 0.85 + majorAdj(choice.jurusan));
    const diff = round1(score - req);
    const pct = Math.round(clampR(100 / (1 + Math.exp(-diff / 3.2)), 3, 97));
    const tone = pct >= 75 ? 'good' : pct >= 50 ? 'ok' : pct >= 25 ? 'warn' : 'hard';
    const label = { good: 'Sangat mungkin', ok: 'Peluang bagus', warn: 'Perlu usaha', hard: 'Berat, butuh lonjakan' }[tone];
    return { pct, tone, label, score, req, diff, need: Math.max(0, Math.ceil(req - score)) };
  }

  /* ---------- Operasi data (CRUD) ---------- */
  function addStudent(name, kelas) {
    name = String(name || '').trim().replace(/\s+/g, ' ');
    if (!name) return { ok: false, error: 'Nama siswa wajib diisi.' };
    if (name.length > 40) return { ok: false, error: 'Nama maksimal 40 karakter.' };
    if (!KELAS[kelas]) kelas = Object.keys(KELAS)[0];
    const list = load().students;
    if (list.some(s => s.name.toLowerCase() === name.toLowerCase()))
      return { ok: false, error: 'Nama siswa sudah ada.' };
    const student = {
      id: 's' + Date.now().toString(36), name, kelas,
      tugas: null, uh: null, uts: null, uas: null, target: 90, hist: {}, ptn: [null, null]
    };
    list.push(student);
    save();
    return { ok: true, student };
  }

  // sem = semester yang diisi (default: semester berjalan)
  function saveScores(id, scores, sem = CURRENT_SEM) {
    const s = load().students.find(x => x.id === id);
    if (!s) return false;
    const target = sem === CURRENT_SEM ? s : (s.hist[sem] = s.hist[sem] || {});
    COMPONENTS.forEach(c => { target[c.key] = scores[c.key]; });
    save();
    return true;
  }

  function removeStudent(id) {
    const st = load();
    st.students = st.students.filter(s => s.id !== id);
    save();
  }

  function setKkm(value) {
    if (!isNum(value) || value < 0 || value > 100) return;
    load().kkm = value;
    save();
  }

  function reset() { state = seed(); save(); }

  /* ---------- Autentikasi demo (sisi klien, hanya simulasi) ---------- */
  const auth = {
    login(username, password, role, remember) {
      const uname = String(username || '').trim().toLowerCase();
      const acc = ACCOUNTS.find(a => a.username === uname && a.password === password && a.role === role);
      if (!acc) return null;
      const session = { username: acc.username, role: acc.role, name: acc.name, studentId: acc.studentId || null };
      auth.logout();
      (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    },
    current() {
      for (const store of [sessionStorage, localStorage]) {
        try {
          const s = JSON.parse(store.getItem(SESSION_KEY) || 'null');
          if (s && (s.role === 'guru' || s.role === 'murid')) return s;
        } catch (e) { /* sesi rusak → dianggap belum login */ }
      }
      return null;
    },
    logout() {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
  };

  return {
    COMPONENTS, PREDIKAT, SEMESTERS, CURRENT_SEM, KELAS, PTN: PTN_DATA,
    // students() mengikuti filter kelas aktif; allStudents() = semua kelas
    students: () => load().students.filter(s => inClass(s, activeClass())),
    allStudents: () => load().students,
    student: id => load().students.find(s => s.id === id) || null,
    activeClass, setClass, classLabel,
    kkm, setKkm, isGraded, finalScore, predikat, status, risk, weakest, neededUas,
    validateScores, stats, scoresOf, classAvgAt, trendOf, classTrend,
    ptnById, ptnLabel, setPtn, ptnMatch,
    NEXT_SEM, rankingAt, leaderboard, classDuel, gamify, predict,
    addStudent, saveScores, removeStudent, reset, auth,
    ui: { ready: false }
  };
})();
