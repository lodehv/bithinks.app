// ─────────────────────────────────────────────────────────────────────────────
// Uji asap: BENAR-BENAR merender tiap halaman, bukan cuma mem-build-nya.
//
// Kenapa ada berkas ini. Pada 20 Agustus 2026 halaman Laporan Penjualan mati
// total jadi layar putih karena satu baris ditaruh di atas `useState` sumbernya
// — "zona mati temporal". `npm run build` HIJAU. `eslint` HIJAU. Seluruh test
// backend LULUS. Yang menemukan pemilik toko, dari layar kosong.
//
// Sebabnya sederhana: mem-build hanya membuktikan kodenya bisa DITERJEMAHKAN,
// bukan bisa DIJALANKAN. Kesalahan seperti ini baru lahir saat komponennya
// dieksekusi. Jadi berkas ini mengeksekusinya, di Node, tanpa browser.
//
// `renderToString` tidak menjalankan `useEffect`, jadi TIDAK ADA panggilan
// jaringan dan tidak ada kredensial yang dipakai. Yang diuji cuma: apakah
// halaman ini sanggup dirender sekali dengan keadaan kosong.
// ─────────────────────────────────────────────────────────────────────────────
import { createServer } from 'vite'
import { renderToString } from 'react-dom/server'
import { createElement } from 'react'

const HALAMAN = [
  { jalur: '/src/pages/dashboard/MarketingDashboard.jsx' },
  // Antrean cetak: layar yang paling sering diubah, dan yang paling mahal
  // kalau mati — di sinilah pemilik toko mencetak resi tiap hari.
  { jalur: '/src/pages/dashboard/omni/AntreanCetak.jsx' },
  // Dirender tanpa prop apa pun. Itu memang maksudnya: yang diuji apakah
  // komponennya sanggup dieksekusi sekali dengan keadaan kosong.
  { jalur: '/src/pages/dashboard/omni/TombolAturKirim.jsx' },
  // Riwayat cetak: layar baru, dan layar baru yang tidak diuji adalah layar
  // yang mati diam-diam.
  { jalur: '/src/pages/dashboard/omni/RiwayatCetak.jsx' },
  // US2: aksi berbayar harus tetap sanggup dirender dalam keadaan terkunci,
  // serta benar-benar menghasilkan kontrol disabled yang menjelaskan sebabnya.
  {
    jalur: '/src/pages/dashboard/omni/TombolCetak.jsx',
    props: { channel: 'shopee', jumlah: 12, locked: true },
    harusMemuat: ['disabled=""', 'Mode hanya-baca: aktifkan akses untuk mencetak'],
  },
]

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })

let gagal = 0
for (const { jalur, props, harusMemuat = [] } of HALAMAN) {
  try {
    const mod = await vite.ssrLoadModule(jalur)
    if (typeof mod.default !== 'function') throw new Error('tidak mengekspor komponen default')
    const html = renderToString(createElement(mod.default, props))
    for (const bagian of harusMemuat) {
      if (!html.includes(bagian)) throw new Error(`hasil render tidak memuat: ${bagian}`)
    }
    console.log(`  ✓ ${jalur}`)
  } catch (e) {
    gagal++
    console.log(`  ✗ ${jalur}\n    ${e.message}`)
  }
}

await vite.close()
if (gagal) {
  console.log(`\n${gagal} halaman gagal dirender.`)
  process.exit(1)
}
console.log(`\n${HALAMAN.length} halaman terender.`)
