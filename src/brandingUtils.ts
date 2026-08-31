import { useState, useEffect } from 'react';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface AppBrandingConfig {
  oauth_logo?: string;     // Uploaded image for OAuth / Continue with Zenoa page
  public_logo?: string;    // Uploaded image for Public pages & SSO Landing
  messenger_logo?: string; // Uploaded image for Main Messenger app
  favicon_logo?: string;   // Uploaded image for Browser Favicon
  dev_console_logo?: string; // Uploaded image for Developer Console & Developer Portal
  app_name?: string;       // Brand name override (defaults to "Zenoa")
  updated_at?: number;
  updated_by?: string;
}

const STORAGE_KEY = 'zenoa_app_branding';

export const DEFAULT_BRANDING: AppBrandingConfig = {
  oauth_logo: '',
  public_logo: '',
  messenger_logo: '',
  favicon_logo: '',
  dev_console_logo: '',
  app_name: 'Zenoa',
  updated_at: Date.now()
};

// In-memory cache for fast access
let currentBranding: AppBrandingConfig = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_BRANDING, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return { ...DEFAULT_BRANDING };
})();

// Subscribers list
type BrandingListener = (branding: AppBrandingConfig) => void;
const listeners: Set<BrandingListener> = new Set();

/**
 * Update the dynamic favicon in browser head
 */
export const updateFavicon = (iconUrl?: string) => {
  if (typeof document === 'undefined') return;
  if (!iconUrl || !iconUrl.trim()) return;

  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.type = 'image/x-icon';
    link.href = iconUrl;
  } catch (err) {
    console.warn('Failed to update favicon:', err);
  }
};

// Apply initial favicon if stored
if (currentBranding.favicon_logo) {
  updateFavicon(currentBranding.favicon_logo);
}

/**
 * Get active branding configuration
 */
export const getBranding = (): AppBrandingConfig => {
  return { ...currentBranding };
};

/**
 * Internal trigger for updates
 */

const notifyListeners = (newBranding: AppBrandingConfig) => {
  currentBranding = { ...newBranding };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentBranding));
  } catch (e) {}

  if (currentBranding.favicon_logo) {
    updateFavicon(currentBranding.favicon_logo);
  }

  listeners.forEach((listener) => {
    try {
      listener(currentBranding);
    } catch (e) {}
  });
};

/**
 * Subscribe to real-time branding changes
 */
export const subscribeBranding = (listener: BrandingListener): (() => void) => {
  listeners.add(listener);
  // Send current state immediately
  listener(currentBranding);

  return () => {
    listeners.delete(listener);
  };
};

/**
 * Save updated branding to Firestore & localStorage
 */
export const saveBranding = async (
  newConfig: Partial<AppBrandingConfig>,
  updatedBy: string = 'admin'
): Promise<AppBrandingConfig> => {
  const merged: AppBrandingConfig = {
    ...currentBranding,
    ...newConfig,
    updated_at: Date.now(),
    updated_by: updatedBy
  };

  notifyListeners(merged);

  if (db) {
    try {
      await setDoc(doc(db, 'system_config', 'branding'), merged, { merge: true });
    } catch (err) {
      console.warn('Failed to sync branding to Firestore:', err);
    }
  }

  return merged;
};

/**
 * Initialize real-time Firestore listener for branding
 */
export const initBrandingSync = (): (() => void) => {
  if (!db) return () => {};

  try {
    const unsub = onSnapshot(
      doc(db, 'system_config', 'branding'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as AppBrandingConfig;
          notifyListeners({ ...DEFAULT_BRANDING, ...data });
        }
      },
      (err) => {
        console.warn('Branding snapshot notice:', err);
      }
    );
    return unsub;
  } catch (e) {
    return () => {};
  }
};

export const useBranding = (): AppBrandingConfig => {
  const [branding, setBranding] = useState<AppBrandingConfig>(getBranding());

  useEffect(() => {
    const unsub = subscribeBranding(setBranding);
    return () => unsub();
  }, []);

  return branding;
};
