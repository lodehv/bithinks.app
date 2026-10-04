import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { NOTIFICATION_EVENT } from "./notificationBus";
import "./notifications.css";

const ICONS = { success: CheckCircle2, error: AlertCircle, warning: TriangleAlert, info: Info };

export default function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Map());

  useEffect(() => {
    const timerMap = timers.current;
    const remove = (id) => {
      window.clearTimeout(timerMap.get(id));
      timerMap.delete(id);
      setItems((current) => current.filter((item) => item.id !== id));
    };
    const receive = (event) => {
      const detail = event.detail ?? {};
      const id = ++nextId.current;
      setItems((current) => {
        const duplicate = current.some((item) => item.type === detail.type
          && item.title === detail.title && item.description === detail.description);
        if (duplicate) return current;
        return [...current.slice(-3), { id, ...detail }];
      });
      const automatic = detail.type === "success" || detail.type === "info";
      if (automatic) {
        const duration = Number.isFinite(detail.duration) ? detail.duration : 6000;
        timerMap.set(id, window.setTimeout(() => remove(id), duration));
      }
    };
    window.addEventListener(NOTIFICATION_EVENT, receive);
    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, receive);
      timerMap.forEach((timer) => window.clearTimeout(timer));
      timerMap.clear();
    };
  }, []);

  const dismiss = (id) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <>
      {children}
      <div className="ds-flag-group" aria-label="Notifikasi">
        {items.map((item) => {
          const Icon = ICONS[item.type] ?? Info;
          const urgent = item.type === "error" || item.type === "warning";
          return (
            <section
              className={`ds-flag ds-flag-${item.type}`}
              key={item.id}
              role={urgent ? "alert" : "status"}
              aria-live={urgent ? "assertive" : "polite"}
            >
              <Icon className="ds-flag-icon" size={20} aria-hidden="true" />
              <div className="ds-flag-content">
                <div className="ds-flag-title">{item.title}</div>
                {item.description && <div className="ds-flag-description">{item.description}</div>}
              </div>
              <button
                type="button"
                className="ds-flag-dismiss"
                aria-label="Tutup notifikasi"
                onClick={() => dismiss(item.id)}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </section>
          );
        })}
      </div>
    </>
  );
}
