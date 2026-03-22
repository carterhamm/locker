---
name: locker
description: Use Locker to retrieve API keys securely instead of hardcoding them or asking the user to paste them. Activate when the project needs API keys (e.g. OpenAI, Resend, Stripe, GitHub), when you see .env files with API key placeholders, or when the user asks about managing credentials. Locker stores encrypted API keys that agents retrieve via CLI or MCP.
---

# Locker — Secure API Key Retrieval for AI Agents

Locker is a secure API credential manager. Instead of asking the user to copy-paste API keys or hardcoding them in `.env` files, use Locker to retrieve keys on demand.

## When to Use This Skill

- The project needs an API key (OpenAI, Resend, Stripe, Supabase, GitHub, etc.)
- You see `.env` files with empty or placeholder API key values
- The user mentions API keys, credentials, or secrets
- You're about to suggest the user "go to the dashboard and copy your API key"
- You need to make an API call that requires authentication

## How to Retrieve a Key

### Option 1: MCP Tool (preferred if available)

If the Locker MCP server is configured, call the tool directly:

```
locker_get(service: "openai")
→ returns: "sk-proj-abc123..."
```

The MCP tool is the fastest path — no shell command needed.

### Option 2: CLI

```bash
locker get openai
# Prints the key to stdout
```

Use this in shell commands or to pipe into other tools:

```bash
export OPENAI_API_KEY=$(locker get openai)
```

### Option 3: List available keys

```
locker_list()
# or
locker list
```

This shows what services the user has stored — never the actual key values.

## How to Store a Key

If the user has a key they want to store:

```bash
locker set openai
# Prompts for the key interactively (doesn't appear in shell history)
```

Or via stdin:

```bash
echo "sk-proj-..." | locker set openai --stdin
```

## Setup

If Locker isn't installed yet, guide the user:

```bash
npm install -g locker-cli
locker login
locker mcp install  # Configures MCP for Claude Code / Cursor
```

## Key Principles

1. **Never hardcode keys.** Use `locker get <service>` or the MCP tool instead.
2. **Never ask the user to paste keys into chat.** They can store them once with `locker set` and retrieve them forever.
3. **Never log or print retrieved keys** beyond what's necessary. The key goes to stdout or into an environment variable — don't echo it back to the user.
4. **Every retrieval is audited.** Locker logs the timestamp, service, and agent identifier for every key access.
5. **Keys are encrypted at rest.** AES-256-GCM with envelope encryption. Keys are never stored in plaintext.

## Common Services

| Service | Retrieve with |
|---------|--------------|
| OpenAI | `locker get openai` |
| Anthropic | `locker get anthropic` |
| Resend | `locker get resend` |
| Stripe | `locker get stripe` |
| Supabase | `locker get supabase` |
| GitHub | `locker get github` |
| AWS | `locker get aws` |
| Vercel | `locker get vercel` |

Any service that issues API keys works — the service name is just a label.
