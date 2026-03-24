import { Router, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { getPool } from "../db/client";
import { requireEnv } from "../config";
import { authenticate } from "../middleware/auth";
import {
  generateUserCEK,
  encryptWithMasterKey,
} from "../services/encryption";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later" },
});
authRouter.use(authLimiter);

const SALT_ROUNDS = 12;
const JWT_EXPIRY = "30d";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

function isStrongPassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return null;
}

export function isValidServiceName(name: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{0,99}$/.test(name);
}

/**
 * Issues a JWT with a unique jti for revocation support.
 * [H2] Also sets an httpOnly cookie for dashboard use.
 */
function issueToken(
  res: Response,
  userId: string,
  email: string
): string {
  const secret = requireEnv("JWT_SECRET");
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { userId, email, jti },
    secret,
    { expiresIn: JWT_EXPIRY, algorithm: "HS256" }
  );

  // [H2] Set httpOnly cookie — dashboard reads this automatically
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("locker_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  // Also return token in body for CLI/MCP (they ignore cookies)
  return token;
}

/**
 * POST /auth/register
 */
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Email and password must be strings" });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    const pwError = isStrongPassword(password);
    if (pwError) {
      res.status(400).json({ error: pwError });
      return;
    }

    const pool = getPool();

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const plainCEK = generateUserCEK();
    const { ciphertext: encryptedCEK, iv: cekIV } =
      encryptWithMasterKey(plainCEK);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, encrypted_cek, cek_iv)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email`,
      [email.toLowerCase(), passwordHash, encryptedCEK, cekIV]
    );

    const user = result.rows[0];
    const token = issueToken(res, user.id, user.email);

    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /auth/login
 */
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const pool = getPool();
    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = issueToken(res, user.id, user.email);

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /auth/check-email
 */
authRouter.post("/check-email", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const pool = getPool();
    const result = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    res.json({ exists: result.rows.length > 0 });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /auth/logout
 * [H1] Revokes the JWT by adding its jti to the denylist.
 */
authRouter.post("/logout", authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.jti) {
      // Decode the full token to get expiry
      const token = req.headers.authorization?.slice(7)
        || req.headers.cookie?.split("locker_token=")[1]?.split(";")[0];

      let expiresAt = new Date(Date.now() + COOKIE_MAX_AGE);
      if (token) {
        const decoded = jwt.decode(token) as { exp?: number } | null;
        if (decoded?.exp) {
          expiresAt = new Date(decoded.exp * 1000);
        }
      }

      const pool = getPool();
      await pool.query(
        `INSERT INTO revoked_tokens (jti, user_id, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (jti) DO NOTHING`,
        [user.jti, user.userId, expiresAt.toISOString()]
      );
    }

    // [H2] Clear the cookie
    res.clearCookie("locker_token", { path: "/" });

    res.json({ message: "Logged out. Token revoked." });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /auth/me
 * [H2] Returns current user from cookie — dashboard uses this instead of localStorage.
 */
authRouter.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      "SELECT id, email, full_name, billing_address FROM users WHERE id = $1",
      [req.user!.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const u = result.rows[0];
    res.json({ user: { id: u.id, email: u.email, fullName: u.full_name, billingAddress: u.billing_address } });
  } catch {
    res.json({ user: { id: req.user!.userId, email: req.user!.email } });
  }
});

/**
 * POST /auth/forgot-password
 */
authRouter.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "Email is required" }); return; }
    const pool = getPool();
    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    // Always succeed to prevent email enumeration
    if (userResult.rows.length === 0) { res.json({ message: "If that email exists, a reset link has been sent." }); return; }
    const userId = userResult.rows[0].id;
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query("INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)", [userId, resetToken, expiresAt.toISOString()]);
    // TODO: Send email via Resend/SendGrid. For now, log it.
    console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

/**
 * POST /auth/reset-password
 */
authRouter.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token: resetToken, password } = req.body;
    if (!resetToken || !password) { res.status(400).json({ error: "Token and password are required" }); return; }
    const pwError = isStrongPassword(password);
    if (pwError) { res.status(400).json({ error: pwError }); return; }
    const pool = getPool();
    const result = await pool.query("SELECT id, user_id FROM password_resets WHERE token = $1 AND expires_at > now() AND used = false", [resetToken]);
    if (result.rows.length === 0) { res.status(400).json({ error: "Invalid or expired reset link" }); return; }
    const { id: resetId, user_id: userId } = result.rows[0];
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await pool.query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [passwordHash, userId]);
    await pool.query("UPDATE password_resets SET used = true WHERE id = $1", [resetId]);
    res.json({ message: "Password reset. You can now sign in." });
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

/**
 * PUT /auth/profile
 */
authRouter.put("/profile", authenticate, async (req: Request, res: Response) => {
  try {
    const { fullName, billingAddress } = req.body;
    const pool = getPool();
    await pool.query(
      "UPDATE users SET full_name = $1, billing_address = $2, updated_at = now() WHERE id = $3",
      [fullName || null, billingAddress || null, req.user!.userId]
    );
    res.json({ message: "Profile updated" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});
