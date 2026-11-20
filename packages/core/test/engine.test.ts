import { describe, expect, it } from "vitest";
import { buildCleanedPrompt, runPreflight, type Rule } from "@pigpen/core";

// Fake rules for testing the engine only. The real rules are human-owned (see AGENTS.md).
const rule = (
  id: string,
  weight: number,
  fires: boolean,
  field: Rule["field"] = "context",
): Rule => ({
  id,
  name: id.toLowerCase(),
  weight,
  question: `question ${id}?`,
  field,
  fires: () => fires,
});
const ctx = { prompt: "anything", now: new Date("2026-11-24T10:00:00Z") };

describe("runPreflight", () => {
  it("scores 0 with no rules", () => {
    expect(runPreflight([], ctx, { threshold: 40 })).toMatchObject({
      score: 0,
      fired: [],
      questions: [],
    });
  });

  it("sums fired weights and ignores rules that don't fire", () => {
    const result = runPreflight(
      [rule("R1", 20, true), rule("R2", 20, false), rule("R3", 15, true)],
      ctx,
      {
        threshold: 40,
      },
    );
    expect(result.score).toBe(35);
    expect(result.fired.map((f) => f.id)).toEqual(["R1", "R3"]);
  });

  it("caps the score at 100", () => {
    const all = Array.from({ length: 8 }, (_, i) => rule(`R${i + 1}`, 20, true));
    expect(runPreflight(all, ctx, { threshold: 40 }).score).toBe(100);
  });

  it("asks nothing below the threshold", () => {
    expect(runPreflight([rule("R1", 20, true)], ctx, { threshold: 40 }).questions).toEqual([]);
  });

  it("asks at most 3 questions, highest weight first, ties by id", () => {
    const rules = [
      rule("R7", 10, true),
      rule("R3", 15, true),
      rule("R2", 20, true),
      rule("R10", 15, true),
    ];
    const { questions } = runPreflight(rules, ctx, { threshold: 40 });
    expect(questions.map((q) => q.ruleId)).toEqual(["R2", "R3", "R10"]);
  });
});

describe("buildCleanedPrompt", () => {
  const rules = [rule("R2", 20, true, "done"), rule("R4", 15, true, "location")];

  it("returns the original when nothing was answered", () => {
    expect(buildCleanedPrompt("fix it", [{ ruleId: "R2", text: "  " }], rules)).toBe("fix it");
  });

  it("fills the fixed template and keeps the original verbatim", () => {
    expect(
      buildCleanedPrompt(
        "fix it",
        [
          { ruleId: "R2", text: "login test passes" },
          { ruleId: "R4", text: "src/auth.ts" },
        ],
        rules,
      ),
    ).toBe("Done when: login test passes\nLook in: src/auth.ts\n\nRequest: fix it");
  });
});
