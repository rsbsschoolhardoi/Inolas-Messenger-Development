import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Verify configuration status
export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'your-supabase-project-url' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-supabase-anon-key';

function detectSecretServiceKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = atob(base64);
      const claims = JSON.parse(decodedPayload);
      
      if (
        claims.role === 'service_role' || 
        claims.iss === 'supabase-service-role' || 
        claims.sub === 'service_role'
      ) {
        return true;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  if (key.toLowerCase().includes('service_role')) {
    return true;
  }
  
  return false;
}

let initializedClient = null;
let initializationError = '';

if (isSupabaseConfigured) {
  if (detectSecretServiceKey(supabaseAnonKey)) {
    initializationError = JSON.stringify({
      message: "Forbidden use of secret API key in browser",
      hint: "Secret API keys can only be used in a protected environment and should never be used in a browser. Delete this secret API key immediately!"
    });
  } else {
    try {
      initializedClient = createClient(supabaseUrl, supabaseAnonKey);
    } catch (err: any) {
      console.error("Supabase client initialization error caught:", err);
      initializationError = err.message || String(err);
    }
  }
}

export const supabase = initializedClient;
export const supabaseInitError = initializationError;


