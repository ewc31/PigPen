#!/usr/bin/env node
import { readAll, runCli, version } from "./cli.js";

const argv = process.argv.slice(2);
if (argv[0] === "--version" || argv[0] === "-v") {
  console.log(await version());
} else {
  process.exitCode = await runCli(argv, {
    cwd: process.cwd(),
    out: (t) => console.log(t),
    err: (t) => console.error(t),
    readStdin: () => readAll(process.stdin),
  });
}
