// Date and time formatting, following the Atlassian date and time guidance:
// a date is written so it cannot be misread, and the format says how far away
// the moment is rather than repeating a timestamp nobody decodes.
//
// Rules this file applies:
//   - The month is a word, never a digit. "09/03" means two different days
//     depending on who reads it; "3 Sep" means one.
//   - The year appears only when the date is outside the current year.
//   - Time is 24-hour, which is how Indonesian receipts and marketplaces print
//     it, and how the shop staff read a cut-off time.
//   - Recent moments are relative, because "5 menit lalu" answers the question
//     the reader actually has.
//
// Product copy stays Indonesian: these strings are read by shop owners.

const LOCALE = 'id-ID'

// Warehouse and ledger rows carry a server timestamp that means a wall-clock
// moment in the shop, so they are read in Jakarta time whatever the laptop is
// set to.
export const WIB = 'Asia/Jakarta'

const toDate = (value) => {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'string') {
    // A bare calendar date has no time zone. Reading it as UTC shifts it a day
    // backwards for every user east of Greenwich, which is all of them.
    const bare = /^\d{4}-\d{2}-\d{2}$/.test(value)
    return new Date(bare ? `${value}T00:00:00` : value)
  }
  return null
}

const valid = (d) => d instanceof Date && !Number.isNaN(d.getTime())

const sameYear = (d, now) => d.getFullYear() === now.getFullYear()

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/**
 * 3 Sep, or 3 Sep 2025 once the date leaves the current year.
 * Pass weekday when the day of the week is what the reader is looking for,
 * as in an attendance list: "Rab, 3 Sep".
 */
export function formatDate(value, { year = 'auto', weekday = false, month = 'short', timeZone } = {}) {
  const d = toDate(value)
  if (!valid(d)) return '-'
  const withYear = year === 'always' || (year === 'auto' && !sameYear(d, new Date()))
  return d.toLocaleDateString(LOCALE, {
    ...(weekday ? { weekday: 'short' } : {}),
    day: 'numeric',
    month,
    ...(withYear ? { year: 'numeric' } : {}),
    ...(timeZone ? { timeZone } : {}),
  })
}

/** Rabu, 3 September 2026. Used for a single prominent date, not for a list. */
export function formatDateLong(value) {
  const d = toDate(value)
  if (!valid(d)) return '-'
  return d.toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** 14:05 */
export function formatTime(value, { seconds = false, timeZone } = {}) {
  const d = toDate(value)
  if (!valid(d)) return '-'
  return d.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
    ...(timeZone ? { timeZone } : {}),
    hour12: false,
  })
}

/** 3 Sep 14:05, with the year added once the date leaves the current year. */
export function formatDateTime(value, options = {}) {
  const d = toDate(value)
  if (!valid(d)) return '-'
  return `${formatDate(d, options)} ${formatTime(d, options)}`
}

/** September 2026 */
export function formatMonth(value) {
  const d = toDate(value)
  if (!valid(d)) return '-'
  return d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
}

/**
 * How long ago something happened, in the words a reader would use.
 * Falls back to an absolute date once "lalu" stops being useful.
 */
export function formatRelative(value, now = new Date()) {
  const d = toDate(value)
  if (!valid(d)) return '-'

  const detik = Math.round((now - d) / 1000)
  if (detik < 0) return formatDateTime(d)
  if (detik < 60) return 'baru saja'
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`
  if (detik < 86400 && startOfDay(d).getTime() === startOfDay(now).getTime()) {
    return `${Math.floor(detik / 3600)} jam lalu`
  }

  const selisihHari = Math.round((startOfDay(now) - startOfDay(d)) / 86400000)
  if (selisihHari === 1) return `Kemarin ${formatTime(d)}`
  if (selisihHari < 7) return `${selisihHari} hari lalu`
  return formatDateTime(d)
}

/** The number of whole days between two dates, ignoring the time of day. */
export function daysBetween(from, to = new Date()) {
  const a = toDate(from)
  const b = toDate(to)
  if (!valid(a) || !valid(b)) return null
  return Math.round((startOfDay(b) - startOfDay(a)) / 86400000)
}

/** YYYY-MM-DD in local time, for a date input or an API query parameter. */
export function toDateInput(value) {
  const d = toDate(value)
  if (!valid(d)) return ''
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const tanggal = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${bulan}-${tanggal}`
}
