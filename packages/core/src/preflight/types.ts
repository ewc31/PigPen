import type { Brief } from "../brief.js";

/** Everything a rule may look at. Rules must be pure: same context in, same answer out. */
export interface RuleContext {
  prompt: string;
  /** The pen's brief, when one exists. */
  brief?: Brief;
  /** Number of tracked files in the repo, when known. */
  repoFileCount?: number;
  /** This member's recent prompts, newest first (from `.pigpen/private/`). */
  recentPrompts?: { text: string; ts: string }[];
  /** Injected so time-based rules stay testable. */
  now: Date;
}

/** Which line of the cleaned-prompt template an answer to this rule fills. */
export type TemplateField = "goal" | "done" | "location" | "limits" | "scope" | "context";

export interface Rule {
  /** Stable id, e.g. "R1". Ledger events and the docs refer to it. */
  id: string;
  /** Short label shown in the terminal, e.g. 'no "done"'. */
  name: string;
  /** Points added to the mud score when this rule fires. */
  weight: number;
  /** The one question shown when this rule fires. */
  question: string;
  field: TemplateField;
  fires(ctx: RuleContext): boolean;
}

export interface FiredRule {
  id: string;
  name: string;
  weight: number;
}

export interface PreflightResult {
  /** 0–100, lower is cleaner. */
  score: number;
  fired: FiredRule[];
  /** Up to 3 questions, highest weight first; empty below the threshold. */
  questions: { ruleId: string; text: string }[];
  threshold: number;
}

export interface Answer {
  ruleId: string;
  text: string;
}
