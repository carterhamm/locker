import { Router, Request, Response } from "express";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { getPool } from "../db/client";
import { requireEnv } from "../config";
import { authenticate } from "../middleware/auth";

export const passkeysRouter = Router();

/**
 * GET /passkeys/count
 * Returns how many passkeys the user has registered.
 */
passkeysRouter.get("/count", authenticate, async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM passkey_credentials WHERE user_id = $1",
      [req.user!.userId]
    );
    res.json({ count: Number(result.rows[0].count) });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// RP config — update these for production
const RP_NAME = "Locker";
const RP_ID = process.env.PASSKEY_RP_ID || "localhost";
const RP_ORIGIN = process.env.PASSKEY_RP_ORIGIN || "http://localhost:5003";

const JWT_EXPIRY = "24h";

function issueJWT(res: Response, userId: string, email: string): string {
  const secret = requireEnv("JWT_SECRET");
  const jti = crypto.randomUUID();
  const token = jwt.sign({ userId, email, jti }, secret, {
    expiresIn: JWT_EXPIRY,
    algorithm: "HS256",
  });
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("locker_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
  return token;
}

/**
 * POST /passkeys/register/options
 * Generates registration options for the authenticated user.
 * User must be logged in first (via password) to register a passkey.
 */
passkeysRouter.post("/register/options", authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const pool = getPool();

    // Get existing credentials for exclusion
    const existing = await pool.query(
      "SELECT id, transports FROM passkey_credentials WHERE user_id = $1",
      [user.userId]
    );

    const excludeCredentials = existing.rows.map((row) => ({
      id: row.id,
      transports: (row.transports || []) as AuthenticatorTransportFuture[],
    }));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: user.email,
      userDisplayName: user.email,
      attestationType: "none",
      excludeCredentials,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Store challenge
    await pool.query(
      `INSERT INTO passkey_challenges (user_id, challenge) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET challenge = $2, created_at = now()`,
      [user.userId, options.challenge]
    );

    res.json(options);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /passkeys/register/verify
 * Verifies the registration response and stores the credential.
 */
passkeysRouter.post("/register/verify", authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const pool = getPool();

    // Get stored challenge
    const challengeResult = await pool.query(
      "SELECT challenge FROM passkey_challenges WHERE user_id = $1",
      [user.userId]
    );
    if (challengeResult.rows.length === 0) {
      res.status(400).json({ error: "No challenge found. Start registration again." });
      return;
    }

    const expectedChallenge = challengeResult.rows[0].challenge;
    const body = req.body as RegistrationResponseJSON;

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: "Verification failed" });
      return;
    }

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // Store credential
    await pool.query(
      `INSERT INTO passkey_credentials (id, user_id, public_key, counter, device_type, backed_up, transports)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        credential.id,
        user.userId,
        Buffer.from(credential.publicKey),
        credential.counter,
        credentialDeviceType,
        credentialBackedUp,
        credential.transports || [],
      ]
    );

    // Clean up challenge
    await pool.query("DELETE FROM passkey_challenges WHERE user_id = $1", [user.userId]);

    res.json({ verified: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /passkeys/authenticate/options
 * Generates authentication options. No auth required — this is the login flow.
 */
passkeysRouter.post("/authenticate/options", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const pool = getPool();

    let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = [];
    let userId: string | null = null;

    if (email) {
      // Find user and their credentials
      const userResult = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email.toLowerCase()]
      );
      if (userResult.rows.length === 0) {
        res.status(404).json({ error: "No account found" });
        return;
      }
      userId = userResult.rows[0].id;

      const creds = await pool.query(
        "SELECT id, transports FROM passkey_credentials WHERE user_id = $1",
        [userId]
      );

      if (creds.rows.length === 0) {
        res.status(404).json({ error: "No passkeys registered for this account" });
        return;
      }

      allowCredentials = creds.rows.map((row) => ({
        id: row.id,
        transports: (row.transports || []) as AuthenticatorTransportFuture[],
      }));
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: "preferred",
    });

    // Store challenge (use a temp ID if no user yet — for discoverable credentials)
    if (userId) {
      await pool.query(
        `INSERT INTO passkey_challenges (user_id, challenge) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET challenge = $2, created_at = now()`,
        [userId, options.challenge]
      );
    }

    res.json({ ...options, userId });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /passkeys/authenticate/verify
 * Verifies the authentication response and issues a JWT.
 */
passkeysRouter.post("/authenticate/verify", async (req: Request, res: Response) => {
  try {
    const { response, userId } = req.body as {
      response: AuthenticationResponseJSON;
      userId: string;
    };

    if (!userId || !response) {
      res.status(400).json({ error: "Missing userId or response" });
      return;
    }

    const pool = getPool();

    // Get stored challenge
    const challengeResult = await pool.query(
      "SELECT challenge FROM passkey_challenges WHERE user_id = $1",
      [userId]
    );
    if (challengeResult.rows.length === 0) {
      res.status(400).json({ error: "No challenge found" });
      return;
    }

    const expectedChallenge = challengeResult.rows[0].challenge;

    // Get the credential
    const credResult = await pool.query(
      "SELECT id, public_key, counter FROM passkey_credentials WHERE id = $1 AND user_id = $2",
      [response.id, userId]
    );
    if (credResult.rows.length === 0) {
      res.status(400).json({ error: "Credential not found" });
      return;
    }

    const storedCred = credResult.rows[0];

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: storedCred.id,
        publicKey: new Uint8Array(storedCred.public_key),
        counter: Number(storedCred.counter),
      },
    });

    if (!verification.verified) {
      res.status(400).json({ error: "Verification failed" });
      return;
    }

    // Update counter
    await pool.query(
      "UPDATE passkey_credentials SET counter = $1 WHERE id = $2",
      [verification.authenticationInfo.newCounter, storedCred.id]
    );

    // Clean up challenge
    await pool.query("DELETE FROM passkey_challenges WHERE user_id = $1", [userId]);

    // Get user email and issue JWT
    const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);
    const email = userResult.rows[0].email;

    const token = issueJWT(res, userId, email);

    res.json({ token, user: { id: userId, email } });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});
