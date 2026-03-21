# Locker — Technical Architecture

## Stack

| Layer | Technology | Reason |
|---|---|---|
| Backend API | Node.js + TypeScript | Best CLI/npm ecosystem |
| Database | PostgreSQL (Railway) | Reliable, relational, Railway-native |
| Frontend Dashboard | Next.js (Railway) | Fast to build, React-based |
| CLI | npm package (`locker`) | Where developers live |
| Hosting | Railway Pro | Already paid for |
| Auth | Clerk or Auth.js | SSO: Google, GitHub, Apple |
| Payments | Stripe | Industry standard |
| Encryption | AES-256 + AWS KMS or Railway env vars | Never store keys in plaintext |

---

## System Architecture

```
Developer Machine
└── locker CLI (npm)
    └── calls → Locker API (Railway)
                └── decrypts key from Postgres
                └── logs usage
                └── returns key to CLI
                └── CLI passes to agent
```

---

## Security Model

### Encryption at Rest
- Every API key encrypted with AES-256 before hitting Postgres
- Each user gets their own encryption key (envelope encryption)
- Master key lives in Railway environment variables (or AWS KMS at scale)
- Keys never stored in plaintext, ever

### Encryption in Transit
- TLS everywhere, no exceptions

### Key Hierarchy
```
Master Key (Railway env / AWS KMS)
  └── Customer Key (encrypted by master)
        └── Individual API Keys (encrypted by customer key)
```

### Access Control
- Short-lived JWT tokens issued after `locker login`
- Stored locally in `~/.locker/config`
- Token scoped to user — no cross-user key access possible

---

## Database Schema (simplified)

```sql
users
  id, email, stripe_customer_id, created_at

keys
  id, user_id, service_name, encrypted_value, iv, created_at, last_used

access_logs
  id, key_id, user_id, accessed_at, agent_identifier
```

---

## CLI Commands (MVP)

```bash
locker login                    # browser-based OAuth flow
locker logout                   # clears local token
locker set <service> <key>      # store a key
locker get <service>            # retrieve a key (used by agents)
locker list                     # list all stored services
locker revoke <service>         # delete a key
locker whoami                   # show current logged-in user
```

---

## Dashboard Features (MVP)

- Login via Google / GitHub / Apple
- Add / view / delete keys per service
- Usage logs (which key, when, how many times)
- Billing (Stripe, usage-based or flat monthly)
- API token management
