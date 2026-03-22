-- WebAuthn passkey credentials
CREATE TABLE passkey_credentials (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT,
  backed_up BOOLEAN NOT NULL DEFAULT false,
  transports TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_passkey_user ON passkey_credentials (user_id);

-- Store current challenges (short-lived, cleaned up after use)
CREATE TABLE passkey_challenges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);
