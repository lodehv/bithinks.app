import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Upload, Trash2 } from "lucide-react";
import { omniApi } from "../../../../utils/omniApi";

// ─────────────────────────────────────────────────────────────────────────────
// Kop surat — identitas perusahaan pelanggan untuk dokumen yang keluar (PO).
//
// Logo disimpan sebagai gambar tertanam (data URI), bukan berkas terunggah,
// karena aplikasi ini belum punya penyimpanan berkas sama sekali. Konsekuensinya
// ukurannya dibatasi — dan itu dijelaskan apa adanya ke user, bukan dibiarkan
// gagal diam-diam saat menyimpan.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_BYTES = 180 * 1024;

export default function WmsCompanyForm({ onBack, onError }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    omniApi.companyProfile()
      .then((d) => setForm({
        name: d.name ?? "", address: d.address ?? "", phone: d.phone ?? "",
        email: d.email ?? "", taxId: d.taxId ?? "", logo: d.logo ?? null,
      }))
      .catch(() => setForm(false));
  }, []);

  const patch = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg({ type: "err", text: "Berkas harus berupa gambar (PNG, JPG, atau WebP)." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setMsg({
        type: "err",
        text: `Logo terlalu besar (${Math.round(file.size / 1024)} KB). Maksimal 180 KB — perkecil dulu gambarnya.`,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { patch("logo", String(reader.result)); setMsg(null); };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await omniApi.saveCompanyProfile({ ...form, logo: form.logo ?? "" });
      setMsg({ type: "ok", text: "Kop surat tersimpan. Dokumen PO berikutnya akan memakainya." });
    } catch (err) {
      if (onError?.(err)) return;
      setMsg({ type: "err", text: err?.response?.data?.error?.message ?? "Gagal menyimpan." });
    } finally { setSaving(false); }
  };

  if (form === null) return <div className="omni-loading">Memuat profil perusahaan…</div>;
  if (form === false) return <div className="omni-inline-msg">Gagal memuat profil perusahaan.</div>;

  return (
    <div>
      <div className="omni-toolbar">
        <button className="omni-btn omni-btn-ghost" onClick={onBack}><ArrowLeft size={14} /> Kembali</button>
        <button className="omni-btn omni-btn-primary" onClick={save} disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan Kop Surat"}
        </button>
      </div>

      {msg && <div className={`wms-msg ${msg.type}`}>{msg.text}</div>}

      <div className="wms-panel">
        <div className="wms-panel-head">
          <div>
            <div className="wms-panel-title">Identitas Perusahaan</div>
            <div className="wms-panel-sub">
              Dipakai sebagai kop dokumen yang dikirim ke pihak luar, seperti Purchase Order.
              Ini identitas perusahaan Anda sendiri — bukan penyedia aplikasi.
            </div>
          </div>
        </div>

        <div className="wms-company-grid">
          <div className="omni-field">
            <label>Nama perusahaan</label>
            <input className="omni-input" value={form.name} onChange={(e) => patch("name", e.target.value)} />
          </div>
          <div className="omni-field">
            <label>NPWP</label>
            <input className="omni-input" value={form.taxId} onChange={(e) => patch("taxId", e.target.value)} />
          </div>
          <div className="omni-field" style={{ gridColumn: "1 / -1" }}>
            <label>Alamat</label>
            <input className="omni-input" value={form.address} onChange={(e) => patch("address", e.target.value)}
              placeholder="Jalan, kota, kode pos" />
          </div>
          <div className="omni-field">
            <label>Telepon</label>
            <input className="omni-input" value={form.phone} onChange={(e) => patch("phone", e.target.value)} />
          </div>
          <div className="omni-field">
            <label>Email</label>
            <input className="omni-input" value={form.email} onChange={(e) => patch("email", e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="wms-ledger-detail-label">Logo</div>
          <div className="wms-edit-bar" style={{ marginTop: 8 }}>
            {form.logo
              ? <img src={form.logo} alt="" className="wms-logo-preview" />
              : <div className="wms-logo-empty">Belum ada logo</div>}
            <button className="omni-btn omni-btn-ghost" onClick={() => fileRef.current?.click()}>
              <Upload size={13} /> {form.logo ? "Ganti Logo" : "Unggah Logo"}
            </button>
            {form.logo && (
              <button className="omni-btn omni-btn-ghost" onClick={() => patch("logo", null)}>
                <Trash2 size={13} /> Hapus
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickLogo} />
          </div>
          <div className="wms-edit-note">
            Gambar disimpan menyatu dengan data perusahaan, jadi ukurannya dibatasi maksimal
            180 KB. Ukuran sekitar 400×200 piksel sudah cukup tajam untuk dicetak.
          </div>
        </div>
      </div>
    </div>
  );
}
