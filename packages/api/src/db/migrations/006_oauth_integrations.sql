-- OAuth integrations for Model B (Direct Partnership)
-- Stores OAuth tokens from partner services that can auto-issue API keys

CREATE TABLE oauth_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  auth_url TEXT NOT NULL,
  token_url TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT '',
  icon_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES oauth_providers(id) ON DELETE CASCADE,
  access_token_encrypted TEXT NOT NULL,
  access_token_iv TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  refresh_token_iv TEXT,
  token_expires_at TIMESTAMPTZ,
  provider_account_id TEXT,
  provider_email TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider_id)
);

CREATE INDEX idx_oauth_connections_user ON oauth_connections (user_id);

-- Seed some providers (credentials filled in later via env vars)
INSERT INTO oauth_providers (id, name, auth_url, token_url, scopes) VALUES
  ('github', 'GitHub', 'https://github.com/login/oauth/authorize', 'https://github.com/login/oauth/access_token', 'repo'),
  ('vercel', 'Vercel', 'https://vercel.com/integrations/oauth/authorize', 'https://api.vercel.com/v2/oauth/access_token', ''),
  ('resend', 'Resend', '', '', ''),
  ('stripe', 'Stripe', 'https://connect.stripe.com/oauth/authorize', 'https://connect.stripe.com/oauth/token', 'read_write')
ON CONFLICT (id) DO NOTHING;
