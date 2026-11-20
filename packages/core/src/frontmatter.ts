import { parse, stringify } from "yaml";

export interface Frontmatter<T = unknown> {
  data: T;
  content: string;
}

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Split a markdown file into its YAML frontmatter and body. Missing frontmatter → `{}`. */
export function parseFrontmatter(text: string): Frontmatter {
  const match = FENCE.exec(text);
  if (!match) return { data: {}, content: text };
  return { data: parse(match[1] ?? "") ?? {}, content: text.slice(match[0].length) };
}

export function stringifyFrontmatter(data: object, content: string): string {
  const yaml = stringify(data, { lineWidth: 0 }).trimEnd();
  return `---\n${yaml}\n---\n${content.startsWith("\n") ? content : `\n${content}`}`;
}
