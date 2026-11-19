# PigPen for Cursor

1. **MCP server.** Add PigPen to `.cursor/mcp.json` in your repo:

   ```json
   {
     "mcpServers": {
       "pigpen": { "command": "pigpen-mcp" }
     }
   }
   ```

2. **Rule.** Copy [`pigpen.mdc`](./pigpen.mdc) to `.cursor/rules/pigpen.mdc`. It tells Cursor's agent
   to call `pen_preflight` before starting and how to treat handoff cards.

3. **Who you are.** Run `pigpen init` once per repo and `pigpen me b` on your machine.

## Open question: a real hook

The rule asks the agent to call preflight; a hook would make it automatic, like Claude Code.
Cursor has a `beforeSubmitPrompt` hook, but it may not be able to pass extra context to the
agent. **Engineer, week 1:** check Cursor's current hooks docs and either wire up
`pigpen hook cursor` or note here why the rule is the better route for now.
