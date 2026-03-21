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

// Stricter rate limit on auth routes (20 per 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later" },
});
authRouter.use(authLimiter);

const SALT_ROUNDS = 12;
const JWT_EXPIRY = "24h";

/**
 * POST /auth/register
 * Body: { email, password }
 * Creates user with encrypted CEK, returns JWT.
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

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const pool = getPool();

    // Check if user exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate and encrypt a CEK for this user
    const plainCEK = generateUserCEK();
    const { ciphertext: encryptedCEK, iv: cekIV } =
      encryptWithMasterKey(plainCEK);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, encrypted_cek, cek_iv)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email`,
      [email.toLowerCase(), passwordHash, encryptedCEK, cekIV]
    );

    const user = result.rows[0];

    // Issue JWT
    const secret = requireEnv("JWT_SECRET");
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /auth/login
 * Body: { email, password }
 * Returns JWT on success.
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
      { expiresIn: JWT_EXPIRY }
    );

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /auth/logout
 * Client-side logout — JWT is stateless, so just acknowledge.
 * Client should discard the token.
 */
authRouter.post("/logout", (_req: Request, res: Response) => {
  res.json({ message: "Logged out. Discard your token." });
});
