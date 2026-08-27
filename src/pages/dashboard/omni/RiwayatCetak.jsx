import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Printer } from "lucide-react";
import { omniApi } from "../../../utils/omniApi";
import { angka, jamSingkat } from "./format-antrean";

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
    <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, marginBottom: 8, background: "#fff" }}>
      <button
        onClick={bukaTutup}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
        }}
      >
        {buka ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <Printer size={16} style={{ color: "#6B7280", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{jamSingkat(s.waktu)}</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>satu kali cetak</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, minWidth: 92 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#166534", fontVariantNumeric: "tabular-nums" }}>
            {angka(s.tercetak)}
          </div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>resi tercetak</div>
        </div>
        {s.gagal > 0 && (
          <div style={{ textAlign: "right", flexShrink: 0, minWidth: 72 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#991B1B", fontVariantNumeric: "tabular-nums" }}>
              {angka(s.gagal)}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>gagal</div>
          </div>
        )}
      </button>

      {buka && (
        <div style={{ borderTop: "1px solid #F3F4F6", padding: "4px 16px 12px 46px" }}>
          {memuat && <div style={{ fontSize: 13, color: "#9CA3AF", padding: "10px 0" }}>Memuat isinya…</div>}
          {isi?.isi?.map((b, i) => (
            <div key={`${b.nomorPesanan}-${i}`} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
              borderBottom: "1px solid #F9FAFB", fontSize: 13,
            }}>
              <span style={{ color: "#111827", minWidth: 150, letterSpacing: ".02em", fontVariantNumeric: "tabular-nums" }}>
                {b.nomorPesanan ?? "—"}
              </span>
              <span style={{ flex: 1, color: "#374151", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {b.penerima ?? "—"}
              </span>
              {b.ulangKe > 1 && (
                <span style={{ fontSize: 11, color: "#6B7280", flexShrink: 0 }}>cetakan ke-{b.ulangKe}</span>
              )}
              <span
                // Kode dan kalimat marketplace dibawa apa adanya — alasan harus
                // asli, bukan karangan kita.
                title={[b.kode, b.pesan].filter(Boolean).join(" · ") || undefined}
                style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 99, flexShrink: 0,
                  cursor: b.kode ? "help" : undefined,
                  background: b.hasil === "tercetak" ? "#F0FDF4" : "#FEF2F2",
                  color: b.hasil === "tercetak" ? "#166534" : "#991B1B",
                }}
              >{b.hasil === "tercetak" ? "Tercetak" : (b.kode || "Gagal")}</span>
            </div>
          ))}
          {isi?.terpotong && (
            <div style={{ fontSize: 12, color: "#92400E", paddingTop: 8 }}>
              Isinya terlalu banyak dan ditampilkan sebagian.
            </div>
          )}
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
        paddingBottom: 20, borderBottom: "1px solid #F3F4F6", marginBottom: 24,
      }}>
        <div style={{ display: "inline-flex", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
          {PLATFORM.map((p, i) => {
            const aktif = p.id === channel;
            return (
              <button
                key={p.id}
                onClick={() => setChannel(p.id)}
                aria-pressed={aktif}
                style={{
                  padding: "7px 12px", fontSize: 13, cursor: "pointer", border: "none",
                  borderLeft: i ? "1px solid #E5E7EB" : "none",
                  fontWeight: aktif ? 600 : 500, fontFamily: "inherit",
                  background: aktif ? "#fff" : "#F9FAFB",
                  color: aktif ? "#111827" : "#6B7280",
                  boxShadow: aktif ? "inset 0 -2px 0 #4F46E5" : "none",
                }}
              >{p.label}</button>
            );
          })}
        </div>
        <span style={{ fontSize: 13, color: "#6B7280" }}>
          Tiap baris satu kali tekan tombol cetak. Angkanya tidak berubah.
        </span>
      </div>

      {memuat && !data ? (
        <div style={{ color: "#9CA3AF", fontSize: 13, padding: "20px 2px" }}>Memuat riwayat…</div>
      ) : !data?.sesi?.length ? (
        <div style={{ color: "#6B7280", fontSize: 14, padding: "28px 2px", textAlign: "center" }}>
          Belum ada riwayat cetak untuk platform ini.
        </div>
      ) : (
        <>
          {data.sesi.map((s) => <Sesi key={s.sesiId} channel={channel} s={s} />)}
          {data.terpotong && (
            <div style={{ fontSize: 12, color: "#92400E", padding: "10px 2px", textAlign: "center" }}>
              Riwayatnya lebih panjang dari yang ditampilkan.
            </div>
          )}
        </>
      )}
    </div>
  );
}
