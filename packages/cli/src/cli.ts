import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { HandoffStatusSchema, renderHandoff } from "@pigpen/core";
import { checkPrompt, Pen } from "@pigpen/core/node";
import { formatForAgent, formatPreflight } from "./format.js";

export interface Io {
  cwd: string;
  out: (text: string) => void;
  err: (text: string) => void;
  readStdin: () => Promise<string>;
}

const HELP = `pigpen — clean up AI slop before it happens

Usage:
  pigpen init [--name <name>]        create .pigpen/ in this folder
  pigpen me [<member-id>]            show or set who you are in this pen
  pigpen preflight "<prompt>" [--task <id>] [--json]
  pigpen handoffs [--status proposed|approved|rejected|done]
  pigpen show <handoff-id>
  pigpen approve <handoff-id>        humans only: lets the other agent read the card
  pigpen reject <handoff-id>
  pigpen hook claude-code            Claude Code UserPromptSubmit hook (reads JSON on stdin)
`;

/** Run the CLI. Returns the process exit code. */
export async function runCli(argv: string[], io: Io): Promise<number> {
  const [command, ...rest] = argv;
  try {
    switch (command) {
      case "init":
        return await init(rest, io);
      case "me":
        return await me(rest, io);
      case "preflight":
        return await preflight(rest, io);
      case "handoffs":
        return await handoffs(rest, io);
      case "show":
        return await show(rest, io);
      case "approve":
      case "reject":
        return await decide(command, rest, io);
      case "hook":
        return await hook(rest, io);
      case undefined:
      case "help":
      case "--help":
      case "-h":
        io.out(HELP);
        return 0;
      default:
        io.err(`Unknown command "${command}".\n\n${HELP}`);
        return 1;
    }
  } catch (err) {
    io.err(`pigpen: ${(err as Error).message}`);
    return 1;
  }
}

async function init(args: string[], io: Io): Promise<number> {
  const { values } = parseArgs({ args, options: { name: { type: "string" } } });
  const name = values.name ?? path.basename(io.cwd);
  const { created } = await Pen.init(io.cwd, { name });
  if (created.length === 0) {
    io.out(".pigpen/ already set up; nothing changed.");
  } else {
    io.out(`Created:\n${created.map((f) => `  ${f}`).join("\n")}`);
    io.out(
      "\nNext: edit .pigpen/pen.yaml (members), fill in .pigpen/brief.md, then `pigpen me a`.",
    );
  }
  return 0;
}

async function me(args: string[], io: Io): Promise<number> {
  const pen = await Pen.open(io.cwd);
  const [id] = args;
  if (id) {
    await pen.setMe(id);
    io.out(`You are member "${id}" on this machine.`);
  } else {
    io.out(await pen.me());
  }
  return 0;
}

async function preflight(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { task: { type: "string" }, json: { type: "boolean", default: false } },
  });
  const prompt = positionals.join(" ").trim();
  if (!prompt) throw new Error('Give a prompt to check: pigpen preflight "fix the login bug"');
  const pen = await Pen.open(io.cwd);
  const [member, config] = await Promise.all([pen.me(), pen.readConfig()]);
  const tool = config.members.find((m) => m.id === member)?.tool ?? "other";
  const result = await checkPrompt(pen, {
    prompt,
    member,
    tool,
    ...(values.task ? { task: values.task } : {}),
  });
  io.out(values.json ? JSON.stringify(result, null, 2) : formatPreflight(result, config.gate));
  return 0;
}

async function handoffs(args: string[], io: Io): Promise<number> {
  const { values } = parseArgs({ args, options: { status: { type: "string" } } });
  const status = values.status ? HandoffStatusSchema.parse(values.status) : undefined;
  const pen = await Pen.open(io.cwd);
  const cards = await pen.listHandoffs(status ? { status } : undefined);
  if (cards.length === 0) {
    io.out("No handoffs.");
    return 0;
  }
  for (const { meta } of cards) {
    io.out(
      `${meta.id}  ${meta.from} → ${meta.to}  ${meta.status.padEnd(8)}  ${meta.criteria.join(", ")}`,
    );
  }
  return 0;
}

async function show(args: string[], io: Io): Promise<number> {
  const [id] = args;
  if (!id) throw new Error("Which handoff? pigpen show h-001");
  const pen = await Pen.open(io.cwd);
  io.out(renderHandoff(await pen.readHandoff(id)));
  return 0;
}

async function decide(command: "approve" | "reject", args: string[], io: Io): Promise<number> {
  const [id] = args;
  if (!id) throw new Error(`Which handoff? pigpen ${command} h-001`);
  const pen = await Pen.open(io.cwd);
  const [by, config] = await Promise.all([pen.me(), pen.readConfig()]);
  const decision = command === "approve" ? "approved" : "rejected";
  const card = await pen.decideHandoff(id, decision, by);
  await pen.appendLedger({
    ts: new Date().toISOString(),
    member: by,
    tool: config.members.find((m) => m.id === by)?.tool ?? "other",
    event: "handoff_decided",
    handoff: card.meta.id,
    decision,
    by,
  });
  io.out(`${card.meta.id} ${decision}.`);
  return 0;
}

/**
 * Claude Code UserPromptSubmit hook. Reads the hook's JSON from stdin, checks the prompt,
 * and replies with JSON: a message for the person and context for Claude. Advise mode never
 * blocks. Any problem (no pen, no member set) exits 0 silently so it can't break a session.
 */
async function hook(args: string[], io: Io): Promise<number> {
  const [target] = args;
  if (target !== "claude-code") throw new Error("Supported hooks: claude-code");
  let input: { prompt?: string; cwd?: string };
  try {
    input = JSON.parse(await io.readStdin()) as { prompt?: string; cwd?: string };
  } catch {
    return 0;
  }
  if (!input.prompt) return 0;
  let pen: Pen;
  let member: string;
  try {
    pen = await Pen.open(input.cwd ?? io.cwd);
    member = await pen.me();
  } catch {
    return 0;
  }
  const config = await pen.readConfig();
  const result = await checkPrompt(pen, { prompt: input.prompt, member, tool: "claude-code" });
  const forAgent = formatForAgent(result);
  const blocking = config.gate === "block" && result.questions.length > 0;
  const shown = formatPreflight(result, config.gate);
  const reply: Record<string, unknown> = blocking
    ? { decision: "block", reason: shown }
    : { systemMessage: shown };
  if (!blocking && forAgent) {
    reply.hookSpecificOutput = { hookEventName: "UserPromptSubmit", additionalContext: forAgent };
  }
  io.out(JSON.stringify(reply));
  return 0;
}

export async function readAll(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks).toString("utf8");
}

export async function version(): Promise<string> {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
    version: string;
  };
  return pkg.version;
}
