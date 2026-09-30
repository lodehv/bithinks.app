import { Construction } from "lucide-react";

export default function ModulePlaceholder({ name, icon: Icon, color }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "60vh", gap: 14, textAlign: "center",
      fontFamily: '"DM Sans", ui-sans-serif, sans-serif',
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 16,
        background: "#FFF5DB", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={28} color="#BD5B00" strokeWidth={1.8} />
      </div>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#292A2E" }}>{name}</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#8C8F97", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
          <Construction size={13} strokeWidth={1.8} /> Sedang dalam pengembangan
        </p>
      </div>
    </div>
  );
}
