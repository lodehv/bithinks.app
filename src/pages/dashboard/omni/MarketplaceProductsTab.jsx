import { useCallback, useEffect, useMemo, useState } from "react";
import { PackageOpen, RefreshCw, Link2, Check, ImageOff, Search, X } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";

// ─────────────────────────────────────────────────────────────────────────────
// Produk Marketplaces — grid etalase (6/baris). Tiap etalase membungkus SKU;
// tiap SKU dipetakan ke master produk (single = 1 komponen, bundle = >1) + qty.
// Resep ini jadi dasar movement stok & COGS.
// ─────────────────────────────────────────────────────────────────────────────

import "./MarketplaceCatalog.css";
import MarketplaceMappingDialog from "./MarketplaceMappingDialog";
import { syncCatalogPages } from "../../../utils/catalogSync";
import { notify } from "../../../components/notifications/notificationBus";

const SUB_TABS = [
  { key: "tiktok", label: "TikTok Shop", logo: tiktokLogo },
  { key: "shopee", label: "Shopee", logo: shopeeLogo },
];

export default function MarketplaceProductsTab({ locked, onRequirePayment }) {
  const [channel, setChannel] = useState("tiktok");
  const [products, setProducts] = useState(null);
  const [mappings, setMappings] = useState({});   // sku → components[{masterProductId, qty, masterName}]
  const [masters, setMasters] = useState([]);     // master produk utk dropdown
  const [syncing, setSyncing] = useState(false);
  const [note, setNote] = useState("");
  const [noteTone, setNoteTone] = useState("neutral");
  const [searchQ, setSearchQ] = useState("");
  const [mapFilter, setMapFilter] = useState("all"); // all | mapped | unmapped
  const [storeFilter, setStoreFilter] = useState("all");
  const [stores, setStores] = useState([]);

  // Modal pemetaan per etalase
  const [mapProduct, setMapProduct] = useState(null); // etalase yang sedang dipetakan
  const [editingSku, setEditingSku] = useState(null);
  const [bundleMode, setBundleMode] = useState(false);
  const [rows, setRows] = useState([]);           // [{masterProductId, qty}]
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const load = (ch) => {
    setProducts(null);
    omniApi.listMarketplaceProducts(ch).then(setProducts).catch(() => setProducts([]));
  };
  const loadMappings = () =>
    omniApi.listSkuMappings()
      .then((list) => setMappings(Object.fromEntries((list || []).map((m) => [m.sku, m.components]))))
      .catch(() => {});

  useEffect(() => { load(channel); }, [channel]);
  useEffect(() => {
    loadMappings();
    omniApi.listProducts().then((p) => setMasters(Array.isArray(p) ? p : [])).catch(() => {});
    omniApi.listStores().then((s) => setStores(Array.isArray(s) ? s : [])).catch(() => {});
  }, []);
  useEffect(() => { setStoreFilter("all"); }, [channel]);

  const syncCatalog = async () => {
    if (locked) return onRequirePayment?.();
    setSyncing(true); setNote(""); setNoteTone("neutral");
    try {
      const r = await syncCatalogPages(omniApi, ({ store, synced }) =>
        setNote(`Menarik produk ${store}… ${synced} produk tersimpan.`));
      const message = r.errors.length
        ? `${r.synced} produk tersimpan. Belum selesai: ${r.errors.map((error) => error.store).join(', ')}. Coba Sync Produk lagi.`
        : `${r.synced} produk tersinkron.`;
      setNote(message); setNoteTone(r.errors.length ? "unsync" : "sync");
      notify({ type: r.errors.length ? (r.synced ? 'warning' : 'error') : 'success',
        title: r.errors.length ? 'Sinkron produk belum lengkap' : 'Produk berhasil disinkronkan', description: message });
      load(channel);
    } catch (err) {
      if (isPaymentRequired(err)) return onRequirePayment?.();
      const message = err?.response?.data?.error?.message ?? err.message ?? "Gagal sinkron produk.";
      setNote(message); setNoteTone("error");
      notify({ type: 'error', title: 'Sinkron produk gagal', description: message });
    } finally {
      setSyncing(false);

    }
  };

  // ── Editor per-SKU ──
  const openEditor = (sku) => {
    const existing = mappings[sku];
    if (existing?.length) {
      setRows(existing.map((c) => ({ masterProductId: c.masterProductId, qty: c.qty })));
      setBundleMode(existing.length > 1);
    } else {
      setRows([{ masterProductId: "", qty: 1 }]);
      setBundleMode(false);
    }
    setFormErr("");
    setEditingSku(sku);
  };

  const setMode = (bundle) => {
    setBundleMode(bundle);
    if (!bundle) setRows((r) => r.slice(0, 1)); // single = tepat 1 komponen
  };

  const saveMapping = async () => {
    const clean = rows.filter((r) => r.masterProductId && Number(r.qty) >= 1)
      .map((r) => ({ masterProductId: r.masterProductId, qty: Number(r.qty) }));
    if (clean.length === 0) return setFormErr("Pilih master produk & kuantiti dulu.");
    if (clean.length !== rows.length) return setFormErr("Lengkapi semua baris (master + qty).");
    if (new Set(clean.map((c) => c.masterProductId)).size !== clean.length) return setFormErr("Master produk tidak boleh duplikat.");
    setSaving(true); setFormErr("");
    try {
      await omniApi.saveSkuMapping(editingSku, clean);
      await loadMappings();
      setEditingSku(null);
    } catch (err) {
      if (isPaymentRequired(err)) return onRequirePayment?.();
      setFormErr(err?.response?.data?.error?.message ?? "Gagal menyimpan pemetaan.");
    } finally {
      setSaving(false);
    }
  };

  const summaryOf = (sku) => {
    const c = mappings[sku];
    if (!c?.length) return null;
    return c.map((x) => `${x.masterName ?? "?"} ×${x.qty}`).join(" + ");
  };

  const mappedCount = (p) => (p.skus || []).filter((s) => mappings[s]?.length).length;

  const masterOptions = useMemo(
    () => masters.filter((m) => m.id && !String(m.id).startsWith("mock")),
    [masters],
  );

  const channelStores = useMemo(
    () => stores.filter((s) => s.channel === channel && s.status === "connected"),
    [stores, channel],
  );

  const isFullyMapped = useCallback((p) => {
    const total = (p.skus || []).length;
    return total > 0 && p.skus.every((s) => mappings[s]?.length);
  }, [mappings]);

  const visible = useMemo(() => {
    let list = products ?? [];
    const q = searchQ.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        (p.skus || []).some((s) => s.toLowerCase().includes(q)),
      );
    }
    if (storeFilter !== "all") list = list.filter((p) => p.storeId === storeFilter);
    if (mapFilter === "mapped") list = list.filter((p) => isFullyMapped(p));
    if (mapFilter === "unmapped") list = list.filter((p) => !isFullyMapped(p));
    return list;
  }, [products, searchQ, storeFilter, mapFilter, isFullyMapped]);

  const countMapped = useMemo(() => (products ?? []).filter((p) => isFullyMapped(p)).length, [products, isFullyMapped]);
  const countUnmapped = (products?.length ?? 0) - countMapped;

  return (
    <div className="mp-products">
      <div className="mp-products-head">
        <div>
          <h1 className="pm-title">Produk Marketplaces</h1>
          <p className="pm-subtitle">Produk dari toko marketplace untuk ditautkan ke Master Produk</p>
        </div>
        <button className="pm-btn pm-btn-add-product" onClick={syncCatalog} disabled={syncing}>
          <RefreshCw size={14} className={syncing ? "spin" : ""} />
          <span>{syncing ? "Menyinkron…" : "Sync Produk"}</span>
        </button>
      </div>

      <div className="mp-subtabs">
        {SUB_TABS.map((t) => (
          <button key={t.key} className={`mp-subtab ${channel === t.key ? "active" : ""}`} onClick={() => setChannel(t.key)}>
            <img src={t.logo} alt={t.label} className="mp-subtab-logo" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Pencarian · tab pemetaan · filter toko */}
      <div className="mpp-toolbar">
        <div className="mpp-search">
          <Search size={14} className="mpp-search-icon" />
          <input
            type="text"
            placeholder="Cari produk atau SKU…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          {searchQ && <button className="mpp-search-clear" aria-label="Hapus pencarian" onClick={() => setSearchQ("")}><X size={12} /></button>}
        </div>

        <div className="mpp-map-tabs">
          <button className={`mpp-map-tab ${mapFilter === "all" ? "active" : ""}`} onClick={() => setMapFilter("all")}>
            Semua ({products?.length ?? 0})
          </button>
          <button className={`mpp-map-tab ${mapFilter === "mapped" ? "active" : ""}`} onClick={() => setMapFilter("mapped")}>
            Sudah dipetakan ({countMapped})
          </button>
          <button className={`mpp-map-tab ${mapFilter === "unmapped" ? "active" : ""}`} onClick={() => setMapFilter("unmapped")}>
            Belum dipetakan ({countUnmapped})
          </button>
        </div>

        <select className="mpp-store-filter" value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
          <option value="all">Semua Toko</option>
          {channelStores.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
        </select>
      </div>

      {note && <div role="status" aria-live="polite" className={`omni-pill ${noteTone}`} style={{ marginBottom: 12 }}>{note}</div>}

      {products === null ? (
        <div className="mp-products-panel"><div className="mp-products-empty"><RefreshCw size={26} className="spin text-gray" /><p>Memuat produk…</p></div></div>
      ) : products.length === 0 ? (
        <div className="mp-products-panel">
          <div className="mp-products-empty">
            <PackageOpen size={30} className="text-gray" />
            <h4>Belum ada produk {channel === "shopee" ? "Shopee" : "TikTok"}</h4>
            <p>Klik <b>Sync Produk</b> untuk menarik semua produk (aktif &amp; non-aktif) dari toko marketplace-mu.</p>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="mp-products-panel">
          <div className="mp-products-empty">
            <Search size={26} className="text-gray" />
            <h4>Tidak ada produk yang cocok</h4>
            <p>Coba ubah kata kunci, tab pemetaan, atau filter toko.</p>
          </div>
        </div>
      ) : (
        <div className="mpp-grid">
          {visible.map((p) => {
            const total = (p.skus || []).length;
            const done = mappedCount(p);
            const allMapped = total > 0 && done === total;
            return (
              <div key={p.id} className={`mpp-card ${p.status !== "active" ? "inactive" : ""}`}>
                <div className="mpp-card-img">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.title} loading="lazy" />
                    : <div className="mpp-card-noimg"><ImageOff size={22} /></div>}
                  <span className={`mp-status-badge ${p.status}`}>{p.status === "active" ? "Aktif" : "Non-aktif"}</span>
                </div>
                <div className="mpp-card-body">
                  <div className="mpp-card-title" title={p.title}>{p.title}</div>
                  <div className="mpp-card-skus">
                    {total === 0
                      ? <span className="mp-sku-empty">Tanpa SKU</span>
                      : p.skus.map((s, i) => (
                          <span key={i} className={`mp-sku-chip ${mappings[s]?.length ? "mapped" : ""}`} title={summaryOf(s) ?? "Belum dipetakan"}>
                            {mappings[s]?.length ? <Check size={9} strokeWidth={3} /> : null}{s}
                          </span>
                        ))}
                  </div>
                </div>
                <button className={`mp-map-btn ${allMapped ? "mapped" : ""}`} onClick={() => setMapProduct(p)} disabled={total === 0}>
                  {allMapped
                    ? <><Check size={13} /> Terpetakan ({done}/{total} SKU)</>
                    : <><Link2 size={13} /> Petakan ke Master Produk{done > 0 ? ` (${done}/${total})` : ""}</>}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <MarketplaceMappingDialog {...{ mapProduct, setMapProduct, setEditingSku, summaryOf,
        editingSku, openEditor, bundleMode, setMode, rows, setRows, masterOptions, formErr, saveMapping, saving }} />
    </div>
  );
}
