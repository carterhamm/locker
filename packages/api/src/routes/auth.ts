import { Router, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPool } from "../db/client";
import { requireEnv } from "../config";
import {
  generateUserCEK,
  encryptWithMasterKey,
} from "../services/encryption";

export const authRouter = Router();

// [M1] Stricter rate limit on auth (10 per 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later" },
});
authRouter.use(authLimiter);

const SALT_ROUNDS = 12;
const JWT_EXPIRY = "24h";

// [M2] Email validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

// [M5] Password complexity
function isStrongPassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return null;
}

// [M3] Service name validation (exported for use in keys.ts)
export function isValidServiceName(name: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{0,99}$/.test(name);
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

    // [M2] Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // [M5] Password complexity
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

    const secret = requireEnv("JWT_SECRET");
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: JWT_EXPIRY, algorithm: "HS256" }
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch {
    // [M4] Don't log full error objects
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

    const secret = requireEnv("JWT_SECRET");
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: JWT_EXPIRY, algorithm: "HS256" }
    );

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /auth/check-email
 * [C2] Removed hardcoded demo account backdoor
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
 */
authRouter.post("/logout", (_req: Request, res: Response) => {
  res.json({ message: "Logged out. Discard your token." });
});
