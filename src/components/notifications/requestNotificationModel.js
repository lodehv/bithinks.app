const MUTATIONS = new Set(["post", "put", "patch", "delete"]);

function endpoint(config) {
  return String(config?.url ?? "").split("?")[0];
}

export function isMutation(config) {
  return MUTATIONS.has(config?.method?.toLowerCase());
}

export function isStoreDisconnect(config) {
  return config?.method?.toLowerCase() === "delete"
    && /^\/api\/omni\/stores\/[^/]+$/.test(endpoint(config));
}

export function successMessage(config) {
  if (isStoreDisconnect(config)) return {
    title: "Toko berhasil diputuskan",
    description: "Riwayat tetap tersimpan. Toko dapat diintegrasikan kembali kapan saja.",
  };
  const method = config?.method?.toLowerCase();
  if (method === "delete") return { title: "Data berhasil dihapus" };
  if (method === "post") return { title: "Permintaan berhasil diproses" };
  return { title: "Perubahan berhasil disimpan" };
}

export function errorMessage(error) {
  if (error?.friendlyMessage) return error.friendlyMessage;
  if (error?.code === "ECONNABORTED") return "Server membutuhkan waktu terlalu lama. Coba lagi.";
  return error?.response?.data?.error?.message
    ?? "Permintaan tidak dapat diproses. Coba lagi.";
}

export function semanticFailure(response) {
  const result = response?.data?.data;
  return result?.ok === false
    ? result.message ?? "Aksi belum dapat diproses. Coba lagi."
    : null;
}

export function shouldNotifyError(error) {
  const status = error?.response?.status;
  const config = error?.config;
  return config?.notifications !== false
    && (config?.bithinksUserAction || isMutation(config))
    && status !== 401
    && status !== 402
    && error?.code !== "ERR_CANCELED";
}
