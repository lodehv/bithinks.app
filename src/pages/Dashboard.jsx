import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import DashboardLayout from "./dashboard/DashboardLayout";
import DashboardHome from "./dashboard/DashboardHome";
import HrmModule from "./dashboard/hrm/HrmModule";
import ModulePlaceholder from "./dashboard/ModulePlaceholder";
import {
  DollarSign, Package,
  ShoppingCart, Store, ClipboardList, Settings
} from "lucide-react";

// ─── Map menu id → konten halaman ─────────────────────────────────────────────
const PAGES = {
  dashboard:   { title: "Dashboard"    },
  hrm:         { title: "HRM"          },
  finance:     { title: "Finance"      },
  inventory:   { title: "Inventori"    },
  pos:         { title: "POS"          },
  marketplace: { title: "Marketplaces" },
  orders:      { title: "Pesanan"      },
  settings:    { title: "Pengaturan"   },
};

export default function Dashboard() {
  const { isAuthenticated } = useAppContext();
  const [activeMenu, setActiveMenu] = useState("dashboard");

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  const title = PAGES[activeMenu]?.title ?? "Dashboard";

  return (
    <DashboardLayout
      activeMenu={activeMenu}
      onMenuClick={setActiveMenu}
      pageTitle={title}
    >
      {activeMenu === "dashboard"   && <DashboardHome onMenuClick={setActiveMenu} />}
      {activeMenu === "hrm"         && <HrmModule />}
      {activeMenu === "finance"     && <ModulePlaceholder name="Finance — Keuangan"               icon={DollarSign}    />}
      {activeMenu === "inventory"   && <ModulePlaceholder name="Inventori — Warehouse Management" icon={Package}       />}
      {activeMenu === "pos"         && <ModulePlaceholder name="POS — Sistem Kasir"               icon={ShoppingCart}  />}
      {activeMenu === "marketplace" && <ModulePlaceholder name="Marketplaces — Integrasi Toko"    icon={Store}         />}
      {activeMenu === "orders"      && <ModulePlaceholder name="Pesanan — Order Management"       icon={ClipboardList} />}
      {activeMenu === "settings"    && <ModulePlaceholder name="Pengaturan"                       icon={Settings}      />}
    </DashboardLayout>
  );
}
