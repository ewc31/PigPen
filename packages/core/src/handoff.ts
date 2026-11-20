import { parseFrontmatter, stringifyFrontmatter } from "./frontmatter.js";
import { type Handoff, type HandoffBody, type HandoffMeta, HandoffMetaSchema } from "./schemas.js";

export const HANDOFF_HEADINGS = {
  doneSoFar: "Done so far",
  doneMeans: 'What "done" means for you',
  watchOut: "Watch out for",
} as const satisfies Record<keyof HandoffBody, string>;

export function handoffFilename(meta: Pick<HandoffMeta, "id" | "from" | "to">): string {
  return `${meta.id}-${meta.from}-to-${meta.to}.md`;
}

export function renderHandoff({ meta, body }: Handoff): string {
  const content = (Object.keys(HANDOFF_HEADINGS) as (keyof HandoffBody)[])
    .map((key) => `## ${HANDOFF_HEADINGS[key]}\n${body[key].trim()}\n`)
    .join("\n");
  return stringifyFrontmatter(HandoffMetaSchema.parse(meta), content);
}

export function parseHandoff(text: string): Handoff {
  const { data, content } = parseFrontmatter(text);
  const meta = HandoffMetaSchema.parse(data);
  const body: HandoffBody = { doneSoFar: "", doneMeans: "", watchOut: "" };
  const byHeading = new Map(
    (Object.entries(HANDOFF_HEADINGS) as [keyof HandoffBody, string][]).map(([k, h]) => [
      h.toLowerCase(),
      k,
    ]),
  );
  let current: keyof HandoffBody | undefined;
  const lines: Record<keyof HandoffBody, string[]> = { doneSoFar: [], doneMeans: [], watchOut: [] };
  for (const line of content.split(/\r?\n/)) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h?.[1]) {
      current = byHeading.get(h[1].toLowerCase());
      continue;
    }
    if (current) lines[current].push(line);
  }
  for (const key of Object.keys(lines) as (keyof HandoffBody)[]) {
    body[key] = lines[key].join("\n").trim();
  }
  return { meta, body };
}

/** Next id after the highest existing one: h-001, h-002, … */
export function nextHandoffId(existing: string[]): string {
  const max = existing.reduce((n, id) => Math.max(n, Number(/^h-(\d+)$/.exec(id)?.[1] ?? 0)), 0);
  return `h-${String(max + 1).padStart(3, "0")}`;
}
