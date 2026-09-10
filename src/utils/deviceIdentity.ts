// Utility for detecting and maintaining unique device identity, location, and session roles
// Ensures every logged-in device has its own distinct identity and location

export interface ClientDeviceIdentity {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  location: string;
  isLinkedClient: boolean;
  isPrimary: boolean;
  sessionId?: string;
}

// Map common timezones to human-friendly location labels
const TIMEZONE_TO_LOCATION: Record<string, string> = {
  'Asia/Kolkata': 'India (Mumbai / Delhi)',
  'Asia/Calcutta': 'India (Mumbai / Delhi)',
  'Asia/Dubai': 'Dubai, UAE',
  'Asia/Singapore': 'Singapore',
  'Asia/Tokyo': 'Tokyo, Japan',
  'Asia/Hong_Kong': 'Hong Kong',
  'Asia/Dhaka': 'Dhaka, Bangladesh',
  'Asia/Karachi': 'Karachi, Pakistan',
  'Asia/Kathmandu': 'Kathmandu, Nepal',
  'Asia/Colombo': 'Colombo, Sri Lanka',
  'America/New_York': 'New York, USA',
  'America/Chicago': 'Chicago, USA',
  'America/Los_Angeles': 'Los Angeles, USA',
  'America/San_Francisco': 'San Francisco, USA',
  'America/Toronto': 'Toronto, Canada',
  'America/Vancouver': 'Vancouver, Canada',
  'America/Sao_Paulo': 'São Paulo, Brazil',
  'Europe/London': 'London, UK',
  'Europe/Paris': 'Paris, France',
  'Europe/Berlin': 'Berlin, Germany',
  'Europe/Rome': 'Rome, Italy',
  'Europe/Amsterdam': 'Amsterdam, Netherlands',
  'Europe/Madrid': 'Madrid, Spain',
  'Australia/Sydney': 'Sydney, Australia',
  'Australia/Melbourne': 'Melbourne, Australia',
  'Pacific/Auckland': 'Auckland, New Zealand'
};

export function getDeviceLocation(): string {
  if (typeof window === 'undefined') return 'Unknown Location';

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      if (TIMEZONE_TO_LOCATION[tz]) {
        return TIMEZONE_TO_LOCATION[tz];
      }
      // Clean fallback from timezone string (e.g. "Europe/Zurich" -> "Zurich (Europe)")
      const parts = tz.split('/');
      if (parts.length === 2) {
        const city = parts[1].replace(/_/g, ' ');
        const region = parts[0].replace(/_/g, ' ');
        return `${city}, ${region}`;
      }
      return tz;
    }
  } catch (e) {
    console.warn('Timezone detection notice:', e);
  }

  return 'Local Network';
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server_instance';

  const STORAGE_KEY = 'zenoa_unique_device_id';
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'temp_device_' + Date.now();
  }
}

export function getDeviceDetails(): {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  deviceName: string;
} {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      os: 'Server Node',
      browser: 'Node.js',
      deviceName: 'System Server'
    };
  }

  const ua = navigator.userAgent || '';
  let os = 'Desktop';
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  // OS Detection
  if (/iPad|Tablet/i.test(ua)) {
    os = 'iPadOS';
    deviceType = 'tablet';
  } else if (/iPhone/i.test(ua)) {
    os = 'iOS (iPhone)';
    deviceType = 'mobile';
  } else if (/Android/i.test(ua)) {
    if (/Mobile/i.test(ua)) {
      os = 'Android';
      deviceType = 'mobile';
    } else {
      os = 'Android Tablet';
      deviceType = 'tablet';
    }
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
    deviceType = 'desktop';
  } else if (/Windows NT 10.0/i.test(ua)) {
    os = 'Windows 11 / 10';
    deviceType = 'desktop';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows PC';
    deviceType = 'desktop';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
    deviceType = 'desktop';
  } else if (/CrOS/i.test(ua)) {
    os = 'Chrome OS';
    deviceType = 'desktop';
  }

  // Width check fallback for small screens
  if (deviceType === 'desktop' && window.innerWidth < 768) {
    deviceType = 'mobile';
  }

  // Browser Detection
  let browser = 'Web Browser';
  if (/Edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/Opera|OPR\//i.test(ua)) {
    browser = 'Opera';
  }

  // Device friendly label
  let deviceName = `${os} (${browser})`;
  if (deviceType === 'mobile') {
    deviceName = /iPhone/i.test(ua) ? 'Apple iPhone' : 'Android Smartphone';
  } else if (deviceType === 'tablet') {
    deviceName = /iPad/i.test(ua) ? 'Apple iPad' : 'Tablet Device';
  } else {
    deviceName = os === 'macOS' ? 'Apple Mac' : `${os} Desktop`;
  }

  return { deviceType, os, browser, deviceName };
}

export function getCurrentClientIdentity(): ClientDeviceIdentity {
  const isLinked = typeof window !== 'undefined' && (
    sessionStorage.getItem('zenoa_is_linked_client') === 'true' ||
    localStorage.getItem('zenoa_is_linked_client') === 'true'
  );

  const sessionId = typeof window !== 'undefined'
    ? (sessionStorage.getItem('zenoa_linked_session_id') || localStorage.getItem('zenoa_linked_session_id') || undefined)
    : undefined;

  const { deviceType, os, browser, deviceName } = getDeviceDetails();
  const deviceId = getDeviceId();
  const location = getDeviceLocation();

  return {
    deviceId,
    deviceName,
    deviceType,
    os,
    browser,
    location,
    isLinkedClient: isLinked,
    isPrimary: !isLinked,
    sessionId
  };
}

export async function registerPrimaryDevice(username: string): Promise<void> {
  if (!username || typeof window === 'undefined') return;
  const isLinked = (
    sessionStorage.getItem('zenoa_is_linked_client') === 'true' ||
    localStorage.getItem('zenoa_is_linked_client') === 'true'
  );

  // Only register as Primary if this device is NOT a linked companion
  if (isLinked) return;

  const identity = getCurrentClientIdentity();

  try {
    await fetch('/api/v1/link-device/register-primary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.toLowerCase().trim(),
        deviceId: identity.deviceId,
        deviceName: identity.deviceName,
        deviceType: identity.deviceType,
        os: identity.os,
        browser: identity.browser,
        location: identity.location
      })
    });
  } catch (err) {
    console.warn('Failed to register primary device identity:', err);
  }
}
