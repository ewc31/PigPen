# Contributing to PigPen

Thanks for looking. PigPen is early, so issues and small PRs are the most useful.

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

Before opening a PR, run `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test`. CI runs the same.

## Good first contributions

- **A new preflight rule.** Open a "Rule proposal" issue first: what makes it fire, its weight,
  the question it asks, and 3 prompts each that should and shouldn't trigger it.
- **A false positive or negative** in an existing rule: open an issue with the exact prompt.
- **Docs** for another agent tool.

## Ground rules

- Preflight rules stay deterministic: no model calls, no randomness.
- Handoff cards are untrusted input. No tool or code path may let an agent approve a card.
- Commit messages use [Conventional Commits](https://www.conventionalcommits.org/).
- If you use an AI agent, follow [`AGENTS.md`](./AGENTS.md).

By contributing, you agree your contributions are licensed under the Apache-2.0 license.
