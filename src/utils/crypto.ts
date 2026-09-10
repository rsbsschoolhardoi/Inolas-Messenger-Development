import argon2 from 'argon2-browser/dist/argon2-bundled.min.js';

/**
 * Cryptographic utility for Zenoa Vault
 * Uses Web Crypto API + Argon2id (WASM) for memory-hard key derivation & AES-256-GCM encryption
 */

// Argon2id Parameters (Security-hardened for client-side/browser environment)
const ARGON2_TIME = 3;        // 3 iterations
const ARGON2_MEM = 65536;     // 64 MB RAM (Memory-hard against GPU/ASIC brute-force attacks)
const ARGON2_PARALLELISM = 1; // 1 thread
const KEY_LEN = 32;           // 256 bits for AES-256-GCM
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // Standard for GCM
const MAGIC_HEADER = new Uint8Array([0x41, 0x52, 0x47, 0x32]); // "ARG2" magic prefix

/**
 * Derives a 256-bit AES-GCM CryptoKey from a password using Argon2id (Memory-hard)
 */
async function deriveKeyArgon2id(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const result = await argon2.hash({
    pass: password,
    salt: salt,
    time: ARGON2_TIME,
    mem: ARGON2_MEM,
    hashLen: KEY_LEN,
    parallelism: ARGON2_PARALLELISM,
    type: argon2.ArgonType?.Argon2id ?? 2
  });

  return window.crypto.subtle.importKey(
    'raw',
    result.hash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Legacy key derivation fallback using PBKDF2 (for backwards compatibility with older backups)
 */
async function deriveKeyPBKDF2(password: string, salt: Uint8Array): Promise<CryptoKey> {
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
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string (JSON data) using Argon2id key derivation and AES-256-GCM
 * Returns a base64 string containing: MAGIC_HEADER ("ARG2") + salt + iv + ciphertext
 */
export async function encryptVault(data: string, password: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKeyArgon2id(password, salt);
  
  const encoder = new TextEncoder();
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    encoder.encode(data)
  );

  const encryptedArray = new Uint8Array(encryptedContent);
  const combined = new Uint8Array(MAGIC_HEADER.length + salt.length + iv.length + encryptedArray.length);
  
  combined.set(MAGIC_HEADER, 0);
  combined.set(salt, MAGIC_HEADER.length);
  combined.set(iv, MAGIC_HEADER.length + salt.length);
  combined.set(encryptedArray, MAGIC_HEADER.length + salt.length + iv.length);

  // Convert to Base64 for storage/transmission safely
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decrypts a base64 vault string using Argon2id with PBKDF2 fallback for legacy backups
 */
export async function decryptVault(encryptedBase64: string, password: string): Promise<string> {
  try {
    const combined = new Uint8Array(
      atob(encryptedBase64).split('').map(char => char.charCodeAt(0))
    );

    // Check if payload starts with "ARG2" magic header
    const isArgon2Header = 
      combined.length > MAGIC_HEADER.length + SALT_LENGTH + IV_LENGTH &&
      combined[0] === MAGIC_HEADER[0] &&
      combined[1] === MAGIC_HEADER[1] &&
      combined[2] === MAGIC_HEADER[2] &&
      combined[3] === MAGIC_HEADER[3];

    if (isArgon2Header) {
      const offset = MAGIC_HEADER.length;
      const salt = combined.slice(offset, offset + SALT_LENGTH);
      const iv = combined.slice(offset + SALT_LENGTH, offset + SALT_LENGTH + IV_LENGTH);
      const encryptedContent = combined.slice(offset + SALT_LENGTH + IV_LENGTH);

      const key = await deriveKeyArgon2id(password, salt);
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any },
        key,
        encryptedContent
      );
      return new TextDecoder().decode(decryptedContent);
    }

    // Fallback for legacy backups (without "ARG2" header)
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encryptedContent = combined.slice(SALT_LENGTH + IV_LENGTH);

    try {
      const keyArgon = await deriveKeyArgon2id(password, salt);
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any },
        keyArgon,
        encryptedContent
      );
      return new TextDecoder().decode(decryptedContent);
    } catch {
      // Fallback to PBKDF2
      const keyPbkdf2 = await deriveKeyPBKDF2(password, salt);
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any },
        keyPbkdf2,
        encryptedContent
      );
      return new TextDecoder().decode(decryptedContent);
    }
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Invalid password or corrupted backup file');
  }
}

