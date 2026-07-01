import { useEffect, useState, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import DashboardLayout from "./dashboard/DashboardLayout";
import DashboardHome from "./dashboard/DashboardHome";
import StoresTab from "./dashboard/omni/StoresTab";
import ProductsTab from "./dashboard/omni/ProductsTab";
import OrdersTab from "./dashboard/omni/OrdersTab";
import PaymentPage from "./dashboard/PaymentPage";
import ModulePlaceholder from "./dashboard/ModulePlaceholder";
import { subscriptionApi } from "../utils/omniApi";
import { Warehouse, Megaphone, Settings, Info } from "lucide-react";

// ─── Map menu id → judul halaman ──────────────────────────────────────────────
const PAGES = {
  dashboard:        { title: "Dashboard"              },
  wms:              { title: "WMS — Manajemen Gudang" },
  "integrasi-toko": { title: "Integrasi Toko"         },
  pesanan:          { title: "Pesanan"                },
  "kelola-produk":  { title: "Kelola Produk"          },
  marketing:        { title: "Dashboard Marketing"    },
  settings:         { title: "Pengaturan"             },
  payment:          { title: "Pembayaran"             },
};

// ─── Banner billing global (status langganan live) ────────────────────────────
function BillingBanner({ sub, onPay }) {
  if (!sub) return null;

  const base = {
    display: "flex", alignItems: "center", gap: 10, borderRadius: 10,
    padding: "12px 16px", marginBottom: 20, fontSize: 13,
    fontFamily: '"DM Sans", sans-serif',
  };

  if (sub.status === "trial" && sub.daysLeft > 0) {
    return (
      <div style={{ ...base, background: "#FFF4EC", border: "1px solid #FED7AA", color: "#92400E" }}>
        <Info size={16} color="#F97316" />
        <span>Free Trial aktif — tersisa <strong style={{ color: "#C2410C" }}>{sub.daysLeft} hari</strong>. Aktifkan langganan agar fitur tidak terkunci.</span>
        <button onClick={onPay} style={billBtn}>Bayar</button>
      </div>
    );
  }
  if (sub.locked) {
    return (
      <div style={{ ...base, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}>
        <Info size={16} color="#DC2626" />
        <span><strong style={{ color: "#991B1B" }}>Trial berakhir.</strong> Aksi tulis terkunci (mode hanya-baca). Lakukan pembayaran untuk mengaktifkan kembali.</span>
        <button onClick={onPay} style={{ ...billBtn, color: "#DC2626", borderColor: "#FECACA" }}>Bayar Sekarang</button>
      </div>
    );
  }
  return null;
}

const billBtn = {
  marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#F97316",
  background: "#fff", border: "1px solid #FED7AA", borderRadius: 6,
  padding: "5px 12px", cursor: "pointer", whiteSpace: "nowrap",
};

export default function Dashboard() {
  const { isAuthenticated } = useAppContext();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sub, setSub] = useState(null);
  const [connectNotice, setConnectNotice] = useState(null); // 'ok' | 'failed'

  const refreshSub = useCallback(() => {
    subscriptionApi.status().then(setSub).catch(() => setSub(null));
  }, []);
  useEffect(() => { if (isAuthenticated) refreshSub(); }, [isAuthenticated, refreshSub]);

  // Tangani kembalinya redirect penautan Shopee (?connect=shopee_ok|shopee_failed)
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("connect");
    if (!c) return;
    setActiveMenu("integrasi-toko");
    setConnectNotice(c.endsWith("_ok") ? "ok" : "failed");
    window.history.replaceState({}, "", "/dashboard");
    const t = setTimeout(() => setConnectNotice(null), 6000);
    return () => clearTimeout(t);
  }, []);

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  const goToPayment = () => setActiveMenu("payment");
  const title = PAGES[activeMenu]?.title ?? "Dashboard";
  const locked = !!sub?.locked;

  return (
    <DashboardLayout activeMenu={activeMenu} onMenuClick={setActiveMenu} pageTitle={title}>
      {activeMenu === "payment" ? (
        <PaymentPage onBack={() => { refreshSub(); setActiveMenu("dashboard"); }} />
      ) : (
        <>
          {connectNotice && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, borderRadius: 10, padding: "12px 16px",
              marginBottom: 20, fontSize: 13, fontFamily: '"DM Sans", sans-serif',
              background: connectNotice === "ok" ? "#F0FDF4" : "#FEF2F2",
              border: `1px solid ${connectNotice === "ok" ? "#BBF7D0" : "#FECACA"}`,
              color: connectNotice === "ok" ? "#166534" : "#991B1B",
            }}>
              {connectNotice === "ok"
                ? "✓ Toko Shopee berhasil ditautkan & kredensial tersimpan aman (terenkripsi)."
                : "✕ Penautan Shopee gagal. Coba lagi atau periksa konfigurasi Shopee di server."}
            </div>
          )}

          {activeMenu !== "dashboard" && <BillingBanner sub={sub} onPay={goToPayment} />}

          {activeMenu === "dashboard"      && <DashboardHome onMenuClick={setActiveMenu} />}
          {activeMenu === "wms"            && <ModulePlaceholder name="WMS — Manajemen Gudang" icon={Warehouse} />}
          {activeMenu === "integrasi-toko" && <div className="omni"><StoresTab   locked={locked} onRequirePayment={goToPayment} /></div>}
          {activeMenu === "pesanan"        && <div className="omni"><OrdersTab   locked={locked} onRequirePayment={goToPayment} /></div>}
          {activeMenu === "kelola-produk"  && <div className="omni"><ProductsTab locked={locked} onRequirePayment={goToPayment} /></div>}
          {activeMenu === "marketing"      && <ModulePlaceholder name="Dashboard Marketing" icon={Megaphone} />}
          {activeMenu === "settings"       && <ModulePlaceholder name="Pengaturan" icon={Settings} />}
        </>
      )}
    </DashboardLayout>
  );
}
