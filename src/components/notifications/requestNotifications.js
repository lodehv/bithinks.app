import api from "../../utils/api";
import { notify } from "./notificationBus";
import { errorMessage, isMutation, isStoreDisconnect, semanticFailure, shouldNotifyError, successMessage } from "./requestNotificationModel";

let installed = false;
let lastInteractionAt = 0;

function onDashboard() {
  return window.location.pathname.startsWith("/dashboard");
}

export function installRequestNotifications() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const markInteraction = () => { lastInteractionAt = Date.now(); };
  window.addEventListener("click", markInteraction, true);
  window.addEventListener("submit", markInteraction, true);

  api.interceptors.request.use((config) => {
    config.bithinksUserAction = Date.now() - lastInteractionAt < 1500;
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      const config = response.config;
      const failure = semanticFailure(response);
      if (onDashboard() && config?.notifications !== false) {
        if (failure) notify({ type: "error", title: "Aksi gagal", description: failure });
        else if (isMutation(config)) notify({ type: "success", ...successMessage(config) });
      }
      return response;
    },
    (error) => {
      const config = error?.config;
      if (onDashboard() && shouldNotifyError(error)) {
        notify({
          type: "error",
          title: isStoreDisconnect(config) ? "Toko belum dapat diputuskan" : "Aksi gagal",
          description: errorMessage(error),
        });
      }
      return Promise.reject(error);
    },
  );
}
