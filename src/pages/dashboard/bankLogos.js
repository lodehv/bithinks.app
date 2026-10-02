const BANK_CODES = ['BCA', 'BNC', 'BNI', 'BRI', 'BSI', 'CIMB', 'DANAMON', 'MANDIRI', 'MAYBANK', 'MUAMALAT', 'OCBC', 'PERMATA']
const logos = Object.fromEntries(BANK_CODES.map((code) => [code, `/images/banks/${code.toLowerCase()}.webp`]))

export function bankLogoUrl(code) {
  return logos[String(code ?? '').toUpperCase()] ?? null
}
