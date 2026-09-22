import { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera, MapPin, CheckCircle, XCircle,
  Loader2, RotateCcw, LogIn, LogOut, RefreshCw
} from "lucide-react";
import "./Absensi.css";
import { useAppContext } from "../../../context/AppContext";
import api from "../../../utils/api";

// ─── Clock ────────────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const date = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="absensi-clock-card">
      <div className="absensi-clock-time">{time}</div>
      <div className="absensi-clock-date">{date}</div>
    </div>
  );
}

// ─── GPS hook ─────────────────────────────────────────────────────────────────
function useGps(enabled = true) {
  const [state, setState] = useState({ status: "idle", lat: null, lng: null, label: "" });

  const fetch = useCallback(() => {
    if (!enabled) {
      setState({ status: "idle", lat: null, lng: null, label: "" });
      return;
    }
    setState({ status: "loading", lat: null, lng: null, label: "Mengambil lokasi..." });
    if (!navigator.geolocation) {
      setState({ status: "error", lat: null, lng: null, label: "GPS tidak didukung browser ini" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setState({
          status: "ok",
          lat, lng,
          label: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
      },
      () => setState({ status: "error", lat: null, lng: null, label: "Akses lokasi ditolak" }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [enabled]);

  useEffect(() => { if (enabled) fetch(); }, [enabled, fetch]);
  return { ...state, refetch: fetch };
}

// ─── Camera component ─────────────────────────────────────────────────────────
function SelfieCapture({ onCapture, onClear, captured }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [camOn, setCamOn] = useState(false);
  const [error, setError] = useState("");

  const startCam = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      setCamOn(true);
      // srcObject di-assign setelah render via useEffect di bawah
    } catch {
      setError("Akses kamera ditolak. Izinkan kamera di browser Anda.");
    }
  };

  const stopCam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCamOn(false);
  };

  // Setelah camOn=true dan <video> muncul di DOM, assign stream ke srcObject
  useEffect(() => {
    if (camOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [camOn]);

  const capture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    // Resize ke max 480px agar base64 tidak terlalu besar (~80KB)
    const maxW = 480;
    const scale = Math.min(1, maxW / video.videoWidth);
    canvas.width  = Math.round(video.videoWidth  * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    stopCam();
    onCapture(dataUrl);
  };

  const clear = () => { onClear(); };

  useEffect(() => () => stopCam(), []);

  return (
    <div className="selfie-card">
      <div className="selfie-header">
        <Camera size={15} strokeWidth={2} />
        Foto Selfie
        <span className="selfie-header-sub">
          {captured ? "Foto siap" : camOn ? "Kamera aktif" : "Belum difoto"}
        </span>
      </div>

      <div className="selfie-preview">
        {/* Tampil hasil foto */}
        {captured && <img src={captured} alt="selfie" />}

        {/* Tampil kamera live */}
        {!captured && camOn && (
          <>
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="selfie-guide">
              <div className="selfie-guide-oval" />
            </div>
          </>
        )}

        {/* Placeholder */}
        {!captured && !camOn && (
          <div className="selfie-placeholder">
            <Camera size={36} strokeWidth={1.5} />
            <p>Klik "Buka Kamera" untuk mulai</p>
            {error && <p style={{ color: "#C9372C" }}>{error}</p>}
          </div>
        )}

        <canvas ref={canvasRef} />
      </div>

      <div className="selfie-actions">
        {!captured && !camOn && (
          <button className="btn-selfie primary" onClick={startCam}>
            <Camera size={15} strokeWidth={2} /> Buka Kamera
          </button>
        )}
        {!captured && camOn && (
          <>
            <button className="btn-selfie secondary" onClick={stopCam}>
              <XCircle size={15} strokeWidth={2} /> Batal
            </button>
            <button className="btn-selfie primary" onClick={capture}>
              <Camera size={15} strokeWidth={2} /> Ambil Foto
            </button>
          </>
        )}
        {captured && (
          <>
            <button className="btn-selfie secondary" onClick={clear}>
              <RotateCcw size={14} strokeWidth={2} /> Ulangi
            </button>
            <button className="btn-selfie primary" style={{ background: "#DFFCF0", color: "#22A06B" }} disabled>
              <CheckCircle size={15} strokeWidth={2} /> Foto OK
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── GPS card ─────────────────────────────────────────────────────────────────
function GpsCard({ gps }) {
  const iconClass = gps.status === "ok" ? "ok" : gps.status === "loading" ? "loading" : "error";
  return (
    <div className="gps-card">
      <div className={`gps-icon ${iconClass}`}>
        {gps.status === "loading"
          ? <Loader2 size={18} strokeWidth={2} className="spin" />
          : <MapPin size={18} strokeWidth={2} />}
      </div>
      <div className="gps-info">
        <div className="gps-label">Lokasi GPS</div>
        <div className="gps-value">{gps.label || "–"}</div>
      </div>
      {gps.status !== "loading" && (
        <button onClick={gps.refetch} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 4 }} title="Refresh lokasi">
          <RefreshCw size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Absensi({ locked = false, onRequirePayment }) {
  const { user } = useAppContext();
  const gps = useGps(!locked);

  const [photo, setPhoto]         = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState(null); // { type: "checkin"|"checkout", time }
  const [todayLog, setTodayLog]   = useState(null); // data absensi hari ini
  const [loadingLog, setLoadingLog] = useState(true);

  // Ambil status absensi hari ini
  const fetchTodayLog = useCallback(async () => {
    setLoadingLog(true);
    try {
      const res = await api.get("/api/hrm/attendance/today");
      setTodayLog(res.data.data);
    } catch {
      setTodayLog(null);
    } finally {
      setLoadingLog(false);
    }
  }, []);

  useEffect(() => { fetchTodayLog(); }, [fetchTodayLog]);

  const hasCheckedIn  = todayLog?.checkIn  != null;
  const hasCheckedOut = todayLog?.checkOut != null;
  const actionType    = hasCheckedIn && !hasCheckedOut ? "checkout" : "checkin";

  const canSubmit = !locked && photo && gps.status === "ok" && !submitting;

  const handleSubmit = async () => {
    if (locked) return onRequirePayment?.();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.post("/api/hrm/attendance/checkin", {
        type:  actionType,
        photo, // base64
        lat:   gps.lat,
        lng:   gps.lng,
      });
      const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      setResult({ type: actionType, time });
      setPhoto(null);
      await fetchTodayLog();
    } catch (err) {
      const msg = err?.response?.data?.error?.message
        ?? err?.response?.data?.message
        ?? err?.message
        ?? "Gagal menyimpan absensi. Coba lagi.";
      console.error("[Absensi] submit error:", err?.response?.data ?? err);
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Tampilan setelah berhasil ─────────────────────────────────────────────
  if (result) {
    const isIn = result.type === "checkin";
    return (
      <div className="absensi-wrap">
        <div className="absensi-success">
          <div className={`absensi-success-icon ${result.type}`}>
            {isIn ? <CheckCircle size={32} strokeWidth={2} /> : <LogOut size={32} strokeWidth={2} />}
          </div>
          <h3>{isIn ? "Check-In Berhasil!" : "Check-Out Berhasil!"}</h3>
          <p>Waktu tercatat: <strong>{result.time}</strong></p>
          <button className="btn-reset" onClick={() => setResult(null)}>
            <RotateCcw size={14} strokeWidth={2} /> Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absensi-wrap">
      {/* Jam */}
      <LiveClock />

      {/* Status hari ini */}
      {!loadingLog && (
        <div className="absensi-status-card">
          <div className={`absensi-status-icon ${hasCheckedIn ? (hasCheckedOut ? "checkout" : "checkin") : "idle"}`}>
            {hasCheckedOut
              ? <LogOut size={22} strokeWidth={2} />
              : hasCheckedIn
              ? <LogIn size={22} strokeWidth={2} />
              : <Camera size={22} strokeWidth={2} />}
          </div>
          <div className="absensi-status-info">
            <div className="absensi-status-label">Status Hari Ini</div>
            <div className="absensi-status-value">
              {hasCheckedOut
                ? "Sudah Check-Out"
                : hasCheckedIn
                ? "Sudah Check-In"
                : "Belum Absen"}
            </div>
            <div className="absensi-status-sub">
              {hasCheckedIn && `Masuk: ${new Date(todayLog.checkIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
              {hasCheckedOut && ` · Keluar: ${new Date(todayLog.checkOut).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
              {!hasCheckedIn && `Halo, ${user?.name?.split(" ")[0]}! Silakan absen masuk.`}
            </div>
          </div>
        </div>
      )}

      {/* Jika sudah checkout penuh */}
      {hasCheckedOut ? (
        <div style={{ textAlign: "center", padding: "24px", background: "#fff", border: "1px solid #DCDFE4", borderRadius: 14, color: "#aaa", fontSize: 13 }}>
          <CheckCircle size={28} strokeWidth={1.8} color="#22A06B" style={{ marginBottom: 10 }} />
          <p style={{ margin: 0, fontWeight: 600, color: "#111" }}>Absensi hari ini selesai</p>
          <p style={{ marginTop: 4 }}>Sampai jumpa besok!</p>
        </div>
      ) : (
        <>
          {locked && (
            <div style={{ padding: 14, marginBottom: 12, borderRadius: 10, background: "#FFECEB", color: "#AE2E24", fontSize: 13 }}>
              Mode hanya-baca aktif. Riwayat kehadiran tetap tersedia, tetapi check-in dan check-out berhenti sementara.
            </div>
          )}

          {!locked && (
            <>
              {/* Selfie */}
              <SelfieCapture
                captured={photo}
                onCapture={setPhoto}
                onClear={() => setPhoto(null)}
              />

              {/* GPS */}
              <GpsCard gps={gps} />

              {/* Submit */}
              <button
                className={`btn-absensi ${actionType}`}
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {submitting
                  ? <><Loader2 size={18} strokeWidth={2} className="spin" /> Menyimpan...</>
                  : actionType === "checkin"
                  ? <><LogIn size={18} strokeWidth={2} /> Check-In Sekarang</>
                  : <><LogOut size={18} strokeWidth={2} /> Check-Out Sekarang</>
                }
              </button>

              {!photo && (
                <p style={{ textAlign: "center", fontSize: 12, color: "#bbb", marginTop: -8 }}>
                  Ambil foto selfie terlebih dahulu untuk melanjutkan
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
