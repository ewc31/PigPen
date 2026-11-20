import type { PenFiles } from "./timeline";

// Bundle the recorded demo pen at build time. Swap the folder to replay a different recording.
const raw = import.meta.glob("../../../../examples/demo-pen/.pigpen/**/*.{yaml,md,jsonl}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const demoFiles: PenFiles = Object.fromEntries(
  Object.entries(raw).map(([p, text]) => [p.replace(/^.*\/\.pigpen\//, ""), text]),
);
