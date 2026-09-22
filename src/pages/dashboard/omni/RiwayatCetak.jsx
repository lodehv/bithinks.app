import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Printer } from "lucide-react";
import { omniApi } from "../../../utils/omniApi";
import { AlertTriangle } from "lucide-react";
import { angka, jamSingkat, tanggal } from "./format-antrean";

// ─────────────────────────────────────────────────────────────────────────────
// RIWAYAT CETAK — tiap baris satu kali tekan tombol.
//
// Aturan pemilik toko 27 Agustus 2026:
//
//   "misal hari ini saya cetak jam 12.30 sebanyak 30 resi, kalau saya buka jam
//    1 itu riwayatnya ada resi terakhir dicetak jam 12.30 sebanyak 30 — dan ini
//    tidak boleh berubah."
//
// KENAPA BERDIRI SENDIRI. Angka "sudah cetak" di antrean adalah PENJUMLAHAN:
// ia bertambah tiap ada cetakan baru. Jadi tidak ada cara melihat "jam 12.30
// tercetak 30" — yang terlihat cuma total yang terus bergerak.
//
// Antrean diturunkan dari keadaan SEKARANG dan memang harus berubah. Riwayat
// adalah catatan masa lalu dan tidak boleh berubah. Menggabungkan keduanya di
// satu angka membuat keduanya berhenti bisa dipercaya.
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORM = [
  { id: "shopee", label: "Shopee" },
  { id: "tiktok", label: "TikTok Shop" },
];

function Sesi({ channel, s }) {
  const [buka, setBuka] = useState(false);
  const [isi, setIsi] = useState(null);
  const [memuat, setMemuat] = useState(false);

  async function bukaTutup() {
    const mau = !buka;
    setBuka(mau);
    if (!mau || isi) return;
    setMemuat(true);
    try {
      setIsi(await omniApi.riwayatCetak(channel, { sesi: s.sesiId }));
    } catch {
      setIsi({ isi: [] });
    } finally {
      setMemuat(false);
    }
  }

  return (
    <div style={{ border: "1px solid #DCDFE4", borderRadius: 10, marginBottom: 8, background: "#fff" }}>
      <button
        onClick={bukaTutup}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
        }}
      >
        {buka ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <Printer size={16} style={{ color: "#626F86", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#172B4D" }}>{jamSingkat(s.waktu)}</div>
          <div style={{ fontSize: 12, color: "#626F86" }}>satu kali cetak</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, minWidth: 92 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#216E4E", fontVariantNumeric: "tabular-nums" }}>
            {angka(s.tercetak)}
          </div>
          <div style={{ fontSize: 12, color: "#626F86" }}>resi tercetak</div>
        </div>
        {s.gagal > 0 && (
          <div style={{ textAlign: "right", flexShrink: 0, minWidth: 72 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#AE2E24", fontVariantNumeric: "tabular-nums" }}>
              {angka(s.gagal)}
            </div>
            <div style={{ fontSize: 12, color: "#626F86" }}>gagal</div>
          </div>
        )}
      </button>

      {buka && (
        <div style={{ borderTop: "1px solid #F1F2F4", padding: "4px 16px 12px 46px" }}>
          {memuat && <div style={{ fontSize: 13, color: "#8590A2", padding: "10px 0" }}>Memuat isinya…</div>}
          {isi?.isi?.map((b, i) => (
            <div key={`${b.nomorPesanan}-${i}`} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
              borderBottom: "1px solid #F7F8F9", fontSize: 13,
            }}>
              <span style={{ color: "#172B4D", minWidth: 150, letterSpacing: ".02em", fontVariantNumeric: "tabular-nums" }}>
                {b.nomorPesanan ?? "—"}
              </span>
              <span style={{ flex: 1, color: "#44546F", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {b.penerima ?? "—"}
              </span>
              {b.ulangKe > 1 && (
                <span style={{ fontSize: 11, color: "#626F86", flexShrink: 0 }}>cetakan ke-{b.ulangKe}</span>
              )}
              <span
                // Kode dan kalimat marketplace dibawa apa adanya — alasan harus
                // asli, bukan karangan kita.
                title={[b.kode, b.pesan].filter(Boolean).join(" · ") || undefined}
                style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 99, flexShrink: 0,
                  cursor: b.kode ? "help" : undefined,
                  background: b.hasil === "tercetak" ? "#DFFCF0" : "#FFECEB",
                  color: b.hasil === "tercetak" ? "#216E4E" : "#AE2E24",
                }}
              >{b.hasil === "tercetak" ? "Tercetak" : (b.kode || "Gagal")}</span>
            </div>
          ))}
          {isi?.terpotong && (
            <div style={{ fontSize: 12, color: "#A54800", paddingTop: 8 }}>
              Isinya terlalu banyak dan ditampilkan sebagian.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PEMERIKSAAN: ADA YANG TERLEWAT TIDAK?
//
// Antrean cetak diturunkan dari keadaan SEKARANG — jadi pesanan yang sempat
// siap cetak lalu berpindah jadi "dikirim" HILANG dari layar, termasuk yang
// tidak pernah dicetak dari sini. Setelah itu tidak ada jejak apa pun.
//
// Itu membuat aturan "toleransi nol untuk resi yang hilang" mustahil
// ditegakkan: bukan karena angkanya salah, tapi karena tidak ada tempat
// bertanya. Bagian ini tempatnya.
// ─────────────────────────────────────────────────────────────────────────────
function Terlewat({ channel }) {
  const [d, setD] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [buka, setBuka] = useState(false);

  // Pemanggilannya dibungkus useCallback, bukan ditaruh langsung di dalam
  // effect: memanggil setState di badan effect memicu render beruntun, dan
  // aturan lint proyek ini menolaknya. Pola yang sama dipakai AntreanCetak.
  const periksa = useCallback(async () => {
    setMemuat(true);
    try {
      setD(await omniApi.lewatTanpaCetak(channel));
    } catch {
      setD(null);
    } finally {
      setMemuat(false);
    }
  }, [channel]);

  useEffect(() => { periksa(); }, [periksa]);

  if (memuat) {
    return <div style={{ fontSize: 13, color: "#8590A2", marginBottom: 16 }}>Memeriksa yang terlewat…</div>;
  }
  if (!d) return null;

  // NOL BUKAN KEKOSONGAN — ia jawaban, dan jawaban yang paling sering
  // dibutuhkan. Menyembunyikannya membuat orang harus memeriksa sendiri.
  if (d.jumlah === 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 20,
        padding: "10px 14px", borderRadius: 10, background: "#DFFCF0",
        border: "1px solid #BAF3DB", color: "#216E4E", fontSize: 13,
      }}>
        <strong>Tidak ada resi yang terlewat</strong>
        <span style={{ color: "#216E4E" }}>· {d.hari} hari terakhir</span>
      </div>
    );
  }

  return (
    <div style={{
      marginBottom: 20, padding: "12px 14px", borderRadius: 10,
      background: "#FFF7D6", border: "1px solid #F8E6A0", color: "#A54800",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>{angka(d.jumlah)} pesanan</strong> sempat siap dicetak lalu terkirim tanpa
          pernah dicetak dari sini, {d.hari} hari terakhir.
          {d.jendelaTersempitMenit !== null && (
            <> Yang tersingkat cuma <strong>{angka(d.jendelaTersempitMenit)} menit</strong>.</>
          )}
        </span>
        <button
          onClick={() => setBuka((b) => !b)}
          style={{
            marginLeft: "auto", padding: "3px 10px", borderRadius: 999, cursor: "pointer",
            border: "1px solid #F8E6A0", background: "#fff", color: "#A54800",
            fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", flexShrink: 0,
          }}
        >{buka ? "Sembunyikan" : "Lihat nomornya"}</button>
      </div>

      {buka && (
        <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
          {d.daftar.map((b) => (
            <div key={b.nomorPesanan} style={{ display: "flex", gap: 10, fontSize: 12.5, flexWrap: "wrap" }}>
              <span style={{ letterSpacing: ".02em", minWidth: 140 }}>{b.nomorPesanan}</span>
              <span style={{ letterSpacing: ".02em", color: "#A54800", minWidth: 150 }}>{b.resi ?? "—"}</span>
              <span style={{ color: "#A54800" }}>{b.toko}</span>
              {b.jendelaMenit !== null && (
                <span style={{ color: "#A54800" }}>jendela {angka(b.jendelaMenit)} menit</span>
              )}
              {b.siapPada && <span style={{ color: "#A54800" }}>siap {tanggal(b.siapPada)}</span>}
            </div>
          ))}
          {d.terpotong && <div style={{ marginTop: 6 }}>Daftarnya lebih panjang dari yang ditampilkan.</div>}
        </div>
      )}
    </div>
  );
}

export default function RiwayatCetak() {
  const [channel, setChannel] = useState("shopee");
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);

  const ambil = useCallback(async () => {
    setMemuat(true);
    try {
      setData(await omniApi.riwayatCetak(channel));
    } catch {
      setData(null);
    } finally {
      setMemuat(false);
    }
  }, [channel]);

  useEffect(() => { ambil(); }, [ambil]);

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        paddingBottom: 20, borderBottom: "1px solid #F1F2F4", marginBottom: 24,
      }}>
        <div style={{ display: "inline-flex", border: "1px solid #DCDFE4", borderRadius: 8, overflow: "hidden" }}>
          {PLATFORM.map((p, i) => {
            const aktif = p.id === channel;
            return (
              <button
                key={p.id}
                onClick={() => setChannel(p.id)}
                aria-pressed={aktif}
                style={{
                  padding: "7px 12px", fontSize: 13, cursor: "pointer", border: "none",
                  borderLeft: i ? "1px solid #DCDFE4" : "none",
                  fontWeight: aktif ? 600 : 500, fontFamily: "inherit",
                  background: aktif ? "#fff" : "#F7F8F9",
                  color: aktif ? "#172B4D" : "#626F86",
                  boxShadow: aktif ? "inset 0 -2px 0 #0C66E4" : "none",
                }}
              >{p.label}</button>
            );
          })}
        </div>
        <span style={{ fontSize: 13, color: "#626F86" }}>
          Tiap baris satu kali tekan tombol cetak. Angkanya tidak berubah.
        </span>
      </div>

      <Terlewat channel={channel} />

      {memuat && !data ? (
        <div style={{ color: "#8590A2", fontSize: 13, padding: "20px 2px" }}>Memuat riwayat…</div>
      ) : !data?.sesi?.length ? (
        <div style={{ color: "#626F86", fontSize: 14, padding: "28px 2px", textAlign: "center" }}>
          Belum ada riwayat cetak untuk platform ini.
        </div>
      ) : (
        <>
          {data.sesi.map((s) => <Sesi key={s.sesiId} channel={channel} s={s} />)}
          {data.terpotong && (
            <div style={{ fontSize: 12, color: "#A54800", padding: "10px 2px", textAlign: "center" }}>
              Riwayatnya lebih panjang dari yang ditampilkan.
            </div>
          )}
        </>
      )}
    </div>
  );
}
