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

// Halaman yang butuh AppProvider menyebutkannya di `provider`. Tanpa itu
// `useAppContext` melempar, dan yang kita lihat cuma galat pembungkusnya —
// bukan jawaban atas pertanyaan "halaman ini sanggup dirender atau tidak".
const HALAMAN = [
  { jalur: '/src/pages/dashboard/MarketingDashboard.jsx' },
  { jalur: '/src/pages/dashboard/AdminPendaftaran.jsx' },
  { jalur: '/src/pages/dashboard/AdminPanel.jsx' },
  { jalur: '/src/pages/Register.jsx', provider: ['/src/context/AppContext.jsx', 'AppProvider'] },
]

// AppProvider membaca localStorage saat lahir. Disediakan yang paling
// sederhana: peta dalam ingatan, hidup sepanjang satu kali jalan. Murni
// penopang harness — kode produksi tidak diubah.
//
// Dipasang dengan defineProperty, bukan penugasan biasa: Node 22 ke atas sudah
// punya `globalThis.localStorage` bawaan, tapi ia MATI kalau dijalankan tanpa
// `--localstorage-file` — ada, namun setiap panggilannya melempar. Pemeriksaan
// "kalau belum ada" karena itu selalu meleset.
{
  const isi = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (isi.has(k) ? isi.get(k) : null),
      setItem: (k, v) => isi.set(k, String(v)),
      removeItem: (k) => isi.delete(k),
      clear: () => isi.clear(),
    },
  })
}

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })

let gagal = 0
for (const { jalur, provider } of HALAMAN) {
  try {
    const mod = await vite.ssrLoadModule(jalur)
    if (typeof mod.default !== 'function') throw new Error('tidak mengekspor komponen default')

    let pohon = createElement(mod.default)
    if (provider) {
      const [modulProvider, namaEkspor] = provider
      const p = await vite.ssrLoadModule(modulProvider)
      if (typeof p[namaEkspor] !== 'function') {
        throw new Error(`${modulProvider} tidak mengekspor ${namaEkspor}`)
      }
      pohon = createElement(p[namaEkspor], null, pohon)
    }
    renderToString(pohon)
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
