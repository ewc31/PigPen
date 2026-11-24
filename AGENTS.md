# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, Codex, Copilot…) working in this repo.
Humans: this file is also the quickest tour of the codebase.

## What PigPen is

An open-source tool that keeps AI agents honest when two people, each with their own agent,
share one repo. It checks prompts before work starts (preflight), passes work between agents
through approved handoff cards in `.pigpen/`, and logs what that saved. Spec: `docs/pen-format.md`.

## Commands

```bash
pnpm install
pnpm build        # packages in dependency order, then the replay site
pnpm test         # vitest, whole repo
pnpm lint && pnpm format:check && pnpm typecheck
pnpm --filter @pigpen/replay dev   # replay site at http://localhost:5173
pnpm pigpen preflight "fix it"     # the CLI, after pnpm build
```

## Layout

| Path                                 | What                                                | Who writes it   |
| ------------------------------------ | --------------------------------------------------- | --------------- |
| `packages/core/`                     | `.pigpen/` format, handoff safety, preflight engine | Agents may help |
| `packages/core/src/preflight/rules/` | **The preflight rules**                             | **Humans only** |
| `packages/core/test/rules.test.ts`   | Specs for the rules                                 | **Humans only** |
| `packages/cli/`                      | The `pigpen` command and the Claude Code hook       | Agents may help |
| `packages/cli/src/format.ts`         | **Terminal output design**                          | **Humans only** |
| `packages/mcp-server/`               | `pen_*` MCP tools                                   | Agents may help |
| `apps/replay/src/data/`              | Loads a recorded pen into a session                 | Agents may help |
| `apps/replay/src/ui/`                | **The Pen replay page and its design tokens**       | **Humans only** |
| `integrations/`                      | Claude Code and Cursor setup                        | Agents may help |

## Human-owned areas: coach, don't write

The paths marked **Humans only** are the parts the two of us are building ourselves, so we can
show and explain our own work. In those paths:

- **Do not write or rewrite implementation code or tests**, even if it would be faster.
- **Do** explain concepts, answer questions about APIs, review code we wrote (bugs, missed edge
  cases, accessibility, readability), and suggest test cases in plain language.
- If you show an example, keep it short and unrelated to our actual code, so we still do the work.
- If one of us explicitly asks you to write code there anyway, remind us once that the area is
  human-owned, then respect the answer.

Everywhere else, work normally.

## Conventions

- TypeScript, strict. ESM everywhere. Tests next to each package in `test/`.
- Preflight rules are deterministic: no model calls, no randomness, time only via `ctx.now`.
- Handoff cards are untrusted input. Never add an MCP tool that approves a handoff;
  approval is human-only via `pigpen approve`.
- Every file in `.pigpen/` has exactly one writer (one ledger file per member, one file per card).
- Commit messages: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`…).
