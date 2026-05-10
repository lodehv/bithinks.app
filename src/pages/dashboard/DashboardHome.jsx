import { useAppContext } from "../../context/AppContext";
import "./DashboardHome.css";
import {
  ShoppingBag, TrendingUp, Users,
  Package, AlertTriangle, Clock, Info
} from "lucide-react";

// ─── Marketplace logos (SVG inline, no CDN needed) ───────────────────────────
const MARKETPLACE_LOGOS = [
  {
    name: "Shopee",
    color: "#EE4D2D",
    svg: (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <rect width="100" height="100" rx="16" fill="#EE4D2D"/>
        <path d="M50 18C43.4 18 38 23.1 38 29.4c0 1.2.2 2.4.5 3.5H28.5C26 32.9 24 34.8 24 37.2l3.2 36.2C27.5 75.8 29.3 77 31.3 77h37.4c2 0 3.8-1.2 4.1-3.6L76 37.2c0-2.4-2-4.3-4.5-4.3H61.5c.3-1.1.5-2.3.5-3.5C62 23.1 56.6 18 50 18zm0 5c4.1 0 7.5 3.1 7.5 7 0 1.2-.3 2.4-.9 3.4H43.4c-.6-1-1-2.2-1-3.4.1-3.9 3.5-7 7.6-7zm-8 28.5c1.4 0 2.5 1.1 2.5 2.5S43.4 56.5 42 56.5s-2.5-1.1-2.5-2.5S40.6 51.5 42 51.5zm16 0c1.4 0 2.5 1.1 2.5 2.5S59.4 56.5 58 56.5s-2.5-1.1-2.5-2.5S56.6 51.5 58 51.5z" fill="white"/>
      </svg>
    ),
  },
  {
    name: "Tokopedia",
    color: "#03AC0E",
    svg: (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <rect width="100" height="100" rx="16" fill="#03AC0E"/>
        <path d="M50 20C33.4 20 20 33.4 20 50s13.4 30 30 30 30-13.4 30-30S66.6 20 50 20zm0 8c3.9 0 7 3.1 7 7s-3.1 7-7 7-7-3.1-7-7 3.1-7 7-7zm0 44c-8.3 0-15.7-4.2-20-10.6.1-6.6 13.3-10.2 20-10.2s19.9 3.6 20 10.2C65.7 67.8 58.3 72 50 72z" fill="white"/>
      </svg>
    ),
  },
  {
    name: "TikTok Shop",
    color: "#010101",
    svg: (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
        <rect width="100" height="100" rx="16" fill="#010101"/>
        <path d="M67.5 30.2c-3.5-.4-6.6-2.2-8.8-4.9V57c0 7.2-5.8 13-13 13s-13-5.8-13-13 5.8-13 13-13c.7 0 1.4.1 2 .2V36c-.7-.1-1.3-.1-2-.1-12.1 0-22 9.9-22 22s9.9 22 22 22 22-9.9 22-22V42.7c3.3 2.2 7.2 3.5 11.5 3.5v-9.6c-4.5-.1-9.1-2.8-11.7-6.4z" fill="white"/>
      </svg>
    ),
  },
];

// ─── Marketplace card ─────────────────────────────────────────────────────────
function MarketplaceCard({ icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">Total Penjualan Hari Ini</span>
        <div className="stat-card-icon orange">
          <Icon size={16} strokeWidth={1.8} />
        </div>
      </div>
      <div className="stat-card-value orange">Rp 0</div>
      <div className="stat-card-sub">Belum ada transaksi hari ini</div>

      {/* Marketplace logos */}
      <div className="marketplace-logos">
        {MARKETPLACE_LOGOS.map((m) => (
          <div key={m.name} className="marketplace-logo-item" title={m.name}>
            {m.svg}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function MiniChart({ color, values }) {
  const max = Math.max(...values);
  return (
    <div className="mini-chart">
      {values.map((v, i) => (
        <div
          key={i}
          className={`mini-bar ${i === values.length - 1 ? "last" : ""}`}
          style={{
            height: `${(v / max) * 100}%`,
            background: color,
          }}
        />
      ))}
    </div>
  );
}

// ─── Attendance progress bar card ─────────────────────────────────────────────
function AttendanceCard({ hadir, total, icon: Icon }) {
  const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;
  const color = pct === 100 ? "#16A34A" : pct >= 70 ? "#F97316" : "#2563EB";

  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">Kehadiran Hari Ini</span>
        <div className="stat-card-icon blue">
          <Icon size={16} strokeWidth={1.8} />
        </div>
      </div>
      <div className="stat-card-value" style={{ color }}>
        {hadir} <span style={{ fontSize: 14, fontWeight: 500, color: "#aaa" }}>/ {total} orang</span>
      </div>

      {/* Progress bar */}
      <div className="attendance-bar-wrap">
        <div
          className="attendance-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>

      <div className="attendance-bar-footer">
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>{pct}%</span>
        <span style={{ color: "#bbb", fontSize: 12 }}>
          {pct === 100 ? "Semua sudah hadir ✓" : `${total - hadir} belum hadir`}
        </span>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, subClass, icon: Icon, iconClass, color, chartValues }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon ${iconClass}`}>
          <Icon size={16} strokeWidth={1.8} />
        </div>
      </div>
      <div className={`stat-card-value ${color ?? ""}`}>{value}</div>
      {sub && <div className={`stat-card-sub ${subClass ?? ""}`}>{sub}</div>}
      {chartValues && <MiniChart color={
        iconClass === "orange" ? "#F97316" :
        iconClass === "green"  ? "#16A34A" :
        iconClass === "red"    ? "#DC2626" :
        iconClass === "purple" ? "#7C3AED" : "#D97706"
      } values={chartValues} />}
    </div>
  );
}

// ─── Mock stok menipis ────────────────────────────────────────────────────────
const LOW_STOCK = [
  { name: "Kopi Arabica 250g",    sku: "KOP-001", stok: 3,  status: "kritis"  },
  { name: "Gula Pasir 1kg",       sku: "GUL-012", stok: 8,  status: "menipis" },
  { name: "Susu Full Cream 1L",   sku: "SSU-034", stok: 5,  status: "kritis"  },
  { name: "Teh Celup Kotak",      sku: "TEH-007", stok: 12, status: "menipis" },
];

// ─── Trial banner ─────────────────────────────────────────────────────────────
function TrialBanner({ tenant }) {
  if (!tenant || tenant.status !== "trial") return null;

  const daysLeft = tenant.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(tenant.trialEndsAt) - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="trial-banner">
      <Info size={16} className="trial-banner-icon" strokeWidth={2} />
      <span>
        <strong>Free Trial</strong> — Paket <strong>{tenant.plan}</strong> Anda
        {daysLeft !== null
          ? <> tersisa <strong>{daysLeft} hari</strong>.</>
          : <> sedang aktif.</>
        } Upgrade untuk akses penuh semua modul.
      </span>
      <button className="trial-banner-action">Upgrade Sekarang</button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardHome({ onMenuClick }) {
  const { user, tenant } = useAppContext();
  const firstName = user?.name?.split(" ")[0] ?? "–";

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Selamat pagi";
    if (h < 17) return "Selamat siang";
    return "Selamat malam";
  }

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div>
      {/* Header */}
      <div className="dash-header">
        <h1>{greeting()}, {firstName} 👋</h1>
        <p>Data ringkasan hari ini · {today}</p>
      </div>

      {/* Trial banner */}
      <TrialBanner tenant={tenant} />

      {/* Stat cards — baris 1 */}
      <div className="dash-section-label">Perlu Tindakan</div>
      <div className="stat-grid">
        <MarketplaceCard icon={ShoppingBag} />
        <StatCard
          label="Profit & Loss Hari Ini"
          value="Rp 0"
          sub="Terhubung ke modul Finance"
          icon={TrendingUp}
          iconClass="green"
          color="green"
          chartValues={[3, 5, 4, 8, 6, 7, 9]}
        />
        <AttendanceCard hadir={0} total={12} icon={Users} />
        <StatCard
          label="Stok Perlu Diperhatikan"
          value={`${LOW_STOCK.length} produk`}
          sub={`${LOW_STOCK.filter(s => s.status === "kritis").length} kritis · ${LOW_STOCK.filter(s => s.status === "menipis").length} menipis`}
          subClass="warn"
          icon={AlertTriangle}
          iconClass="red"
          color="red"
          chartValues={[2, 3, 4, 3, 5, 4, LOW_STOCK.length]}
        />
        <StatCard
          label="Total Stok Hari Ini"
          value="—"
          sub="Sinkron dari modul Inventori"
          icon={Package}
          iconClass="purple"
          chartValues={[5, 7, 6, 8, 7, 9, 8]}
        />
        <StatCard
          label="Total Jam Kerja Hari Ini"
          value="0 jam"
          sub="Data dari modul HRM"
          icon={Clock}
          iconClass="yellow"
          chartValues={[3, 4, 5, 6, 4, 5, 6]}
        />
      </div>

    </div>
  );
}
