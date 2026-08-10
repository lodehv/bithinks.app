# BitOmni — Frontend

Ini bagian yang dilihat pengguna: React 19 + Vite 8, tayang di
**bithinks.com** lewat Vercel.

Backend dan seluruh dokumentasi tim ada di repo sebelah:
**[bithinks-backend](https://github.com/MasTampubolon/bithinks-backend)** —
tolong baca `README.md`, `CONTRIBUTING.md`, dan `docs/tim/keamanan.md` di sana
sebelum mulai.

---

## Mulai bekerja

```bash
git clone https://github.com/MasTampubolon/bithinks.app.git
cd bithinks.app

git config core.hooksPath .githooks   # WAJIB, sekali saja
cp .env.example .env
npm install
npm run dev                            # http://localhost:5173
```

Backend-nya harus jalan juga di `http://localhost:3001`, kalau tidak semua
halaman akan kosong. Petunjuknya ada di repo backend.

---

## Tiga hal yang paling sering bikin celaka

**1. `main` langsung tayang.** Vercel menerbitkan otomatis setiap kali `main`
berubah — tanpa persetujuan, tanpa jeda. Sekitar satu menit setelah merge,
pelanggan sudah melihatnya. Jadi jangan pernah push langsung ke `main`; selalu
lewat branch dan PR.

**2. Build lolos bukan berarti komponennya muncul.** Kalau Anda menyambungkan
komponen ke berkas yang tidak pernah di-`import` siapa pun, Vite membuangnya
karena dianggap tidak terpakai — build tetap hijau, tapi layarnya kosong. Selalu
telusuri dari `src/pages/Dashboard.jsx` ke bawah untuk memastikan komponen Anda
benar-benar tersambung.

**3. Variabel `VITE_` terbaca semua orang.** Isinya ikut terbundel ke JavaScript
yang diunduh setiap pengunjung, jadi bisa dibaca lewat DevTools. **Jangan pernah
menaruh kunci API atau token di sana** — rahasia hanya boleh hidup di backend.

---

## Soal tampilan

Warna latar cuma tiga: **ungu indigo, hitam, putih.** Solid, tanpa gradasi. Font
**Plus Jakarta Sans**, dan jangan terlalu kecil — aplikasi ini dipakai berjam-jam
oleh orang gudang.

Token warnanya sudah ada di berkas CSS masing-masing modul. Pakai token itu,
jangan menulis kode warna sendiri.

---

## Perintah

| Perintah | Gunanya |
|---|---|
| `npm run dev` | Jalankan untuk pengembangan |
| `npm run build` | Bangun seperti yang dilakukan Vercel |
| `npm run lint` | Periksa gaya penulisan kode |

Sebelum push, `npm run build` berjalan otomatis lewat git hook. Kalau gagal,
push-nya ditahan — memang disengaja, karena build yang rusak berarti
bithinks.com rusak.

Catatan jujur: `npm run lint` saat ini masih menyisakan **20 error dan 4 warning
warisan lama** di modul HRM, AdminPanel, dan MarketingDashboard. Karena itu lint
belum dijadikan gerbang yang memblokir. Kalau Anda kebetulan menyentuh berkas
yang bermasalah, tolong sekalian dirapikan.
