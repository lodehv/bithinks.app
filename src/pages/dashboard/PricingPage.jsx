import { useState } from "react";
import { ArrowLeft, Check, Store, Building2, Crown, Sparkles, Flame } from "lucide-react";
import "./PricingPage.css";

// ─────────────────────────────────────────────────────────────────────────────
// Data paket — HARGA MUDAH DIUBAH DI SINI.
// `price` = harga per bulan (angka bulat, sudah termasuk PPN 11%).
// Ubah angka & fitur sesuai skema harga final Anda nanti.
// ─────────────────────────────────────────────────────────────────────────────
const PLANS = [
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

// Periode langganan — `months` dikirim ke halaman transfer, `disc` = diskon.
const PERIODS = [
  { key: 1,  label: "1 Bulan", months: 1,  disc: 0    },
  { key: 6,  label: "6 Bulan", months: 6,  disc: 0.09, save: "Hemat 9%"  },
  { key: 12, label: "1 Tahun", months: 12, disc: 0.15, save: "Hemat 15%" },
];

const rupiah = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");

export default function PricingPage({ onBack, onSelect, currentPlan }) {
  const [period, setPeriod] = useState(PERIODS[0]);

  return (
    <div className="pricing-wrap">
      {onBack && (
        <button className="pricing-back" onClick={onBack}>
          <ArrowLeft size={15} /> Kembali
        </button>
      )}

      <div className="pricing-head">
        <h1 className="pricing-title">
          Tingkatkan Produktivitas <span className="pricing-chip">Bisnis Kamu</span>
        </h1>

        <div className="pricing-toggle" role="tablist">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={`pt-btn ${period.key === p.key ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p.save && <span className="pt-badge">{p.save}</span>}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pricing-grid">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isFree = plan.price === 0;
          const monthly = plan.price * (1 - period.disc);
          const isCurrent = currentPlan && currentPlan === plan.key;

          return (
            <div
              key={plan.key}
              className={`plan-card ${plan.highlighted ? "pro" : ""}`}
            >
              {plan.badge && (
                <span className="plan-badge">
                  <Flame size={13} /> {plan.badge}
                </span>
              )}

              <div className="plan-icon">
                {isFree ? <span className="plan-icon-free">FREE</span> : <Icon size={26} />}
              </div>

              <div className="plan-name">{plan.name}</div>
              <div className="plan-desc">{plan.desc}</div>

              <div className="plan-price-block">
                {isFree ? (
                  <div className="plan-price">
                    Gratis <span className="plan-price-per">/ Bulan</span>
                  </div>
                ) : (
                  <>
                    <div className="plan-price">
                      {rupiah(monthly)} <span className="plan-price-per">/ Bulan</span>
                    </div>
                    <div className="plan-price-note">*Harga termasuk PPN 11%</div>
                  </>
                )}
              </div>

              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f} className="plan-feat">
                    <span className="plan-check"><Check size={13} strokeWidth={3} /></span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className="plan-btn"
                disabled={isFree || isCurrent}
                onClick={() => !isFree && onSelect?.({ ...plan, months: period.months, monthly, period })}
              >
                {isFree ? "Selalu Gratis" : isCurrent ? "Paket Saat Ini" : "Pilih Paket"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
