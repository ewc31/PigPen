import { describe, expect, it } from "vitest";
import {
  mergeLedgers,
  nextHandoffId,
  parseBrief,
  parseHandoff,
  parseLedger,
  parsePenConfig,
  renderHandoff,
  serializeEvent,
  type Handoff,
} from "@pigpen/core";

describe("pen.yaml", () => {
  it("applies defaults for gate, profile and threshold", () => {
    const config = parsePenConfig(
      "version: 0.1\nname: demo\nmembers:\n  - { id: a, human: Ana, tool: claude-code }\n",
    );
    expect(config).toMatchObject({ version: "0.1", gate: "advise", question_threshold: 40 });
  });

  it("rejects an unknown tool", () => {
    expect(() =>
      parsePenConfig("version: 1\nname: x\nmembers:\n  - { id: a, human: A, tool: vim }\n"),
    ).toThrow();
  });
});

describe("brief.md", () => {
  const brief = parseBrief(`---
updated: 2026-11-24
---
# Goal
Ship the demo
for recruiters.

# Constraints
- TypeScript only
- Don't touch packages/cli

# Acceptance criteria
- [ ] AC1: Replay plays
- [x] AC2: CI is green

# Out of scope
- Live sync
`);

  it("reads every section", () => {
    expect(brief.goal).toBe("Ship the demo for recruiters.");
    expect(brief.constraints).toEqual(["TypeScript only", "Don't touch packages/cli"]);
    expect(brief.outOfScope).toEqual(["Live sync"]);
  });

  it("numbers acceptance criteria and tracks done", () => {
    expect(brief.criteria).toEqual([
      { id: "AC1", text: "Replay plays", done: false },
      { id: "AC2", text: "CI is green", done: true },
    ]);
  });
});

describe("handoff cards", () => {
  const card: Handoff = {
    meta: {
      id: "h-001",
      from: "a",
      to: "b",
      created: "2026-11-24T10:42:00-08:00",
      status: "proposed",
      approved_by: null,
      criteria: ["AC1"],
      files: ["src/a.ts"],
    },
    body: { doneSoFar: "Rules R1-R4.", doneMeans: "- R5-R8 tested", watchOut: "R3 is noisy." },
  };

  it("round-trips through markdown", () => {
    expect(parseHandoff(renderHandoff(card))).toEqual(card);
  });

  it("uses the three fixed headings", () => {
    const text = renderHandoff(card);
    expect(text).toContain("## Done so far");
    expect(text).toContain('## What "done" means for you');
    expect(text).toContain("## Watch out for");
  });

  it("rejects a bad id", () => {
    expect(() => renderHandoff({ ...card, meta: { ...card.meta, id: "first" } })).toThrow();
  });

  it("allocates the next id", () => {
    expect(nextHandoffId([])).toBe("h-001");
    expect(nextHandoffId(["h-001", "h-009"])).toBe("h-010");
  });
});

describe("ledger", () => {
  const preflight = {
    ts: "2026-11-24T10:30:12-08:00",
    member: "a",
    tool: "claude-code",
    event: "preflight" as const,
    score_before: 50,
    rules: ["R2"],
    questions: 1,
  };

  it("defaults pigpen_tokens to 0", () => {
    expect(JSON.parse(serializeEvent(preflight))).toMatchObject({ pigpen_tokens: 0 });
  });

  it("skips blank lines and reports the bad line number", () => {
    const good = serializeEvent(preflight);
    expect(parseLedger(`${good}\n\n${good}\n`)).toHaveLength(2);
    expect(() => parseLedger(`${good}\n{"event":"nope"}`)).toThrow(/line 2/);
  });

  it("merges members' ledgers oldest first", () => {
    const [late] = parseLedger(serializeEvent({ ...preflight, ts: "2026-11-24T11:00:00-08:00" }));
    const [early] = parseLedger(serializeEvent({ ...preflight, member: "b" }));
    expect(mergeLedgers([late!], [early!]).map((e) => e.member)).toEqual(["b", "a"]);
  });
});
