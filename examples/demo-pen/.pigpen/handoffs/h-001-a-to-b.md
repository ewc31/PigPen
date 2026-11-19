---
id: h-001
from: a
to: b
created: 2026-11-24T10:41:00-08:00
status: approved
approved_by: b
criteria:
  - AC1
files:
  - src/routes/login.tsx
  - src/routes/reset-request.tsx
---

## Done so far

Built the "Forgot password?" link and the reset request form. It posts to /api/reset with the email.

## What "done" means for you

- /api/reset creates a single-use token that expires in 30 minutes (AC2)
- The form shows the same message whether or not the email exists

## Watch out for

The form has no rate limit yet; AC3 is still open.
