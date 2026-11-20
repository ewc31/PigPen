import { runPreflight } from "../preflight/engine.js";
import { rules as defaultRules } from "../preflight/rules/index.js";
import type { PreflightResult, Rule } from "../preflight/types.js";
import type { Pen } from "./index.js";

/**
 * Check one prompt the way every surface does it (CLI, Claude Code hook, MCP tool):
 * gather context from the pen, run the rules, log a `preflight` event, remember the prompt.
 */
export async function checkPrompt(
  pen: Pen,
  input: {
    prompt: string;
    member: string;
    tool: string;
    task?: string;
    now?: Date;
    rules?: readonly Rule[];
  },
): Promise<PreflightResult> {
  const now = input.now ?? new Date();
  const [config, brief, recentPrompts, repoFileCount] = await Promise.all([
    pen.readConfig(),
    pen.readBrief(),
    pen.recentPrompts(),
    pen.repoFileCount(),
  ]);
  const result = runPreflight(
    input.rules ?? defaultRules,
    { prompt: input.prompt, brief, recentPrompts, repoFileCount, now },
    { threshold: config.question_threshold },
  );
  await pen.appendLedger({
    ts: now.toISOString(),
    member: input.member,
    tool: input.tool,
    ...(input.task ? { task: input.task } : {}),
    event: "preflight",
    score_before: result.score,
    rules: result.fired.map((f) => f.id),
    questions: result.questions.length,
    pigpen_tokens: 0,
  });
  await pen.rememberPrompt(input.prompt, now);
  return result;
}
