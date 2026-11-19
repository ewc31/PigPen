# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `.pigpen/` file format: `pen.yaml`, `brief.md`, handoff cards and per-member ledgers
- Handoff safety: markup stripping, secret refusal, 4 KB cap, human-only approval
- Preflight engine (scoring, thresholds, questions, cleaned prompt). Rules R1–R8 to come.
- `pigpen` CLI: `init`, `me`, `preflight`, `handoffs`, `show`, `approve`, `reject`, `hook claude-code`
- MCP server with `pen_preflight`, `pen_brief_read`, `pen_handoff_create`, `pen_handoff_list`
- Claude Code and Cursor integration guides
- Pen replay app shell and a sample demo pen
- CI and GitHub Pages deploy
