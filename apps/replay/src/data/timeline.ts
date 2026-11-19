import {
  type Handoff,
  type LedgerEvent,
  mergeLedgers,
  parseHandoff,
  parseLedger,
  parsePenConfig,
  type PenConfig,
} from "@pigpen/core";

/** Raw files from a recorded `.pigpen/` folder, keyed by path inside it (e.g. "ledger/a.jsonl"). */
export type PenFiles = Record<string, string>;

export interface Session {
  config: PenConfig;
  handoffs: Handoff[];
  /** Every member's events, oldest first. */
  events: LedgerEvent[];
}

export interface Receipts {
  prompts: number;
  questionsAsked: number;
  questionsAnswered: number;
  handoffs: number;
  handoffsApproved: number;
  reruns: number;
  reverts: number;
  pigpenTokens: number;
}

/** Turn a recorded `.pigpen/` folder into a replayable session. Pure: no fs, no fetch. */
export function loadSession(files: PenFiles): Session {
  const configText = files["pen.yaml"];
  if (!configText) throw new Error("recording has no pen.yaml");
  const ledgers = Object.entries(files)
    .filter(([p]) => /^ledger\/[^/]+\.jsonl$/.test(p))
    .map(([, text]) => parseLedger(text));
  const handoffs = Object.entries(files)
    .filter(([p]) => /^handoffs\/h-\d+.*\.md$/.test(p))
    .map(([, text]) => parseHandoff(text))
    .sort((x, y) => x.meta.id.localeCompare(y.meta.id));
  return { config: parsePenConfig(configText), handoffs, events: mergeLedgers(...ledgers) };
}

/** Running totals after the first `upTo` events — what the receipts panel shows at each step. */
export function receipts(events: readonly LedgerEvent[], upTo = events.length): Receipts {
  const r: Receipts = {
    prompts: 0,
    questionsAsked: 0,
    questionsAnswered: 0,
    handoffs: 0,
    handoffsApproved: 0,
    reruns: 0,
    reverts: 0,
    pigpenTokens: 0,
  };
  for (const e of events.slice(0, upTo)) {
    r.pigpenTokens += e.pigpen_tokens;
    switch (e.event) {
      case "preflight":
        r.prompts++;
        r.questionsAsked += e.questions;
        break;
      case "answered":
        r.questionsAnswered += e.answered;
        break;
      case "handoff_created":
        r.handoffs++;
        break;
      case "handoff_decided":
        if (e.decision === "approved") r.handoffsApproved++;
        break;
      case "rerun":
        r.reruns++;
        break;
      case "revert":
        r.reverts++;
        break;
    }
  }
  return r;
}
