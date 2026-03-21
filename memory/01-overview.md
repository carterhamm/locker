# Locker — Product Overview

## What Is Locker?

Locker is a secure API credential manager built for AI agents and developers. It eliminates the manual, error-prone process of generating, copying, pasting, and managing API keys across projects and AI tools.

Think of it as **1Password for AI agents** — but with a CLI that agents can call directly, without any human involvement after initial setup.

## The Problem

Every developer using Claude Code, Cursor, Codex, or any AI agent hits the same wall:

- Agent needs a Resend API key
- Developer has to stop, open a browser, log into Resend, navigate to the API section, generate a key, copy it, paste it somewhere
- This happens for every service, every project, every new environment
- Keys get stored insecurely (`.env` files committed to git, Slack messages, notes apps)
- No audit trail of which agent used which key when

This is a daily friction point for every developer working with AI agents. It's also a security risk.

## The Solution

```bash
locker login         # once, ever
locker get resend    # agent calls this, gets the key instantly
```

One login. Every key available to any agent, securely, instantly, with full audit logs.

## Domain

**locker.dev** (pending purchase)

## Company

Built under **Nexus AI** umbrella (nexus-ai.com / Google Workspace already active)

## Stage

Pre-build. MVP planned for 7-day sprint using Claude Code + Railway.
