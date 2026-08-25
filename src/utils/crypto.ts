/**
 * Cryptographic utility for Zenoa Vault
 * Uses Web Crypto API for secure, client-side encryption (AES-256-GCM)
 */

const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // Standard for GCM

/**
 * Derives a cryptographic key from a password string using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string (JSON data) using a password
 * Returns a base64 string containing: salt + iv + ciphertext
 */
export async function encryptVault(data: string, password: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);
  
  const encoder = new TextEncoder();
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    encoder.encode(data)
  );

  const encryptedArray = new Uint8Array(encryptedContent);
  const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
  
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(encryptedArray, salt.length + iv.length);

  // Convert to Base64 for storage/transmission safely
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decrypts a base64 string using a password
 */
export async function decryptVault(encryptedBase64: string, password: string): Promise<string> {
  try {
    const combined = new Uint8Array(
      atob(encryptedBase64).split('').map(char => char.charCodeAt(0))
    );

    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encryptedContent = combined.slice(SALT_LENGTH + IV_LENGTH);

    const key = await deriveKey(password, salt);
    
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      encryptedContent
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Invalid password or corrupted backup file');
  }
}
