import { useState } from "react";
import { Printer, Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { omniApi } from "../../../utils/omniApi";

// ─────────────────────────────────────────────────────────────────────────────
// TOMBOL CETAK RESI — Tahap 2e.
//
// TUJUAN
// Satu klik: "cetak 30 resi SKU A" → satu berkas PDF berisi ketiga puluhnya,
// langsung terunduh. Meniru cara kerja yang sudah dipakai admin di Seller
// Center, supaya tidak ada kebiasaan baru yang harus dipelajari.
//
// FILOSOFI — SATU KLIK, TANPA DIALOG KONFIRMASI
// Tidak ada "Anda yakin?". Bukan karena aksinya remeh, tapi karena aksinya
// AMAN DIULANG: daftar pesanannya disusun server dari antrean, dan yang sudah
// tercetak keluar dari antrean. Klik kedua tidak menemukan apa-apa lagi.
// Dialog konfirmasi yang tidak melindungi apa pun cuma melatih orang menekan
// "ya" tanpa membaca.
//
// FILOSOFI — PDF DIBUKA DI TAB BARU, HALAMAN INI TETAP TERBUKA
// Sama seperti Seller Center: resinya muncul di tab sendiri, siap ditekan
// Ctrl+P, sementara antrean tetap ada di tab semula. Versi pertama mengunduh
// berkas — dan itu memaksa orang membuka folder Download dulu, tiap kali.
//
// Tabnya dibuka SAAT KLIK, bukan setelah jawabannya datang. Peramban memblokir
// `window.open` yang dipanggil setelah `await`, karena tidak lagi terhitung
// sebagai akibat langsung dari klik orang. Kalau tetap terblokir, berkasnya
// diunduh sebagai jalan mundur — bukan hilang.
//
// FILOSOFI — YANG GAGAL DITUNJUKKAN, BUKAN DISEMBUNYIKAN
// Panel hasil selalu muncul, juga saat semuanya berhasil. Kegagalan yang cuma
// tampil sebagai toast merah sekejap adalah persis keluhan yang fitur ini
// dibangun untuk menghilangkan: resi yang tidak masuk pantauan.
//
// Tiga keadaan dibedakan karena TINDAKANNYA berbeda bagi pemilik toko:
//   tertunda  tidak perlu apa-apa, akan dicoba lagi
//   dilewati  perlu atur pengiriman dulu
//   gagal     perlu dilihat, ada yang harus dibereskan
// ─────────────────────────────────────────────────────────────────────────────

const angka = (n) => Number(n ?? 0).toLocaleString("id-ID");

/** PDF base64 → alamat blob yang bisa dibuka peramban. */
function keAlamatPdf(base64) {
  const biner = atob(base64);
  const byte = new Uint8Array(biner.length);
  for (let i = 0; i < biner.length; i++) byte[i] = biner.charCodeAt(i);
  return URL.createObjectURL(new Blob([byte], { type: "application/pdf" }));
}

/** Jalan mundur kalau tab baru diblokir peramban: unduh sebagai berkas. */
function unduhPdf(url, namaBerkas) {
  const a = document.createElement("a");
  a.href = url;
  a.download = namaBerkas;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Ganti isi tab dengan HTML. Tab yang sudah ditutup orangnya diabaikan. */
function tulisHtml(tab, html) {
  if (!tab) return;
  try {
    tab.document.open();
    tab.document.write(html);
    tab.document.close();
  } catch {
    // Tab sudah ditutup — tidak apa-apa.
  }
}

const lolos = (t) =>
  String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/**
 * Alasan kegagalan, dikelompokkan menurut kalimatnya.
 *
 * Dua puluh baris identik tidak memberi tahu apa pun selain bahwa daftarnya
 * panjang. Yang berguna: kalimatnya, dan berapa pesanan yang mengalaminya.
 */
function kelompokAlasan(d) {
  const peta = new Map();
  for (const g of d.gagal ?? []) {
    const k = g.pesan || g.kode || "Tidak diketahui";
    peta.set(k, (peta.get(k) ?? 0) + 1);
  }
  for (const x of d.dilewati ?? []) {
    const k = x.alasan || "Dilewati";
    peta.set(k, (peta.get(k) ?? 0) + 1);
  }
  return [...peta.entries()].sort((a, b) => b[1] - a[1]);
}

/**
 * Halaman pembungkus di tab resi.
 *
 * KENAPA PDF-NYA TIDAK LANGSUNG DIBUKA
 * Karena laporan kegagalannya jadi tidak terlihat. Kejadian nyata 19 Agustus
 * 2026: tombol menyebut 16, PDF berisi 12 halaman, dan empat sisanya memang
 * ditolak Shopee dengan alasan yang sudah tercatat rapi — di panel hasil, di
 * TAB SEBELAH, yang tidak dilihat siapa pun karena orangnya sedang menatap
 * PDF. Sistem sudah melaporkan; laporannya yang salah tempat.
 *
 * Sekarang ringkasannya menempel di atas PDF-nya sendiri: berapa yang tercetak,
 * berapa halaman, dan kalau ada yang gagal — berapa dan kenapa.
 */
function halamanResi(d, urlPdf, judul) {
  const alasan = kelompokAlasan(d);
  const adaMasalah = alasan.length > 0;
  const tercetak = d.jumlahTercetak ?? 0;
  const halaman = typeof d.halamanPdf === "number" ? d.halamanPdf : null;
  const diminta = tercetak + alasan.reduce((n, [, jml]) => n + jml, 0);

  const baris = adaMasalah
    ? `<div class="masalah">
         <strong>${diminta - tercetak} dari ${diminta} pesanan tidak tercetak.</strong>
         Pesanannya TETAP di antrean — tidak hilang, dan bisa dicoba lagi.
         <ul>${alasan.map(([k, n]) => `<li><b>${n}×</b> ${lolos(k)}</li>`).join("")}</ul>
       </div>`
    : `<div class="aman">Semua pesanan yang diminta tercetak.</div>`;

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>${lolos(judul)}</title>
<style>
  *{box-sizing:border-box} body{margin:0;font:14px/1.6 system-ui,sans-serif;color:#111827;height:100vh;display:flex;flex-direction:column}
  header{padding:12px 18px;border-bottom:1px solid #E5E7EB;background:#fff;flex:0 0 auto}
  .judul{font-weight:600;font-size:15px}
  .angka{color:#4B5563;margin-top:2px}
  .masalah{margin-top:8px;padding:10px 12px;border-radius:8px;background:#FFFBEB;border:1px solid #FDE68A;color:#78350F}
  .masalah ul{margin:6px 0 0;padding-left:18px}
  .aman{margin-top:8px;color:#166534}
  iframe{flex:1 1 auto;width:100%;border:0}
</style></head><body>
<header>
  <div class="judul">${lolos(judul)}</div>
  <div class="angka"><b>${tercetak}</b> resi tercetak${halaman === null ? "" : ` · <b>${halaman}</b> halaman`}</div>
  ${baris}
</header>
<iframe src="${urlPdf}" title="Resi"></iframe>
</body></html>`;
}

/** Halaman untuk keadaan "tidak ada satu pun yang tercetak". */
function halamanKosong(d, judul) {
  const alasan = kelompokAlasan(d);
  const isi = alasan.length
    ? `<ul>${alasan.map(([k, n]) => `<li><b>${n}×</b> ${lolos(k)}</li>`).join("")}</ul>`
    : `<p>Marketplace masih menyiapkan dokumennya. Coba lagi sebentar lagi — pesanannya tetap di antrean.</p>`;

  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${lolos(judul)}</title>
<style>body{margin:0;font:15px/1.7 system-ui,sans-serif;color:#111827;padding:32px;max-width:720px}
h1{font-size:17px;margin:0 0 4px} p,ul{color:#4B5563} ul{padding-left:20px}</style></head><body>
<h1>Tidak ada resi yang tercetak</h1>
<p>Pesanannya <b>tetap di antrean</b> — tidak ada yang hilang.</p>
${isi}
</body></html>`;
}

function namaBerkas(channel, sku) {
  const tgl = new Date().toISOString().slice(0, 10);
  const bagian = sku ? sku.replace(/[^\w.-]+/g, "-").slice(0, 40) : "semua";
  return `resi-${channel}-${bagian}-${tgl}.pdf`;
}

function Baris({ ikon, warna, latar, judul, isi }) {
  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px",
      background: latar, borderRadius: 8, fontSize: 13, color: warna, marginTop: 6,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1, lineHeight: 0 }}>{ikon}</span>
      <span><strong>{judul}</strong>{isi ? ` — ${isi}` : ""}</span>
    </div>
  );
}

/**
 * Panel hasil satu aksi cetak.
 *
 * Alasan kegagalan dikelompokkan menurut kalimatnya, bukan didaftar satu per
 * satu: dua puluh baris "Status pesanan belum mendukung cetak label" tidak
 * memberi tahu apa pun selain bahwa daftarnya panjang.
 */
function Hasil({ h, channel, onUlang }) {
  const alasanGagal = Object.entries(
    (h.gagal ?? []).reduce((acc, g) => {
      const k = g.pesan || g.kode || "Tidak diketahui";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  );
  const alasanDilewati = Object.entries(
    (h.dilewati ?? []).reduce((acc, d) => {
      acc[d.alasan] = (acc[d.alasan] ?? 0) + 1;
      return acc;
    }, {}),
  );

  return (
    <div style={{
      border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px",
      marginBottom: 10, background: "#fff",
    }}>
      {h.jumlahTercetak > 0 ? (
        <Baris
          ikon={<CheckCircle2 size={16} />} warna="#166534" latar="#F0FDF4"
          judul={`${angka(h.jumlahTercetak)} resi tercetak`}
          isi={
            // Jumlah halaman disebut apa adanya, dihitung dari berkasnya
            // sendiri. Tiga salah paham berturut-turut lahir dari menghitung
            // halaman PDF secara manual lalu membandingkannya dengan angka
            // tombol dari klik yang berbeda.
            typeof h.halamanPdf === "number"
              ? `${angka(h.halamanPdf)} halaman · terbuka di tab baru, tekan Ctrl+P di sana`
              : "terbuka di tab baru — tekan Ctrl+P di sana"
          }
        />
      ) : (
        <Baris
          ikon={<AlertTriangle size={16} />} warna="#92400E" latar="#FFFBEB"
          judul="Tidak ada resi yang tercetak" isi={null}
        />
      )}

      {h.tertunda > 0 && (
        <Baris
          ikon={<Clock size={16} />} warna="#1E40AF" latar="#EFF6FF"
          judul={`${angka(h.tertunda)} masih disiapkan ${channel === "shopee" ? "Shopee" : "TikTok"}`}
          isi="tidak perlu apa-apa, tetap di antrean — coba lagi sebentar lagi"
        />
      )}

      {alasanDilewati.map(([alasan, n]) => (
        <Baris key={alasan} ikon={<AlertTriangle size={16} />} warna="#92400E" latar="#FFFBEB"
               judul={`${angka(n)} dilewati`} isi={alasan} />
      ))}

      {alasanGagal.map(([alasan, n]) => (
        <Baris key={alasan} ikon={<AlertTriangle size={16} />} warna="#991B1B" latar="#FEF2F2"
               judul={`${angka(n)} gagal`} isi={alasan} />
      ))}

      <button onClick={onUlang} style={{
        marginTop: 10, background: "none", border: "none", padding: 0,
        color: "#4F46E5", fontSize: 13, cursor: "pointer", fontWeight: 600,
      }}>
        Tutup
      </button>
    </div>
  );
}

/**
 * Tombol cetak untuk satu tumpukan.
 *
 * `sku` kosong berarti seluruh antrean platform ini. Yang dikirim ke server
 * cuma channel dan sku — daftar pesanannya disusun ulang di sana, memakai
 * penyaring yang sama dengan yang menghasilkan angka di layar ini.
 */
export default function TombolCetak({ channel, sku, jumlah, utama = false, onSelesai }) {
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState(null);
  const [galat, setGalat] = useState(null);

  async function cetak(e) {
    e?.stopPropagation();
    setSibuk(true);
    setGalat(null);

    // Dibuka sekarang, diisi belakangan — lihat catatan di kepala berkas.
    const tab = window.open("", "_blank");
    if (tab) tab.document.write("<p style='font:14px sans-serif;padding:24px'>Menyiapkan resi…</p>");

    try {
      const d = await omniApi.cetakLabel({ channel, sku: sku ?? undefined });

      const judul = `Resi ${channel === "tiktok" ? "TikTok" : "Shopee"}${sku ? ` — ${sku}` : ""}`;

      if (d.pdfBase64) {
        const url = keAlamatPdf(d.pdfBase64);
        if (tab) tulisHtml(tab, halamanResi(d, url, judul));
        else unduhPdf(url, namaBerkas(channel, sku));
        // Dilepas belakangan: mencabutnya seketika membuat tab yang baru
        // dibuka menampilkan halaman kosong.
        setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
      } else {
        // Tidak ada yang tercetak. Tabnya TIDAK ditutup diam-diam: tab yang
        // muncul lalu lenyap tanpa penjelasan membuat orang mengira sistemnya
        // rusak, padahal marketplace-nya yang menolak dan alasannya ada.
        tulisHtml(tab, halamanKosong(d, judul));
      }

      setHasil(d);
      // Antreannya dimuat ulang supaya angkanya turun. Inilah yang membuat
      // "tumpukan habis → nol" benar-benar terlihat.
      onSelesai?.();
    } catch (err) {
      tulisHtml(tab, halamanKosong({ gagal: [], dilewati: [] }, 'Cetak resi gagal'));
      setGalat(
        err?.response?.status === 402
          ? "Langganan sedang tidak aktif, jadi cetak resi dimatikan."
          : err?.code === "ECONNABORTED"
            ? "Terlalu lama menunggu marketplace. Sebagian resi mungkin sudah terbuat — muat ulang halaman dan periksa antreannya sebelum mencoba lagi."
            : "Gagal menghubungi marketplace. Coba lagi sebentar lagi.",
      );
    } finally {
      setSibuk(false);
    }
  }

  if (hasil) return <Hasil h={hasil} channel={channel} onUlang={() => setHasil(null)} />;

  return (
    <>
      <button
        onClick={cetak}
        disabled={sibuk || jumlah === 0}
        title={jumlah === 0 ? "Tidak ada yang perlu dicetak" : undefined}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: utama ? "10px 18px" : "7px 12px",
          borderRadius: 8, border: "none",
          fontSize: utama ? 14 : 13, fontWeight: 600,
          cursor: sibuk || jumlah === 0 ? "not-allowed" : "pointer",
          background: jumlah === 0 ? "#F3F4F6" : "#4F46E5",
          color: jumlah === 0 ? "#9CA3AF" : "#fff",
          opacity: sibuk ? 0.7 : 1,
          flexShrink: 0,
        }}
      >
        {sibuk ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
        {sibuk ? "Menyiapkan…" : `Cetak ${angka(jumlah)} resi`}
      </button>

      {galat && (
        <div style={{ fontSize: 12, color: "#991B1B", marginTop: 6 }}>{galat}</div>
      )}
    </>
  );
}
