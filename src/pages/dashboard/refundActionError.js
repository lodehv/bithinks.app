export function refundActionError(error, uncertainMessage) {
  const status = error?.response?.status
  if ([400, 401, 403, 404, 409, 422].includes(status)) {
    return error.response.data?.error?.message || 'Permintaan ditolak. Tutup dialog, muat ulang status, lalu periksa kembali data dan akses Anda.'
  }
  return uncertainMessage
}
