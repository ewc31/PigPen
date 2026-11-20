import type { Answer, PreflightResult, Rule, RuleContext, TemplateField } from "./types.js";

export const MAX_SCORE = 100;
export const MAX_QUESTIONS = 3;

/**
 * Run every rule against the prompt. The score is the sum of fired weights, capped at 100.
 * At or above the threshold, return up to 3 questions, highest weight first (ties by id).
 */
export function runPreflight(
  rules: readonly Rule[],
  ctx: RuleContext,
  opts: { threshold: number },
): PreflightResult {
  const fired = rules
    .filter((rule) => rule.fires(ctx))
    .sort((x, y) => y.weight - x.weight || x.id.localeCompare(y.id, "en", { numeric: true }));
  const score = Math.min(
    MAX_SCORE,
    fired.reduce((sum, r) => sum + r.weight, 0),
  );
  const questions =
    score >= opts.threshold
      ? fired.slice(0, MAX_QUESTIONS).map((r) => ({ ruleId: r.id, text: r.question }))
      : [];
  return {
    score,
    fired: fired.map(({ id, name, weight }) => ({ id, name, weight })),
    questions,
    threshold: opts.threshold,
  };
}

const FIELD_LABELS: Record<TemplateField, string> = {
  goal: "Goal",
  done: "Done when",
  location: "Look in",
  limits: "Limits",
  scope: "Scope",
  context: "Context",
};

/**
 * Build the cleaned prompt from the person's answers using a fixed template.
 * No model rewrites anything: the original prompt is kept verbatim at the end.
 */
export function buildCleanedPrompt(
  original: string,
  answers: readonly Answer[],
  rules: readonly Rule[],
): string {
  const byId = new Map(rules.map((r) => [r.id, r]));
  const lines = answers
    .filter((a) => a.text.trim().length > 0)
    .map((a) => {
      const field = byId.get(a.ruleId)?.field ?? "context";
      return `${FIELD_LABELS[field]}: ${a.text.trim()}`;
    });
  return lines.length === 0 ? original : `${lines.join("\n")}\n\nRequest: ${original}`;
}
