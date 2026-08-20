import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],

      // Memakai const/let SEBELUM baris deklarasinya.
      //
      // 20 Agustus 2026: satu nilai turunan ditaruh satu baris DI ATAS
      // `useState` yang jadi sumbernya. Halaman Laporan Penjualan langsung mati
      // jadi layar putih — `Cannot access '_' before initialization`.
      //
      // `npm run build` HIJAU dan `eslint` HIJAU pada versi yang rusak itu.
      // Tidak ada yang menahannya sampai pemilik toko membuka halamannya
      // sendiri dan menemukan layar kosong.
      //
      // functions & classes sengaja dibiarkan (hoisting-nya memang sah);
      // yang dijaga cuma variabel — di situlah zona matinya.
      'no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
    },
  },
])
