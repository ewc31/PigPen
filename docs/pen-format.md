# PigPen file format and preflight rules (v0.1)

Everything PigPen knows lives in a `.pigpen/` folder at the repo root. Git carries it between
people, so there is no server. Every file has exactly one writer, so two people pushing at once
never hit a merge conflict.

```text
.pigpen/
  pen.yaml                 # pen settings: members, tools, gate mode
  brief.md                 # shared goal, constraints, acceptance criteria (humans edit)
  handoffs/
    h-001-a-to-b.md        # one file per handoff card
  ledger/
    a.jsonl                # member a's events, append-only
    b.jsonl                # member b's events, append-only
  private/                 # git-ignored: who you are, recent prompts
  .gitignore               # contains "private/"
```

## pen.yaml

```yaml
version: "0.1"
name: pigpen-demo
members:
  - { id: a, human: Designer, tool: claude-code }
  - { id: b, human: Engineer, tool: cursor }
gate: advise # advise | block. Handoffs always need human approval either way.
profile: standard # loose | standard | strict
question_threshold: 40 # show questions when the mud score is at or above this
```

Member ids are what every other file refers to, so names can change without breaking anything.

## brief.md

The contract both agents check against. Humans edit it; agents only read it.

```markdown
# Goal

One or two sentences.

# Constraints

- Things agents must respect

# Acceptance criteria

- [ ] AC1: An observable, testable statement

# Out of scope

- Things agents should not start on
```

## Handoff cards

Markdown with YAML frontmatter, in `handoffs/<id>-<from>-to-<to>.md`.

| Field         | Meaning                                        |
| ------------- | ---------------------------------------------- |
| `id`          | `h-001`, `h-002`…                              |
| `from`, `to`  | Member ids                                     |
| `created`     | ISO 8601 time with offset                      |
| `status`      | `proposed` → `approved` or `rejected` → `done` |
| `approved_by` | The human who approved it, or `null`           |
| `criteria`    | Acceptance criteria ids this work moves        |
| `files`       | Files touched so far                           |

The body has exactly three headings: **Done so far**, **What "done" means for you**, **Watch out for**.

**Safety.** A card written by one agent becomes input to another, so:

1. Only a human can approve a card, with `pigpen approve`. No MCP tool can.
2. The receiving agent only sees approved cards, quoted as a colleague's note, not instructions.
3. Hidden markup (HTML, comments, zero-width characters, encoded blobs) is stripped.
4. Cards containing secrets are refused.
5. Cards are capped at 4 KB.

## Ledger

One JSON event per line in `ledger/<member>.jsonl`. Every event has `ts`, `member`, `tool`,
`event` and `pigpen_tokens`, plus optional `task`. Agent token counts (`tokens_in`, `tokens_out`)
are recorded only when the tool exposes them; anything inferred is marked `"estimated": true`.

| Event             | Written when                               | Extra fields                         |
| ----------------- | ------------------------------------------ | ------------------------------------ |
| `preflight`       | A prompt is checked                        | `score_before`, `rules`, `questions` |
| `answered`        | The person answers or skips the questions  | `answered`, `skipped`                |
| `handoff_created` | A card is written                          | `handoff`                            |
| `handoff_decided` | A human approves or rejects it             | `handoff`, `decision`, `by`          |
| `review`          | A diff is checked against the brief        | `criteria_met`, `drift`              |
| `rerun`           | A prompt is near-identical to a recent one | `similar_to`                         |
| `revert`          | A revert commit lands on an agent's change | `commit`                             |

## Preflight rules (v0.2)

Deterministic, no model calls, so preflight costs zero tokens and every point has a reason. The
**mud score** is the sum of the weights of the rules that fire, capped at 100; lower is cleaner.
At or above `question_threshold`, PigPen shows up to 3 questions, highest weight first.

Rule ids never change once assigned, so ledgers and tests stay valid. Weights are starting
guesses: set them from labeled real prompts before the demo.

### Demo set: build these now

Nine rules that need only the prompt text, the brief and the repo's file count.

| ID  | Rule                 | Fires when                                                                                                    | Weight | Question                                                              |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------- |
| R1  | No clear goal        | No action verb in the first sentence, or the prompt is under 6 words                                          | 20     | What should be different when this is done?                           |
| R2  | No "done"            | No should / must / so that / until / test, and the brief has no open acceptance criteria                      | 20     | How will we know it's done?                                           |
| R9  | Bug with no evidence | Says bug / broken / doesn't work / crash / fails, with no error text, no code block and no expected-vs-actual | 20     | What did you expect, and what happened instead? Paste the error text. |
| R3  | Vague pointer        | "it", "this" or "that" in the first 10 words with no file, function or earlier mention                        | 15     | Which file or function do you mean?                                   |
| R4  | No location          | No file path, symbol or URL, in a repo with more than 50 files                                                | 15     | Where should the agent look first?                                    |
| R5  | Scope explosion      | "everything", "whole app", "rewrite", or 3+ separate asks                                                     | 15     | Can we split this? Which part first?                                  |
| R10 | Vague quality words  | "better", "cleaner", "nicer", "modern", "polish", "clean up" with no criteria, example or reference           | 15     | Better how? Name one thing that should look or work differently.      |
| R7  | Risky with no limits | Delete / migrate / deploy / auth / payments with no stated limit                                              | 10     | Anything it must not touch, or data to keep?                          |
| R11 | Huge paste           | Over 200 lines or 20,000 characters, or a pasted log or stack trace over 50 lines                             | 10     | Which part of this matters? Trim it to the lines the agent needs.     |

### Next: after checking what the hook receives

These need data beyond the prompt text. Confirm Claude Code (and Cursor) actually pass it before
building them, then add the field to `RuleContext`.

| ID  | Rule                       | Fires when                                                         | Needs                                           | Question                                                 |
| --- | -------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------------- |
| R12 | Big task outside plan mode | R5 fires and the agent is not in plan mode                         | The hook's `permission_mode` (Claude Code only) | This looks big. Plan it first?                           |
| R13 | Long session               | The current session's transcript is over a size limit              | The hook's `transcript_path`                    | Start a fresh session with a handoff? It's cheaper.      |
| R14 | Screenshot instead of text | An image is attached and the prompt mentions an error or a message | A way to see attachments                        | Can you paste the text instead? Images cost more tokens. |

R13 is advice about the session rather than the prompt, so consider showing it as a tip that
doesn't add to the mud score.

### Later

| ID  | Rule                            | Why later                                                                         |
| --- | ------------------------------- | --------------------------------------------------------------------------------- |
| R6  | Fights the brief                | Only useful while the brief is kept current; bring it back once you use one daily |
| R8  | Likely rerun                    | Needs a prompt-similarity measure, the hardest piece of the original eight        |
| R15 | Names a file that doesn't exist | Needs fuzzy matching against the repo's files ("Did you mean `fetchUser`?")       |
| —   | Secret in the prompt            | A safety warning using the existing secret scanner, not part of the mud score     |

After the person answers, PigPen builds the cleaned prompt from a fixed template
(Goal / Done when / Look in / Limits) plus the original text. No model rewrites it.
