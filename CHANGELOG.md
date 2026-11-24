# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Preflight rules spec v0.2: a nine-rule demo set adds R9 (bug with no evidence), R10 (vague
  quality words) and R11 (huge paste); R12–R14 wait on hook data; R6, R8 and R15 move to later

### Added

- `.pigpen/` file format: `pen.yaml`, `brief.md`, handoff cards and per-member ledgers
- Handoff safety: markup stripping, secret refusal, 4 KB cap, human-only approval
- Preflight engine (scoring, thresholds, questions, cleaned prompt). Rules to come.
- `pigpen` CLI: `init`, `me`, `preflight`, `handoffs`, `show`, `approve`, `reject`, `hook claude-code`
- MCP server with `pen_preflight`, `pen_brief_read`, `pen_handoff_create`, `pen_handoff_list`
- Claude Code and Cursor integration guides
- Pen replay app shell and a sample demo pen
- CI and GitHub Pages deploy
