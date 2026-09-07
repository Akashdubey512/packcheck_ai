/**
 * BROWSER STORAGE RULES
 * Strict policy enforcement:
 * - Allowed: UI preferences only (theme, sidebar collapsed state, reduced motion).
 * - FORBIDDEN: Passwords, authentication tokens, compliance evidence, or sensitive regulatory records.
 */

export const ALLOWED_STORAGE_KEYS = {
  THEME: 'app_theme',
  SIDEBAR_COLLAPSED: 'app_sidebar_collapsed',
  REDUCED_MOTION: 'app_reduced_motion',
} as const;

export type AllowedStorageKey = (typeof ALLOWED_STORAGE_KEYS)[keyof typeof ALLOWED_STORAGE_KEYS];

const SENSITIVE_KEYWORDS = [
  'token',
  'jwt',
  'password',
  'secret',
  'auth',
  'credential',
  'evidence',
  'violation',
  'compliance',
  'scan',
];

export const storage = {
  get<T>(key: AllowedStorageKey, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: AllowedStorageKey, value: T): boolean {
    // Defense-in-depth: Verify key is in the allowlist
    const isAllowed = Object.values(ALLOWED_STORAGE_KEYS).includes(key);
    if (!isAllowed) {
      console.error(`[Storage Policy Violation] Key "${key}" is not in the allowed UI preferences allowlist.`);
      return false;
    }

    // Guard against storing sensitive data
    const serialized = JSON.stringify(value);
    const hasSensitiveData = SENSITIVE_KEYWORDS.some((kw) =>
      key.toLowerCase().includes(kw)
    );
    if (hasSensitiveData) {
      console.error(`[Storage Security Guard] Sensitive regulatory or credential data rejected from storage: ${key}`);
      return false;
    }

    try {
      localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.warn(`[Storage Error] Failed to write key "${key}" to localStorage:`, e);
      return false;
    }
  },

  remove(key: AllowedStorageKey): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore removal failure
    }
  },

  clearPreferences(): void {
    try {
      Object.values(ALLOWED_STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignore failure
    }
  },
};
