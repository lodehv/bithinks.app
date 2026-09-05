import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, RefreshCw, WalletCards } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import PricingPage from "./PricingPage";
import "./wallet-page.css";
import { walletApi } from "../../utils/omniApi";

const rupiah = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const typeLabel = {
  TOPUP: "Isi saldo",
  ORDER_FEE: "Biaya pesanan",
  REFUND_REVERSAL: "Pembalikan biaya",
  CORRECTION: "Koreksi",
};

function selectLedger(payload) {
  return {
    entries: payload?.data?.entries ?? [],
    meta: payload?.meta ?? { page: 1, limit: 25, total: 0, totalPages: 1 },
  };
}

export default function WalletPage({ onBack, onSelect, currentPlan }) {
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [topupAmount, setTopupAmount] = useState(10000);
  const [topup, setTopup] = useState(null);
  const [topupError, setTopupError] = useState(null);
  const [topupBusy, setTopupBusy] = useState(false);
  const ledgerConfig = useMemo(() => ({
    params: { page, limit: 25, ...(type ? { type } : {}) },
  }), [page, type]);
  const walletRequest = useFetch("/api/wallet");
  const ledgerRequest = useFetch("/api/wallet/ledger", {
    config: ledgerConfig,
    initialData: { entries: [], meta: null },
    requestKey: `${page}:${type}`,
    select: selectLedger,
  });
  const wallet = walletRequest.data;
  const ledger = ledgerRequest.data;
  const loading = walletRequest.loading || ledgerRequest.loading;
  const error = walletRequest.error || ledgerRequest.error;

  const changeType = (next) => { setType(next); setPage(1); };
  const retry = () => { void Promise.allSettled([walletRequest.refetch(), ledgerRequest.refetch()]); };
  const startTopup = async () => {
    setTopupBusy(true); setTopupError(null);
    try { setTopup(await walletApi.createTopup(Number(topupAmount))); }
    catch (requestError) { setTopupError(requestError.friendlyMessage || "Pembayaran isi saldo gagal dibuat."); }
    finally { setTopupBusy(false); }
  };
  const completeMock = async () => {
    if (!topup?.paymentId) return;
    setTopupBusy(true); setTopupError(null);
    try { await walletApi.completeMockTopup(topup.paymentId); setTopup(null); retry(); }
    catch (requestError) { setTopupError(requestError.friendlyMessage || "Pembayaran belum dapat dikonfirmasi."); }
    finally { setTopupBusy(false); }
  };

  return (
    <div className="wallet-page">
      {onBack && <button className="wallet-back" onClick={onBack}><ArrowLeft size={15} /> Kembali</button>}
      <div className="wallet-head">
        <div>
          <p className="wallet-eyebrow">Saldo & Tagihan</p>
          <h1>Saldo prabayar</h1>
          <p>Riwayat saldo tersimpan sebagai catatan keuangan dan tidak dapat diubah.</p>
        </div>
        <WalletCards className="wallet-head-icon" size={32} />
      </div>

      {error ? (
        <div className="wallet-state wallet-error">
          <span>{walletRequest.errorMessage || ledgerRequest.errorMessage || "Saldo belum dapat dimuat."}</span>
          <button onClick={retry}><RefreshCw size={14} /> Coba lagi</button>
        </div>
      ) : (
        <>
          <section className="wallet-balance-card">
            <div className="wallet-balance-label">Saldo tersedia</div>
            <div className="wallet-balance-value">{loading ? "Memuat…" : rupiah(wallet?.balance)}</div>
            <div className="wallet-balance-note">Saldo tidak kedaluwarsa. Isi saldo diproses asinkron oleh penyedia pembayaran.</div>
            <div className="wallet-topup">
              <label htmlFor="wallet-topup-amount">Isi saldo (IDR)</label>
              <div className="wallet-topup-row">
                <input id="wallet-topup-amount" type="number" min="1000" step="1000" value={topupAmount} onChange={(event) => setTopupAmount(event.target.value)} />
                <button type="button" onClick={startTopup} disabled={topupBusy}>{topupBusy ? "Memproses…" : "Buat pembayaran"}</button>
              </div>
              {topup && <div className="wallet-topup-pending"><span>Pembayaran {topup.reference} menunggu konfirmasi.</span><button type="button" onClick={completeMock} disabled={topupBusy}>Konfirmasi mock</button></div>}
              {topupError && <div className="wallet-topup-error">{topupError}</div>}
            </div>
          </section>

          <section className="wallet-ledger-card">
            <div className="wallet-section-head">
              <div><h2><BookOpen size={16} /> Riwayat mutasi</h2><span>{ledger.meta?.total ?? 0} catatan</span></div>
              <select value={type} onChange={(event) => changeType(event.target.value)} aria-label="Filter tipe mutasi">
                <option value="">Semua tipe</option>
                <option value="TOPUP">Isi saldo</option>
                <option value="ORDER_FEE">Biaya pesanan</option>
                <option value="REFUND_REVERSAL">Pembalikan biaya</option>
                <option value="CORRECTION">Koreksi</option>
              </select>
            </div>
            {loading ? <div className="wallet-state">Memuat riwayat…</div> : ledger.entries.length === 0 ? (
              <div className="wallet-state">Belum ada mutasi saldo.</div>
            ) : (
              <div className="wallet-table-wrap"><table className="wallet-table"><thead><tr><th>Waktu</th><th>Mutasi</th><th>Referensi</th><th className="num">Saldo sebelum</th><th className="num">Saldo sesudah</th></tr></thead><tbody>
                {ledger.entries.map((entry) => <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleString("id-ID")}</td>
                  <td><strong className={Number(entry.amount) >= 0 ? "positive" : "negative"}>{Number(entry.amount) >= 0 ? "+" : "−"}{rupiah(Math.abs(Number(entry.amount)))}</strong><span className="wallet-sub">{typeLabel[entry.type] ?? entry.type}</span></td>
                  <td>
                    <span>{entry.referenceType}: {entry.referenceId}</span>
                    <span className="wallet-sub">Sumber: {entry.source}{entry.actorUserId ? ` · Aktor: ${entry.actorUserId}` : ""}</span>
                    {entry.reason && <span className="wallet-sub">{entry.reason}</span>}
                    {entry.correctionOfId && <span className="wallet-sub">Koreksi untuk: {entry.correctionOfId}</span>}
                    {entry.pricingKey && <span className="wallet-sub">Harga {entry.pricingKey} · {entry.pricingVersion}</span>}
                  </td>
                  <td className="num">{rupiah(entry.balanceBefore)}</td>
                  <td className="num">{rupiah(entry.balanceAfter)}</td>
                </tr>)}
              </tbody></table></div>
            )}
            {!loading && ledger.meta?.totalPages > 1 && <div className="wallet-pagination"><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</button><span>Halaman {page} dari {ledger.meta.totalPages}</span><button disabled={page >= ledger.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Berikutnya</button></div>}
          </section>
        </>
      )}

      <section className="wallet-subscription"><h2>Paket langganan</h2><PricingPage currentPlan={currentPlan} onSelect={onSelect} /></section>
    </div>
  );
}
