import { type LedgerEvent, type LedgerEventInput, LedgerEventSchema } from "./schemas.js";

export function serializeEvent(event: LedgerEventInput): string {
  return JSON.stringify(LedgerEventSchema.parse(event));
}

/** Parse a `.jsonl` ledger. Blank lines are skipped; a malformed line throws with its line number. */
export function parseLedger(text: string): LedgerEvent[] {
  return text
    .split(/\r?\n/)
    .map((line, i) => ({ line: line.trim(), n: i + 1 }))
    .filter(({ line }) => line.length > 0)
    .map(({ line, n }) => {
      try {
        return LedgerEventSchema.parse(JSON.parse(line));
      } catch (err) {
        throw new Error(`ledger line ${n}: ${(err as Error).message}`, { cause: err });
      }
    });
}

/** Merge several members' ledgers into one timeline, oldest first. */
export function mergeLedgers(...ledgers: LedgerEvent[][]): LedgerEvent[] {
  return ledgers.flat().sort((x, y) => Date.parse(x.ts) - Date.parse(y.ts));
}
