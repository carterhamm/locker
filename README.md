# Locker

Secure API key manager for AI agents and developers.

Store your API keys once. Retrieve them from any agent, any project, any machine. Encrypted at rest, audited on every access.

## Quick Start

```bash
npm install -g locker-cli
locker login
locker set openai
# Prompts for the key — never appears in shell history
```

Any AI agent retrieves keys instantly:

```bash
locker get openai
# sk-proj-...
```

Works with Claude Code, Cursor, Codex, and anything that runs shell commands.

## How It Works

You store API keys in Locker. They're encrypted with AES-256-GCM using an envelope encryption model — your keys never exist in plaintext in the database. When an agent needs a key, it calls `locker get <service>` and gets the decrypted key to stdout. Every retrieval is logged with a timestamp, user, and agent identifier.

```
Your API Key
    → Encrypted with your personal key (CEK)
        → CEK encrypted with master key (env var only)
            → Stored in Postgres
```

Nobody — not even us — can read your keys without the master key.

## MCP Server

For Claude Code and other MCP-compatible agents, Locker exposes tools natively:

```bash
locker mcp install
# Automatically configures Claude Code and Cursor
```

The agent can then call `locker_get("openai")` directly — no shell commands needed.

## Chrome Extension

Store keys from anywhere with the Locker Chrome extension. Hit `Ctrl+Shift+K` (Mac: `Ctrl+Shift+K`), type the service name, paste the key, done. Keys appear on your dashboard within seconds.

## Commands

| Command | Description |
|---------|-------------|
| `locker login` | Sign in (once) |
| `locker set <service>` | Store a key (prompts interactively) |
| `locker get <service>` | Retrieve a key to stdout |
| `locker list` | List stored services |
| `locker revoke <service>` | Delete a stored key |
| `locker whoami` | Show current user |
| `locker mcp install` | Configure MCP for AI tools |

## Security

- **AES-256-GCM** encryption with authenticated encryption and unique IVs
- **Envelope encryption** — master key → per-user CEK → individual keys
- **JWT auth** with HS256, token revocation on logout, httpOnly cookies
- **Passkey support** — WebAuthn for passwordless login
- **Audit trail** — every key retrieval logged with timestamp and agent ID
- **Rate limiting** — 10 auth attempts / 15min, 100 requests / 15min
- **Zero plaintext** — keys are never stored unencrypted, never logged

## Dashboard

Manage keys, view access logs, register passkeys, and monitor usage at your dashboard URL.

## Claude Code Skill

Teach any AI agent about Locker:

```bash
npx skills add carterhamm/locker --skill locker
```

The agent will automatically use `locker get` instead of asking you to paste API keys.

## Architecture

```
CLI / Extension / MCP Server
    ↓ HTTPS + JWT
Express API (Railway)
    ↓ AES-256-GCM
PostgreSQL (Railway, 50GB)
```

Built with TypeScript, Express, Next.js, and PostgreSQL. Hosted on Railway.

## License

Private. © 2026 Nexus AI.
