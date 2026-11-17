# SKORIN

Aplikasi demo manajemen nilai berbasis HTML, CSS, dan JavaScript (tanpa backend). Data tersimpan di `localStorage` browser.

## Cara menjalankan
Buka folder di VS Code, jalankan `index.html` dengan **Live Server**.

## Akun demo
| Peran | Username | Password |
|-------|----------|----------|
| Guru  | `guru01`  | `guru123` |
| Murid | `murid01` | `murid123` (Lamine Yamal, XII-B, nilai tinggi) |
| Murid | `murid02` | `murid123` (Rayhan Hannan, XII-A, perlu bimbingan) |

## Fitur
- Login berbasis akun dan peran; halaman dilindungi per peran (murid tidak bisa membuka halaman guru, dan sebaliknya).
- **Guru:** dashboard, kelas & siswa (cari, tambah, hapus), input nilai (validasi 0–100, tersimpan), analisis, simulasi, rekomendasi.
- **Murid:** dashboard, analisis, simulasi target, dan rekomendasi belajar dari nilainya sendiri.
- Semua angka (rata-rata, ketuntasan, distribusi predikat, grafik, siswa berisiko, rekomendasi) **dihitung dari data siswa**, bukan teks statis.
- Tombol **Reset data demo** di halaman Kelas & Siswa mengembalikan data awal.

## Fitur v5
- **Layar pembuka sinematik** (login): layar putih, si peniup seruling berjalan kiri → kanan dan "memanggil" semua elemen login. Lewati dengan tombol/klik/Esc, atau buka `index.html?nointro`. Tombol "Putar ulang intro" memutar dengan suara seruling (browser memblokir suara otomatis).
- **Kartu & Level (murid):** kartu gaya FIFA Ultimate Team (rating = nilai akhir, atribut = komponen + TRN tren + KON konsistensi), level, XP, streak, dan 10 badge.
- **Leaderboard:** per kelas dan antar kelas, duel XII-A vs XII-B, podium, animasi naik/turun peringkat dibanding semester lalu.
- **Peringatan Dini (guru) + prediksi nilai (murid):** regresi linier dari riwayat 3 semester, garis proyeksi, pita ketidakpastian, status aman/waspada/bahaya.
- **Kecocokan PTN:** persentase sederhana per pilihan PTN. **ESTIMASI DEMO**, bukan prediksi resmi; rumusnya ditampilkan di halaman.
- Data demo fiktif (nama pemain asli, nilai karangan). Kunci penyimpanan berubah, jadi data lama di browser otomatis reset.

## Struktur
```
index.html              halaman login
pages/                  halaman guru dan murid
css/                    auth, app, components, theme, intro, game
js/data.js              sumber data, rumus nilai, autentikasi demo
js/common.js            penjaga akses, sidebar, menu mobile, grafik, toast
js/*.js                 logika per halaman
```

## Rumus
Nilai akhir = Tugas 20% + UH 25% + UTS 25% + UAS 30%. Predikat: A ≥ 90, B+ ≥ 80, B ≥ 75, C ≥ 70, D < 70. Tuntas jika nilai akhir ≥ KKM.

## Batasan
Autentikasi dan penyimpanan masih di sisi klien (simulasi). Aplikasi nyata memerlukan backend dan database, dengan password yang di-hash.

## v3 — Neon Campus (upgrade tampilan)
- `css/theme.css` (baru): tema gelap neon/glass, font dasar 16–17px, kontras teks ≥ 7:1. Dimuat terakhir di semua halaman.
- `js/fx.js` (baru): latar 3D di login, "Menara Nilai 3D" (bar chart CSS 3D, bisa digeser) di dashboard guru & murid, tilt 3D pada kartu, count-up angka. Tanpa library, jalan offline.
- Perbaikan: panel kanan dashboard tidak lagi turun, tombol "Lihat" password sejajar, status murid "Belum Tuntas" tidak lagi berwarna hijau.
- Font Plus Jakarta Sans dimuat dari Google Fonts (butuh internet; tanpa internet otomatis pakai font sistem).

## v4 — fitur baru
- **Logo gambar:** taruh file di `assets/logo.png` (lihat `assets/BACA-INI.txt`). Tanpa file → tampil kotak "SS".
- **Guru:** Ibu Warnety (Guru • Informatika). **Kelas:** XII-A = skuad Persija Jakarta 2026/27 (29), XII-B = skuad FC Barcelona 2026/27 (27). Nilai murid fiktif. Filter kelas ada di pojok kanan atas.
- **Export:** tombol Excel (.xlsx asli, 3 sheet: Nilai, Riwayat Semester, PTN Impian) dan PDF (dialog cetak → Simpan sebagai PDF) di halaman Kelas & Siswa dan PTN Impian.
- **Riwayat semester:** 3 semester (Ganjil 25/26, Genap 25/26, Ganjil 26/27). Input Nilai bisa memilih semester; grafik tren ada di Analisis (guru, bisa bandingkan per siswa) dan Analisis Saya (murid).
- **Mode terang/gelap:** tombol di pojok kanan atas (pilihan tersimpan di browser).
- **PTN Impian:** murid memilih 2 PTN + jurusan dari 20 PTN (peringkat Webometrics 2026) di menu "PTN Impian Saya"; guru melihat daftarnya di dashboard dan menu "PTN Impian". Daftar jurusan = jurusan populer, bukan daftar lengkap.
- Data disimpan dengan kunci baru (`_v3`), jadi data lama otomatis diganti data awal.
