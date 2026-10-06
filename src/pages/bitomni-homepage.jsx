import { useState } from 'react';
import { ArrowRight, Check, Menu, X, Package, ClipboardList, ChartNoAxesCombined } from 'lucide-react';
import WorkflowPreview from '../components/bitomni/workflow-preview';
import './bitomni-homepage.css';

const salesUrl = 'https://wa.me/6285156297948?text=Halo%20Bithinks%2C%20saya%20ingin%20diskusi%20kebutuhan%20toko%20untuk%20BitOmni.';
const features = [
  { label: 'Kelola stok', Icon: Package, question: 'Yang ada di gudang, belum tentu semuanya bisa dijual.',
    description: 'Bedakan stok fisik, barang yang sudah dipesan, dan cadangan. Tim punya acuan saat menerima barang, menyiapkan pesanan, atau merencanakan restok.',
    points: ['Hubungkan SKU toko ke master produk.', 'Catat barang masuk, keluar, dan penyesuaian stok.', 'Telusuri perubahan melalui riwayat stok.'],
    title: 'Dari stok fisik ke stok siap jual', columns: ['Komponen stok', 'Jumlah'],
    rows: [['Stok fisik', '120 unit'], ['Terkunci pesanan', '−18 unit'], ['Cadangan', '−10 unit'], ['Siap jual', '92 unit']],
    note: 'Cadangan membantu mengurangi risiko overselling. Pembaruan antar-marketplace tetap memiliki jeda.' },
  { label: 'Proses pesanan', Icon: ClipboardList, question: 'Tahu pesanan mana yang perlu dikerjakan berikutnya.',
    description: 'Kumpulkan pesanan toko yang terhubung dalam satu tempat. Periksa tahapnya, atur pengiriman yang tersedia, lalu cetak resi sesuai antrean.',
    points: ['Pantau pesanan berdasarkan tahap pemrosesan.', 'Kelompokkan antrean cetak berdasarkan SKU.', 'Periksa hasil dan riwayat cetak resi.'],
    title: 'Antrean kerja yang bisa ditindaklanjuti', columns: ['Tahap pesanan', 'Jumlah'],
    rows: [['Perlu atur pengiriman', '6 pesanan'], ['Siap cetak resi', '12 pesanan'], ['Sudah dicetak', '24 pesanan']],
    note: 'Ketersediaan resi dan pilihan pengiriman mengikuti status serta ketentuan masing-masing marketplace.' },
  { label: 'Baca hasil penjualan', Icon: ChartNoAxesCombined, question: 'Penjualan ramai. Apa yang tersisa setelah biaya?',
    description: 'Baca omzet bersama potongan platform, HPP, biaya iklan yang dicatat, dan retur. Bandingkan hasil per toko dan periode untuk menentukan langkah berikutnya.',
    points: ['Pisahkan pesanan berjalan, selesai, batal, dan retur.', 'Periksa komponen biaya yang memengaruhi hasil.', 'Evaluasi toko dan produk berdasarkan laporan.'],
    title: 'Lihat komponen di balik hasil penjualan', columns: ['Komponen laporan', 'Contoh nilai'],
    rows: [['Omzet perkiraan', 'Rp10.000.000'], ['HPP', '−Rp5.000.000'], ['Biaya platform', '−Rp1.000.000'], ['Biaya iklan tercatat', '−Rp500.000'], ['Sisa setelah biaya di atas', 'Rp3.500.000']],
    note: 'Kelengkapan hasil bergantung pada data marketplace, pemetaan HPP, serta biaya yang sudah dicatat.' },
];
const questions = [
  ['Marketplace apa yang bisa dihubungkan?', 'BitOmni mendukung koneksi toko Shopee dan TikTok Shop. Diskusikan jumlah toko dan alur operasional Anda dengan tim sebelum mulai.'],
  ['Apakah stok dijamin tidak pernah overselling?', 'Tidak. Marketplace menerima pesanan secara terpisah dan pembaruan stok memiliki jeda. Pemetaan SKU yang tepat dan stok cadangan membantu mengurangi risikonya.'],
  ['Apa yang perlu disiapkan agar laporan berguna?', 'Hubungkan toko, petakan SKU ke master produk, lengkapi HPP, dan catat biaya yang relevan. Angka laporan mengikuti kelengkapan data tersebut serta status pesanan dari marketplace.'],
  ['Bagaimana ketentuan coba gratisnya?', 'Masa coba berlaku sampai 3 hari atau 100 pesanan, mana yang tercapai lebih dahulu, dengan 1 toko terhubung. Setelah batas tercapai, akses operasional memerlukan layanan berbayar.'],
];

export default function BitOmniHomepage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const feature = features[selected];
  return (
    <div className="omni-home" lang="id">
      <a className="omni-skip" href="#omni-main">Lewati ke konten</a>
      <header className="omni-header">
        <div className="omni-wrap omni-nav">
          <a className="omni-brand" href="/bitomni" aria-label="BitOmni beranda"><img src="/bithinks.png" width="34" height="38" alt="" /><span>BitOmni<small>by bithinks</small></span><span className="omni-beta">BETA</span></a>
          <button className="omni-menu" aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'} aria-expanded={menuOpen} aria-controls="omni-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
          <nav id="omni-navigation" aria-label="Navigasi utama" className={menuOpen ? 'is-open' : ''} onKeyDown={(event) => { if (event.key === 'Escape') { setMenuOpen(false); document.querySelector('.omni-menu')?.focus(); } }}>
            <a href="#alur-kerja" onClick={() => setMenuOpen(false)}>Alur kerja</a><a href="#fitur" onClick={() => setMenuOpen(false)}>Fitur</a><a href="#pertanyaan" onClick={() => setMenuOpen(false)}>Tanya jawab</a>
            <a href="/login">Masuk</a><a className="omni-button" href="/register">Coba gratis <ArrowRight size={16} aria-hidden="true" /></a>
          </nav>
        </div>
      </header>
      <main id="omni-main">
        <section className="omni-wrap omni-hero" aria-labelledby="omni-title">
          <div>
            <p className="omni-eyebrow">UNTUK PENJUAL SHOPEE & TIKTOK SHOP</p>
            <h1 id="omni-title">Dari stok masuk<br />sampai hasil penjualan.<br /><em>Kelola dalam satu alur.</em></h1>
            <p className="omni-lead">Stok di gudang, pesanan di marketplace, laporan di akhir hari. BitOmni membantu Anda mengelolanya dalam satu tempat.</p>
            <div className="omni-actions"><a className="omni-button" href="/register">Coba BitOmni gratis <ArrowRight size={18} aria-hidden="true" /></a><a className="omni-text-link" href="#alur-kerja">Lihat alur kerjanya <ArrowRight size={17} aria-hidden="true" /></a></div>
            <p className="omni-small">Masa coba hingga 3 hari atau 100 pesanan · 1 toko</p>
            <div className="omni-channels"><span>Untuk toko Anda di</span><strong>Shopee</strong><strong>TikTok Shop</strong></div>
          </div>
          <WorkflowPreview />
        </section>
        <section className="omni-workflow" id="alur-kerja" aria-labelledby="workflow-title">
          <div className="omni-wrap">
            <div className="omni-section-heading"><p className="omni-eyebrow">SATU RANGKAIAN KERJA</p><h2 id="workflow-title">Jualan tidak berhenti<br />di pesanan masuk.</h2><p>Barang harus tersedia. Pesanan perlu dikirim.<br />Hasilnya perlu dibaca untuk langkah berikutnya.</p></div>
            <ol className="omni-steps">
              {[
                ['01', 'Siapkan barangnya', 'Kelola master produk, penerimaan barang, dan stok siap jual.', 'Kelola stok'],
                ['02', 'Kerjakan pesanannya', 'Pantau tahap pesanan, siapkan pengiriman, dan cetak resi.', 'Proses pesanan'],
                ['03', 'Pahami hasilnya', 'Baca penjualan, biaya, dan retur untuk mengevaluasi toko.', 'Baca laporan'],
              ].map(([number, title, copy, link], index) => <li key={number}><span className="omni-step-number">{number}</span><h3>{title}</h3><p>{copy}</p><a href="#fitur" onClick={() => setSelected(index)}>{link}<ArrowRight size={17} aria-hidden="true" /></a></li>)}
            </ol>
          </div>
        </section>
        <section className="omni-wrap omni-features" id="fitur" aria-labelledby="features-title">
          <p className="omni-eyebrow">LEBIH DEKAT DENGAN PEKERJAAN ANDA</p><h2 id="features-title">Satu tempat, dari gudang<br />sampai evaluasi toko.</h2>
          <div className="omni-feature-switch" role="group" aria-label="Pilih bagian alur kerja">
            {features.map(({ label, Icon }, index) => <button key={label} type="button" aria-pressed={selected === index} aria-controls="omni-feature-panel" onClick={() => setSelected(index)}><Icon size={19} aria-hidden="true" />{label}</button>)}
          </div>
          <div id="omni-feature-panel" className="omni-feature-panel" aria-live="polite" aria-atomic="true">
            <div className="omni-feature-copy"><h3>{feature.question}</h3><p>{feature.description}</p><ul>{feature.points.map(point => <li key={point}><Check size={18} aria-hidden="true" />{point}</li>)}</ul></div>
            <figure className="omni-example"><figcaption><strong>{feature.title}</strong><span>Ilustrasi data</span></figcaption><table><thead><tr>{feature.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{feature.rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table><p>{feature.note}</p></figure>
          </div>
        </section>
        <section className="omni-start" aria-labelledby="start-title"><div className="omni-wrap omni-start-grid"><div><p className="omni-eyebrow">MULAI DARI SATU TOKO</p><h2 id="start-title">Cocokkan dulu dengan<br />cara kerja tim Anda.</h2><p>Hubungkan toko, petakan produk, lalu telusuri pesanan dan laporannya. Gunakan masa coba untuk melihat kebutuhan operasional Anda secara langsung.</p></div><div><a className="omni-button" href="/register">Mulai coba gratis <ArrowRight size={18} aria-hidden="true" /></a><a className="omni-text-link" href={salesUrl} target="_blank" rel="noopener noreferrer">Diskusikan kebutuhan toko <ArrowRight size={17} aria-hidden="true" /></a><p className="omni-small">Hingga 3 hari atau 100 pesanan, mana yang lebih dulu.<br />Berlaku untuk 1 toko terhubung.</p></div></div></section>
        <section className="omni-wrap omni-faq" id="pertanyaan" aria-labelledby="faq-title"><div><p className="omni-eyebrow">SEBELUM MULAI</p><h2 id="faq-title">Yang mungkin<br />ingin Anda tahu.</h2><a className="omni-text-link" href={salesUrl} target="_blank" rel="noopener noreferrer">Tanyakan ke tim kami <ArrowRight size={17} aria-hidden="true" /></a></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
      </main>
      <footer className="omni-footer"><div className="omni-wrap"><div><strong>BitOmni <span>by bithinks</span></strong><p>Kelola stok. Proses pesanan. Pahami penjualan.</p></div><nav aria-label="Informasi perusahaan"><a href="/about">Tentang Bithinks</a><a href="/terms">Syarat & ketentuan</a><a href="/privacy">Privasi & keamanan data</a></nav><small>© 2026 PT. Bithinks Digital Teknologi</small></div></footer>
    </div>
  );
}
