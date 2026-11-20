---
updated: 2026-11-24
---

# Goal

Add a password-reset flow to the sample app so locked-out users can get back in without support.

# Constraints

- TypeScript and the existing Express server
- Don't change the session store in src/session/

# Acceptance criteria

- [x] AC1: A user can request a reset link from the login page
- [x] AC2: The link expires after 30 minutes and works once
- [ ] AC3: Reset emails are rate-limited to 3 per hour per address

# Out of scope

- SMS or social login recovery
