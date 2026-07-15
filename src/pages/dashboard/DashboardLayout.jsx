import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import "./DashboardLayout.css";
import {
  Store, ClipboardList, Menu, X, LogOut, Warehouse, Boxes, Megaphone,
  ChevronLeft, ChevronRight, LayoutDashboard, Lock, Settings, ShieldCheck
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
      { id: "marketing", label: "Dashboard Marketing", icon: Megaphone, module: null },
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

  const planStatus = tenant?.status ?? "trial";

  // Sisipkan menu Admin hanya untuk email admin platform.
  const isAdmin = (user?.email ?? "").toLowerCase() === ADMIN_EMAIL;
  const navSections = isAdmin ? [...NAV_SECTIONS, ADMIN_SECTION] : NAV_SECTIONS;

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onCloseMobile} />}

      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <img src="/bithinks.jpeg" alt="Logo" />
          <span className="sidebar-brand-name">Bithinks</span>
        </div>

        {/* Billing strip */}
        <div className="sidebar-billing">
          <div className="sidebar-billing-top">
            <span className="sidebar-billing-label">Paket kamu</span>
            <span className={`sidebar-billing-badge ${planStatus}`}>
              {tenant?.plan ?? "Free"}
            </span>
          </div>
          <div className="sidebar-billing-name">{tenant?.name ?? "–"}</div>
          <div className="sidebar-billing-sub">
            Status: {planStatus === "trial" ? "Free Trial" : planStatus}
          </div>
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

export default function DashboardLayout({ activeMenu, onMenuClick, children, pageTitle }) {
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

      <div className="dashboard-main">
        <header className="topbar">
          <button className="topbar-hamburger" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={18} strokeWidth={1.8} /> : <Menu size={18} strokeWidth={1.8} />}
          </button>
          <span className="topbar-title">{pageTitle}</span>
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
