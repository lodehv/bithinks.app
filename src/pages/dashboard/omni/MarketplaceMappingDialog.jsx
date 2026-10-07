import { X, Check, Plus, Trash2 } from "lucide-react";

export default function MarketplaceMappingDialog({ mapProduct, setMapProduct, setEditingSku, summaryOf, editingSku, openEditor, bundleMode, setMode, rows, setRows, masterOptions, formErr, saveMapping, saving }) {
  if (!mapProduct) return null;
  return (

        <div className="skum-overlay" onClick={() => { setMapProduct(null); setEditingSku(null); }}>
          <div className="skum-modal" onClick={(e) => e.stopPropagation()}>
            <div className="skum-head">
              <div>
                <h3>Petakan SKU ke Master Produk</h3>
                <p className="skum-sub" title={mapProduct.title}>{mapProduct.title}</p>
              </div>
              <button className="skum-close" aria-label="Tutup pemetaan SKU" onClick={() => { setMapProduct(null); setEditingSku(null); }}><X size={18} /></button>
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

  );
}
