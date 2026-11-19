import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pen } from "@pigpen/core/node";
import { runCli } from "../src/cli.js";

let cwd: string;
let out: string[];
let err: string[];
let stdin = "";

const run = (...argv: string[]) =>
  runCli(argv, {
    cwd,
    out: (t) => out.push(t),
    err: (t) => err.push(t),
    readStdin: async () => stdin,
  });

beforeEach(async () => {
  cwd = await mkdtemp(path.join(tmpdir(), "pigpen-cli-"));
  out = [];
  err = [];
  stdin = "";
});
afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
});

describe("pigpen", () => {
  it("prints help with no command and fails on an unknown one", async () => {
    expect(await run()).toBe(0);
    expect(out.join("")).toContain("pigpen preflight");
    expect(await run("oink")).toBe(1);
    expect(err.join("")).toContain('Unknown command "oink"');
  });

  it("init → me → preflight logs a ledger event", async () => {
    expect(await run("init", "--name", "demo")).toBe(0);
    expect(await run("me", "a")).toBe(0);
    expect(await run("preflight", "fix", "it")).toBe(0);
    expect(out.at(-1)).toMatch(/^PigPen preflight · mud \d+\/100/);
    const ledger = await readFile(path.join(cwd, ".pigpen/ledger/a.jsonl"), "utf8");
    expect(JSON.parse(ledger.trim())).toMatchObject({ event: "preflight", member: "a" });
  });

  it("preflight --json returns the raw result", async () => {
    await run("init");
    await run("me", "a");
    await run("preflight", "--json", "add retries to fetchUser");
    expect(JSON.parse(out.at(-1)!)).toHaveProperty("score");
  });

  it("explains what to do when no pen exists", async () => {
    expect(await run("preflight", "hello")).toBe(1);
    expect(err.join("")).toContain("pigpen init");
  });

  it("approves a handoff from the command line and logs who decided", async () => {
    await run("init");
    await run("me", "b");
    const pen = await Pen.open(cwd);
    await pen.createHandoff({
      from: "a",
      to: "b",
      body: { doneSoFar: "x", doneMeans: "y", watchOut: "z" },
    });
    expect(await run("handoffs", "--status", "proposed")).toBe(0);
    expect(out.at(-1)).toContain("h-001");
    expect(await run("approve", "h-001")).toBe(0);
    expect((await pen.readHandoff("h-001")).meta).toMatchObject({
      status: "approved",
      approved_by: "b",
    });
    const ledger = await readFile(path.join(cwd, ".pigpen/ledger/b.jsonl"), "utf8");
    expect(ledger).toContain('"decision":"approved"');
  });

  describe("hook claude-code", () => {
    it("stays silent when there is no pen, so it can't break a session", async () => {
      stdin = JSON.stringify({ prompt: "fix it", cwd });
      expect(await run("hook", "claude-code")).toBe(0);
      expect(out).toEqual([]);
    });

    it("stays silent on bad input", async () => {
      stdin = "not json";
      expect(await run("hook", "claude-code")).toBe(0);
      expect(out).toEqual([]);
    });

    it("replies with a message for the person and never blocks in advise mode", async () => {
      await run("init");
      await run("me", "a");
      out = [];
      stdin = JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt: "fix it", cwd });
      expect(await run("hook", "claude-code")).toBe(0);
      const reply = JSON.parse(out.join(""));
      expect(reply.systemMessage).toMatch(/PigPen preflight/);
      expect(reply.decision).toBeUndefined();
    });
  });
});
