---
name: agent-docs-skill
description: Generate and maintain AI-agent-optimized documentation in `.agents/docs/` so coding and design agents load only the slice of the repo they need. Use this skill whenever the user mentions "bootstrap documentation", "update documentation", "set up agent docs", "generate agent context", "make this repo agent-readable", "sync agent docs after changes", or any request to produce, refresh, or per-module-document a codebase for AI agents — even if they don't say "agents.md" explicitly. Inspired by retrieval-led passive-context findings (Vercel agents-md evals).
---

# agent-docs-skill

Produce and maintain a tiny, retrieval-friendly documentation tree at
`.agents/docs/` in the target repo. Agents read it before starting work
so they load only the slice of code they need. The format follows the
pattern that beat retrieval-on-demand in Vercel's agents-md evals: a
small **pipe-delimited index** (always loaded) plus per-domain detail
files (loaded as needed). See `references/vercel-rationale.md`.

## Two entry points

- **`bootstrap documentation`** — no `.agents/docs/` yet (or user wants
  a clean rebuild). Generate the whole tree.
- **`update documentation`** — `.agents/docs/` exists. Look at what
  changed on the current branch and refresh only affected docs.

Pick the matching workflow if the user says anything close to those
phrases ("set up agent docs", "sync the agent docs", "regenerate the
agents context").

## Hard boundaries

- **Write only inside `.agents/docs/`.** Never touch `AGENTS.md`,
  `CLAUDE.md`, source files, manifests, CI configs, or anything else.
  The user wires up a one-line pointer in their AGENTS.md/CLAUDE.md
  by hand, exactly once. After that, every future run resolves through
  the same pointer because its target (`.agents/docs/index.md`) is
  updated in place.
- **No silent rewrites.** During `update`, list the docs you intend to
  touch and ask for explicit confirmation before writing.
- **No scripts in the target repo.** This skill is 100% Markdown-driven.
  Run any commands you need (`git diff`, manifest reads, line counts)
  directly via your bash and read tools.

## Bootstrap workflow

### 1. Detect the tech stack

Look for these in the repo root and one level down. Record what you
found.

| Stack signal              | Files / markers                                          |
|---------------------------|----------------------------------------------------------|
| Node / TypeScript         | `package.json`, `tsconfig.json`, `pnpm-lock.yaml`, `bun.lock` |
| Python                    | `pyproject.toml`, `setup.py`, `requirements.txt`, `Pipfile` |
| Rust                      | `Cargo.toml`                                             |
| Go                        | `go.mod`                                                 |
| PHP                       | `composer.json`                                          |
| Ruby                      | `Gemfile`                                                |
| JVM                       | `pom.xml`, `build.gradle`, `build.gradle.kts`            |
| .NET                      | `*.csproj`, `*.sln`                                      |
| Container / runtime       | `Dockerfile`, `docker-compose.yml`, `Procfile`           |
| Framework hints           | `next.config.*`, `vite.config.*`, `astro.config.*`, `nuxt.config.*`, `svelte.config.*`, `remix.config.*`, `manage.py`, `app/main.py` |
| CI                        | `.github/workflows/*.yml`, `.gitlab-ci.yml`, `circleci/`  |

Pull from the relevant manifests: package name, version, runtime,
build/test/lint commands, declared env vars, key deps.

### 2. Detect top-level modules

Scan these roots in order; include every one that has real source:

- `packages/*`, `apps/*` (monorepo)
- `src/*`, `lib/*`, `app/*` (single package)
- `cmd/*`, `internal/*` (Go)

Each immediate child directory is a module. **Directory name = module
name = doc file name.** No mapping config.

### 3. Detect frontend presence

Frontend exists if any of these are true:

- A `components/`, `ui/`, `views/`, or `pages/` directory contains
  `.tsx`, `.jsx`, `.vue`, `.svelte`, or `.astro` files.
- A design-token / theme file exists (`tailwind.config.*`,
  `tokens.json`, `theme.ts`, `_variables.scss`, `globals.css`).
- A Storybook config exists (`.storybook/`).
- A frontend framework config from the table above is present.

Record which signals fired.

### 4. Fill templates and write

Always write `stack.md`, `core.md`, and one `modules/<name>.md` per
module. Write `frontend.md` only if a frontend was detected.

Templates are inlined below — fill the placeholders, write the file,
do not Read separate template files. Placeholder rules: substitute
`{{...}}` with real content; if a section truly has no content, write
`(none)` rather than dropping the heading.

#### `.agents/docs/stack.md`

````md
# Stack — {{REPO_NAME}}

## Runtime
- Language / runtime: {{RUNTIME}}
- Package manager: {{PACKAGE_MANAGER}}
- Framework(s): {{FRAMEWORKS}}

## Build, test, lint
{{BUILD_COMMANDS}}

## Environment variables
{{ENV_VARS}}

## Root-level config files agents commonly need to update
{{ROOT_CONFIG_FILES}}

## Deploy target
{{DEPLOY_TARGET}}

## Notable version constraints
{{VERSION_CONSTRAINTS}}

## Anchors
{{ANCHORS}}
````

`{{ROOT_CONFIG_FILES}}` should list files like `.env.example`,
`vercel.json`, `next.config.*`, `tsconfig.json`, `Dockerfile`,
`docker-compose.yml`, `.github/workflows/*` — the kinds of files that
sit at the repo root and get edited alongside feature work but aren't
captured by any `modules/<name>.md`. Without this list, a doc-driven
agent will miss them; a grep-driven agent stumbles on them by
accident.

#### `.agents/docs/core.md`

````md
# Core — {{REPO_NAME}}

## Domain glossary
{{GLOSSARY}}

## Invariants
{{INVARIANTS}}

## Cross-cutting rules
{{CROSS_CUTTING}}

## Shared utilities
{{SHARED_UTILS}}

## Anchors
{{ANCHORS}}
````

#### `.agents/docs/modules/<MODULE_NAME>.md`

````md
# Module — {{MODULE_NAME}}

## Purpose
{{PURPOSE}}

## Entry point
{{ENTRY_POINT}}

## Public API
{{PUBLIC_API}}

## Internal layering
{{LAYERING}}

## Dependencies
{{DEPENDENCIES}}

## Invariants
{{INVARIANTS}}

## Anchors
{{ANCHORS}}
````

#### `.agents/docs/frontend.md` (only if frontend detected)

````md
# Frontend — {{REPO_NAME}}

## Stack signals detected
{{FRONTEND_SIGNALS}}

## Design tokens
{{DESIGN_TOKENS}}

## Component inventory
{{COMPONENT_INVENTORY}}

## Styling system
{{STYLING_SYSTEM}}

## Routing & layout
{{ROUTING}}

## Anchors
{{ANCHORS}}
````

### 5. Write `index.md`

Render this exact pipe-delimited block to `.agents/docs/index.md`,
substituting `{{MODULES_LIST}}` with the comma-separated module file
list and including the `|frontend:{frontend.md}` segment **only if a
frontend was detected**. Target ~200 bytes.

```
[Agent Docs Index]|root:./.agents/docs
|stack:{stack.md}|core:{core.md}
|modules:{{{MODULES_LIST}}}{{FRONTEND_SEGMENT}}
{{TOPICS_LINE}}
|hint:Read only the file matching the paths you are about to modify.
|directive:Prefer retrieval-led reasoning over pre-training assumptions.
```

`{{FRONTEND_SEGMENT}}` is either `|frontend:{frontend.md}` or empty.
`{{MODULES_LIST}}` example: `modules/auth.md,modules/billing.md`.

`{{TOPICS_LINE}}` is **optional**. Add it only when a concept could
plausibly belong to two or more modules (e.g. a monorepo with a web
*and* a mobile app that both handle "deeplinks", or a polyglot repo
where "auth" lives in both `services/auth` and `web/auth`). Format:

```
|topics:{<topic>:<module>,<topic>:<module>,...}
```

Example for a Next.js + Flutter monorepo:

```
|topics:{deeplinks:flutter,invitations:flutter,routing:flutter,api:app,server-actions:lib}
```

If no concept is shared across modules, omit the line entirely. The
goal is disambiguation, not exhaustive tagging.

Regenerate `index.md` on every bootstrap and every update run, even if
the module list looks unchanged.

### 6. Notice (show exactly once, only after bootstrap)

```
Done. Add this line to your AGENTS.md or CLAUDE.md once:

  For agent context, read .agents/docs/index.md first, then load only
  the domain files relevant to your task.

Future `update documentation` runs will keep .agents/docs/ in sync
automatically — no further manual steps needed.
```

Do not repeat this on update runs.

## Update workflow

### 1. Find changed files

```
git rev-parse --abbrev-ref HEAD
```

If `main` (or `master`), stop with:

> Already on the main branch — no diff to summarize. Run
> `update documentation` from a feature branch.

Otherwise:

```
git diff --name-only main...HEAD -- . ':!.agents/docs'
```

(Use `master...HEAD` if `main` doesn't exist locally.) The three-dot
form gives what changed on this branch since it diverged from main.

**Always exclude `.agents/docs/**`** from the source-change list. The
docs themselves are this skill's output — including them would feed
doc edits back into the doc-update mapping (circular). The
`':!.agents/docs'` pathspec at the end of the command does this.

### 2. Map paths to docs

Apply in order; first match wins:

| Path pattern | Doc to update |
|--------------|---------------|
| `packages/<n>/**`, `apps/<n>/**`, `src/<n>/**`, `lib/<n>/**`, `cmd/<n>/**`, `internal/<n>/**`, `app/<n>/**` | `.agents/docs/modules/<n>.md` (auto-create if missing) |
| `components/**`, `ui/**`, `views/**`, `pages/**`, `*.tsx`/`*.jsx`/`*.vue`/`*.svelte`/`*.astro`, `tailwind.config.*`, design-token / theme files, `.storybook/**` | `.agents/docs/frontend.md` |
| `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `composer.json`, `Gemfile`, JVM/.NET manifests, `Dockerfile`, `docker-compose.yml`, `.github/workflows/**`, framework configs | `.agents/docs/stack.md` |
| anything else | `.agents/docs/core.md` |

### 3. Verify code anchors in docs you'll touch

For each doc you intend to touch, scan its existing anchors of the form
`<path>:L<start>-L<end>`. For each anchor:

- If `<path>` no longer exists → mark **stale (file gone)**.
- If `<end>` exceeds the current line count → mark **stale (out of
  range)**.

Don't surface anchors in *other* docs as part of the proposal — only
the docs being touched. Verifying anchors elsewhere is a separate
operation and would over-broaden the update scope.

### 4. Propose, confirm, write

Show the user something like:

```
Changed source files:
  - src/auth/session.ts
  - packages/billing/index.ts
  - tailwind.config.ts

I would update these docs:
  - .agents/docs/modules/auth.md
  - .agents/docs/modules/billing.md
  - .agents/docs/frontend.md

New module detected: payments
  → would create .agents/docs/modules/payments.md

Stale anchors in docs to be touched:
  - .agents/docs/modules/auth.md
      src/auth/session.ts:200-240   (file is now 180 lines)

Proceed? (yes / select which / no)
```

After user confirms, write the docs and regenerate `index.md` if the
module list changed. **Do not** show the post-bootstrap notice.

## Code-anchor discipline

Detail docs cite `path:Lstart-Lend` (e.g. `src/auth/session.ts:42-78`),
not embedded code blocks. Anchors are cheap to verify and surface
staleness loudly when the source moves.

**Counting lines correctly is the most common mistake.** Use one of:

- `wc -l < path` — gives the line count exactly. Use that number as
  `Lend`. Do not add 1 for a trailing newline; `wc -l` already accounts
  for it.
- The line numbers shown by your Read tool — the **highest** line
  number you saw is `Lend`.

If you computed `Lend` and it equals "line count + 1", you've hit the
trailing-newline trap; subtract 1.

`Lstart` defaults to 1 unless you're citing a specific span, in which
case it's the first line of the function or block.

## Doc conventions

- **Doc name = module name.** Directory `src/billing/` ⇒
  `.agents/docs/modules/billing.md`.
- **Code anchors over snippets.**
- **Per-module isolation.** A coding agent touching `auth` should be
  able to load `index.md` + `modules/auth.md` and have everything it
  needs. If `auth.md` keeps reaching into `billing.md`, the boundary
  is wrong — surface that to the user rather than blurring the docs.
- **Short and dense.** Prefer bullets, tables, and anchors over prose.
  The docs are read by other LLMs; signal-to-token ratio matters more
  than narrative flow.
- **No silent rewrites.**

## Placeholder vocabulary

| Placeholder            | Meaning                                                 |
|------------------------|---------------------------------------------------------|
| `{{REPO_NAME}}`        | Project name (from manifest or directory)               |
| `{{MODULE_NAME}}`      | Module / package directory name                         |
| `{{ENTRY_POINT}}`      | Main entry file path                                    |
| `{{PUBLIC_API}}`       | Bullet list of exports / endpoints / commands           |
| `{{ANCHORS}}`          | Bullet list of `path:Lstart-Lend` pointers              |
| `{{INVARIANTS}}`       | Bullet list of rules that must always hold              |
| `{{DEPENDENCIES}}`     | Bullet list of internal deps + external libs            |
| `{{BUILD_COMMANDS}}`   | Build / test / lint commands                            |
| `{{ENV_VARS}}`         | Required environment variables                          |
| `{{MODULES_LIST}}`     | `modules/a.md,modules/b.md,...`                         |

## When in doubt

- Prefer asking the user a short question over guessing a module
  boundary.
- If anchors would all become stale to write the doc honestly (e.g.
  the source is being rewritten right now), say so and skip that doc
  rather than fabricating anchors.
- If detected stack signals contradict (e.g. both `package.json` and
  `pyproject.toml` at the root), record both in `stack.md` and let
  the user clarify on the next run.
