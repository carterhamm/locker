import { Router, Request, Response } from "express";
import crypto from "node:crypto";
import { getPool } from "../db/client";
import { requireEnv } from "../config";
import { authenticate } from "../middleware/auth";
import { encryptWithMasterKey, decryptWithMasterKey } from "../services/encryption";

export const integrationsRouter = Router();

// All routes require auth
integrationsRouter.use(authenticate);

/**
 * GET /integrations
 * List available providers and user's connection status.
 */
integrationsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const userId = req.user!.userId;

    const providers = await pool.query(
      "SELECT id, name, icon_url, enabled FROM oauth_providers WHERE enabled = true ORDER BY name"
    );

    const connections = await pool.query(
      "SELECT provider_id, provider_email, connected_at FROM oauth_connections WHERE user_id = $1",
      [userId]
    );

    const connMap = new Map(connections.rows.map((c) => [c.provider_id, c]));

    const result = providers.rows.map((p) => {
      const conn = connMap.get(p.id);
      return {
        id: p.id,
        name: p.name,
        iconUrl: p.icon_url,
        connected: !!conn,
        connectedEmail: conn?.provider_email || null,
        connectedAt: conn?.connected_at || null,
      };
    });

    res.json({ integrations: result });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /integrations/:provider/connect
 * Returns the OAuth authorization URL for the provider.
 */
integrationsRouter.get("/:provider/connect", async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const providerId = req.params.provider.toLowerCase();

    const providerResult = await pool.query(
      "SELECT id, auth_url, scopes FROM oauth_providers WHERE id = $1 AND enabled = true",
      [providerId]
    );

    if (providerResult.rows.length === 0) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }

    const provider = providerResult.rows[0];
    if (!provider.auth_url) {
      res.status(400).json({ error: `${providerId} doesn't support OAuth yet` });
      return;
    }

    // Get client ID from env
    const clientIdKey = `OAUTH_${providerId.toUpperCase()}_CLIENT_ID`;
    const clientId = process.env[clientIdKey];
    if (!clientId) {
      res.status(400).json({ error: `${providerId} OAuth is not configured` });
      return;
    }

    // Generate state token for CSRF protection
    const state = crypto.randomUUID();
    const redirectUri = `${process.env.API_BASE_URL || "https://api-production-449f.up.railway.app"}/integrations/${providerId}/callback`;

    // Store state in DB for verification
    await pool.query(
      `INSERT INTO passkey_challenges (user_id, challenge) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET challenge = $2, created_at = now()`,
      [req.user!.userId, `oauth:${providerId}:${state}`]
    );

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: provider.scopes,
      response_type: "code",
    });

    res.json({ url: `${provider.auth_url}?${params.toString()}` });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /integrations/:provider/callback
 * OAuth callback — exchanges code for tokens, stores encrypted.
 */
integrationsRouter.get("/:provider/callback", async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const providerId = req.params.provider.toLowerCase();
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({ error: "Missing code or state" });
      return;
    }

    const provider = await pool.query(
      "SELECT token_url FROM oauth_providers WHERE id = $1",
      [providerId]
    );
    if (provider.rows.length === 0) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }

    const clientIdKey = `OAUTH_${providerId.toUpperCase()}_CLIENT_ID`;
    const clientSecretKey = `OAUTH_${providerId.toUpperCase()}_CLIENT_SECRET`;
    const clientId = process.env[clientIdKey];
    const clientSecret = process.env[clientSecretKey];

    if (!clientId || !clientSecret) {
      res.status(400).json({ error: "OAuth not configured" });
      return;
    }

    const redirectUri = `${process.env.API_BASE_URL || "https://api-production-449f.up.railway.app"}/integrations/${providerId}/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch(provider.rows[0].token_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json() as Record<string, unknown>;
    if (!tokenRes.ok || !tokenData.access_token) {
      res.status(400).json({ error: "Failed to exchange code for token" });
      return;
    }

    const accessToken = tokenData.access_token as string;
    const refreshToken = (tokenData.refresh_token as string) || null;
    const expiresIn = (tokenData.expires_in as number) || null;

    // Encrypt tokens before storing
    const { ciphertext: atEnc, iv: atIv } = encryptWithMasterKey(accessToken);
    let rtEnc = null, rtIv = null;
    if (refreshToken) {
      const rt = encryptWithMasterKey(refreshToken);
      rtEnc = rt.ciphertext;
      rtIv = rt.iv;
    }

    // Find the user from the OAuth state
    // For callback flow, we need to identify the user differently
    // Using a cookie or the state token
    const stateResult = await pool.query(
      "SELECT user_id FROM passkey_challenges WHERE challenge = $1",
      [`oauth:${providerId}:${state}`]
    );

    if (stateResult.rows.length === 0) {
      res.status(400).json({ error: "Invalid state" });
      return;
    }

    const userId = stateResult.rows[0].user_id;

    // Store connection
    await pool.query(
      `INSERT INTO oauth_connections
       (user_id, provider_id, access_token_encrypted, access_token_iv, refresh_token_encrypted, refresh_token_iv, token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, provider_id)
       DO UPDATE SET access_token_encrypted = $3, access_token_iv = $4,
                     refresh_token_encrypted = $5, refresh_token_iv = $6,
                     token_expires_at = $7, connected_at = now()`,
      [
        userId, providerId, atEnc, atIv, rtEnc, rtIv,
        expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      ]
    );

    // Clean up state
    await pool.query("DELETE FROM passkey_challenges WHERE user_id = $1", [userId]);

    // Redirect to dashboard
    const dashboardUrl = process.env.DASHBOARD_URL || "https://dashboard-production-fe57.up.railway.app";
    res.redirect(`${dashboardUrl}/dashboard/settings?connected=${providerId}`);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /integrations/:provider
 * Disconnect a provider.
 */
integrationsRouter.delete("/:provider", async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const userId = req.user!.userId;
    const providerId = req.params.provider.toLowerCase();

    const result = await pool.query(
      "DELETE FROM oauth_connections WHERE user_id = $1 AND provider_id = $2 RETURNING id",
      [userId, providerId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Not connected" });
      return;
    }

    res.json({ message: `Disconnected from ${providerId}` });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});
