import { useMemo, useState } from 'react'
import { X, ChevronDown, Copy, Download, Check } from 'lucide-react'
import './PanelRetur.css'

// ─────────────────────────────────────────────────────────────────────────────
// PANEL RINCIAN RETUR — satu tahap, disaring platform lalu toko, lalu tabelnya.
//
// Bentuk ini rancangan pemilik toko 11 September 2026, mengikuti referensi yang
// beliau berikan. Sebelumnya rinciannya menempel di bawah ringkasan dan seluruh
// daftar tampil sekaligus; pada data sungguhan itu 22 baris dalam satu layar,
// dan layar utama jadi terbaca bercecer.
//
// Dipisah jadi panel supaya halaman laporan tetap ringkas: ringkasan di
// halaman, rincian saat diminta.
// ─────────────────────────────────────────────────────────────────────────────

const rupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
    .format(Number(v) || 0)

export default function PanelRetur({ judul, keterangan, baris, onTutup }) {
  const [platform, setPlatform] = useState(null)
  const [toko, setToko] = useState([])
  const [bukaToko, setBukaToko] = useState(false)
  const [terbuka, setTerbuka] = useState(null)
  const [disalin, setDisalin] = useState(false)

  // Daftar platform dan toko lahir DARI datanya sendiri, bukan dari daftar
  // tetap. Toko yang tidak punya retur tidak perlu muncul sebagai pilihan yang
  // selalu menghasilkan tabel kosong.
  const platformAda = useMemo(
    () => [...new Set(baris.map((r) => r.channel))].sort(),
    [baris],
  )

  const tokoAda = useMemo(() => {
    const peta = new Map()
    for (const r of baris) {
      if (platform && r.channel !== platform) continue
      if (!peta.has(r.toko)) peta.set(r.toko, r.channel)
    }
    return [...peta].map(([nama, channel]) => ({ nama, channel })).sort((a, b) => a.nama.localeCompare(b.nama))
  }, [baris, platform])

  const tersaring = useMemo(
    () => baris.filter((r) =>
      (!platform || r.channel === platform) && (toko.length === 0 || toko.includes(r.toko))),
    [baris, platform, toko],
  )

  const total = tersaring.reduce((a, r) => a + (r.nominal ?? 0), 0)

  const salinNomor = () => {
    const teks = tersaring.map((r) => r.pesanan).join('\n')
    navigator.clipboard?.writeText(teks).then(
      () => { setDisalin(true); setTimeout(() => setDisalin(false), 2000) },
      () => setDisalin(false),
    )
  }

  // Diekspor sebagai CSV, bukan .xlsx. Berkas .xlsx sungguhan butuh pustaka
  // tersendiri; CSV dibuka Excel apa adanya dan tidak menambah apa pun ke
  // bundel yang sudah besar.
  const unduh = () => {
    const kolom = ['No. Pesanan', 'Toko', 'Platform', 'Resi Retur', 'Status Marketplace', 'Alasan', 'Nominal', 'Tanggal']
    const kutip = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const isi = [
      kolom.join(','),
      ...tersaring.map((r) => [
        r.pesanan, r.toko, r.channel, r.resi ?? '', r.status ?? '',
        r.alasan ?? '', r.nominal ?? 0, r.tanggal ?? '',
      ].map(kutip).join(',')),
    ].join('\n')
    // BOM supaya Excel membaca huruf beraksen dengan benar. Ditulis sebagai
    // escape, bukan karakter aslinya: karakter tak terlihat di dalam sumber
    // adalah hal yang hanya terbaca oleh linter, tidak oleh manusia.
    const blob = new Blob(['\uFEFF' + isi], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `retur-${judul.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="panel-retur-latar" onClick={onTutup}>
      <div className="panel-retur" onClick={(e) => e.stopPropagation()}>
        <div className="panel-retur-kepala">
          <div>
            <h3>{judul}</h3>
            <p>{keterangan}</p>
          </div>
          <button type="button" className="panel-retur-tutup" onClick={onTutup} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className="panel-retur-saringan">
          <span className="panel-retur-label">PLATFORM</span>
          <div className="panel-ruas">
            <button
              type="button"
              className={`panel-ruas-tombol${platform === null ? ' panel-ruas-aktif' : ''}`}
              onClick={() => { setPlatform(null); setToko([]) }}
            >
              Semua
            </button>
            {platformAda.map((p) => (
              <button
                type="button"
                key={p}
                className={`panel-ruas-tombol${platform === p ? ' panel-ruas-aktif' : ''}`}
                onClick={() => { setPlatform(p); setToko([]) }}
              >
                {p}
              </button>
            ))}
          </div>

          <span className="panel-retur-label">TOKO</span>
          <div className="panel-toko">
            <button type="button" className="panel-toko-tombol" onClick={() => setBukaToko((b) => !b)}>
              {toko.length === 0 ? 'Semua toko' : `${toko.length} toko dipilih`}
              <ChevronDown size={14} className={bukaToko ? 'panel-panah-buka' : ''} />
            </button>
            {bukaToko && (
              <div className="panel-toko-menu">
                <button
                  type="button"
                  className="panel-toko-semua"
                  onClick={() => { setToko([]); setBukaToko(false) }}
                >
                  Semua toko
                </button>
                {tokoAda.map((t) => (
                  <label key={t.nama} className="panel-toko-baris">
                    <input
                      type="checkbox"
                      checked={toko.includes(t.nama)}
                      onChange={(e) =>
                        setToko((lama) =>
                          e.target.checked ? [...lama, t.nama] : lama.filter((n) => n !== t.nama))}
                    />
                    <span className="panel-toko-nama">{t.nama}</span>
                    <span className="panel-toko-channel">{t.channel}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel-retur-ringkas">
          <span className="panel-ringkas-jumlah">
            <b>{tersaring.length}</b> pesanan retur
          </span>
          <span className="panel-ringkas-nilai">− {rupiah(total)}</span>
          <button type="button" className="panel-aksi" onClick={salinNomor} disabled={tersaring.length === 0}>
            {disalin ? <Check size={14} /> : <Copy size={14} />}
            {disalin ? 'Tersalin' : 'Salin No. Pesanan'}
          </button>
          <button type="button" className="panel-aksi panel-aksi-utama" onClick={unduh} disabled={tersaring.length === 0}>
            <Download size={14} />
            Export Excel
          </button>
        </div>

        <div className="panel-retur-isi">
          {tersaring.length === 0 ? (
            <div className="panel-kosong">Tidak ada retur untuk saringan ini.</div>
          ) : (
            <table className="panel-tabel">
              <thead>
                <tr>
                  <th className="panel-kolom-no">#</th>
                  <th>No. Pesanan</th>
                  <th>Toko</th>
                  <th>Resi Retur</th>
                  <th>Status Marketplace</th>
                  <th>Alasan</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {tersaring.map((r, i) => (
                  <BarisRetur
                    key={r.id}
                    nomor={i + 1}
                    r={r}
                    buka={terbuka === r.id}
                    onKlik={() => setTerbuka(terbuka === r.id ? null : r.id)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function BarisRetur({ nomor, r, buka, onKlik }) {
  const jejak = Array.isArray(r.jejak) ? r.jejak : []
  // Tanggal diambil dari titik PERTAMA linimasa — saat returnya diajukan.
  // Bukan karangan: itu `requestedAt` yang sama, sudah dicetak dalam WIB oleh
  // server. Kalau kelak server mengirim `tanggal` tersendiri, yang itu menang.
  const tanggal = r.tanggal || jejak[0]?.waktu || ''
  return (
    <>
      <tr className={`panel-baris${buka ? ' panel-baris-buka' : ''}`} onClick={onKlik}>
        <td className="panel-kolom-no">{nomor}</td>
        <td>
          <div className="panel-no-pesanan">{r.pesanan}</div>
          <div className="panel-sub">{r.channel}</div>
        </td>
        <td className="panel-toko-sel">{r.toko}</td>
        {/* Garis pendek, bukan sel kosong: marketplace belum tentu mengirim
            resi retur, dan kosong terbaca seperti kesalahan tampilan. */}
        <td className="panel-resi">{r.resi || '—'}</td>
        <td><span className="panel-status">{r.status || '—'}</span></td>
        <td className="panel-alasan" title={r.alasan || undefined}>{r.alasan || '—'}</td>
        <td className="panel-tanggal">{tanggal || '—'}</td>
      </tr>
      {buka && (
        <tr className="panel-detail-baris">
          <td colSpan="7">
            <div className="panel-detail">
              <dl className="panel-fakta">
                <div><dt>Barang</dt><dd>{r.item || '—'}</dd></div>
                <div>
                  <dt>Alasan</dt>
                  <dd>
                    {r.alasan || '—'}
                    {r.alasanAsli && <span className="panel-alasan-asli">{r.alasanAsli}</span>}
                  </dd>
                </div>
                <div><dt>Nominal</dt><dd>{rupiah(r.nominal)}</dd></div>
              <div><dt>Resi retur</dt><dd className="panel-resi">{r.resi || '— belum ada resi'}</dd></div>
              </dl>
              {jejak.length === 0 ? (
                <div className="panel-kosong-kecil">
                  Marketplace belum memberikan titik perjalanan untuk retur ini.
                </div>
              ) : (
                <ol className="panel-jejak">
                  {jejak.map((j, i) => (
                    <li key={i} className={i === jejak.length - 1 ? 'panel-jejak-kini' : ''}>
                      <span className="panel-jejak-waktu">{j.waktu}</span>
                      <span>{j.teks}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
