/**
 * Safe, fault-tolerant wrapper around localStorage and sessionStorage
 * to handle iframe sandbox restrictions, quota limits, and private browsing.
 */

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(key);
      }
    } catch (err) {
      console.warn(`[SafeStorage] Failed to read key "${key}" from localStorage:`, err);
    }
    return null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
      }
    } catch (err) {
      console.warn(`[SafeStorage] Failed to write key "${key}" to localStorage:`, err);
    }
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.removeItem(key);
      }
    } catch (err) {
      console.warn(`[SafeStorage] Failed to remove key "${key}" from localStorage:`, err);
    }
  }
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && 'sessionStorage' in window) {
        return window.sessionStorage.getItem(key);
      }
    } catch (err) {
      console.warn(`[SafeStorage] Failed to read key "${key}" from sessionStorage:`, err);
    }
    return null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && 'sessionStorage' in window) {
        window.sessionStorage.setItem(key, value);
      }
    } catch (err) {
      console.warn(`[SafeStorage] Failed to write key "${key}" to sessionStorage:`, err);
    }
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && 'sessionStorage' in window) {
        window.sessionStorage.removeItem(key);
      }
    } catch (err) {
      console.warn(`[SafeStorage] Failed to remove key "${key}" from sessionStorage:`, err);
    }
  }
};
