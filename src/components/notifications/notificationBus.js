export const NOTIFICATION_EVENT = "bithinks:notification";

const TYPES = new Set(["success", "error", "warning", "info"]);

export function notify({ type = "info", title, description = "", duration }) {
  if (typeof window === "undefined" || !String(title ?? "").trim()) return;
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, {
    detail: {
      type: TYPES.has(type) ? type : "info",
      title: String(title).trim(),
      description: String(description ?? "").trim(),
      duration,
    },
  }));
}
