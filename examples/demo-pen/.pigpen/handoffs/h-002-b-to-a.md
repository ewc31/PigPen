---
id: h-002
from: b
to: a
created: 2026-11-24T11:30:00-08:00
status: approved
approved_by: a
criteria:
  - AC2
files:
  - src/api/reset.ts
  - src/api/reset.test.ts
---

## Done so far

/api/reset issues a hashed, single-use token with a 30-minute expiry. Tests cover expiry and reuse.

## What "done" means for you

- The "check your email" screen and the set-new-password page match the login styles
- An expired link shows a clear way to request a new one

## Watch out for

I reverted my first attempt because it touched src/session/, which the brief rules out.
