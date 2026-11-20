import type { Rule } from "../types.js";

/**
 * The preflight rules, R1–R8.
 *
 * HUMAN-OWNED: the designer and engineer write these by hand (see AGENTS.md and
 * docs/build-it-yourselves.md). Copy `_template.ts`, implement `fires`, add the rule
 * here, and turn its `it.todo` lines in `test/rules.test.ts` into real tests.
 *
 * Until a rule is added here, preflight scores every prompt 0.
 */
export const rules: readonly Rule[] = [];
