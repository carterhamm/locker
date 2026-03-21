import { describe, it, expect, beforeAll } from "vitest";
import crypto from "node:crypto";
import {
  encryptWithMasterKey,
  decryptWithMasterKey,
  encryptUserKey,
  decryptUserKey,
  generateUserCEK,
} from "./encryption";

// Set up a valid master key for tests
beforeAll(() => {
  process.env.MASTER_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
});

describe("generateUserCEK", () => {
  it("generates a base64-encoded 32-byte key", () => {
    const cek = generateUserCEK();
    const buf = Buffer.from(cek, "base64");
    expect(buf.length).toBe(32);
  });

  it("generates unique keys each time", () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateUserCEK()));
    expect(keys.size).toBe(100);
  });
});

describe("master key encryption", () => {
  it("encrypts and decrypts a string", () => {
    const plaintext = "sk-live-abc123def456";
    const { ciphertext, iv } = encryptWithMasterKey(plaintext);
    const result = decryptWithMasterKey(ciphertext, iv);
    expect(result).toBe(plaintext);
  });

  it("produces different ciphertext each time (unique IVs)", () => {
    const plaintext = "same-key-value";
    const a = encryptWithMasterKey(plaintext);
    const b = encryptWithMasterKey(plaintext);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it("ciphertext is not the plaintext", () => {
    const plaintext = "my-secret-key";
    const { ciphertext } = encryptWithMasterKey(plaintext);
    const decoded = Buffer.from(ciphertext, "base64").toString("utf8");
    expect(decoded).not.toContain(plaintext);
  });

  it("detects tampered ciphertext (GCM auth)", () => {
    const { ciphertext, iv } = encryptWithMasterKey("test-key");
    // Flip a bit in the ciphertext
    const buf = Buffer.from(ciphertext, "base64");
    buf[0] ^= 0xff;
    const tampered = buf.toString("base64");

    expect(() => decryptWithMasterKey(tampered, iv)).toThrow();
  });

  it("detects tampered IV", () => {
    const { ciphertext, iv } = encryptWithMasterKey("test-key");
    const ivBuf = Buffer.from(iv, "base64");
    ivBuf[0] ^= 0xff;
    const tamperedIV = ivBuf.toString("base64");

    expect(() => decryptWithMasterKey(ciphertext, tamperedIV)).toThrow();
  });

  it("handles empty string", () => {
    const { ciphertext, iv } = encryptWithMasterKey("");
    expect(decryptWithMasterKey(ciphertext, iv)).toBe("");
  });

  it("handles long strings", () => {
    const plaintext = "x".repeat(10000);
    const { ciphertext, iv } = encryptWithMasterKey(plaintext);
    expect(decryptWithMasterKey(ciphertext, iv)).toBe(plaintext);
  });

  it("handles unicode", () => {
    const plaintext = "key-with-emoji-🔑-and-日本語";
    const { ciphertext, iv } = encryptWithMasterKey(plaintext);
    expect(decryptWithMasterKey(ciphertext, iv)).toBe(plaintext);
  });

  it("throws when master key is not set", () => {
    const original = process.env.MASTER_ENCRYPTION_KEY;
    delete process.env.MASTER_ENCRYPTION_KEY;

    expect(() => encryptWithMasterKey("test")).toThrow("MASTER_ENCRYPTION_KEY is not set");

    process.env.MASTER_ENCRYPTION_KEY = original;
  });

  it("throws when master key is wrong length", () => {
    const original = process.env.MASTER_ENCRYPTION_KEY;
    process.env.MASTER_ENCRYPTION_KEY = Buffer.from("short").toString("base64");

    expect(() => encryptWithMasterKey("test")).toThrow("must be exactly 32 bytes");

    process.env.MASTER_ENCRYPTION_KEY = original;
  });
});

describe("user key encryption", () => {
  it("encrypts and decrypts with a user CEK", () => {
    const cek = generateUserCEK();
    const plaintext = "sk-resend-abc123";
    const { ciphertext, iv } = encryptUserKey(plaintext, cek);
    const result = decryptUserKey(ciphertext, iv, cek);
    expect(result).toBe(plaintext);
  });

  it("different CEKs cannot decrypt each other's data", () => {
    const cek1 = generateUserCEK();
    const cek2 = generateUserCEK();
    const { ciphertext, iv } = encryptUserKey("secret", cek1);

    expect(() => decryptUserKey(ciphertext, iv, cek2)).toThrow();
  });

  it("produces different ciphertext with same CEK (unique IVs)", () => {
    const cek = generateUserCEK();
    const a = encryptUserKey("same", cek);
    const b = encryptUserKey("same", cek);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it("throws on invalid CEK length", () => {
    const badCEK = Buffer.from("tooshort").toString("base64");
    expect(() => encryptUserKey("test", badCEK)).toThrow("must be exactly 32 bytes");
    expect(() => decryptUserKey("dGVzdA==", "dGVzdA==", badCEK)).toThrow(
      "must be exactly 32 bytes"
    );
  });

  it("detects tampered ciphertext", () => {
    const cek = generateUserCEK();
    const { ciphertext, iv } = encryptUserKey("secret", cek);
    const buf = Buffer.from(ciphertext, "base64");
    buf[0] ^= 0xff;

    expect(() => decryptUserKey(buf.toString("base64"), iv, cek)).toThrow();
  });
});

describe("envelope encryption flow", () => {
  it("full envelope encryption roundtrip", () => {
    // 1. Generate a CEK for the user
    const plainCEK = generateUserCEK();

    // 2. Encrypt the CEK with the master key (stored in DB)
    const { ciphertext: encryptedCEK, iv: cekIV } =
      encryptWithMasterKey(plainCEK);

    // 3. Encrypt an API key with the user's CEK
    const apiKey = "sk-live-stripe-abc123xyz789";
    const { ciphertext: encryptedAPIKey, iv: keyIV } = encryptUserKey(
      apiKey,
      plainCEK
    );

    // 4. To retrieve: decrypt the CEK first, then the API key
    const recoveredCEK = decryptWithMasterKey(encryptedCEK, cekIV);
    const recoveredAPIKey = decryptUserKey(encryptedAPIKey, keyIV, recoveredCEK);

    expect(recoveredCEK).toBe(plainCEK);
    expect(recoveredAPIKey).toBe(apiKey);
  });
});
