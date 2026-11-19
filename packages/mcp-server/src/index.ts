#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

// Clients start this from the repo root; PIGPEN_ROOT overrides when they don't.
const server = createServer({ cwd: process.env.PIGPEN_ROOT ?? process.cwd() });
await server.connect(new StdioServerTransport());
