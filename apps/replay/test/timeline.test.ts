import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadSession, receipts } from "../src/data/timeline";

const dir = path.resolve(import.meta.dirname, "../../../examples/demo-pen/.pigpen");
const files = Object.fromEntries(
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((p) => /\.(yaml|md|jsonl)$/.test(p))
    .map((p) => [p.split(path.sep).join("/"), readFileSync(path.join(dir, p), "utf8")]),
);

describe("demo pen", () => {
  const session = loadSession(files);

  it("loads both members' events, oldest first", () => {
    expect(session.config.members.map((m) => m.tool)).toEqual(["claude-code", "cursor"]);
    expect(session.events).toHaveLength(15);
    const times = session.events.map((e) => Date.parse(e.ts));
    expect(times).toEqual([...times].sort((x, y) => x - y));
  });

  it("loads both handoff cards", () => {
    expect(session.handoffs.map((h) => `${h.meta.id}:${h.meta.status}`)).toEqual([
      "h-001:approved",
      "h-002:approved",
    ]);
  });

  it("totals receipts, and running totals at any step", () => {
    expect(receipts(session.events)).toEqual({
      prompts: 6,
      questionsAsked: 6,
      questionsAnswered: 5,
      handoffs: 2,
      handoffsApproved: 2,
      reruns: 1,
      reverts: 1,
      pigpenTokens: 0,
    });
    expect(receipts(session.events, 1).prompts).toBe(1);
  });

  it("fails clearly without pen.yaml", () => {
    expect(() => loadSession({})).toThrow(/pen.yaml/);
  });
});
