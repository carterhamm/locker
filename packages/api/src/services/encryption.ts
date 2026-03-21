import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const KEY_LENGTH = 32; // 256 bits

/**
 * Returns the master encryption key from environment.
 * Validates it's a proper 32-byte key.
 */
function getMasterKey(): Buffer {
  const encoded = process.env.MASTER_ENCRYPTION_KEY;
  if (!encoded) {
    throw new Error("MASTER_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(encoded, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `MASTER_ENCRYPTION_KEY must be exactly ${KEY_LENGTH} bytes (got ${key.length}). Generate with: openssl rand -base64 32`
    );
  }
  return key;
}

/**
 * Generates a cryptographically random IV (12 bytes for GCM).
 */
function generateIV(): Buffer {
  return crypto.randomBytes(IV_LENGTH);
}

/**
 * Encrypts plaintext using AES-256-GCM with the given key.
 * Returns base64-encoded ciphertext (with auth tag appended) and IV.
 */
function encrypt(
  plaintext: string,
  key: Buffer
): { ciphertext: string; iv: string } {
  const iv = generateIV();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Store ciphertext + authTag together
  const combined = Buffer.concat([encrypted, authTag]);

  return {
    ciphertext: combined.toString("base64"),
    iv: iv.toString("base64"),
  };
}

/**
 * Decrypts ciphertext using AES-256-GCM with the given key.
 * Ciphertext is expected to have the auth tag appended.
 */
function decrypt(ciphertext: string, iv: string, key: Buffer): string {
  const combined = Buffer.from(ciphertext, "base64");
  const ivBuf = Buffer.from(iv, "base64");

  // Split ciphertext and auth tag
  const encrypted = combined.subarray(0, combined.length - AUTH_TAG_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuf, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

// --- Public API ---

/**
 * Encrypts data using the master encryption key.
 * Used for encrypting Customer Encryption Keys (CEKs).
 */
export function encryptWithMasterKey(plaintext: string): {
  ciphertext: string;
  iv: string;
} {
  return encrypt(plaintext, getMasterKey());
}

/**
 * Decrypts data using the master encryption key.
 * Used for decrypting Customer Encryption Keys (CEKs).
 */
export function decryptWithMasterKey(ciphertext: string, iv: string): string {
  return decrypt(ciphertext, iv, getMasterKey());
}

/**
 * Encrypts data using a user's Customer Encryption Key (CEK).
 * Used for encrypting individual API keys.
 * The CEK must be provided as a base64-encoded 32-byte key.
 */
export function encryptUserKey(
  plaintext: string,
  userCEK: string
): { ciphertext: string; iv: string } {
  const key = Buffer.from(userCEK, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error("User CEK must be exactly 32 bytes");
  }
  return encrypt(plaintext, key);
}

/**
 * Decrypts data using a user's Customer Encryption Key (CEK).
 * Used for decrypting individual API keys.
 */
export function decryptUserKey(
  ciphertext: string,
  iv: string,
  userCEK: string
): string {
  const key = Buffer.from(userCEK, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error("User CEK must be exactly 32 bytes");
  }
  return decrypt(ciphertext, iv, key);
}

/**
 * Generates a new Customer Encryption Key (CEK).
 * Returns 32 cryptographically random bytes, base64 encoded.
 */
export function generateUserCEK(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("base64");
}
