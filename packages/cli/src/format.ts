/**
 * HUMAN-OWNED (designer): the terminal output people see on every prompt.
 * This plain version works; restyle it however you like. Keep it short, and make sure
 * it still reads well with no colour (some terminals and CI logs strip it).
 */
import type { PreflightResult } from "@pigpen/core";

export function formatPreflight(result: PreflightResult, gate: "advise" | "block"): string {
  const header = `PigPen preflight · mud ${result.score}/100 · ${gate}`;
  if (result.fired.length === 0) return `${header} · clean`;
  const lines = [header, `  fired: ${result.fired.map((f) => `${f.id} ${f.name}`).join(" · ")}`];
  result.questions.forEach((q, i) => lines.push(`  ${i + 1}. ${q.text}`));
  if (result.questions.length > 0) {
    lines.push("  answer, skip, or send as-is · PigPen used 0 tokens");
  }
  return lines.join("\n");
}

/** What the agent itself is told. Plain and direct; the person never sees this. */
export function formatForAgent(result: PreflightResult): string {
  if (result.questions.length === 0) return "";
  return [
    `PigPen preflight (advise mode): this prompt scored ${result.score}/100 for vagueness.`,
    "Unless the answers are already clear from context, ask the user these questions before starting:",
    ...result.questions.map((q, i) => `${i + 1}. ${q.text}`),
  ].join("\n");
}
