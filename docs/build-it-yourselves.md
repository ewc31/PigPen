# Build it yourselves: preflight rules and the Pen replay

The tooling in this repo (monorepo, CI, file format, MCP server, CLI) is plumbing. Two parts are
the product, and they're the parts you'll be asked about in interviews:

- **The preflight rules** (`packages/core/src/preflight/rules/`): what PigPen thinks makes a prompt sloppy.
- **The Pen replay** (`apps/replay/src/ui/`): what people see and click.

Write these two yourselves. `AGENTS.md` tells Claude Code and Cursor to coach rather than write in
those folders. The prompts below keep the agent in that role.

## 1. Preflight rules

**Engineer leads, designer co-owns.** The engineer writes `fires()`. The designer writes each
rule's question and the example prompts that should and shouldn't trigger it, because the
wording is the user experience.

**How to do one rule**

1. Open its block in `packages/core/test/rules.test.ts` and turn each `it.todo` into a real test.
   Add at least 3 prompts that should fire and 3 that shouldn't. Write them together.
2. Copy `rules/_template.ts` to `rules/r1-no-clear-goal.ts` (and so on), then implement `fires()`.
3. Add it to the `rules` array in `rules/index.ts`.
4. Run `pnpm test`, then try it for real: `pnpm build && pnpm pigpen preflight "fix it"`.
5. Open a PR. Whoever didn't write it reviews it.

**Which rules:** build the nine in the "Demo set" table of `docs/pen-format.md`.
Suggested order: R1, R3, R4 and R11 are the simplest. Then R2, R5, R7, R9 and R10. The rules
marked "Next" need data from the hook, so check what it receives first. Leave the "Later" rules
until after the demo.

**Done when:** the demo-set rules are in, every `it.todo` is a real test, and `pigpen preflight "fix it"`
fires R1 and R3.

### Coach prompts for the rules

Paste these into Claude Code or Cursor as they are.

> I'm implementing PigPen preflight rule **R3 (vague pointer)** myself in
> `packages/core/src/preflight/rules/`. Read its spec in `docs/pen-format.md`. Don't write the
> implementation. Ask me 3 questions that expose edge cases I haven't thought about yet.

> Here's my `fires()` for **R5**. Review it like a senior engineer: bugs, false positives, false
> negatives, readability. Suggest extra test prompts in plain English. Don't rewrite the function.

> For rule **R9 (bug with no evidence)**, what counts as "error text" in a prompt? Give me examples
> of prompts that should and shouldn't count, and the tricky middle cases. No code.

> I wrote these test prompts for **R2**. Which ones are weak or redundant, and what cases am I
> missing? Don't write the tests for me.

## 2. The Pen replay

**Designer leads, engineer pairs.** The designer owns layout, components, motion and tokens.
The engineer pairs on state and playback logic when asked.

You already have a fully parsed `session` (members, handoff cards, every event in order) and
`receipts(events, upTo)` for running totals at any step. Both are in `apps/replay/src/data/timeline.ts`.
`App.tsx` is a bare placeholder; replace it.

**Steps**

1. Sketch it first: two lanes (one per member and tool), preflight cards with the mud score,
   a handoff card moving between lanes with its approval, a receipts panel, and play / pause /
   step controls.
2. Set your tokens in `src/ui/tokens.css`: colour, type, spacing, radius. Use only tokens in components.
3. Build components in `src/ui/`, for example `Lane`, `PreflightCard`, `HandoffCard`, `Receipts`, `Controls`.
4. Playback is one number: the current step. Show `session.events.slice(0, step)` and
   `receipts(session.events, step)`.
5. Make it accessible: keyboard controls, visible focus, `prefers-reduced-motion`, readable contrast.
6. Run it with `pnpm --filter @pigpen/replay dev`. It deploys to GitHub Pages on every push to `main`.

**Done when:** a stranger can watch the demo pen play through and explain what PigPen did, in under
60 seconds.

### Coach prompts for the replay

> I'm building the PigPen replay UI myself in React, in `apps/replay/src/ui/`. Don't write
> components for me. Here's my component plan: [describe it]. Tell me where state should live
> and what I'll regret later.

> Review this component for accessibility (keyboard, focus, reduced motion, contrast) and React
> mistakes. List the issues in order of importance. Don't rewrite it.

> Explain how I could animate a card moving from one column to another using only CSS. Use a
> tiny example that has nothing to do with my code.

> Here are my design tokens. Are any missing for a timeline UI with cards, a score and controls?

## Make it clear who built what

- **Commit your own work under your own name.** Small commits with clear messages.
- **Review each other's PRs on GitHub.** Hiring managers read review comments.
- **Write PR descriptions yourself:** what you built, what you decided, what you'd do next.
- **Keep the README's "Who built what" section current.**
- **Write it up.** Designer: a portfolio case study of the replay and the brand.
  Engineer: a post on the rules engine, MCP and hooks.
- **Be upfront that you used AI** for scaffolding and review. Showing you can direct agents well,
  and keep them out of the work that matters, is a strength in a portfolio about AI quality.
