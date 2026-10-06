import { createElement } from 'react';
import { Package, ClipboardList, ChartNoAxesCombined, ArrowDown } from 'lucide-react';

const steps = [
  { Icon: Package, title: 'Stok siap dijual', detail: 'Fisik 120 − pesanan 18 − cadangan 10', value: '92', unit: 'unit siap jual' },
  { Icon: ClipboardList, title: 'Pesanan siap diproses', detail: 'Shopee & TikTok Shop dalam satu antrean', value: '18', unit: 'pesanan' },
  { Icon: ChartNoAxesCombined, title: 'Hasil penjualan terbaca', detail: 'Omzet, biaya platform, HPP, dan retur', value: 'Per toko', unit: 'per periode' },
];

export default function WorkflowPreview() {
  return (
    <figure className="omni-preview">
      <figcaption><strong>Alur kerja di BitOmni</strong><span>Ilustrasi data</span></figcaption>
      <div className="omni-preview-body">
        {steps.map(({ Icon, title, detail, value, unit }, index) => (
          <div key={title}>
            {index > 0 && <div className="omni-connector"><ArrowDown size={18} aria-hidden="true" /></div>}
            <div className="omni-preview-step">
              <div className="omni-preview-label">{createElement(Icon, { size: 20, 'aria-hidden': true })}<strong>{title}</strong><span>0{index + 1}</span></div>
              <div className="omni-preview-value"><b>{value}</b><span>{unit}</span></div>
              <p>{detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="omni-preview-bottom">Barang masuk → pesanan diproses → penjualan dievaluasi</div>
    </figure>
  );
}
