import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import "./DashboardHome.css";
import {
  Store, ClipboardList, TrendingUp, Boxes, Package,
  RefreshCw, AlertTriangle, Info,
} from "lucide-react";
import { omniApi } from "../../utils/omniApi";
import { channelMeta } from "./omni/channels";

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

export default function DashboardHome({ onMenuClick }) {
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
  const RINGKASAN_KOSONG = { total: 0, omset: 0, perluProses: 0, perStatus: {}, perChannel: [] };

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
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // ─── Derivasi metrik dari data nyata ───
  const stores   = data?.stores   ?? [];
  const products = data?.products ?? [];
  const ringkasan = data?.ringkasan ?? RINGKASAN_KOSONG;

  const connected    = stores.filter((s) => s.status === "connected");
  const perluProses  = ringkasan.perluProses;
  const omset        = ringkasan.omset;
  const totalPesanan = ringkasan.total;
  const perStatus    = ringkasan.perStatus ?? {};
  const perluSinkron = products.filter((p) => !p.fullySynced).length;
  const totalStok   = products.reduce((a, p) => a + Number(p.masterStock || 0), 0);
  const lowStock    = products
    .filter((p) => Number(p.masterStock) <= 8)
    .map((p) => ({ ...p, level: Number(p.masterStock) <= 3 ? "kritis" : "menipis" }));

  // Penjualan per channel (teaser Dashboard Marketing) — sudah dikelompokkan
  // dan diurutkan server, atas seluruh pesanan.
  const perChannel = ringkasan.perChannel ?? [];
  const maxChannel = Math.max(1, ...perChannel.map((c) => c.total));

  return (
    <div>
      <div className="dash-header">
        <h1>{greeting}, {firstName} 👋</h1>
        <p>Ringkasan operasional · {today}</p>
      </div>

      <TrialBanner tenant={tenant} />

      {data === null ? (
        <div style={{ color: "#999", fontSize: 13, padding: "24px 2px" }}>Memuat ringkasan…</div>
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
                    return <span key={s.id} title={m.label} style={{ width: 26, height: 26, borderRadius: 7, background: "#1F2937", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{m.short}</span>;
                  })}
                </div>
              )}
            </StatCard>

            <StatCard
              label="Pesanan Perlu Diproses" value={`${perluProses} pesanan`}
              sub={`${perStatus.baru ?? 0} baru · ${perStatus.dikemas ?? 0} dikemas`}
              subClass={perluProses ? "warn" : ""}
              icon={ClipboardList} iconClass="blue" color="blue"
              onClick={() => onMenuClick?.("pesanan")}
            />

            <StatCard
              label="Omset Pesanan" value={rupiah(omset)}
              sub={`dari ${totalPesanan.toLocaleString("id-ID")} pesanan semua channel`}
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
              label="Total Stok (WMS)" value={`${totalStok}`}
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
              <div className="dash-section-label">Penjualan per Channel</div>
              <div className="stock-alert-box" style={{ marginBottom: 28, padding: "16px 18px" }}>
                {perChannel.map((c) => {
                  const m = channelMeta(c.channel);
                  return (
                    <div key={c.channel} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                      <span style={{ width: 90, fontSize: 12.5, fontWeight: 600, color: "#333", display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4F46E5" }} />{m.label}
                      </span>
                      <div style={{ flex: 1, height: 8, background: "#F1F1F1", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${(c.total / maxChannel) * 100}%`, height: "100%", background: "#4F46E5", borderRadius: 99 }} />
                      </div>
                      <span style={{ width: 110, textAlign: "right", fontSize: 12.5, fontWeight: 700, color: "#111" }}>{rupiah(c.total)}</span>
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
                <AlertTriangle size={14} color="#DC2626" /> Stok Perlu Diperhatikan
                {lowStock.length > 0 && <span className="stock-alert-badge">{lowStock.length}</span>}
              </span>
              <span className="stock-alert-link" onClick={() => onMenuClick?.("kelola-produk")}>Kelola →</span>
            </div>
            {lowStock.length === 0 ? (
              <div style={{ padding: "18px", fontSize: 12.5, color: "#aaa" }}>Tidak ada stok yang menipis. 👍</div>
            ) : (
              <table className="stock-table">
                <thead><tr><th>Produk</th><th>SKU</th><th>Stok</th><th>Status</th></tr></thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td style={{ color: "#aaa" }}>{p.sku}</td>
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
