/**
 * Resilient API Client & Network Safety Utilities
 * Provides automatic request timeout via AbortController, safe JSON parsing,
 * network connectivity detection, and fallback handling for 4xx/5xx HTML errors.
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

export async function safeFetchJson<T = any>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<SafeFetchResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const mergedHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: mergedHeaders,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let parsedData: any = null;
    let errorMessage: string | null = null;

    if (contentType.includes('application/json')) {
      try {
        parsedData = await response.json();
      } catch (parseErr: any) {
        errorMessage = 'Failed to parse JSON response: ' + parseErr.message;
      }
    } else {
      // Non-JSON response (e.g. HTML gateway error from Nginx/Render/Cloudflare)
      const text = await response.text();
      if (!response.ok) {
        if (response.status === 502) {
          errorMessage = 'Bad Gateway: Upstream service temporarily unavailable.';
        } else if (response.status === 504) {
          errorMessage = 'Gateway Timeout: Request took too long to complete.';
        } else if (response.status === 503) {
          errorMessage = 'Service Unavailable: Backend is restarting or under maintenance.';
        } else {
          errorMessage = `HTTP error ${response.status}: Server returned non-JSON payload`;
        }
      } else {
        try {
          parsedData = JSON.parse(text);
        } catch {
          parsedData = text;
        }
      }
    }

    if (!response.ok) {
      const serverError = parsedData?.error || parsedData?.message || errorMessage || `Request failed with status ${response.status}`;
      return {
        ok: false,
        status: response.status,
        data: parsedData,
        error: serverError
      };
    }

    return {
      ok: true,
      status: response.status,
      data: parsedData as T,
      error: null
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err?.name === 'AbortError') {
      return {
        ok: false,
        status: 408,
        data: null,
        error: 'Request timed out after ' + Math.round(timeoutMs / 1000) + 's. Please check connection and try again.'
      };
    }

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const errorMsg = isOffline
      ? 'You appear to be offline. Please verify your internet connection.'
      : (err?.message || 'Network communication failure');

    return {
      ok: false,
      status: 0,
      data: null,
      error: errorMsg
    };
  }
}

/**
 * Safe LocalStorage wrapper to prevent DOMException: QUOTA_EXCEEDED_ERR crashes
 */
export const safeStorage = {
  getItem(key: string, fallback: string | null = null): string | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return fallback;
      return window.localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  },
  setItem(key: string, value: string): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[safeStorage] Failed to set key "${key}":`, e);
      return false;
    }
  },
  removeItem(key: string): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};
