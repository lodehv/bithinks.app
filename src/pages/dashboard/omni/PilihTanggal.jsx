import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { labelRentang, hariIni, mundur } from "./format-antrean";

// SATU TOMBOL UNTUK SATU PERTANYAAN.
//
// Sebelumnya periode dipilih lewat empat kendali berjajar: kotak tanggal,
// garis pisah, kotak tanggal lagi, lalu tombol "Semua". Keempatnya menjawab
// satu pertanyaan — periode mana yang sedang dilihat — jadi keempatnya
// dikumpulkan ke dalam satu tombol yang menyebutkan jawabannya.
//
// Isi laci tetap dua kotak tanggal bawaan peramban. Kalender buatan sendiri
// gampang salah di zona waktu, dan tanggal yang meleset satu hari di layar
// cetak resi berarti tumpukan kerja yang salah.

const PINTASAN = [
  { id: "hari-ini", teks: "Hari ini",       nilai: () => [hariIni(), hariIni()] },
  { id: "7-hari",   teks: "7 hari terakhir", nilai: () => [mundur(6), hariIni()] },
  { id: "semua",    teks: "Semua tanggal",   nilai: () => ["", ""] },
];

const kotak = {
  padding: "6px 8px", borderRadius: 7, border: "1px solid #E5E7EB",
  fontSize: 13, fontFamily: "inherit", color: "#111827", width: "100%",
};

export default function PilihTanggal({ dari, sampai, onUbah }) {
  const [buka, setBuka] = useState(false);
  const bungkus = useRef(null);

  // Laci menutup saat orang menekan di luarnya atau menekan Esc. Tanpa ini,
  // laci yang tertinggal terbuka menutupi baris pesanan di bawahnya.
  useEffect(() => {
    if (!buka) return undefined;
    const diLuar = (e) => {
      if (bungkus.current && !bungkus.current.contains(e.target)) setBuka(false);
    };
    const esc = (e) => { if (e.key === "Escape") setBuka(false); };
    document.addEventListener("mousedown", diLuar);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", diLuar);
      document.removeEventListener("keydown", esc);
    };
  }, [buka]);

  const disaring = Boolean(dari || sampai);

  return (
    <div ref={bungkus} style={{ position: "relative" }}>
      <button
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px",
          borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
          border: `1px solid ${disaring ? "#C7D2FE" : "#E5E7EB"}`,
          background: disaring ? "#EEF2FF" : "#fff",
          color: disaring ? "#4F46E5" : "#374151",
          fontWeight: 500, fontVariantNumeric: "tabular-nums",
        }}
      >
        <Calendar size={14} />
        {labelRentang(dari, sampai)}
        <ChevronDown size={13} />
      </button>

      {buka && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 20,
          background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10,
          boxShadow: "0 10px 30px -10px rgba(17,24,39,.25)", padding: 14, width: 268,
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PINTASAN.map((p) => (
              <button
                key={p.id}
                onClick={() => { const [a, b] = p.nilai(); onUbah(a, b); setBuka(false); }}
                style={{
                  padding: "5px 10px", borderRadius: 999, cursor: "pointer",
                  border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151",
                  fontSize: 12.5, fontFamily: "inherit", fontWeight: 500,
                }}
              >{p.teks}</button>
            ))}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 12, color: "#6B7280", display: "grid", gap: 4 }}>
              Tanggal pesanan dari
              <input type="date" value={dari} style={kotak}
                     onChange={(e) => onUbah(e.target.value, sampai)} />
            </label>
            <label style={{ fontSize: 12, color: "#6B7280", display: "grid", gap: 4 }}>
              sampai
              <input type="date" value={sampai} style={kotak}
                     onChange={(e) => onUbah(dari, e.target.value)} />
            </label>
          </div>

          <p style={{ margin: 0, fontSize: 11.5, color: "#9CA3AF", lineHeight: 1.45 }}>
            Yang disaring tanggal <strong>pesanan masuk</strong>, bukan tanggal resi dicetak —
            supaya totalnya tetap jadi penanda dan tidak berubah sendiri.
          </p>
        </div>
      )}
    </div>
  );
}
