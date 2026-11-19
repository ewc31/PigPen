---
updated: 2026-11-19
---

# Goal

Ship a public PigPen demo in three weeks that a recruiter understands in 60 seconds without installing anything.

# Constraints

- TypeScript, pnpm workspaces, Vitest
- Agents don't write code in the human-owned paths listed in AGENTS.md

# Acceptance criteria

- [ ] AC1: Preflight rules R1-R8 implemented and tested by us
- [ ] AC2: `pigpen preflight "fix it"` fires R1 and R3
- [ ] AC3: The Claude Code hook shows preflight on a real prompt
- [ ] AC4: The Pen replay plays a real recorded session on GitHub Pages
- [ ] AC5: README has a demo GIF, the replay link and 3-step install

# Out of scope

- Live sync or any hosted server
- An LLM judge
- Tools beyond Claude Code and Cursor
