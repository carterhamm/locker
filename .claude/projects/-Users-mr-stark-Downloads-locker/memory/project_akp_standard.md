---
name: Agent Key Protocol (AKP) standard
description: Open standard for agents to fetch API keys from service providers via a broker (Locker). Combines Model B + D.
type: project
---

# Agent Key Protocol (AKP)

An open standard where service providers (OpenAI, Resend, Stripe, etc.) expose an endpoint that lets authorized agents request scoped, short-lived API keys on demand. No human copy-paste, no long-lived keys on disk.

## Two sides of the protocol

### AKP-Agent (agent → broker)
- Universal endpoint: `GET /.well-known/agent-keys/<service>`
- Agent authenticates via signed certificate (issued during locker login)
- Broker returns the key + audit metadata
- Replaces: env vars, .env files, shell commands, MCP tool calls
- Any agent, any broker — interoperable

### AKP-Provider (broker → service)
- Services implement: `POST /akp/v1/issue-key`
- Broker calls with OAuth token + requested scope + TTL
- Service returns a fresh, scoped, short-lived API key
- Key auto-expires (minutes to hours, not months)
- Replaces: long-lived keys, manual dashboard key generation

### Why both sides are necessary
- Agent-only = just another client library, services still issue long-lived keys
- Provider-only = services issue short-lived keys but agents can't discover them
- Both together = no long-lived keys anywhere, fully automated, fully audited

## Flow (end to end)
1. User authorizes Locker with a service once (OAuth)
2. Agent calls AKP-Agent endpoint on Locker
3. Locker calls AKP-Provider endpoint on the service
4. Service issues a fresh, scoped, short-lived key
5. Locker returns it to the agent, logs the issuance
6. Agent uses it. Key auto-expires. No key ever touches disk.

## Why services adopt it
- Eliminates leaked long-lived keys (their #1 security headache)
- Scoped keys reduce abuse surface
- Visibility into which agents consume their API
- Fewer "my key got leaked" support tickets

## Locker's role
- Reference broker implementation (both sides)
- Publishes the spec (RFC-style)
- Agent SDK (AKP-Agent client)
- Provider SDK (AKP-Provider server middleware)
- Manages OAuth connections to services
- Audits all key issuances

## Approach
Build V1 as Locker-first — get the UX and logic right on our own product.
Once perfected, extract it into the open standard. Don't ship a half-baked
spec that hasn't been battle-tested.

## V1 Spec (simplified, see separate AKP spec in memory)
- Agent side: standardized endpoint for key retrieval from any store
- Provider side: manifest + connect flow for services to send keys to stores
- Keys persist as long as user wants (not ephemeral-only)
- No required middleman — stores are just where keys live
- Open for anyone: key stores, service providers, agents

## Next steps
1. Build AKP into Locker as the reference implementation
2. Test with real agents (Claude Code MCP, Cursor)
3. Test with real services (start with GitHub OAuth — already built)
4. Iterate on the UX until it's seamless
5. THEN extract into open spec + SDKs
6. Approach services and agents for adoption

**Why:** This is the long-term moat. The protocol is open, Locker is the default broker. Same playbook as OAuth — spec is free, infrastructure is the business.
