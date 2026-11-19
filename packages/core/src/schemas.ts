import { z } from "zod";

/** A member of a pen: one human and the agent tool they work with. */
export const MemberSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{0,15}$/, "member ids are short lowercase slugs, e.g. a, b"),
  human: z.string().min(1),
  tool: z.enum(["claude-code", "cursor", "other"]),
});
export type Member = z.infer<typeof MemberSchema>;

/** `.pigpen/pen.yaml` */
export const PenConfigSchema = z.object({
  version: z.union([z.string(), z.number()]).transform(String),
  name: z.string().min(1),
  members: z.array(MemberSchema).min(1),
  /** advise: never block a prompt. block: hold prompts until questions are answered. */
  gate: z.enum(["advise", "block"]).default("advise"),
  profile: z.enum(["loose", "standard", "strict"]).default("standard"),
  /** Show questions when the mud score is at or above this. */
  question_threshold: z.number().int().min(0).max(100).default(40),
});
export type PenConfig = z.infer<typeof PenConfigSchema>;

export const HandoffStatusSchema = z.enum(["proposed", "approved", "rejected", "done"]);
export type HandoffStatus = z.infer<typeof HandoffStatusSchema>;

/** YAML frontmatter of a handoff card in `.pigpen/handoffs/`. */
export const HandoffMetaSchema = z.object({
  id: z.string().regex(/^h-\d{3,}$/, "handoff ids look like h-001"),
  from: z.string().min(1),
  to: z.string().min(1),
  created: z.string().datetime({ offset: true }),
  status: HandoffStatusSchema,
  approved_by: z.string().nullable().default(null),
  criteria: z.array(z.string().regex(/^AC\d+$/)).default([]),
  files: z.array(z.string()).default([]),
});
export type HandoffMeta = z.infer<typeof HandoffMetaSchema>;

/** The three fixed sections of a handoff card body. */
export interface HandoffBody {
  doneSoFar: string;
  doneMeans: string;
  watchOut: string;
}

export interface Handoff {
  meta: HandoffMeta;
  body: HandoffBody;
}

const LedgerBase = z.object({
  ts: z.string().datetime({ offset: true }),
  member: z.string().min(1),
  tool: z.string().min(1),
  task: z.string().optional(),
  /** Tokens PigPen itself spent producing this event. Preflight rules are deterministic, so 0. */
  pigpen_tokens: z.number().int().min(0).default(0),
  /** Agent token usage, only when the tool actually exposes it. */
  tokens_in: z.number().int().min(0).optional(),
  tokens_out: z.number().int().min(0).optional(),
  /** True when any number on this event was inferred rather than reported by the tool. */
  estimated: z.boolean().optional(),
});

export const LedgerEventSchema = z.discriminatedUnion("event", [
  LedgerBase.extend({
    event: z.literal("preflight"),
    score_before: z.number().int().min(0).max(100),
    score_after: z.number().int().min(0).max(100).optional(),
    rules: z.array(z.string()),
    questions: z.number().int().min(0),
  }),
  LedgerBase.extend({
    event: z.literal("answered"),
    answered: z.number().int().min(0),
    skipped: z.number().int().min(0),
  }),
  LedgerBase.extend({ event: z.literal("handoff_created"), handoff: z.string() }),
  LedgerBase.extend({
    event: z.literal("handoff_decided"),
    handoff: z.string(),
    decision: z.enum(["approved", "rejected"]),
    by: z.string(),
  }),
  LedgerBase.extend({
    event: z.literal("review"),
    criteria_met: z.array(z.string()),
    drift: z.array(z.string()).default([]),
  }),
  LedgerBase.extend({ event: z.literal("rerun"), similar_to: z.string().optional() }),
  LedgerBase.extend({ event: z.literal("revert"), commit: z.string() }),
]);
export type LedgerEvent = z.infer<typeof LedgerEventSchema>;
export type LedgerEventInput = z.input<typeof LedgerEventSchema>;
export type LedgerEventName = LedgerEvent["event"];
