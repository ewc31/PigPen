import { parse, stringify } from "yaml";
import { type PenConfig, PenConfigSchema } from "./schemas.js";

export function parsePenConfig(text: string): PenConfig {
  return PenConfigSchema.parse(parse(text));
}

export function stringifyPenConfig(config: PenConfig): string {
  return stringify(config);
}

export function defaultPenConfig(name: string): PenConfig {
  return {
    version: "0.1",
    name,
    members: [
      { id: "a", human: "Person A", tool: "claude-code" },
      { id: "b", human: "Person B", tool: "cursor" },
    ],
    gate: "advise",
    profile: "standard",
    question_threshold: 40,
  };
}
