import { Truck } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Outbound (Barang Keluar) — kerangka layar. Alurnya belum ditetapkan; menunggu
// rancangan dari pemilik produk, jadi layar ini sengaja dibiarkan kosong alih-alih
// diisi tabel contoh yang nantinya harus dibongkar lagi.
//
// Catatan penting supaya tidak salah paham saat alurnya disusun: barang keluar
// SUDAH tercatat otomatis hari ini. Saat pesanan berstatus "dikirim", mesin WMS
// menurunkan Stok Fisik dan menulis mutasi "Keluar" di Buku Besar. Yang belum ada
// adalah layar untuk melihat dan mengelolanya — bukan pencatatannya.
// ─────────────────────────────────────────────────────────────────────────────

export default function WmsOutbound() {
  return (
    <div>
      <div className="omni-toolbar">
        <div>
          <div className="omni-toolbar-title">Outbound — Barang Keluar</div>
          <div className="omni-toolbar-sub">
            Perjalanan barang dari terkunci pesanan sampai benar-benar keluar gudang.
          </div>
        </div>
      </div>

      <div className="omni-empty">
        <div className="omni-empty-icon"><Truck size={22} /></div>
        <h3>Alurnya belum ditetapkan</h3>
        <p>
          Layar ini sengaja masih kosong sampai alur outbound-nya diputuskan, supaya tidak
          diisi tampilan sementara yang nanti harus dibongkar lagi.
        </p>
      </div>

      <div className="wms-note" style={{ marginTop: 16 }}>
        <strong>Yang sudah berjalan sekarang:</strong> barang keluar tercatat otomatis. Saat
        pesanan berstatus <strong>dikirim</strong>, Stok Fisik turun dan mutasi <strong>Keluar</strong> tertulis
        di Buku Besar lengkap dengan nomor pesanan dan jam kejadiannya. Jadi yang belum ada
        adalah layar untuk memantau dan mengelolanya — bukan pencatatannya.
      </div>
    </div>
  );
}
