# agent-docs-skill

A skill that generates and maintains AI-agent-optimized documentation in
any repository under `.agents/docs/`. Coding and design agents read this
documentation **before** starting a task so they load only the slice of
the codebase they actually need — keeping context bloat and token usage
low. After a task, the same skill helps the agent update only the docs
affected by the changes.

The format follows the pattern that won in
[Vercel's agents-md vs skills evals](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals):
a small **pipe-delimited index** (passive context, always loaded by the
downstream agent) plus per-domain detail files (retrieved on demand).

## What it does

Two entry points, both initiated by a short user phrase:

- **`bootstrap documentation`** — initial generation. Detects stack,
  modules, frontend; writes `.agents/docs/` from scratch.
- **`update documentation`** — incremental sync. Looks at what changed
  on the current branch (`git diff main...HEAD`) and refreshes only
  the affected docs. Asks for explicit confirmation before any write.

Result tree:

```
.agents/docs/
  index.md           # pipe-delimited entry point — always loaded
  stack.md           # detected tech stack, build, deploy, env
  core.md            # cross-cutting domain rules, invariants
  modules/<name>.md  # one per top-level module / package
  frontend.md        # design tokens + components, only if frontend detected
```

The `index.md` is a single ~200-byte block:

```
[Agent Docs Index]|root:./.agents/docs
|stack:{stack.md}|core:{core.md}
|modules:{modules/auth.md,modules/billing.md,modules/users.md}
|frontend:{frontend.md}
|topics:{deeplinks:flutter,api-routes:app,server-actions:lib}
|hint:Read only the file matching the paths you are about to modify.
|directive:Prefer retrieval-led reasoning over pre-training assumptions.
```

Detail docs use **code anchors** (`path:Lstart-Lend`) instead of
embedded code blocks — anchors are cheap to verify and surface staleness
loudly when source moves.

The skill writes only inside `.agents/docs/`. It never touches
`AGENTS.md`, `CLAUDE.md`, source files, or anything else.

## Install

The skill is a single `SKILL.md` plus a few reference markdown files.
There's nothing to compile or run — agents just read it as instructions.

### Claude Code

Either install the packaged `.skill` archive:

```bash
# Download the latest agent-docs-skill.skill from this repo, then:
claude plugin install ./agent-docs-skill.skill
```

Or place the source files in your skills directory:

```bash
git clone https://github.com/christiankoerbs-ui/agent-docs-skill.git \
  ~/.claude/skills/agent-docs-skill
```

Claude Code auto-discovers skills under `~/.claude/skills/` on next
session. Trigger by saying `bootstrap documentation` or
`update documentation` (the description in `SKILL.md` is tuned to fire
on those phrases plus close paraphrases).

### Codex CLI / GitHub Copilot Coding Agent (AGENTS.md)

Both expect agent instructions in a top-level `AGENTS.md`. Add a one-line
pointer once:

```markdown
For agent context, read .agents/docs/index.md first, then load only
the domain files relevant to your task.

To regenerate or sync those docs, follow https://github.com/christiankoerbs-ui/agent-docs-skill/blob/main/SKILL.md
```

Then ask the agent to "bootstrap documentation" once. From then on,
every task starts with the agent reading `.agents/docs/index.md` and
picking the right module file.

### Cursor

Cursor reads `.cursor/rules/*.md`. Drop the skill in:

```bash
mkdir -p .cursor/rules
curl -L https://raw.githubusercontent.com/christiankoerbs-ui/agent-docs-skill/main/SKILL.md \
  > .cursor/rules/agent-docs-skill.md
```

### Aider

Add to `.aider.conf.yml`:

```yaml
read:
  - SKILL.md  # path to this skill's SKILL.md
```

### Gemini CLI

Place the skill in `~/.gemini/skills/agent-docs-skill/` (Gemini auto-loads
skill metadata at session start; the full body activates on demand).

### Generic / any other agent

Any agent that reads markdown instructions can use this skill. Drop
`SKILL.md` (and the `references/` directory) into whatever context-loading
mechanism the agent supports, and trigger with the phrase
`bootstrap documentation` (or `update documentation` for incremental
sync).

## How to use

### First time on a repo (one-time setup)

1. With the skill installed in your agent of choice, say:

   > bootstrap documentation

   The agent detects the stack, modules, and frontend; writes the docs
   under `.agents/docs/`. Takes 1–2 minutes on a typical repo.

2. The agent will then ask you to add **one line** to your `AGENTS.md`
   or `CLAUDE.md`, exactly once:

   > For agent context, read `.agents/docs/index.md` first, then load
   > only the domain files relevant to your task.

   That pointer is stable; the docs evolve in place.

3. Commit `.agents/docs/`. Done.

### After every feature branch

When you finish a task, on the same feature branch:

> update documentation

The skill runs `git diff --name-only main...HEAD` (excluding
`.agents/docs/` itself), maps changed source paths to docs by
convention (e.g. `src/auth/**` → `modules/auth.md`), shows you a
proposal, and waits for confirmation before writing. Stale code
anchors are flagged in the same proposal.

If you're on `main`, the skill stops cleanly — `update` is a no-op
without a feature branch.

### Conventions baked in

- **Doc name = module name.** `src/billing/` ⇒ `modules/billing.md`. No
  mapping config.
- **Code anchors over snippets.** Detail docs cite `path:Lstart-Lend`,
  never embedded code.
- **Per-module isolation.** A coding agent touching `auth` loads
  `index.md` + `modules/auth.md` and has everything it needs.
- **No silent rewrites.** Every `update` requires explicit user
  confirmation.
- **Skill writes only inside `.agents/docs/`.**

## Evidence

The skill was developed and validated through three iterations of
synthetic evals plus a real-repo evaluation against a known-good PR.
All raw artifacts and metrics live under
[`evals/`](./evals/) and the linked workspace.

### Synthetic evals (5 fixtures, 10 runs per iteration)

Five fixtures: TypeScript / Next.js, Python / FastAPI, polyglot monorepo
(`packages/` + `apps/`), pre-existing-docs (update workflow), and
on-main-branch (regression test). Each run pairs `with_skill` against
`without_skill`. Metrics are mechanical (file existence, index module
list, code-anchor resolution, write-scope).

| Iteration | with_skill mean pass rate | without_skill | delta | with_skill mean tokens |
|---|---|---|---|---|
| 1 | 91% | 63% | +28pp | 43,460 |
| 2 (templates inlined, anchor-counting fix) | 98% | 57% | +40pp | 40,004 |
| **3 (topics line, update-diff filter)** | **98%** | **45%** | **+53pp** | 40,004 |

### Real-repo eval — CHR-307 on a multi-stack mobile/web codebase

A real Linear ticket (deeplink routing bug) on a 22-module Next.js +
Flutter + Supabase repo. Each variant ran as an isolated subagent in a
git worktree, with the existing PR diff hidden from the agent. Compared
to the human-authored golden PR (4 files, +916 LOC):

| Metric | with_docs | without_docs |
|---|---|---|
| File overlap with golden (Jaccard) | **1.00** (perfect) | 0.60 |
| Pre-edit shell exploration calls | **8** | 11 (+38%) |
| Diff LOC | **530** | 619 (+17%) |
| Tokens | 94,254 | 96,016 |

The with-docs agent reported the index was *"decisive: it pointed
directly at `apps/flutter/lib/app/router.dart` and
`deep_link_handler.dart` and named the invariant 'All deeplink-driven
navigation must branch on auth state' — which is exactly what the bug
violated."*

### Real-repo eval — CHR-282, a substantial multi-module web ticket

A 22-file refactor (migration + server action + cron route + cleanup +
tests). Both runs based on the commit immediately before the golden PR
was merged.

| Metric | with_docs | without_docs | delta |
|---|---|---|---|
| Tokens | 67,714 | 79,485 | **−15%** |
| Wall time | 4:11 | 7:07 | **−41%** |
| **Bash exploration calls** | **7** | **22** | **−68%** |
| Diff LOC | 320 | 365 | −12% |
| Acceptance criteria met | 6 / 5 | 6 / 5 | tied |

The without_docs agent spent ~3× more shell calls (`find`, `grep -rn`,
`ls`) trying to discover the project layout. The with_docs agent went
from `index.md` → `modules/lib.md` → straight to the right files. **The
docs replaced an exploration sweep, not a correctness fix.** Same
correctness, lower cost.

### Plan-mode disambiguation

When two modules could plausibly own the same concept (a Next.js+Flutter
monorepo where "deeplinks" exist in both), an early version of the skill
let plan-mode agents pick the wrong stack. The optional `|topics:` line
in the index fixes this:

| Run | Target stack | Golden files named |
|---|---|---|
| Plan with old docs (no topics) | web (wrong) | 0 / 4 |
| **Plan with topics line** | **flutter ✓** | **4 / 4** |
| Plan without docs | web (wrong) | 0 / 4 |

### What the evidence supports

1. **The skill helps coding meaningfully on real repos.** Same
   correctness, narrower file changes, ~30% less exploration cost,
   sometimes ~15% fewer tokens / ~40% less wall time.
2. **The mechanism is *exploration substitution*, not error reduction.**
   Both with- and without-docs agents typically reach correct
   solutions. The docs cut the cost of getting there.
3. **Token economics flip on real repos vs synthetic ones.** Synthetic
   evals showed +18% tokens with-skill (because the skill drove more
   work); on real repos with substantial exploration cost, the skill
   *saves* 2–15% tokens.
4. **The `|topics:` line is high-leverage when modules overlap
   conceptually.** ~30 bytes per topic, prevents the wrong-stack
   trap in plan mode.

## Layout of this repo

```
.
├── SKILL.md                    # the skill itself (read this for behavior)
├── references/
│   ├── spec.md                 # alignment with agents.md / Open Skill spec
│   └── vercel-rationale.md     # one-pager on why pipe-delimited passive context
├── evals/
│   ├── evals.json              # 5 test prompts + verifiable assertions
│   └── fixtures/               # 5 mini-repos covering bootstrap + update + regressions
├── agent-docs-skill.skill      # packaged release artifact
├── README.md                   # this file
└── LICENSE
```

## License

MIT. See [LICENSE](./LICENSE).

## Contributing

Issues and PRs welcome. If you run the synthetic evals or use the skill
on a real repo, the workspace artifacts (transcripts, diffs, metrics)
are interesting to compare — share what you find.
