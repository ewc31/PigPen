import { execFile } from "node:child_process";
import { access, appendFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { type Brief, briefTemplate, parseBrief } from "../brief.js";
import { handoffFilename, nextHandoffId, parseHandoff, renderHandoff } from "../handoff.js";
import { parseLedger, serializeEvent } from "../ledger.js";
import { defaultPenConfig, parsePenConfig, stringifyPenConfig } from "../pen-config.js";
import { assertCardSafe } from "../safety.js";
import type {
  Handoff,
  HandoffBody,
  HandoffStatus,
  LedgerEvent,
  LedgerEventInput,
  PenConfig,
} from "../schemas.js";

export const PEN_DIR = ".pigpen";
const RECENT_LIMIT = 20;

const exists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );

/** Walk up from `start` to the first folder holding `.pigpen/pen.yaml`. */
export async function findPenRoot(start: string = process.cwd()): Promise<string | undefined> {
  let dir = path.resolve(start);
  for (;;) {
    if (await exists(path.join(dir, PEN_DIR, "pen.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export class PenNotFoundError extends Error {
  override name = "PenNotFoundError";
  constructor() {
    super("No .pigpen/ folder found here or above. Run `pigpen init` first.");
  }
}

/** File access for one `.pigpen/` folder. Every file has exactly one writer. */
export class Pen {
  constructor(readonly root: string) {}

  get dir(): string {
    return path.join(this.root, PEN_DIR);
  }

  private p(...parts: string[]): string {
    return path.join(this.dir, ...parts);
  }

  static async open(start?: string): Promise<Pen> {
    const root = await findPenRoot(start);
    if (!root) throw new PenNotFoundError();
    return new Pen(root);
  }

  /** Create any missing parts of `.pigpen/`. Never overwrites existing files. */
  static async init(
    root: string,
    opts: { name: string; now?: Date },
  ): Promise<{ pen: Pen; created: string[] }> {
    const pen = new Pen(root);
    const created: string[] = [];
    for (const dir of ["handoffs", "ledger", "private"]) {
      if (!(await exists(pen.p(dir)))) {
        await mkdir(pen.p(dir), { recursive: true });
        created.push(path.join(PEN_DIR, dir) + "/");
      }
    }
    const files: [string, string][] = [
      ["pen.yaml", stringifyPenConfig(defaultPenConfig(opts.name))],
      ["brief.md", briefTemplate(opts.now)],
      [".gitignore", "private/\n"],
      ["handoffs/.gitkeep", ""],
      ["ledger/.gitkeep", ""],
    ];
    for (const [file, content] of files) {
      if (!(await exists(pen.p(file)))) {
        await writeFile(pen.p(file), content);
        created.push(path.join(PEN_DIR, file));
      }
    }
    return { pen, created };
  }

  async readConfig(): Promise<PenConfig> {
    return parsePenConfig(await readFile(this.p("pen.yaml"), "utf8"));
  }

  async readBrief(): Promise<Brief | undefined> {
    const file = this.p("brief.md");
    return (await exists(file)) ? parseBrief(await readFile(file, "utf8")) : undefined;
  }

  // ---- who am I -----------------------------------------------------------------

  /** This machine's member id: $PIGPEN_MEMBER, else `.pigpen/private/me.json`. */
  async me(): Promise<string> {
    const config = await this.readConfig();
    const fromEnv = process.env.PIGPEN_MEMBER;
    let id = fromEnv;
    if (!id && (await exists(this.p("private", "me.json")))) {
      id = (JSON.parse(await readFile(this.p("private", "me.json"), "utf8")) as { member?: string })
        .member;
    }
    if (!id) throw new Error("Who are you in this pen? Run `pigpen me <member-id>` first.");
    if (!config.members.some((m) => m.id === id)) {
      throw new Error(
        `"${id}" is not a member in pen.yaml (${config.members.map((m) => m.id).join(", ")})`,
      );
    }
    return id;
  }

  async setMe(member: string): Promise<void> {
    const config = await this.readConfig();
    if (!config.members.some((m) => m.id === member)) {
      throw new Error(`"${member}" is not a member in pen.yaml`);
    }
    await mkdir(this.p("private"), { recursive: true });
    await writeFile(this.p("private", "me.json"), JSON.stringify({ member }, null, 2) + "\n");
  }

  // ---- handoffs -----------------------------------------------------------------

  async listHandoffs(filter?: { status?: HandoffStatus }): Promise<Handoff[]> {
    if (!(await exists(this.p("handoffs")))) return [];
    const files = (await readdir(this.p("handoffs"))).filter((f) => /^h-\d+.*\.md$/.test(f)).sort();
    const cards = await Promise.all(
      files.map(async (f) => parseHandoff(await readFile(this.p("handoffs", f), "utf8"))),
    );
    return filter?.status ? cards.filter((c) => c.meta.status === filter.status) : cards;
  }

  async readHandoff(id: string): Promise<Handoff> {
    const card = (await this.listHandoffs()).find((c) => c.meta.id === id);
    if (!card) throw new Error(`No handoff ${id}`);
    return card;
  }

  /** Write a new card with status "proposed". Throws UnsafeCardError on secrets or size. */
  async createHandoff(input: {
    from: string;
    to: string;
    criteria?: string[];
    files?: string[];
    body: HandoffBody;
    now?: Date;
  }): Promise<Handoff> {
    const existing = (await this.listHandoffs()).map((c) => c.meta.id);
    const handoff: Handoff = {
      meta: {
        id: nextHandoffId(existing),
        from: input.from,
        to: input.to,
        created: (input.now ?? new Date()).toISOString(),
        status: "proposed",
        approved_by: null,
        criteria: input.criteria ?? [],
        files: input.files ?? [],
      },
      body: input.body,
    };
    const text = renderHandoff(handoff);
    assertCardSafe(text);
    await mkdir(this.p("handoffs"), { recursive: true });
    await writeFile(this.p("handoffs", handoffFilename(handoff.meta)), text);
    return handoff;
  }

  /** Human-only: approve or reject a proposed card. Never exposed as an MCP tool. */
  async decideHandoff(id: string, decision: "approved" | "rejected", by: string): Promise<Handoff> {
    const card = await this.readHandoff(id);
    if (card.meta.status !== "proposed") {
      throw new Error(`${id} is already ${card.meta.status}`);
    }
    const updated: Handoff = {
      ...card,
      meta: { ...card.meta, status: decision, approved_by: decision === "approved" ? by : null },
    };
    await writeFile(this.p("handoffs", handoffFilename(updated.meta)), renderHandoff(updated));
    return updated;
  }

  // ---- ledger -------------------------------------------------------------------

  /** Append to this member's own ledger file, so two people never edit the same file. */
  async appendLedger(event: LedgerEventInput): Promise<void> {
    await mkdir(this.p("ledger"), { recursive: true });
    await appendFile(this.p("ledger", `${event.member}.jsonl`), serializeEvent(event) + "\n");
  }

  /** Every member's events, oldest first. */
  async readLedger(): Promise<LedgerEvent[]> {
    if (!(await exists(this.p("ledger")))) return [];
    const files = (await readdir(this.p("ledger"))).filter((f) => f.endsWith(".jsonl"));
    const events = (
      await Promise.all(
        files.map(async (f) => parseLedger(await readFile(this.p("ledger", f), "utf8"))),
      )
    ).flat();
    return events.sort((x, y) => Date.parse(x.ts) - Date.parse(y.ts));
  }

  // ---- private, per-machine state -----------------------------------------------

  async recentPrompts(): Promise<{ text: string; ts: string }[]> {
    const file = this.p("private", "recent.json");
    if (!(await exists(file))) return [];
    return JSON.parse(await readFile(file, "utf8")) as { text: string; ts: string }[];
  }

  async rememberPrompt(text: string, now: Date = new Date()): Promise<void> {
    const recent = [{ text, ts: now.toISOString() }, ...(await this.recentPrompts())].slice(
      0,
      RECENT_LIMIT,
    );
    await mkdir(this.p("private"), { recursive: true });
    await writeFile(this.p("private", "recent.json"), JSON.stringify(recent, null, 2) + "\n");
  }

  /** Tracked file count from git, or undefined outside a git repo. */
  async repoFileCount(): Promise<number | undefined> {
    try {
      const { stdout } = await promisify(execFile)("git", ["ls-files"], {
        cwd: this.root,
        maxBuffer: 64 * 1024 * 1024,
      });
      return stdout.split("\n").filter(Boolean).length;
    } catch {
      return undefined;
    }
  }
}

export { checkPrompt } from "./preflight.js";
