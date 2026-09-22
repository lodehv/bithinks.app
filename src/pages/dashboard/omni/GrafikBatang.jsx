import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// GRAFIK BATANG VERTIKAL — satu panel, satu ukuran, satu sumbu.
//
// TUJUAN
// Menunjukkan pergerakan harian dalam bentuk yang langsung terbaca: batang
// tinggi = hari ramai. Tidak perlu menelusuri garis untuk tahu hari mana yang
// menonjol.
//
// FILOSOFI — SATU PANEL HANYA BOLEH PUNYA SATU SUMBU
// Grafik sebelumnya menaruh dua ukuran di satu bidang: pcs di sumbu kiri, Rupiah
// di sumbu kanan. Keduanya lalu terlihat nyaris berimpit — dan itu BUKAN
// temuan, cuma akibat masing-masing dipaskan ke skalanya sendiri. Dua garis
// yang sebenarnya bentuk yang sama, digambar dua kali.
//
// Yang lebih buruk: saat keduanya benar-benar berpisah — hari ketika barang
// mahal yang laku, bukan barang banyak — pembaca tidak bisa tahu apakah itu
// nyata atau sekadar akibat penskalaan.
//
// Karena itu tiap ukuran dapat panelnya sendiri, berbagi sumbu tanggal yang
// sama. Membandingkan tetap bisa: lihat hari yang sama di dua panel.
//
// DAMPAK
// Kalau suatu hari batang Rupiah tinggi sementara batang pcs pendek, itu
// keterangan sungguhan — hari itu yang laku barang mahal. Pada grafik lama,
// keterangan itu tenggelam.
//
// CATATAN UKURAN
// Lebar batang dibatasi 24px dan tidak pernah memenuhi slotnya — sisa ruangnya
// sengaja jadi udara. Ujung atasnya membulat, pangkalnya siku menempel garis
// dasar, karena pangkal yang membulat membuat nilai kecil terlihat lebih besar
// dari sebenarnya.
// ─────────────────────────────────────────────────────────────────────────────

/** Angka bulat yang enak dibaca untuk puncak sumbu — 1, 2, 2,5, 5, atau 10 × pangkat sepuluh. */
function puncakRapi(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

const GARIS = ["#F0F1F2", "#F0F1F2", "#F0F1F2", "#DDDEE1"]; // yang terbawah sedikit lebih tegas

export default function GrafikBatang({
  data,            // [{ label, nilai }]
  warna,
  judul,
  satuan,          // teks kecil di samping judul
  format,          // (n) => teks untuk sumbu & tooltip
  tinggi = 132,
  labelSetiap = 1, // tampilkan label tanggal tiap ke-berapa
}) {
  const [aktif, setAktif] = useState(null);

  if (!data.length) {
    return (
      <div style={{ padding: "28px 0", textAlign: "center", color: "#8C8F97", fontSize: 13 }}>
        Belum ada pergerakan pada periode ini.
      </div>
    );
  }

  const puncak = puncakRapi(Math.max(1, ...data.map((d) => d.nilai)));

  // Tanggal mana yang diberi label.
  //
  // Ujung kanan SELALU diberi label — orang membaca grafik dari kanan untuk
  // tahu keadaan terakhir. Tapi kalau label berkala sebelumnya terlalu dekat,
  // yang itu dibuang, bukan dibiarkan bertumpuk. Sempat terjadi: "19/08" dan
  // "20/08" menempel jadi "19/0820/08" dan dua-duanya tak terbaca.
  const iAkhir = data.length - 1;
  const berlabel = new Set(data.map((_, i) => i).filter((i) => i % labelSetiap === 0));
  for (const i of [...berlabel]) if (iAkhir - i < labelSetiap * 0.6) berlabel.delete(i);
  berlabel.add(iAkhir);
  const iPuncak = data.reduce((b, d, i) => (d.nilai > data[b].nilai ? i : b), 0);
  const total = data.reduce((a, d) => a + d.nilai, 0);

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Judul menyebut ukurannya, jadi panel satu-deret ini tidak butuh kotak
          legenda. Totalnya ditulis sekali di sini — bukan di setiap batang. */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: warna, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#505258" }}>{judul}</span>
        <span style={{ fontSize: 11, color: "#8C8F97" }}>{satuan}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#292A2E" }}>
          {format(total)}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {/* Sumbu nilai. Empat tingkat saja — lebih dari itu jadi bising. */}
        <div style={{
          width: 44, height: tinggi, position: "relative", flexShrink: 0,
          fontSize: 10, color: "#8C8F97", fontWeight: 600,
        }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{
              position: "absolute", right: 0, top: `${(i / 3) * 100}%`,
              transform: "translateY(-50%)", whiteSpace: "nowrap",
            }}>{format(puncak * (1 - i / 3))}</span>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ position: "relative", height: tinggi, marginTop: 14 }}>
            {/* Garis bantu: tipis, UTUH, satu tingkat dari warna latar.
                Putus-putus menambah bising dan terbaca seperti ambang batas. */}
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                position: "absolute", left: 0, right: 0, top: `${(i / 3) * 100}%`,
                height: 1, background: GARIS[i],
              }} />
            ))}

            {/* Batangnya. Jarak 2px antar-batang dibuat oleh warna latar, bukan
                garis tepi yang digambar mengelilinginya. */}
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "flex-end",
              gap: 2, justifyContent: "space-between",
            }}>
              {data.map((d, i) => {
                const pct = Math.max(d.nilai > 0 ? 1.5 : 0, (d.nilai / puncak) * 100);
                const disorot = aktif === i;
                return (
                  <div key={d.label} onMouseEnter={() => setAktif(i)} onMouseLeave={() => setAktif(null)}
                    style={{
                      flex: 1, maxWidth: 24, height: "100%", display: "flex",
                      alignItems: "flex-end", cursor: "default", position: "relative",
                    }}>
                    <div style={{
                      width: "100%", height: `${pct}%`, background: warna,
                      // Ujung atas membulat, pangkal siku — menempel garis dasar.
                      borderRadius: "4px 4px 0 0",
                      opacity: aktif === null || disorot ? 1 : 0.45,
                      transition: "opacity .12s",
                    }} />
                  </div>
                );
              })}
            </div>

            {/* Label langsung HANYA pada puncaknya. Angka di setiap batang jadi
                kekacauan dan tidak terbaca — tapi satu angka di titik tertinggi
                menjawab pertanyaan yang paling sering muncul.

                Ditaruh tepat di atas batangnya, bukan di atas bidang gambar,
                supaya tidak menabrak judul panel saat batangnya nyaris penuh. */}
            {data[iPuncak].nilai > 0 && (
              <div style={{
                position: "absolute",
                bottom: `${(data[iPuncak].nilai / puncak) * 100}%`,
                left: `${((iPuncak + 0.5) / data.length) * 100}%`,
                transform: "translate(-50%, -3px)",
                fontSize: 10, fontWeight: 700, color: "#505258", whiteSpace: "nowrap",
                pointerEvents: "none",
              }}>{format(data[iPuncak].nilai)}</div>
            )}

            {/* Tooltip: tanggal + nilai, dengan warna deretnya sebagai penanda.
                Teksnya tetap warna tinta — warna deret dibawa oleh titiknya. */}
            {aktif !== null && (
              <div style={{
                position: "absolute", bottom: "100%",
                left: `${((aktif + 0.5) / data.length) * 100}%`,
                transform: "translate(-50%, -6px)",
                background: "#292A2E", color: "#fff", borderRadius: 6,
                padding: "5px 9px", fontSize: 11, whiteSpace: "nowrap",
                pointerEvents: "none", zIndex: 5,
                boxShadow: "0 4px 12px rgba(0,0,0,.18)",
              }}>
                <span style={{
                  display: "inline-block", width: 6, height: 6, borderRadius: 2,
                  background: warna, marginRight: 6,
                }} />
                {data[aktif].label} · <strong>{format(data[aktif].nilai)}</strong>
              </div>
            )}
          </div>

          {/* Sumbu tanggal */}
          <div style={{
            display: "flex", gap: 2, justifyContent: "space-between", marginTop: 6,
            fontSize: 10, color: "#8C8F97", fontWeight: 600,
          }}>
            {data.map((d, i) => (
              <span key={d.label} style={{
                flex: 1, maxWidth: 24, textAlign: "center", whiteSpace: "nowrap",
                overflow: "visible",
              }}>
                {berlabel.has(i) ? d.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
