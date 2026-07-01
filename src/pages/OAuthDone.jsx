import { useEffect } from "react";

// Halaman kecil tujuan redirect callback OAuth (popup). Memberi tahu jendela
// pembuka lalu menutup diri. Bila dibuka bukan sebagai popup → kembali ke dashboard.
export default function OAuthDone() {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const status = p.get("status") || "failed";
    const channel = p.get("channel") || "";
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ source: "bithinks-oauth", status, channel }, window.location.origin);
        window.close();
        return;
      }
    } catch { /* ignore */ }
    window.location.replace(`/dashboard?connect=${channel}_${status}`);
  }, []);

  return (
    <div style={{
      fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#6B7280", fontSize: 14, textAlign: "center", padding: 20,
    }}>
      Menyelesaikan otorisasi… jendela ini akan tertutup otomatis.
    </div>
  );
}
