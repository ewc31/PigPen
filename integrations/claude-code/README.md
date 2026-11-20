# PigPen for Claude Code

Two pieces, both optional but better together:

1. **Preflight hook** (automatic). On every prompt, Claude Code runs `pigpen hook claude-code`.
   You see the mud score; Claude gets the questions as extra context. Advise mode never blocks.
2. **MCP server** (on demand). Gives Claude the `pen_*` tools: read the brief, write handoff cards,
   read approved cards from your partner.

## Set up

From the repo you want to use PigPen in:

```bash
pigpen init          # creates .pigpen/
pigpen me a          # you are member "a" in .pigpen/pen.yaml
```

**Hook:** merge [`settings.example.json`](./settings.example.json) into `.claude/settings.json`
(shared with the team) or `.claude/settings.local.json` (just you).

> Working inside this repo before `pigpen` is installed globally? Use
> `node "$CLAUDE_PROJECT_DIR/packages/cli/dist/index.js" hook claude-code` as the command, after `pnpm build`.

**MCP server:** add it to `.mcp.json` at the repo root:

```json
{
  "mcpServers": {
    "pigpen": { "command": "pigpen-mcp" }
  }
}
```

## How the hook replies

The hook reads Claude Code's `UserPromptSubmit` JSON from stdin and prints one JSON object:

| Field                                  | Who sees it | When                                                          |
| -------------------------------------- | ----------- | ------------------------------------------------------------- |
| `systemMessage`                        | You         | Always: the mud score, and the questions when there are any   |
| `hookSpecificOutput.additionalContext` | Claude      | When the score is at or above `question_threshold`            |
| `decision: "block"` + `reason`         | You         | Only when `gate: block` in `pen.yaml` and there are questions |

If there is no `.pigpen/`, or you haven't run `pigpen me`, the hook prints nothing and exits 0,
so it can never break a session.
