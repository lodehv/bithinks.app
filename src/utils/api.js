import axios from 'axios'
import { announcePaymentRequired } from './paymentRequired'

// ─────────────────────────────────────────────────────────────────────────────
// Axios Instance — client HTTP untuk komunikasi dengan PADU Backend API
// Base URL diambil dari environment variable VITE_API_URL
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function getAccessToken() {
  try { return JSON.parse(localStorage.getItem('padu-auth') ?? 'null')?.accessToken ?? null }
  catch { return null }
}

export function handleUnauthorized() {
  localStorage.removeItem('padu-auth')
  if (!['/login', '/register'].includes(window.location.pathname)) window.location.href = '/login'
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor
// Otomatis sisipkan Authorization header dari localStorage
// ─────────────────────────────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

// ─────────────────────────────────────────────────────────────────────────────
// Response Interceptor
// Handle error global:
//   401 → hapus auth dari localStorage dan redirect ke /login
//   Network error → berikan pesan yang ramah
// ─────────────────────────────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleUnauthorized()
    }

    // US-02: one authoritative payment-required signal for every feature.
    // Components may still show local context, while Dashboard owns the
    // global view-only state and the server-provided TOP_UP action.
    announcePaymentRequired(error)

    // Tambahkan pesan error yang ramah jika tidak ada koneksi ke server
    if (!error.response && error.code === 'ERR_NETWORK') {
      error.friendlyMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
    }

    return Promise.reject(error)
  },
)

// ─────────────────────────────────────────────────────────────────────────────
// Helper — ambil pesan error dari response API secara konsisten
// Mengembalikan string pesan yang siap ditampilkan ke user
// ─────────────────────────────────────────────────────────────────────────────

export function getApiErrorMessage(error, fallback = 'Terjadi kesalahan. Coba lagi.') {
  if (error?.friendlyMessage) return error.friendlyMessage
  if (error?.response?.data?.error?.message) return error.response.data.error.message
  if (error?.message) return error.message
  return fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — ambil error code dari response API
// Berguna untuk handle kondisi tertentu (misal: OTP_EXPIRED vs OTP_INVALID)
// ─────────────────────────────────────────────────────────────────────────────

export function getApiErrorCode(error) {
  return error?.response?.data?.error?.code ?? null
}

export default api
