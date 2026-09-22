import { useState } from "react";
import { ClipboardCheck, Clock } from "lucide-react";
import Absensi from "./Absensi";
import RiwayatKehadiran from "./RiwayatKehadiran";

const SUB_MENUS = [
  { id: "absensi",  label: "Absensi",           icon: ClipboardCheck },
  { id: "riwayat",  label: "Riwayat Kehadiran", icon: Clock          },
];

export default function HrmModule({ locked = false, onRequirePayment }) {
  const [active, setActive] = useState("absensi");

  return (
    <div>
      {/* Sub-menu tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 24,
        background: "#F7F8F9", borderRadius: 10,
        padding: 4, width: "fit-content",
      }}>
        {SUB_MENUS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 8, border: "none",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.12s",
              background: active === id ? "#fff" : "transparent",
              color: active === id ? "#111" : "#aaa",
              boxShadow: active === id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Icon size={15} strokeWidth={1.8} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === "absensi" && <Absensi locked={locked} onRequirePayment={onRequirePayment} />}
      {active === "riwayat" && <RiwayatKehadiran />}
    </div>
  );
}
