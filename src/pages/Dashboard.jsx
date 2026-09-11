import { useEffect, useState, useCallback, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import DashboardLayout from "./dashboard/DashboardLayout";
import DashboardHome from "./dashboard/DashboardHome";
import StoresTab from "./dashboard/omni/StoresTab";
import ProductsTab from "./dashboard/omni/ProductsTab";
import OrdersTab from "./dashboard/omni/OrdersTab";
import WmsTab from "./dashboard/omni/wms/WmsTab";
import PaymentPage from "./dashboard/PaymentPage";
import AdminPanel from "./dashboard/AdminPanel";
import { ADMIN_EMAIL } from "./dashboard/DashboardLayout";
import ModulePlaceholder from "./dashboard/ModulePlaceholder";
import MarketingDashboard from "./dashboard/MarketingDashboard";
import { subscriptionApi, walletApi } from "../utils/omniApi";
import { PAYMENT_REQUIRED_EVENT } from "../utils/paymentRequired";
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
const PAGE_IDS = new Set(Object.keys(PAGES));

function menuFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const menu = params.get("view");
  if (params.get("connect")) return "integrasi-toko";
  return PAGE_IDS.has(menu) ? menu : "dashboard";
}

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
    const title = {
      TRIAL_TIME_LIMIT: "Masa trial berakhir.",
      TRIAL_ORDER_LIMIT: "Kuota 100 pesanan trial habis.",
      TRIAL_STORE_LIMIT: "Batas toko trial tercapai.",
      INSUFFICIENT_BALANCE: "Saldo tidak mencukupi.",
      SUBSCRIPTION_REQUIRED: "Isi saldo untuk melanjutkan.",
    }[sub.reasonCode] ?? "Mode hanya-baca aktif.";
    const reason = sub.reasonCode === "SUBSCRIPTION_REQUIRED" && sub.action === "TOP_UP"
      ? "Saldo prabayar diperlukan untuk membuka kembali fitur."
      : sub.reason;
    return (
      <div style={{ ...base, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}>
        <Info size={16} color="#DC2626" />
        <span>
          <strong style={{ color: "#991B1B" }}>{title}</strong>{" "}
          {reason || "Data lama tetap bisa dilihat, tetapi aksi tulis dan sinkronisasi berhenti sementara."}
        </span>
        <button onClick={onPay} style={{ ...billBtn, color: "#DC2626", borderColor: "#FECACA" }}>Aktifkan Akses</button>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const { isAuthenticated, user } = useAppContext();
  const isAdmin = (user?.email ?? "").toLowerCase() === ADMIN_EMAIL;
  const canViewWallet = ["owner", "admin"].includes(String(user?.role ?? "").toLowerCase());
  const [activeMenu, setActiveMenu] = useState(menuFromLocation);
  const activeMenuRef = useRef(activeMenu);
  const [sub, setSub] = useState(null);
  const [walletHeader, setWalletHeader] = useState({ status: "loading", balance: null });
  const walletRequestRef = useRef(0);
  const [connectNotice, setConnectNotice] = useState(() => {
    const value = new URLSearchParams(window.location.search).get("connect");
    return value ? (value.endsWith("_ok") ? "ok" : "failed") : null;
  }); // 'ok' | 'failed'

  // Tab Pesanan yang dituju saat datang lewat pintasan dari dashboard.
  // null = buka apa adanya (tab bawaan "Semua Pesanan").
  //
  // Kenapa ada: kartu di halaman depan berfungsi sebagai pintasan kerja —
  // menekan "Siap dicetak 1.096" harus mendarat tepat di tumpukan itu, bukan
  // di daftar semua pesanan yang lalu harus disaring ulang manual. Angka yang
  // ditekan dan halaman yang terbuka harus bercerita hal yang sama.
  const [pesananTab, setPesananTab] = useState(null);

  const navigateMenu = useCallback((menu, options = {}) => {
    if (!PAGE_IDS.has(menu)) return;
    const current = activeMenuRef.current;
    activeMenuRef.current = menu;
    setActiveMenu(menu);
    const url = menu === "dashboard" ? "/dashboard" : `/dashboard?view=${encodeURIComponent(menu)}`;
    const state = { dashboardMenu: menu, ...(menu === "payment" ? { returnMenu: current } : {}) };
    if (options.replace) window.history.replaceState(state, "", url);
    else if (current !== menu) window.history.pushState(state, "", url);
  }, []);

  useEffect(() => {
    activeMenuRef.current = activeMenu;
  }, [activeMenu]);

  useEffect(() => {
    window.history.replaceState({ ...window.history.state, dashboardMenu: menuFromLocation() }, "", window.location.href);
    const restoreMenu = () => {
      const menu = PAGE_IDS.has(window.history.state?.dashboardMenu)
        ? window.history.state.dashboardMenu
        : menuFromLocation();
      activeMenuRef.current = menu;
      setActiveMenu(menu);
      if (menu === "pesanan") setPesananTab(null);
    };
    window.addEventListener("popstate", restoreMenu);
    return () => window.removeEventListener("popstate", restoreMenu);
  }, []);

  const bukaPesanan = (tab) => { setPesananTab(tab); navigateMenu("pesanan"); };

  // Klik menu di sidebar membuka Pesanan apa adanya — pintasan sebelumnya
  // tidak boleh menempel dan diam-diam menyaring layar berikutnya.
  const pilihMenu = (id) => { if (id === "pesanan") setPesananTab(null); navigateMenu(id); };

  const goToPayment = useCallback(() => {
    navigateMenu("payment");
  }, [navigateMenu]);

  const refreshSub = useCallback(() => {
    subscriptionApi.status().then(setSub).catch(() => {});
  }, []);
  const refreshWalletHeader = useCallback(() => {
    if (!canViewWallet) return Promise.resolve(null);
    const requestId = ++walletRequestRef.current;
    return walletApi.get()
      .then((nextWallet) => {
        if (requestId === walletRequestRef.current) {
          setWalletHeader({ status: "ready", balance: nextWallet.balance });
        }
        return nextWallet;
      })
      .catch(() => {
        if (requestId === walletRequestRef.current) {
          setWalletHeader((current) => current.status === "ready"
            ? current
            : { status: "error", balance: null });
        }
        return null;
      });
  }, [canViewWallet]);
  const handleWalletChanged = useCallback((nextWallet) => {
    refreshSub();
    if (nextWallet?.balance !== undefined) {
      walletRequestRef.current += 1;
      setWalletHeader({ status: "ready", balance: nextWallet.balance });
    } else {
      refreshWalletHeader();
    }
  }, [refreshSub, refreshWalletHeader]);
  const leavePayment = useCallback(() => {
    refreshSub();
    if (window.history.state?.dashboardMenu === "payment" && window.history.state?.returnMenu) {
      window.history.back();
    } else {
      navigateMenu("dashboard");
    }
  }, [navigateMenu, refreshSub]);
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    refreshSub();
    window.addEventListener("focus", refreshSub);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshSub();
    }, 60_000);
    return () => {
      window.removeEventListener("focus", refreshSub);
      window.clearInterval(timer);
    };
  }, [isAuthenticated, refreshSub]);

  useEffect(() => {
    if (!isAuthenticated || !canViewWallet) return undefined;
    refreshWalletHeader();
    const onFocus = () => refreshWalletHeader();
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshWalletHeader();
    }, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [canViewWallet, isAuthenticated, refreshWalletHeader]);

  // A 402 can arrive after the initial status fetch (another tab exhausted a
  // quota, a webhook admitted the 100th order, or balance changed). Treat the
  // failed server response as authoritative immediately and follow its action.
  useEffect(() => {
    const onPaymentRequired = (event) => {
      const detail = event.detail ?? {};
      setSub((current) => ({
        ...(current ?? {}),
        active: false,
        locked: true,
        reason: detail.message ?? current?.reason ?? null,
        reasonCode: detail.reason ?? current?.reasonCode ?? "SUBSCRIPTION_REQUIRED",
        action: detail.action ?? "TOP_UP",
      }));
      if (detail.action === "TOP_UP") goToPayment();
    };
    window.addEventListener(PAYMENT_REQUIRED_EVENT, onPaymentRequired);
    return () => window.removeEventListener(PAYMENT_REQUIRED_EVENT, onPaymentRequired);
  }, [goToPayment]);

  // Tangani kembalinya redirect penautan Shopee (?connect=shopee_ok|shopee_failed)
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("connect");
    if (!c) return;
    window.history.replaceState({ dashboardMenu: "integrasi-toko" }, "", "/dashboard?view=integrasi-toko");
    const t = setTimeout(() => setConnectNotice(null), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) window.location.assign("/login");
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const title = PAGES[activeMenu]?.title ?? "Dashboard";
  const locked = !!sub?.locked;

  return (
    <DashboardLayout
      activeMenu={activeMenu}
      onMenuClick={pilihMenu}
      pageTitle={title}
      walletState={canViewWallet ? walletHeader : null}
      onWalletClick={goToPayment}
    >
      {activeMenu === "payment" ? (
        <PaymentPage onBack={leavePayment} onWalletChanged={handleWalletChanged} onPaymentComplete={leavePayment} />
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
