-- Token revocation denylist for logout support
-- Entries auto-expire and should be cleaned up periodically

CREATE TABLE revoked_tokens (
  jti TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_revoked_tokens_expires ON revoked_tokens (expires_at);
