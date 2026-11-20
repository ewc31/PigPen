/**
 * HUMAN-OWNED. These are the specs for R1–R8 from docs/pen-format.md, written as todos.
 * Turn each `it.todo` into a real test as you implement the rule, and add your own
 * edge cases. Agents: review and suggest cases; don't write these for the team.
 */
import { describe, it } from "vitest";

describe("R1 no clear goal (20)", () => {
  it.todo("fires on a prompt under 6 words");
  it.todo("fires when the first sentence has no action verb");
  it.todo("does not fire on 'Add a retry to fetchUser so the login test passes'");
});

describe('R2 no "done" (20)', () => {
  it.todo("fires with no should / must / so that / until / test and no open acceptance criteria");
  it.todo("does not fire when the prompt says how we'll know it's done");
  it.todo("does not fire when the brief still has an open acceptance criterion");
});

describe("R3 vague pointer (15)", () => {
  it.todo("fires on 'fix it' with no file or symbol named");
  it.todo("does not fire when 'it' follows a named file or function");
});

describe("R4 no location (15)", () => {
  it.todo("fires when no path, symbol or URL is named in a repo with more than 50 files");
  it.todo("does not fire in a repo with 50 files or fewer");
  it.todo("does not fire when a path like src/auth.ts is named");
});

describe("R5 scope explosion (15)", () => {
  it.todo("fires on 'rewrite the whole app'");
  it.todo("fires on 3 or more separate asks in one prompt");
  it.todo("does not fire on one focused ask");
});

describe("R6 fights the brief (20)", () => {
  it.todo("fires when the prompt names something under Constraints or Out of scope");
  it.todo("does not fire when there is no brief");
});

describe("R7 risky with no limits (10)", () => {
  it.todo("fires on 'delete the old migrations' with no stated limit");
  it.todo("does not fire when the prompt states what must not be touched");
});

describe("R8 likely rerun (10)", () => {
  it.todo("fires when at least 80% similar to one of the last 5 prompts within 15 minutes");
  it.todo("does not fire when the similar prompt is older than 15 minutes");
});
