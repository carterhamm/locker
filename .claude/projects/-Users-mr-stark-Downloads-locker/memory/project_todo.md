---
name: TODO list
description: Active list of things to build/fix, organized by when they can be done
type: project
---

# Locker TODO

## Now (can do immediately)
- [ ] Forgot password + reset password UI pages on dashboard

## Before Launch (needs domain locker.dev)
- [ ] Email sending via Resend (forgot password, welcome email)
- [ ] MFA/2FA (TOTP authenticator app support)
- [ ] Chrome Web Store publish (user has Google dev account)
- [ ] Safari extension (user has Mac + Xcode + Apple Developer Account)
- [ ] Firefox extension (addons.mozilla.org)
- [ ] Custom domain setup on Railway
- [ ] Email change with verification

## Billing (separate focused session)
- [ ] Stripe Checkout integration ($0.003/retrieval, 100 free/month)
- [ ] Collect payment info securely (Stripe Elements / Checkout)
- [ ] Usage tracking (count retrievals from access_logs per period)
- [ ] Dashboard billing page (usage meter, payment method, invoices)
- [ ] API middleware to enforce limits after free tier

## Nice to Have
- [ ] API key scoping (read-only tokens for agents)
- [ ] Team/org shared vaults
- [ ] Skills.sh indexing (will happen organically)
- [ ] Animated logo (needs layered source file or Lottie)
- [ ] Onboarding email (welcome after signup)
