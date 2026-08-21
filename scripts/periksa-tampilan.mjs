// Menjalankan potret.mjs di beberapa lebar layar sekaligus.
// Ambang lebar dipilih dari yang benar-benar dipakai: laptop 1440 & 1280,
// dan 1024 sebagai batas bawah tempat tata letak dua kolom melipat.
//
// 768 ke bawah SENGAJA belum ikut. Di sana isi kartu sudah terpotong sejak
// sebelum perbaikan 20 Agu 2026 — diperiksa dengan memotret versi lama, hasil
// terpotongnya sama persis. Itu utang tersendiri, bukan akibat perbaikan ini,
// dan menariknya ke sini sekarang cuma akan membuat gerbang merah terus lalu
// diabaikan orang. Tambahkan begitu tampilan ponsel benar-benar digarap.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const LEBAR = [1440, 1280, 1024]
let gagal = 0

for (const w of LEBAR) {
  const kode = await new Promise((s) => {
    const p = spawn(process.execPath, [resolve(here, 'potret.mjs')],
      { stdio: 'inherit', env: { ...process.env, LEBAR: String(w) } })
    p.on('exit', s)
  })
  if (kode !== 0) gagal++
}

if (gagal) { console.error(`\n${gagal} dari ${LEBAR.length} lebar bermasalah.`); process.exit(1) }
console.log(`\n${LEBAR.length} lebar bersih.`)
