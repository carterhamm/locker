---
name: Billing plan
description: Pricing model and billing infrastructure requirements for Locker
type: project
---

# Billing

**Pricing:** $0.003/retrieval, first 100 retrievals/month free.

**Infrastructure needed:**
- Stripe Checkout integration
- `billing` table: user_id, stripe_customer_id, current_period_start/end
- Usage tracking: count retrievals per user per billing period (from access_logs)
- User profile fields: full name, billing address
- Stripe webhook to handle payment events
- Dashboard billing page: usage meter, payment method, invoices
- API middleware: check retrieval count, enforce limit after free tier if no payment method

**Implementation plan:**
1. Stripe Checkout (setup mode) to collect card — no upfront charge
2. Create Stripe Subscription with metered price ($0.003/unit)
3. On each GET /keys/:service, report 1 usage unit to Stripe via API
4. Stripe auto-invoices at end of billing period
5. First 100 units/month free (enforced in our API, not Stripe)
6. Card stays on file for future features (agent auto-purchases)

**Why:** $0.003/retrieval is low enough for zero friction but scales with usage. 100 free/month covers light users and evaluation. A user doing 1000 retrievals/month pays $2.70.
