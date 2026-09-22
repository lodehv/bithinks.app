import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import "./DashboardHome.css";
import {
  Store, ClipboardList, TrendingUp, Boxes, Package,
  RefreshCw, AlertTriangle, Info,
} from "lucide-react";
import { omniApi } from "../../utils/omniApi";
import { channelMeta } from "./omni/channels";
import { formatDate, formatDateLong } from "../../utils/datetime";

const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

// ─── Stat card (clickable) ────────────────────────────────────────────────────
function StatCard({ label, value, sub, subClass, icon: Icon, iconClass, color, onClick, children }) {
  return (
    <div className="stat-card" style={onClick ? { cursor: "pointer" } : undefined} onClick={onClick}>
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon ${iconClass}`}><Icon size={16} strokeWidth={1.8} /></div>
      </div>
      <div className={`stat-card-value ${color ?? ""}`}>{value}</div>
      {sub && <div className={`stat-card-sub ${subClass ?? ""}`}>{sub}</div>}
      {children}
    </div>
  );
}

// ─── Satu baris rincian antrean, sekaligus pintasan ke tumpukannya ──────────
// Menekan angkanya membuka halaman Pesanan tepat di tab itu. Tanpa ini, kartu
// cuma memberi tahu ada pekerjaan tanpa memberi jalan mengerjakannya.
function BarisAntrian({ label, nilai, onClick, redup, peringatan }) {
  return (
    <button
      type="button"
      className={`antrian-baris ${redup ? "redup" : ""} ${peringatan ? "peringatan" : ""}`}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      <span className="antrian-baris-label">{label}</span>
      <span className="antrian-baris-nilai">{Number(nilai || 0).toLocaleString("id-ID")}</span>
    </button>
  );
}

// ─── Trial banner (hanya saat status trial) ──────────────────────────────────
function TrialBanner({ tenant }) {
  if (!tenant || tenant.status !== "trial") return null;
  const daysLeft = tenant.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(tenant.trialEndsAt) - Date.now()) / 86_400_000))
    : null;
  return (
    <div className="trial-banner">
      <Info size={16} className="trial-banner-icon" strokeWidth={2} />
      <span>
        <strong>Free Trial</strong> — paket <strong>{tenant.plan}</strong>
        {daysLeft !== null ? <> tersisa <strong>{daysLeft} hari</strong>.</> : <> sedang aktif.</>}{" "}
        Aktifkan langganan agar fitur tidak terkunci.
      </span>
    </div>
  );
}

export default function DashboardHome({ onMenuClick, onBukaPesanan }) {
  const { user, tenant } = useAppContext();
  const [data, setData] = useState(null); // { stores, products, ringkasan }

  // Angka pesanan diambil sebagai RINGKASAN, bukan sebagai daftar.
  //
  // Sampai 17 Agustus 2026 baris ini memanggil listOrders() lalu menjumlahkan
  // sendiri di bawah. Masalahnya, server hanya mengirim 200 pesanan terbaru —
  // jadi "Omset Pesanan" yang terpampang di halaman pertama tiap pagi
  // sebenarnya jumlah 200 pesanan terakhir dari 18.758 yang ada. Bukan kurang
  // lengkap: salah, dan selalu jauh lebih kecil.
  //
  // Sekarang yang menjumlahkan adalah basis data, karena hanya ia yang melihat
  // semuanya. Sekalian lebih ringan: dua kueri agregat menggantikan pengiriman
  // 200 pesanan lengkap beserta itemnya ke browser hanya untuk dijumlahkan.
  const RINGKASAN_KOSONG = {
    tanggal: null,
    hariIni: { pesanan: 0, omset: 0, perChannel: [] },
    antrian: {
      perluDikerjakan: 0, perluAtur: 0, siapCetak: 0,
      menungguPembayaran: 0, perluDiperiksa: 0, tertuaWib: null,
    },
  };

  useEffect(() => {
    Promise.all([
      omniApi.listStores().catch(() => []),
      omniApi.listProducts().catch(() => []),
      omniApi.ordersSummary().catch(() => RINGKASAN_KOSONG),
    ]).then(([stores, products, ringkasan]) => setData({ stores, products, ringkasan }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "–";
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Selamat pagi" : h < 17 ? "Selamat siang" : "Selamat malam";
  })();
  const today = formatDateLong(new Date());

  // ─── Derivasi metrik dari data nyata ───
  const stores   = data?.stores   ?? [];
  const products = data?.products ?? [];
  const ringkasan = data?.ringkasan ?? RINGKASAN_KOSONG;
  const hariIni   = ringkasan.hariIni ?? RINGKASAN_KOSONG.hariIni;
  const antrian   = ringkasan.antrian ?? RINGKASAN_KOSONG.antrian;

  const connected    = stores.filter((s) => s.status === "connected");
  const perluSinkron = products.filter((p) => !p.fullySynced).length;
  const totalStok   = products.reduce((a, p) => a + Number(p.masterStock || 0), 0);
  const lowStock    = products
    .filter((p) => Number(p.masterStock) <= 8)
    .map((p) => ({ ...p, level: Number(p.masterStock) <= 3 ? "kritis" : "menipis" }));

  // Penjualan per channel HARI INI — dikelompokkan dan diurutkan server.
  const perChannel = hariIni.perChannel ?? [];
  const maxChannel = Math.max(1, ...perChannel.map((c) => c.total));

  const angka = (n) => Number(n || 0).toLocaleString("id-ID");

  // "2026-08-14" → "14 Agu". Dipakai menandai umur pesanan tertua di antrean.
  const tanggalPendek = (iso) => (iso ? formatDate(iso) : null);
  const tertua = tanggalPendek(antrian.tertuaWib);
  const menggantung = antrian.tertuaWib && antrian.tertuaWib < (ringkasan.tanggal ?? "");

  return (
    <div>
      <div className="dash-header">
        <h1>{greeting}, {firstName} 👋</h1>
        <p>Ringkasan operasional · {today}</p>
      </div>

      <TrialBanner tenant={tenant} />

      {data === null ? (
        <div style={{ color: "#8C8F97", fontSize: 13, padding: "24px 2px" }}>Memuat ringkasan…</div>
      ) : (
        <>
          {/* ─── Kartu ringkasan selaras menu ─── */}
          <div className="dash-section-label">Ringkasan</div>
          <div className="stat-grid">
            <StatCard
              label="Toko Terhubung" value={`${connected.length} toko`}
              sub={connected.length ? connected.map((s) => channelMeta(s.channel).label).join(" · ") : "Belum ada toko terhubung"}
              icon={Store} iconClass="orange" color="orange"
              onClick={() => onMenuClick?.("integrasi-toko")}
            >
              {connected.length > 0 && (
                <div className="marketplace-logos">
                  {connected.slice(0, 6).map((s) => {
                    const m = channelMeta(s.channel);
                    return <span key={s.id} title={m.label} style={{ width: 26, height: 26, borderRadius: 7, background: "#292A2E", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{m.short}</span>;
                  })}
                </div>
              )}
            </StatCard>

            {/* ANTREAN KERJA — sengaja TIDAK dibatasi hari ini.
                Pekerjaan yang belum selesai tidak kedaluwarsa jam 12 malam.
                Diukur di produksi 17 Agu 2026: dari 1.103 pesanan yang masih
                menunggu, hanya 321 masuk hari itu. Kalau kartu ini ikut
                dipotong ke hari ini, 782 pesanan lenyap dari pandangan —
                termasuk empat yang sudah menggantung tiga hari. */}
            <StatCard
              label="Perlu Dikerjakan" value={`${angka(antrian.perluDikerjakan)} pesanan`}
              sub={
                antrian.perluDikerjakan === 0
                  ? "Tumpukan bersih 👍"
                  : menggantung
                    ? `paling lama menunggu sejak ${tertua}`
                    : "semuanya masuk hari ini"
              }
              subClass={menggantung ? "warn" : antrian.perluDikerjakan === 0 ? "ok" : ""}
              icon={ClipboardList} iconClass="blue" color="blue"
              onClick={() => onBukaPesanan?.("dikemas")}
            >
              {/* Tiap baris pintasan langsung ke tumpukannya sendiri.
                  Angkanya datang dari penghitung yang SAMA dengan badge tab di
                  halaman Pesanan, jadi yang ditekan dan yang terbuka tidak bisa
                  bercerita beda. */}
              <div className="antrian-rincian">
                <BarisAntrian
                  label="Perlu atur pengiriman" nilai={antrian.perluAtur}
                  onClick={() => onBukaPesanan?.("baru")}
                />
                <BarisAntrian
                  label="Siap dicetak" nilai={antrian.siapCetak}
                  onClick={() => onBukaPesanan?.("dikemas")}
                />
                <BarisAntrian
                  label="Menunggu pembayaran" nilai={antrian.menungguPembayaran}
                  redup
                  onClick={() => onBukaPesanan?.("unpaid")}
                />
                {/* Hanya muncul kalau memang ada. Status marketplace yang tidak
                    dikenali tidak dibuang diam-diam — ia ditandai supaya
                    dilihat manusia sebelum jadi pesanan yang terlewat. */}
                {antrian.perluDiperiksa > 0 && (
                  <BarisAntrian
                    label="⚠ Perlu diperiksa" nilai={antrian.perluDiperiksa} peringatan
                    onClick={() => onBukaPesanan?.("all")}
                  />
                )}
              </div>
            </StatCard>

            <StatCard
              label="Omset Hari Ini" value={rupiah(hariIni.omset)}
              sub={`${angka(hariIni.pesanan)} pesanan masuk hari ini`}
              icon={TrendingUp} iconClass="green" color="green"
              onClick={() => onMenuClick?.("marketing")}
            />

            <StatCard
              label="Kelola Produk" value={`${products.length} produk`}
              sub={perluSinkron ? `${perluSinkron} produk perlu sinkron` : "Semua produk tersinkron"}
              subClass={perluSinkron ? "warn" : "ok"}
              icon={Boxes} iconClass="purple" color="purple"
              onClick={() => onMenuClick?.("kelola-produk")}
            />

            <StatCard
              label="Total Stok (WMS)" value={angka(totalStok)}
              sub={lowStock.length ? `${lowStock.length} produk stok menipis` : "Stok aman"}
              subClass={lowStock.length ? "warn" : "ok"}
              icon={Package} iconClass="yellow"
              onClick={() => onMenuClick?.("wms")}
            />

            <StatCard
              label="Status Sinkron Stok" value={`${products.length - perluSinkron}/${products.length}`}
              sub="produk tersinkron lintas channel"
              icon={RefreshCw} iconClass="green"
              onClick={() => onMenuClick?.("kelola-produk")}
            />
          </div>

          {/* ─── Penjualan per channel (teaser Marketing) ─── */}
          {perChannel.length > 0 && (
            <>
              <div className="dash-section-label">Penjualan per Channel · Hari Ini</div>
              <div className="stock-alert-box" style={{ marginBottom: 28, padding: "16px 18px" }}>
                {perChannel.map((c) => {
                  const m = channelMeta(c.channel);
                  return (
                    <div key={c.channel} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                      <span style={{ width: 90, fontSize: 12.5, fontWeight: 600, color: "#505258", display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1868DB" }} />{m.label}
                      </span>
                      <div style={{ flex: 1, height: 8, background: "#F0F1F2", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${(c.total / maxChannel) * 100}%`, height: "100%", background: "#1868DB", borderRadius: 99 }} />
                      </div>
                      <span style={{ width: 110, textAlign: "right", fontSize: 12.5, fontWeight: 700, color: "#292A2E" }}>{rupiah(c.total)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ─── Stok perlu diperhatikan (data nyata) ─── */}
          <div className="stock-alert-box">
            <div className="stock-alert-header">
              <span className="stock-alert-title">
                <AlertTriangle size={14} color="#C9372C" /> Stok Perlu Diperhatikan
                {lowStock.length > 0 && <span className="stock-alert-badge">{lowStock.length}</span>}
              </span>
              <span className="stock-alert-link" onClick={() => onMenuClick?.("kelola-produk")}>Kelola →</span>
            </div>
            {lowStock.length === 0 ? (
              <div style={{ padding: "18px", fontSize: 12.5, color: "#8C8F97" }}>Tidak ada stok yang menipis. 👍</div>
            ) : (
              <table className="stock-table">
                <thead><tr><th>Produk</th><th>SKU</th><th>Stok</th><th>Status</th></tr></thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td style={{ color: "#8C8F97" }}>{p.sku}</td>
                      <td style={{ fontWeight: 600 }}>{p.masterStock}</td>
                      <td><span className={`stock-pill ${p.level}`}>{p.level}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
