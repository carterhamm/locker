import { describe, it, expect, beforeAll, vi } from "vitest";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import express from "express";
import request from "supertest";
import { keysRouter } from "./keys";
import { authenticate } from "../middleware/auth";
import {
  generateUserCEK,
  encryptWithMasterKey,
  encryptUserKey,
  decryptUserKey,
} from "../services/encryption";

// In-memory mock database
let mockUsers: Record<string, any> = {};
let mockKeys: Record<string, any[]> = {};
let mockLogs: any[] = [];

vi.mock("../db/client", () => ({
  getPool: () => ({
    query: vi.fn(async (sql: string, params?: any[]) => {
      // Route mock queries based on SQL content
      if (sql.includes("FROM users WHERE id")) {
        const userId = params![0];
        const user = mockUsers[userId];
        return { rows: user ? [user] : [] };
      }
      if (sql.includes("INSERT INTO keys")) {
        const [userId, serviceName, encVal, iv] = params!;
        if (!mockKeys[userId]) mockKeys[userId] = [];
        const existing = mockKeys[userId].find(
          (k) => k.service_name === serviceName
        );
        if (existing) {
          existing.encrypted_value = encVal;
          existing.iv = iv;
          existing.last_used = null;
        } else {
          mockKeys[userId].push({
            id: crypto.randomUUID(),
            user_id: userId,
            service_name: serviceName,
            encrypted_value: encVal,
            iv,
            created_at: new Date().toISOString(),
            last_used: null,
          });
        }
        return { rows: [] };
      }
      if (
        sql.includes("FROM keys") &&
        sql.includes("WHERE user_id") &&
        sql.includes("service_name")
      ) {
        const userId = params![0];
        const serviceName = params![1];
        const keys = mockKeys[userId] || [];
        const found = keys.filter((k) => k.service_name === serviceName);
        return { rows: found };
      }
      if (
        sql.includes("FROM keys") &&
        sql.includes("WHERE user_id") &&
        sql.includes("ORDER BY")
      ) {
        const userId = params![0];
        return { rows: mockKeys[userId] || [] };
      }
      if (sql.includes("INSERT INTO access_logs")) {
        mockLogs.push({
          key_id: params![0],
          user_id: params![1],
          agent_identifier: params![2],
        });
        return { rows: [] };
      }
      if (sql.includes("UPDATE keys SET last_used")) {
        return { rows: [] };
      }
      if (sql.includes("DELETE FROM keys")) {
        const userId = params![0];
        const serviceName = params![1];
        const keys = mockKeys[userId] || [];
        const idx = keys.findIndex((k) => k.service_name === serviceName);
        if (idx === -1) return { rows: [] };
        const removed = keys.splice(idx, 1);
        return { rows: removed };
      }
      return { rows: [] };
    }),
  }),
}));

const JWT_SECRET = crypto.randomBytes(32).toString("base64");
const TEST_USER_ID = crypto.randomUUID();

let app: express.Express;

beforeAll(() => {
  process.env.MASTER_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
  process.env.JWT_SECRET = JWT_SECRET;

  // Set up mock user with CEK
  const plainCEK = generateUserCEK();
  const { ciphertext, iv } = encryptWithMasterKey(plainCEK);
  mockUsers[TEST_USER_ID] = {
    id: TEST_USER_ID,
    email: "test@example.com",
    encrypted_cek: ciphertext,
    cek_iv: iv,
  };

  // Reset mock state
  mockKeys = {};
  mockLogs = [];

  // Create Express app with auth + keys routes
  app = express();
  app.use(express.json());
  app.use("/keys", authenticate, keysRouter);
});

function makeToken(userId: string = TEST_USER_ID) {
  return jwt.sign({ userId, email: "test@example.com" }, JWT_SECRET, {
    expiresIn: "1h",
  });
}

describe("POST /keys", () => {
  it("stores an encrypted key", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/keys")
      .set("Authorization", `Bearer ${token}`)
      .send({ service: "resend", key: "sk-resend-abc123" });

    expect(res.status).toBe(201);
    expect(res.body.service).toBe("resend");

    // Verify the stored value is encrypted (not plaintext)
    const stored = mockKeys[TEST_USER_ID][0];
    expect(stored.encrypted_value).not.toBe("sk-resend-abc123");
  });

  it("rejects missing fields", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/keys")
      .set("Authorization", `Bearer ${token}`)
      .send({ service: "resend" });

    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app)
      .post("/keys")
      .send({ service: "resend", key: "sk-123" });

    expect(res.status).toBe(401);
  });
});

describe("GET /keys", () => {
  it("lists stored services without key values", async () => {
    const token = makeToken();
    const res = await request(app)
      .get("/keys")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.services)).toBe(true);
    // Should not contain actual key values
    for (const svc of res.body.services) {
      expect(svc).not.toHaveProperty("key");
      expect(svc).not.toHaveProperty("encrypted_value");
    }
  });
});

describe("GET /keys/:service", () => {
  it("retrieves and decrypts a key", async () => {
    const token = makeToken();
    const res = await request(app)
      .get("/keys/resend")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.key).toBe("sk-resend-abc123");
    expect(res.body.service).toBe("resend");
  });

  it("logs the access", async () => {
    const beforeCount = mockLogs.length;
    const token = makeToken();
    await request(app)
      .get("/keys/resend")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Agent-Identifier", "claude-code");

    expect(mockLogs.length).toBe(beforeCount + 1);
    const lastLog = mockLogs[mockLogs.length - 1];
    expect(lastLog.user_id).toBe(TEST_USER_ID);
    expect(lastLog.agent_identifier).toBe("claude-code");
  });

  it("returns 404 for unknown service", async () => {
    const token = makeToken();
    const res = await request(app)
      .get("/keys/nonexistent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /keys/:service", () => {
  it("deletes a stored key", async () => {
    // First store a key to delete
    const token = makeToken();
    await request(app)
      .post("/keys")
      .set("Authorization", `Bearer ${token}`)
      .send({ service: "disposable", key: "sk-disposable-123" });

    const res = await request(app)
      .delete("/keys/disposable")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Key revoked");
  });

  it("returns 404 for unknown service", async () => {
    const token = makeToken();
    const res = await request(app)
      .delete("/keys/nonexistent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
