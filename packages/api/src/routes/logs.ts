import { Router, Request, Response } from "express";
import { getPool } from "../db/client";

export const logsRouter = Router();

/**
 * GET /logs
 * Returns access logs for the authenticated user.
 * Query params: limit (default 50), offset (default 0)
 */
logsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const pool = getPool();
    const result = await pool.query(
      `SELECT al.id, al.accessed_at, al.agent_identifier,
              k.service_name
       FROM access_logs al
       JOIN keys k ON al.key_id = k.id
       WHERE al.user_id = $1
       ORDER BY al.accessed_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const logs = result.rows.map((row) => ({
      id: row.id,
      service: row.service_name,
      accessedAt: row.accessed_at,
      agentIdentifier: row.agent_identifier,
    }));

    res.json({ logs, limit, offset });
  } catch (err) {
    console.error("Get logs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
