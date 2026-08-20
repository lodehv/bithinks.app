import { useEffect, useState, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import DashboardLayout from "./dashboard/DashboardLayout";
import DashboardHome from "./dashboard/DashboardHome";
import StoresTab from "./dashboard/omni/StoresTab";
import ProductsTab from "./dashboard/omni/ProductsTab";
import OrdersTab from "./dashboard/omni/OrdersTab";
import WmsTab from "./dashboard/omni/wms/WmsTab";
import PaymentPage from "./dashboard/PaymentPage";
import PricingPage from "./dashboard/PricingPage";
import AdminPanel from "./dashboard/AdminPanel";
import { ADMIN_EMAIL } from "./dashboard/DashboardLayout";
import ModulePlaceholder from "./dashboard/ModulePlaceholder";
import MarketingDashboard from "./dashboard/MarketingDashboard";
import { subscriptionApi } from "../utils/omniApi";
import { Settings, Info } from "lucide-react";

// ─── Map menu id → judul halaman ──────────────────────────────────────────────
const PAGES = {
  dashboard:        { title: "Dashboard"              },
  wms:              { title: "WMS — Manajemen Gudang" },
  "integrasi-toko": { title: "Integrasi Toko"         },
  pesanan:          { title: "Pesanan"                },
  "kelola-produk":  { title: "Kelola Produk"          },
  marketing:        { title: "Laporan Penjualan"      },
  settings:         { title: "Pengaturan"             },
  payment:          { title: "Pembayaran"             },
  admin:            { title: "Panel Admin"            },
};

// ─── Banner billing global (status langganan live) ────────────────────────────
// Gaya tombol tagihan. Ditaruh SEBELUM komponen yang memakainya — bukan soal
// selera: nilai yang dipakai di atas baris deklarasinya adalah bentuk yang sama
// dengan yang menjatuhkan halaman Laporan Penjualan jadi layar putih pada
// 20 Agustus 2026. Yang ini sebenarnya aman (React menjalankan komponennya
// belakangan), tapi membedakan yang aman dari yang tidak butuh penalaran —
// dan penalaran itulah yang gagal waktu itu.
const billBtn = {
  marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#F97316",
  background: "#fff", border: "1px solid #FED7AA", borderRadius: 6,
  padding: "5px 12px", cursor: "pointer", whiteSpace: "nowrap",
};

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

export default function Dashboard() {
  const { isAuthenticated, user } = useAppContext();
  const isAdmin = (user?.email ?? "").toLowerCase() === ADMIN_EMAIL;
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sub, setSub] = useState(null);
  const [payPlan, setPayPlan] = useState(null); // paket terpilih di halaman pricing
  const [connectNotice, setConnectNotice] = useState(null); // 'ok' | 'failed'

  // Tab Pesanan yang dituju saat datang lewat pintasan dari dashboard.
  // null = buka apa adanya (tab bawaan "Semua Pesanan").
  //
  // Kenapa ada: kartu di halaman depan berfungsi sebagai pintasan kerja —
  // menekan "Siap dicetak 1.096" harus mendarat tepat di tumpukan itu, bukan
  // di daftar semua pesanan yang lalu harus disaring ulang manual. Angka yang
  // ditekan dan halaman yang terbuka harus bercerita hal yang sama.
  const [pesananTab, setPesananTab] = useState(null);

  const bukaPesanan = (tab) => { setPesananTab(tab); setActiveMenu("pesanan"); };

  // Klik menu di sidebar membuka Pesanan apa adanya — pintasan sebelumnya
  // tidak boleh menempel dan diam-diam menyaring layar berikutnya.
  const pilihMenu = (id) => { if (id === "pesanan") setPesananTab(null); setActiveMenu(id); };

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

  const goToPayment = () => { setPayPlan(null); setActiveMenu("payment"); };
  const title = PAGES[activeMenu]?.title ?? "Dashboard";
  const locked = !!sub?.locked;

  return (
    <DashboardLayout activeMenu={activeMenu} onMenuClick={pilihMenu} pageTitle={title}>
      {activeMenu === "payment" ? (
        payPlan ? (
          <PaymentPage
            plan={payPlan}
            onBack={() => { refreshSub(); setPayPlan(null); }}
          />
        ) : (
          <PricingPage
            currentPlan={sub?.plan}
            onBack={() => setActiveMenu("dashboard")}
            onSelect={(plan) => setPayPlan(plan)}
          />
        )
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

          {(activeMenu !== "dashboard" || locked) && <BillingBanner sub={sub} onPay={goToPayment} />}

          {activeMenu === "dashboard"      && <DashboardHome onMenuClick={pilihMenu} onBukaPesanan={bukaPesanan} />}
          {activeMenu === "wms"            && <WmsTab      locked={locked} onRequirePayment={goToPayment} />}
          {activeMenu === "integrasi-toko" && <div className="omni"><StoresTab   locked={locked} onRequirePayment={goToPayment} /></div>}
          {activeMenu === "pesanan"        && <div className="omni"><OrdersTab   locked={locked} onRequirePayment={goToPayment} tabAwal={pesananTab} /></div>}
          {activeMenu === "kelola-produk"  && <div className="omni"><ProductsTab locked={locked} onRequirePayment={goToPayment} /></div>}
          {activeMenu === "marketing"      && <MarketingDashboard />}
          {activeMenu === "settings"       && <ModulePlaceholder name="Pengaturan" icon={Settings} />}
          {activeMenu === "admin"          && isAdmin && <AdminPanel />}
        </>
      )}
    </DashboardLayout>
  );
}
