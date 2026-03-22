import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { requireEnv } from "../config";
import { getPool } from "../db/client";

export interface AuthPayload {
  userId: string;
  email: string;
  jti?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Extracts token from:
 * 1. Authorization: Bearer <token> (CLI, MCP)
 * 2. Cookie: locker_token=<token> (Dashboard)
 */
function extractToken(req: Request): string | null {
  // Bearer header first
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7);
  }

  // Cookie fallback
  const cookies = req.headers.cookie;
  if (cookies) {
    const match = cookies.split(";").find((c) => c.trim().startsWith("locker_token="));
    if (match) {
      return match.split("=")[1]?.trim() || null;
    }
  }

  return null;
}

/**
 * [H1] Check if token's jti has been revoked
 */
async function isTokenRevoked(jti: string | undefined): Promise<boolean> {
  if (!jti) return false; // Legacy tokens without jti are allowed for backward compat
  try {
    const pool = getPool();
    const result = await pool.query(
      "SELECT jti FROM revoked_tokens WHERE jti = $1 AND expires_at > now()",
      [jti]
    );
    return result.rows.length > 0;
  } catch {
    // If denylist check fails, allow the request (fail-open for availability)
    // but this should be monitored
    return false;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing or invalid authorization" });
    return;
  }

  try {
    const secret = requireEnv("JWT_SECRET");
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] }) as AuthPayload;

    // [H1] Check denylist
    if (await isTokenRevoked(payload.jti)) {
      res.status(401).json({ error: "Token has been revoked" });
      return;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
