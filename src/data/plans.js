import { Store, Building2, Crown, Sparkles } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Sumber tunggal data paket langganan — dipakai halaman Pembayaran (dashboard)
// & section Harga di halaman produk BitOmni.
// HARGA MUDAH DIUBAH DI SINI. `price` = per bulan (sudah termasuk PPN 11%).
// ─────────────────────────────────────────────────────────────────────────────
export const PLANS = [
  {
    key: "free",
    name: "Free",
    icon: Sparkles,
    desc: "Sesuai untuk memulai bisnis marketplace skala kecil",
    price: 0,
    features: [
      "1 Toko / Marketplace",
      "100 Master SKU",
      "Bithinks Mobile App",
      "Naikan 1 Produk Otomatis",
      "Atur Frame Foto 10 Produk",
      "Kelola Produk",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    icon: Store,
    desc: "Sesuai untuk bisnis marketplace menengah dengan fitur lengkap",
    price: 99000,
    features: [
      "10 Toko / Marketplace",
      "Kelola hingga 1.000 pesanan",
      "10.000 Master SKU",
      "Integrasi Chat 3 Toko",
      "Bithinks Mobile App",
      "Kelola Order",
    ],
  },
  {
    key: "medium",
    name: "Medium",
    icon: Building2,
    desc: "Sesuai untuk bisnis marketplace dengan skala yang lebih besar",
    price: 199000,
    highlighted: true,
    badge: "Best Deal",
    features: [
      "50 Toko / Marketplace",
      "Kelola hingga 5.000 pesanan",
      "50.000 Master SKU",
      "5 Akun Sub Member",
      "Integrasi Chat 15 Toko",
      "Bithinks Mobile App",
    ],
  },
  {
    key: "platinum",
    name: "Platinum",
    icon: Crown,
    desc: "Sesuai untuk bisnis marketplace besar dengan fitur eksklusif",
    price: 299000,
    features: [
      "100 Toko / Marketplace",
      "Kelola hingga 50.000 Pesanan",
      "100.000 Master SKU",
      "20 Akun Sub Member",
      "Integrasi Chat 100 Toko",
      "Bithinks Mobile App",
    ],
  },
];

// Periode langganan + diskon.
export const PERIODS = [
  { key: 1,  label: "1 Bulan", months: 1,  disc: 0    },
  { key: 6,  label: "6 Bulan", months: 6,  disc: 0.09, save: "Hemat 9%"  },
  { key: 12, label: "1 Tahun", months: 12, disc: 0.15, save: "Hemat 15%" },
];

export const rupiah = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
