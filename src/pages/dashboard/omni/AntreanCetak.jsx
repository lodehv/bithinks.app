import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Info } from "lucide-react";
import { omniApi } from "../../../utils/omniApi";
import TombolCetak from "./TombolCetak";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";

// ─────────────────────────────────────────────────────────────────────────────
// ANTREAN CETAK RESI — Tahap 1: MELIHAT SAJA.
//
// Acuan: docs/SPEC-cetak-resi.md
//
// TUJUAN
// Menunjukkan pesanan yang menunggu labelnya dicetak, dikelompokkan per SKU,
// supaya orang gudang bisa mengambil barang sejenis sekali jalan lalu menempel
// labelnya berurutan — bukan bolak-balik rak mengikuti urutan pesanan.
//
// TAHAP 2e — TOMBOL CETAK SUDAH TERPASANG (18 Agustus 2026)
// Tahap 1 sengaja tanpa tombol sama sekali: pemilik toko memakai layar ini
// lebih dulu dan mencocokkan angkanya dengan Seller Center SEBELUM ada yang
// bisa mengubah keadaan di marketplace. Urutan itu yang membuat kesalahan
// angka ketahuan saat belum ada satu pun label tercetak keliru.
//
// Sekarang tombolnya ada, satu per kelompok SKU plus satu untuk seluruh
// tumpukan. Menekannya MENGUBAH KEADAAN di marketplace — ia membuat dokumen
// resi di sana — jadi ia bukan lagi layar baca saja.
//
// FILOSOFI — ANGKANYA TURUN SENDIRI
// Setelah mencetak, antrean dimuat ulang. Keanggotaan antrean diturunkan dari
// catatan cetak, bukan disimpan di kolom tersendiri, jadi yang sudah tercetak
// keluar dengan sendirinya. Inilah yang membuat "tumpukan habis → nol" benar-
// benar terlihat, dan yang membuat klik ganda tidak mencetak dua kali.
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORM = [
  { id: "shopee", label: "Shopee", logo: shopeeLogo },
  { id: "tiktok", label: "TikTok Shop", logo: tiktokLogo },
];

const TAHAP = {
  siap_cetak:      { teks: "Siap dicetak",          warna: "#166534", latar: "#F0FDF4" },
  perlu_atur:      { teks: "Perlu atur pengiriman", warna: "#92400E", latar: "#FFFBEB" },
  perlu_diperiksa: { teks: "Perlu diperiksa",       warna: "#991B1B", latar: "#FEF2F2" },
};

const angka = (n) => Number(n ?? 0).toLocaleString("id-ID");

const tanggal = (iso) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

/** Catatan yang menjelaskan angka, bukan menyembunyikannya. */
function Catatan({ ikon, warna, latar, children }) {
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px",
      background: latar, borderRadius: 8, fontSize: 13, color: warna, marginBottom: 10,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1, lineHeight: 0 }}>{ikon}</span>
      <span>{children}</span>
    </div>
  );
}

function Kelompok({ k, channel, onSelesai }) {
  const [buka, setBuka] = useState(false);
  return (
    <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, marginBottom: 8, background: "#fff" }}>
      {/* Tombol cetak berada DI SEBELAH tombol buka-tutup, bukan di dalamnya.
          <button> bersarang bukan HTML yang sah, dan akibatnya nyata: sebagian
          peramban tidak meneruskan klik ke tombol bagian dalam sama sekali. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        <button
          onClick={() => setBuka((b) => !b)}
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 12, minWidth: 0,
            background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
          }}
        >
          {buka ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{k.nama}</div>
            <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace" }}>{k.sku}</div>
          </div>
          {/* Angka besar = yang akan tercetak, sama persis dengan angka di
              tombol dan dengan jumlah halaman PDF.

              Aturan pemilik toko: 10 pesanan siap kirim berarti 10 resi. Resi
              yang belum tersimpan di sistem kami bukan urusan yang memakai —
              ia diambil sendiri saat tombol ditekan. */}
          <div style={{ textAlign: "right", flexShrink: 0, minWidth: 92 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: k.siapCetak > 0 ? "#111827" : "#9CA3AF" }}>
              {angka(k.siapCetak)}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>siap dicetak</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, minWidth: 96 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#374151" }}>{angka(k.totalQty)}</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>barang diambil</div>
          </div>
        </button>

        <div style={{ flexShrink: 0 }}>
          <TombolCetak channel={channel} sku={k.sku} jumlah={k.siapCetak} onSelesai={onSelesai} />
        </div>
      </div>

      {buka && (
        <div style={{ borderTop: "1px solid #F3F4F6", padding: "4px 16px 12px 46px" }}>
          {k.pesanan.map((p) => {
            const t = TAHAP[p.tahap] ?? TAHAP.perlu_diperiksa;
            return (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                borderBottom: "1px solid #F9FAFB", fontSize: 13,
              }}>
                <span style={{ fontFamily: "monospace", color: "#111827", minWidth: 150 }}>
                  {p.nomorPesanan ?? "—"}
                </span>
                <span style={{ flex: 1, color: "#374151", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.penerima ?? "—"}
                </span>
                <span style={{ color: "#6B7280", flexShrink: 0 }}>{p.qty}×</span>
                <span style={{ color: "#9CA3AF", flexShrink: 0, minWidth: 52 }}>{tanggal(p.orderedAt)}</span>
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 99,
                  background: t.latar, color: t.warna, flexShrink: 0,
                }}>{t.teks}</span>
                {p.adaDiKelompokLain && (
                  <span title="Pesanan ini juga berisi SKU lain — labelnya tetap satu"
                        style={{ fontSize: 11, color: "#6B7280", flexShrink: 0 }}>+SKU lain</span>
                )}
                {p.packageCount > 1 && (
                  <span title="Pesanan ini pecah jadi beberapa paket — label belum lengkap"
                        style={{ fontSize: 11, color: "#991B1B", flexShrink: 0 }}>{p.packageCount} paket</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AntreanCetak() {
  const [channel, setChannel] = useState("shopee");
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(null);

  // Nomor urut permintaan: berpindah tab cepat bisa membuat jawaban lama datang
  // belakangan dan menimpa yang baru — layar lalu menampilkan antrean Shopee
  // padahal tab TikTok yang aktif.
  const nomorTerakhir = useRef(0);

  const ambil = useCallback(async () => {
    const nomor = ++nomorTerakhir.current;
    setMemuat(true);
    setGalat(null);
    try {
      const d = await omniApi.antreanCetak(channel);
      if (nomor === nomorTerakhir.current) setData(d);
    } catch {
      if (nomor === nomorTerakhir.current) setGalat("Gagal memuat antrean cetak.");
    } finally {
      if (nomor === nomorTerakhir.current) setMemuat(false);
    }
  }, [channel]);

  useEffect(() => { ambil(); }, [ambil]);

  return (
    <div style={{ marginTop: 12 }}>
      {/* Dua tab platform. Dipisah karena format label keduanya berbeda, dan
          mencetak satu tumpukan Shopee lalu satu tumpukan TikTok jauh lebih
          sederhana bagi orang di depan printer daripada tumpukan campur. */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {PLATFORM.map((p) => (
          <button key={p.id} onClick={() => setChannel(p.id)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
            borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600,
            border: `1px solid ${channel === p.id ? "#4F46E5" : "#E5E7EB"}`,
            background: channel === p.id ? "#EEF2FF" : "#fff",
            color: channel === p.id ? "#4F46E5" : "#6B7280",
          }}>
            <img src={p.logo} alt="" style={{ width: 18, height: 18, borderRadius: 4 }} />
            {p.label}
          </button>
        ))}
      </div>

      {memuat ? (
        <div style={{ color: "#9CA3AF", fontSize: 13, padding: "20px 2px" }}>Memuat antrean…</div>
      ) : galat ? (
        <div style={{ color: "#991B1B", fontSize: 13, padding: "20px 2px" }}>{galat}</div>
      ) : !data || data.totalLabel === 0 ? (
        <div style={{ color: "#6B7280", fontSize: 14, padding: "28px 2px", textAlign: "center" }}>
          Tidak ada pesanan yang menunggu dicetak. 👍
        </div>
      ) : (
        <>
          <div style={{
            display: "flex", gap: 24, padding: "14px 16px", marginBottom: 12,
            background: "#F9FAFB", borderRadius: 10, border: "1px solid #F3F4F6",
          }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>
                {angka(data.totalLabel)}
              </div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>pesanan di antrean</div>
            </div>
            <div style={{ borderLeft: "1px solid #E5E7EB", paddingLeft: 24, display: "flex", gap: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#166534" }}>{angka(data.totalSiapCetak)}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>siap dicetak</div>
              </div>
              {data.totalPerluAtur > 0 && (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#92400E" }}>{angka(data.totalPerluAtur)}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>perlu atur kirim</div>
                </div>
              )}
              {data.totalPerluDiperiksa > 0 && (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#991B1B" }}>{angka(data.totalPerluDiperiksa)}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>perlu diperiksa</div>
                </div>
              )}
            </div>
            {/* Satu klik untuk seluruh tumpukan platform ini — cara yang sudah
                dipakai admin di Seller Center. Yang dihitung cuma yang siap
                dicetak; yang belum diatur pengirimannya tidak ikut. */}
            <div style={{ marginLeft: "auto", alignSelf: "center" }}>
              <TombolCetak channel={channel} jumlah={data.totalSiapCetak} utama onSelesai={ambil} />
            </div>
          </div>

          {/* Selisih antara total label dan penjumlahan kelompok DIJELASKAN,
              bukan disembunyikan. Angka yang tidak bisa dijelaskan membuat
              orang berhenti memercayai seluruh layar. */}
          {data.pesananLintasKelompok > 0 && (
            <Catatan ikon={<Info size={16} />} warna="#1E40AF" latar="#EFF6FF">
              {angka(data.pesananLintasKelompok)} pesanan berisi lebih dari satu SKU, jadi muncul
              di beberapa kelompok. Labelnya tetap <strong>satu</strong> per pesanan — karena itu
              jumlah tiap kelompok kalau dijumlahkan lebih besar dari {angka(data.totalLabel)}.
            </Catatan>
          )}

          {data.pesananPaketPecah > 0 && (
            <Catatan ikon={<AlertTriangle size={16} />} warna="#991B1B" latar="#FEF2F2">
              {angka(data.pesananPaketPecah)} pesanan pecah jadi beberapa paket. Sistem baru
              menyimpan paket pertama, jadi labelnya belum lengkap — cetak sisanya lewat Seller Center.
            </Catatan>
          )}

          {data.terpotong && (
            <Catatan ikon={<AlertTriangle size={16} />} warna="#991B1B" latar="#FEF2F2">
              Antrean melebihi {angka(data.batas)} pesanan dan ditampilkan sebagian.
              Beri tahu kami — batasnya perlu dinaikkan.
            </Catatan>
          )}

          {data.kelompok.map((k) => (
            <Kelompok key={k.sku} k={k} channel={channel} onSelesai={ambil} />
          ))}

          <div style={{ fontSize: 12, color: "#9CA3AF", padding: "10px 2px", textAlign: "center" }}>
            Resi tercetak keluar dari antrean dengan sendirinya. Yang gagal tetap di sini
            supaya tidak ada yang terlewat.
          </div>
        </>
      )}
    </div>
  );
}
