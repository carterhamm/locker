# Locker — Product Models

Four progressive models, each building on the last. MVP ships Model A + Model C.

---

## Model A — Secure Key Storage (MVP)
**"Locker is a secure vault for API keys you already have"**

- User pastes their raw API key into Locker once (via dashboard or CLI)
- Locker encrypts and stores it
- Any agent calls `locker get <service>` to retrieve it
- No partnership with services needed — works with everything on day one
- Full audit log of every retrieval

**Works with:** Every API service that issues keys (Resend, Stripe, OpenAI, GitHub, etc.)

---

## Model B — Direct Partnership (Future)
**"Services issue keys directly to Locker — no raw key ever handled"**

- Service (e.g. Resend) builds an OAuth-style "Connect with Locker" button
- User clicks it, approves scoped access, Resend issues a token directly to Locker
- More secure — no raw key ever touches the user's clipboard or Locker's input layer
- Requires business development and engineering effort from the service

**Timeline:** Post-launch, once there are enough Locker users to make it worth a service's time

---

## Model C — Locker Login CLI (MVP)
**"gh auth login, but for all your API keys"**

```bash
locker login                    # opens browser → user logs in once
locker get resend               # retrieves key instantly
locker set resend <key>         # stores a new key
locker list                     # shows all stored services
```

- CLI is an npm package (`npm install -g locker`)
- Auth token stored locally after `locker login`
- Agents call `locker get <service>` — no human involvement after setup
- Inspired by GitHub CLI (`gh auth login`) UX pattern

---

## Model D — Full Automation (Future Vision)
**"The agent handles everything — account creation, key generation, storage"**

- Agent detects it needs a Resend key
- Runs `locker get resend` — Locker sees user doesn't have one
- Locker uses browser automation (Playwright) to:
  1. Create a Resend account if needed
  2. Generate an API key
  3. Store it automatically
  4. Return it to the agent
- Zero human involvement after `locker login`

**Blocker:** CAPTCHAs and anti-bot detection on service websites. Solvable but not trivial. Post-MVP.

## Model E — MCP Server / Claude Skill (MVP Addition)
**"Agents fetch keys directly through Claude, no CLI required"**

- Publish Locker as an MCP server so Claude agents can call locker_get(service) natively
- Removes CLI installation requirement entirely for Claude Code / claude.ai users
- Target audience overlap is 100% with early adopters
- Build Day 4 alongside CLI polish — shares the same API endpoints, minimal extra work
- Distribution: listed in MCP directory, surfaces Locker to Claude users organically
