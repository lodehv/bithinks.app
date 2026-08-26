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
  '/src/pages/dashboard/MarketingDashboard.jsx',
  // Antrean cetak: layar yang paling sering diubah, dan yang paling mahal
  // kalau mati — di sinilah pemilik toko mencetak resi tiap hari.
  '/src/pages/dashboard/omni/AntreanCetak.jsx',
  // Dirender tanpa prop apa pun. Itu memang maksudnya: yang diuji apakah
  // komponennya sanggup dieksekusi sekali dengan keadaan kosong.
  '/src/pages/dashboard/omni/TombolAturKirim.jsx',
]

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })

let gagal = 0
for (const jalur of HALAMAN) {
  try {
    const mod = await vite.ssrLoadModule(jalur)
    if (typeof mod.default !== 'function') throw new Error('tidak mengekspor komponen default')
    renderToString(createElement(mod.default))
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
