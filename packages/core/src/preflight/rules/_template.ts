/**
 * Template for a preflight rule. Copy this file to e.g. `r1-no-clear-goal.ts`.
 *
 * The spec for each rule (what makes it fire, its weight and its question) lives in
 * docs/pen-format.md. A good rule is:
 *   - deterministic: no model calls, no randomness, no clock except ctx.now
 *   - explainable: you can say in one sentence why it fired
 *   - tested: one prompt where it fires and one where it doesn't, at minimum
 */
import type { Rule } from "../types.js";

export const exampleRule: Rule = {
  id: "R0",
  name: "example",
  weight: 0,
  question: "What should this rule ask?",
  field: "context",
  fires: (_ctx) => false,
};
