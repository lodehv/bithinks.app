import { useState } from "react";
import { ArrowLeft, Check, Flame } from "lucide-react";
import { PLANS, PERIODS, rupiah } from "../../data/plans";
import "./PricingPage.css";

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
