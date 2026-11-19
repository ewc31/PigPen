import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UnsafeCardError } from "@pigpen/core";
import { findPenRoot, Pen } from "@pigpen/core/node";

let root: string;
const body = { doneSoFar: "R1-R4.", doneMeans: "R5-R8 tested.", watchOut: "Nothing." };

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "pigpen-"));
});
afterEach(async () => {
  delete process.env.PIGPEN_MEMBER;
  await rm(root, { recursive: true, force: true });
});

describe("Pen", () => {
  it("init creates the folder once and never overwrites", async () => {
    const first = await Pen.init(root, { name: "demo" });
    expect(first.created).toContain(".pigpen/pen.yaml");
    expect(await readFile(path.join(root, ".pigpen/.gitignore"), "utf8")).toBe("private/\n");
    const second = await Pen.init(root, { name: "other" });
    expect(second.created).toEqual([]);
    expect((await first.pen.readConfig()).name).toBe("demo");
  });

  it("is found from a subfolder", async () => {
    await Pen.init(root, { name: "demo" });
    expect(await findPenRoot(path.join(root, ".pigpen", "handoffs"))).toBe(root);
  });

  it("knows who you are from me.json or $PIGPEN_MEMBER", async () => {
    const { pen } = await Pen.init(root, { name: "demo" });
    await expect(pen.me()).rejects.toThrow(/pigpen me/);
    await pen.setMe("a");
    expect(await pen.me()).toBe("a");
    process.env.PIGPEN_MEMBER = "b";
    expect(await pen.me()).toBe("b");
    await expect(pen.setMe("z")).rejects.toThrow();
  });

  it("creates, lists and decides handoffs", async () => {
    const { pen } = await Pen.init(root, { name: "demo" });
    const card = await pen.createHandoff({ from: "a", to: "b", criteria: ["AC1"], body });
    expect(card.meta).toMatchObject({ id: "h-001", status: "proposed" });
    expect((await pen.createHandoff({ from: "b", to: "a", body })).meta.id).toBe("h-002");

    const approved = await pen.decideHandoff("h-001", "approved", "b");
    expect(approved.meta).toMatchObject({ status: "approved", approved_by: "b" });
    expect(await pen.listHandoffs({ status: "approved" })).toHaveLength(1);
    await expect(pen.decideHandoff("h-001", "rejected", "b")).rejects.toThrow(/already/);
  });

  it("refuses a handoff that contains a secret", async () => {
    const { pen } = await Pen.init(root, { name: "demo" });
    await expect(
      pen.createHandoff({
        from: "a",
        to: "b",
        body: { ...body, watchOut: "DB_PASSWORD=hunter2hunter2" },
      }),
    ).rejects.toThrow(UnsafeCardError);
    expect(await pen.listHandoffs()).toEqual([]);
  });

  it("writes one ledger file per member and reads them merged", async () => {
    const { pen } = await Pen.init(root, { name: "demo" });
    const base = { tool: "claude-code", event: "rerun" as const };
    await pen.appendLedger({ ...base, member: "a", ts: "2026-11-24T10:05:00Z" });
    await pen.appendLedger({ ...base, member: "b", ts: "2026-11-24T10:01:00Z" });
    expect((await pen.readLedger()).map((e) => e.member)).toEqual(["b", "a"]);
    expect(await readFile(path.join(root, ".pigpen/ledger/a.jsonl"), "utf8")).toContain(
      '"member":"a"',
    );
  });

  it("keeps the 20 most recent prompts, newest first", async () => {
    const { pen } = await Pen.init(root, { name: "demo" });
    for (let i = 0; i < 25; i++)
      await pen.rememberPrompt(`p${i}`, new Date(Date.UTC(2026, 10, 24, 10, i)));
    const recent = await pen.recentPrompts();
    expect(recent).toHaveLength(20);
    expect(recent[0]?.text).toBe("p24");
  });
});
