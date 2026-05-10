import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { translations } from "../utils/translations";
import api from "../utils/api";

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx)
    throw new Error("useAppContext harus digunakan di dalam AppProvider");
  return ctx;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — baca / tulis auth ke localStorage
// ─────────────────────────────────────────────────────────────────────────────

const AUTH_STORAGE_KEY = "padu-auth";

function readAuthFromStorage() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeAuthToStorage(authData) {
  try {
    if (authData) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // localStorage tidak tersedia (mode private / storage penuh) — abaikan
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export const AppProvider = ({ children }) => {
  // ── Preferensi UI ──────────────────────────────────────────────────────────

  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "id");

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  // ── Auth State ─────────────────────────────────────────────────────────────

  const [auth, setAuthState] = useState(() => readAuthFromStorage());

  // ─────────────────────────────────────────────────────────────────────────
  // Side effects — sinkronisasi localStorage dengan state
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  // ─────────────────────────────────────────────────────────────────────────
  // Auth Actions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Simpan data auth setelah login / register berhasil
   * @param {Object} param0
   * @param {Object} param0.user          - { id, name, phone, email, role }
   * @param {Object} param0.tenant        - { id, name, slug, status, plan }
   * @param {string} param0.accessToken   - JWT access token
   * @param {string} param0.refreshToken  - JWT refresh token
   */
  const login = useCallback(({ user, tenant, accessToken, refreshToken }) => {
    const authData = { user, tenant, accessToken, refreshToken };
    setAuthState(authData);
    writeAuthToStorage(authData);
  }, []);

  /**
   * Hapus semua data auth dan redirect ke halaman login
   * Jika memungkinkan, revoke refresh token di backend
   */
  const logout = useCallback(async () => {
    const currentAuth = readAuthFromStorage();

    // Coba revoke refresh token di backend — tidak blokir jika gagal
    if (currentAuth?.refreshToken) {
      try {
        await api.post("/api/auth/logout", {
          refreshToken: currentAuth.refreshToken,
        });
      } catch {
        // Gagal revoke tidak masalah — token akan expired sendiri
      }
    }

    setAuthState(null);
    writeAuthToStorage(null);

    window.location.href = "/login";
  }, []);

  /**
   * Update sebagian data user di state (misal: setelah update profil)
   */
  const updateUser = useCallback((updatedFields) => {
    setAuthState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, user: { ...prev.user, ...updatedFields } };
      writeAuthToStorage(next);
      return next;
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // UI Toggles
  // ─────────────────────────────────────────────────────────────────────────

  const toggleLang = useCallback(
    () => setLang((p) => (p === "id" ? "en" : "id")),
    [],
  );
  const toggleTheme = useCallback(
    () => setTheme((p) => (p === "light" ? "dark" : "light")),
    [],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Computed values
  // ─────────────────────────────────────────────────────────────────────────

  const isAuthenticated = !!auth?.accessToken;
  const t = translations[lang];

  // ─────────────────────────────────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────────────────────────────────

  const value = {
    // UI preferences
    lang,
    theme,
    t,
    toggleLang,
    toggleTheme,

    // Auth state
    auth,
    user: auth?.user ?? null,
    tenant: auth?.tenant ?? null,
    accessToken: auth?.accessToken ?? null,
    isAuthenticated,

    // Auth actions
    login,
    logout,
    updateUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
