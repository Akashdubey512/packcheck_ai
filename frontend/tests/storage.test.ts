import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage, ALLOWED_STORAGE_KEYS } from '../src/utils/storage';

describe('Browser Storage Policy & Security Rules', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should successfully store and retrieve allowed UI preferences', () => {
    const success = storage.set(ALLOWED_STORAGE_KEYS.THEME, 'dark');
    expect(success).toBe(true);

    const retrieved = storage.get(ALLOWED_STORAGE_KEYS.THEME, 'light');
    expect(retrieved).toBe('dark');
  });

  it('should return defaultValue when key does not exist in storage', () => {
    const value = storage.get(ALLOWED_STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
    expect(value).toBe(false);
  });

  it('should reject non-allowlisted keys via defense-in-depth check', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-expect-error testing runtime rejection of unapproved keys
    const success = storage.set('custom_unapproved_key', 'value');

    expect(success).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Storage Policy Violation]')
    );
  });

  it('should reject storage attempts containing sensitive keyword tokens', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-expect-error testing security guard against sensitive keys
    const success = storage.set('user_token_auth', 'sensitive_jwt_data');

    expect(success).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
