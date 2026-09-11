import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import "./DashboardLayout.css";
import {
  Store, ClipboardList, Menu, X, LogOut, Warehouse, Boxes, LineChart,
  ChevronLeft, ChevronRight, LayoutDashboard, Lock, Settings, ShieldCheck, Wallet
} from "lucide-react";

// Email admin platform — hanya user ini yang melihat menu Admin.
// (Gerbang sebenarnya ditegakkan di backend; ini hanya untuk UI.)
export const ADMIN_EMAIL = "demo@bithinks.id";

const ADMIN_SECTION = {
  label: "Admin",
  items: [
    { id: "admin", label: "Pelanggan", icon: ShieldCheck, module: null },
  ],
};

const NAV_SECTIONS = [
  {
    label: "Menu",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, module: null },
    ],
  },
  {
    label: "Modul",
    items: [
      { id: "wms",            label: "WMS",            icon: Warehouse,     module: null },
      { id: "integrasi-toko", label: "Integrasi Toko", icon: Store,         module: null },
      { id: "pesanan",        label: "Pesanan",        icon: ClipboardList, module: null },
      { id: "kelola-produk",  label: "Kelola Produk",  icon: Boxes,         module: null },
    ],
  },
  {
    label: "Analitik",
    items: [
      { id: "marketing", label: "Laporan Penjualan", icon: LineChart, module: null },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { id: "settings", label: "Pengaturan", icon: Settings, module: null },
    ],
  },
];

// Di development mode semua modul dibuka agar bisa di-test.
// Logika subscription TIDAK diubah — flag ini hanya aktif saat DEV.
const DEV_UNLOCK = import.meta.env.DEV;

function isModuleActive(moduleKey, tenant) {
  if (!moduleKey)   return true;
  if (DEV_UNLOCK)   return true;   // dev only — hapus baris ini sebelum production
  if (!tenant)      return false;
  if (tenant.plan === "ERP") return true;
  const mods = (tenant.modules ?? []).map(m => m.toLowerCase());
  return mods.includes(moduleKey.toLowerCase());
}

function Sidebar({ activeMenu, onMenuClick, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user, tenant, logout } = useAppContext();

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  // Sisipkan menu Admin hanya untuk email admin platform.
  const isAdmin = (user?.email ?? "").toLowerCase() === ADMIN_EMAIL;
  const navSections = isAdmin ? [...NAV_SECTIONS, ADMIN_SECTION] : NAV_SECTIONS;

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onCloseMobile} />}

      <aside id="dashboard-sidebar" className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>

        {/* Brand */}
        <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: '12px 16px', gap: '8px', lineHeight: 1 }}>
          <img src="/bithinks.png" alt="Logo" style={{ height: '30px', width: 'auto' }} />
          <span className="sidebar-brand-name" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'lowercase' }}>bithinks</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item) => {
                const active = activeMenu === item.id;
                const locked = !isModuleActive(item.module, tenant);
                const Icon   = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`nav-item ${active ? "active" : ""} ${locked ? "locked" : ""}`}
                    onClick={() => !locked && onMenuClick(item.id)}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="nav-item-icon" size={17} strokeWidth={1.8} />
                    <span className="nav-item-label">{item.label}</span>
                    {locked && <Lock className="nav-lock-icon" size={12} strokeWidth={1.8} />}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <div className="sidebar-collapse-btn" onClick={onToggleCollapse}>
            {collapsed
              ? <ChevronRight size={15} strokeWidth={1.8} />
              : <><ChevronLeft size={15} strokeWidth={1.8} /><span className="sidebar-collapse-btn-label">Sembunyikan Menu</span></>
            }
          </div>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name ?? "–"}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
            <button className="logout-btn" onClick={logout} title="Logout">
              <LogOut size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}

const fullRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0,
});
const compactRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", notation: "compact", maximumFractionDigits: 0,
});

function wholeRupiah(value) {
  const digits = String(value ?? "").match(/^\d+/)?.[0];
  return digits ? BigInt(digits) : null;
}

function WalletIndicator({ walletState, onClick }) {
  if (!walletState) return null;
  const amount = walletState.status === "ready" ? wholeRupiah(walletState.balance) : null;
  const low = amount !== null && amount < 250n;
  const unavailable = walletState.status === "error" || (walletState.status === "ready" && amount === null);
  const spokenValue = walletState.status === "loading"
    ? "sedang dimuat"
    : unavailable ? "belum dapat dimuat" : fullRupiah.format(amount);

  return (
    <button
      type="button"
      className={`topbar-wallet ${low ? "low" : ""} ${unavailable ? "unavailable" : ""}`}
      onClick={onClick}
      aria-label={`Saldo: ${spokenValue}. Buka halaman isi saldo.`}
    >
      <Wallet size={18} strokeWidth={1.8} aria-hidden="true" />
      {walletState.status === "loading" ? (
        <span className="topbar-wallet-skeleton" aria-hidden="true" />
      ) : (
        <>
          <span className="topbar-wallet-label">{low ? "Isi saldo" : "Saldo"}</span>
          <strong className="topbar-wallet-amount topbar-wallet-full">
            {unavailable ? "—" : fullRupiah.format(amount)}
          </strong>
          <strong className="topbar-wallet-amount topbar-wallet-compact">
            {unavailable ? "—" : compactRupiah.format(amount)}
          </strong>
        </>
      )}
    </button>
  );
}

export default function DashboardLayout({ activeMenu, onMenuClick, children, pageTitle, walletState, onWalletClick }) {
  const { tenant } = useAppContext();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard-root">
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={onMenuClick}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="dashboard-main" id="dashboard-main">
        <header className="topbar">
          <button
            type="button"
            className="topbar-hamburger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            aria-controls="dashboard-sidebar"
          >
            {mobileOpen ? <X size={18} strokeWidth={1.8} /> : <Menu size={18} strokeWidth={1.8} />}
          </button>
          <span className="topbar-title">{pageTitle}</span>
          <WalletIndicator walletState={walletState} onClick={onWalletClick} />
          {tenant?.name && (
            <span className="topbar-tenant-badge">{tenant.name}</span>
          )}
        </header>

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
