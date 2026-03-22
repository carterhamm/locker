import { Router, Request, Response } from "express";
import { getPool } from "../db/client";
import { isValidServiceName } from "./auth";
import {
  decryptWithMasterKey,
  encryptUserKey,
  decryptUserKey,
} from "../services/encryption";

export const keysRouter = Router();

async function getUserCEK(userId: string): Promise<string> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT encrypted_cek, cek_iv FROM users WHERE id = $1",
    [userId]
  );
  if (result.rows.length === 0) {
    throw new Error("User not found");
  }
  const { encrypted_cek, cek_iv } = result.rows[0];
  return decryptWithMasterKey(encrypted_cek, cek_iv);
}

// [M7] No-cache headers for key responses
function setNoCacheHeaders(res: Response) {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
}

/**
 * POST /keys
 */
keysRouter.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { service, key } = req.body;

    if (!service || !key) {
      res.status(400).json({ error: "service and key are required" });
      return;
    }

    if (typeof service !== "string" || typeof key !== "string") {
      res.status(400).json({ error: "service and key must be strings" });
      return;
    }

    const serviceName = service.toLowerCase().trim();

    // [M3] Validate service name
    if (!isValidServiceName(serviceName)) {
      res.status(400).json({ error: "Service name must be 1-100 chars, alphanumeric with .-_ only" });
      return;
    }

    const userCEK = await getUserCEK(userId);
    const { ciphertext, iv } = encryptUserKey(key, userCEK);

    const pool = getPool();
    await pool.query(
      `INSERT INTO keys (user_id, service_name, encrypted_value, iv)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, service_name)
       DO UPDATE SET encrypted_value = $3, iv = $4, last_used = NULL`,
      [userId, serviceName, ciphertext, iv]
    );

    res.status(201).json({ service: serviceName, message: "Key stored" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /keys
 */
keysRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const pool = getPool();

    const result = await pool.query(
      `SELECT service_name, created_at, last_used FROM keys
       WHERE user_id = $1
       ORDER BY service_name`,
      [userId]
    );

    const services = result.rows.map((row) => ({
      service: row.service_name,
      createdAt: row.created_at,
      lastUsed: row.last_used,
    }));

    res.json({ services });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /keys/:service
 * [H5/M7] Cache-control headers on key retrieval
 */
keysRouter.get("/:service", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const serviceName = req.params.service.toLowerCase().trim();
    const agentIdentifier = (req.headers["x-agent-identifier"] as string) || null;

    const pool = getPool();

    const result = await pool.query(
      `SELECT id, encrypted_value, iv FROM keys
       WHERE user_id = $1 AND service_name = $2`,
      [userId, serviceName]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: `No key found for service: ${serviceName}` });
      return;
    }

    const { id: keyId, encrypted_value, iv } = result.rows[0];

    const userCEK = await getUserCEK(userId);
    const plainKey = decryptUserKey(encrypted_value, iv, userCEK);

    await pool.query(
      `INSERT INTO access_logs (key_id, user_id, agent_identifier)
       VALUES ($1, $2, $3)`,
      [keyId, userId, agentIdentifier]
    );

    await pool.query(
      "UPDATE keys SET last_used = now() WHERE id = $1",
      [keyId]
    );

    setNoCacheHeaders(res);
    res.json({ service: serviceName, key: plainKey });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /keys/:service
 */
keysRouter.delete("/:service", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const serviceName = req.params.service.toLowerCase().trim();

    const pool = getPool();
    const result = await pool.query(
      "DELETE FROM keys WHERE user_id = $1 AND service_name = $2 RETURNING id",
      [userId, serviceName]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: `No key found for service: ${serviceName}` });
      return;
    }

    res.json({ service: serviceName, message: "Key revoked" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});
