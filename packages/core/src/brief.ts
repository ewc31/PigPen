import { parseFrontmatter } from "./frontmatter.js";

export interface AcceptanceCriterion {
  id: string;
  text: string;
  done: boolean;
}

export interface Brief {
  goal: string;
  constraints: string[];
  criteria: AcceptanceCriterion[];
  outOfScope: string[];
}

export const briefTemplate = (today: Date = new Date()) => `---
updated: ${today.toISOString().slice(0, 10)}
---
# Goal
One or two sentences: what we are building and for whom.

# Constraints
- Stack and libraries we use
- Files or folders agents must not change

# Acceptance criteria
- [ ] AC1: An observable, testable statement

# Out of scope
- Things agents should not start on
`;

function sections(markdown: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  let current = "";
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^#\s+(.+?)\s*$/.exec(line);
    if (heading?.[1]) {
      current = heading[1].toLowerCase();
      out.set(current, []);
    } else if (current) {
      out.get(current)?.push(line);
    }
  }
  return out;
}

const bullets = (lines: string[] = []) =>
  lines
    .map((l) => /^\s*[-*]\s+(?!\[[ xX]\])(.+)$/.exec(l)?.[1]?.trim())
    .filter((v): v is string => Boolean(v));

/** Parse `.pigpen/brief.md`. Unknown sections are ignored. */
export function parseBrief(text: string): Brief {
  const { content } = parseFrontmatter(text);
  const s = sections(content);
  const criteria: AcceptanceCriterion[] = [];
  for (const line of s.get("acceptance criteria") ?? []) {
    const m = /^\s*[-*]\s+\[([ xX])\]\s+(AC\d+)\s*:\s*(.+)$/.exec(line);
    if (m?.[2] && m[3]) criteria.push({ id: m[2], text: m[3].trim(), done: m[1] !== " " });
  }
  return {
    goal: (s.get("goal") ?? []).join(" ").replace(/\s+/g, " ").trim(),
    constraints: bullets(s.get("constraints")),
    criteria,
    outOfScope: bullets(s.get("out of scope")),
  };
}
