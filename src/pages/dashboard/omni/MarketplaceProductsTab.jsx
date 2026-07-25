import { useEffect, useMemo, useState } from "react";
import { PackageOpen, RefreshCw, Link2, Check, ImageOff, X, Plus, Trash2 } from "lucide-react";
import { omniApi, isPaymentRequired } from "../../../utils/omniApi";
import shopeeLogo from "../../../assets/logo_pilihan_fitur/shopee.png";
import tiktokLogo from "../../../assets/logo_pilihan_fitur/logo_tiktok.jpg";

// ─────────────────────────────────────────────────────────────────────────────
// Produk Marketplaces — grid etalase (6/baris). Tiap etalase membungkus SKU;
// tiap SKU dipetakan ke master produk (single = 1 komponen, bundle = >1) + qty.
// Resep ini jadi dasar movement stok & COGS.
// ─────────────────────────────────────────────────────────────────────────────

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
  }, []);

  const syncCatalog = async () => {
    if (locked) return onRequirePayment?.();
    setSyncing(true); setNote("");
    try {
      const r = await omniApi.syncProductCatalog();
      setNote(`${r?.synced ?? 0} produk tersinkron.`);
      load(channel);
    } catch (err) {
      if (isPaymentRequired(err)) return onRequirePayment?.();
      setNote(err?.response?.data?.error?.message ?? "Gagal sinkron produk.");
    } finally {
      setSyncing(false);
      setTimeout(() => setNote(""), 5000);
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

      {note && <div className="omni-pill sync" style={{ marginBottom: 12 }}><Check size={12} /> {note}</div>}

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
      ) : (
        <div className="mpp-grid">
          {products.map((p) => {
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

      {/* ── Modal pemetaan SKU per etalase ── */}
      {mapProduct && (
        <div className="skum-overlay" onClick={() => { setMapProduct(null); setEditingSku(null); }}>
          <div className="skum-modal" onClick={(e) => e.stopPropagation()}>
            <div className="skum-head">
              <div>
                <h3>Petakan SKU ke Master Produk</h3>
                <p className="skum-sub" title={mapProduct.title}>{mapProduct.title}</p>
              </div>
              <button className="skum-close" onClick={() => { setMapProduct(null); setEditingSku(null); }}><X size={18} /></button>
            </div>

            <div className="skum-body">
              {(mapProduct.skus || []).map((sku) => {
                const summary = summaryOf(sku);
                const isEditing = editingSku === sku;
                return (
                  <div key={sku} className={`skum-row ${isEditing ? "editing" : ""}`}>
                    <div className="skum-row-head">
                      <div className="skum-row-info">
                        <span className="skum-sku">{sku}</span>
                        {summary
                          ? <span className="skum-summary"><Check size={11} strokeWidth={3} /> {summary}</span>
                          : <span className="skum-unmapped">Belum dipetakan</span>}
                      </div>
                      {!isEditing && (
                        <button className="skum-edit-btn" onClick={() => openEditor(sku)}>
                          {summary ? "Ubah" : "Petakan"}
                        </button>
                      )}
                    </div>

                    {isEditing && (
                      <div className="skum-editor">
                        {/* Single / Bundle */}
                        <div className="skum-type">
                          <label className={`skum-type-opt ${!bundleMode ? "on" : ""}`}>
                            <input type="radio" name={`type-${sku}`} checked={!bundleMode} onChange={() => setMode(false)} />
                            Single <small>1 master produk</small>
                          </label>
                          <label className={`skum-type-opt ${bundleMode ? "on" : ""}`}>
                            <input type="radio" name={`type-${sku}`} checked={bundleMode} onChange={() => setMode(true)} />
                            Bundle <small>gabungan beberapa produk</small>
                          </label>
                        </div>

                        {/* Komponen resep */}
                        {rows.map((r, idx) => (
                          <div key={idx} className="skum-comp">
                            <select
                              value={r.masterProductId}
                              onChange={(e) => setRows((cur) => cur.map((x, i) => (i === idx ? { ...x, masterProductId: e.target.value } : x)))}
                            >
                              <option value="">— Pilih master produk —</option>
                              {masterOptions.map((m) => (
                                <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
                              ))}
                            </select>
                            <input
                              type="number" min="1" value={r.qty}
                              onChange={(e) => setRows((cur) => cur.map((x, i) => (i === idx ? { ...x, qty: e.target.value } : x)))}
                              title="Kuantiti yang keluar per 1 movement SKU ini"
                            />
                            {bundleMode && rows.length > 1 && (
                              <button className="skum-del" onClick={() => setRows((cur) => cur.filter((_, i) => i !== idx))} title="Hapus baris">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}

                        {bundleMode && (
                          <button className="skum-add" onClick={() => setRows((cur) => [...cur, { masterProductId: "", qty: 1 }])}>
                            <Plus size={13} /> Tambah produk
                          </button>
                        )}

                        {formErr && <div className="skum-err">{formErr}</div>}
                        <div className="skum-actions">
                          <button className="skum-cancel" onClick={() => setEditingSku(null)}>Batal</button>
                          <button className="skum-save" onClick={saveMapping} disabled={saving}>
                            {saving ? "Menyimpan…" : "Simpan Pemetaan"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
