// ─────────────────────────────────────────────────────────────────────────────
// Memotret halaman sungguhan di Chrome, dengan data tiruan.
//
// Kenapa ada. `npm run build` cuma membuktikan kodenya bisa DITERJEMAHKAN.
// Ia tidak pernah membuka halamannya, jadi ia buta pada dua hal yang justru
// paling sering dikeluhkan: halaman yang mati saat dijalankan, dan tata letak
// yang melebar keluar layar. Dua-duanya sudah pernah lolos ke produksi.
//
// Tidak ada jaringan, tidak ada kredensial: `utils/omniApi` diganti tiruan
// lewat alias Vite.
// ─────────────────────────────────────────────────────────────────────────────
import { createServer } from 'vite'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const akar = resolve(here, '..')
const keluar = resolve(akar, 'pratinjau-keluaran')
mkdirSync(keluar, { recursive: true })

const LEBAR = Number(process.env.LEBAR ?? 1440)      // satu lebar per pemanggilan
const HALAMAN = process.env.HALAMAN ?? 'laporan'     // satu halaman per pemanggilan
const CHROME = (() => {
  if (process.env.CHROME) return process.env.CHROME
  const calon = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium',
  ]
  for (const c of calon) if (existsSync(c)) return c
  console.error('Chrome tidak ditemukan. Setel CHROME=<jalur> bila ia ada di tempat lain.')
  process.exit(1)
})()

const vite = await createServer({
  root: akar,
  configFile: false,
  plugins: [(await import('@vitejs/plugin-react')).default()],
  resolve: { alias: [{ find: /^.*utils\/omniApi(\.js)?$/, replacement: resolve(here, 'pratinjau/omniApi.js') }] },
  server: { port: 5199, strictPort: true },
  logLevel: 'error',
})
await vite.listen()

const url = `http://localhost:5199/scripts/pratinjau/index.html?halaman=${HALAMAN}`
const berkas = resolve(keluar, `${HALAMAN}-${LEBAR}.png`)

const dom = await new Promise((selesai, gagal) => {
  const p = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--window-size=${LEBAR},2400`, '--virtual-time-budget=6000',
    `--screenshot=${berkas}`, '--dump-dom', url,
  ], { stdio: ['ignore', 'pipe', 'ignore'] })
  let keluaran = ''
  p.stdout.on('data', (b) => (keluaran += b))
  p.on('exit', (k) => (k === 0 ? selesai(keluaran) : gagal(new Error(`Chrome keluar dengan kode ${k}`))))
})

await vite.close()

const cocok = dom.match(/LUBER=(-?\d+)/)
if (!cocok) {
  console.error('Halaman tidak sempat mengukur dirinya — kemungkinan ia gagal dirender.')
  process.exit(1)
}
const luber = Number(cocok[1])
console.log(berkas)
// Ambang 1px, bukan 0: pembulatan sub-piksel kadang menyisakan selisih sepele.
if (luber > 1) {
  console.error(`GAGAL: ${HALAMAN} melebar ${luber}px melewati layar ${LEBAR}px.`)
  const biang = dom.match(/BIANG=(\[.*?\])/)
  if (biang) for (const b of JSON.parse(biang[1].replace(/&quot;/g, '"'))) console.error('   ', b)
  process.exit(1)
}
console.log(`OK: ${HALAMAN} tidak melebar di lebar ${LEBAR}px.`)
