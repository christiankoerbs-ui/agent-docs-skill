# Why pipe-delimited passive context

In late-2025 evals (see Vercel's "AGENTS.md outperforms skills in our
agent evals" post), a small **passive-context** index — a compact,
always-loaded file that names the available detail docs — outperformed
on-demand skill retrieval for typical coding-agent tasks. The headline
finding: **agents are better at picking the right detail file when the
list of options is in front of them than when they have to discover it
through tool calls**.

This skill bakes that finding into its output format.

## What "passive context" means here

The first thing a downstream agent loads, before it touches any code,
is `.agents/docs/index.md`:

```
[Agent Docs Index]|root:./.agents/docs
|stack:{stack.md}|core:{core.md}
|modules:{modules/auth.md,modules/billing.md,modules/users.md}
|frontend:{frontend.md}
|hint:Read only the file matching the paths you are about to modify.
|directive:Prefer retrieval-led reasoning over pre-training assumptions.
```

That single block — under 200 bytes for most repos — tells the agent:

- What domains exist (`stack`, `core`, modules, optionally `frontend`).
- Where to read them.
- How to choose (the `hint:` line).
- Why retrieval-led reasoning matters for this repo (the `directive:`
  line — a lightweight nudge against guessing from training data).

## Why pipe-delimited rather than YAML or JSON

Three reasons:

1. **Token-cheap.** No structural noise (`{`, `:`, quoting). The whole
   index is one line per concept.
2. **Glanceable.** A human or a model can read it in one pass. There is
   no nested structure to traverse.
3. **Diff-friendly.** When the module list changes, exactly one line
   changes, and the change is obvious in a PR review.

YAML and JSON were considered. YAML's whitespace sensitivity made it
fragile in mixed-tooling pipelines; JSON's punctuation overhead inflated
the file by ~40% in early experiments. Pipe-delimited won on both.

## Why one file per module rather than one big doc

A coding agent working on `modules/auth.md` should not have to load the
billing module's domain rules. The whole point of splitting docs is to
keep each context window small and on-topic. The index makes the choice
cheap; the per-module file makes the load cheap.

## Why code anchors instead of code blocks

Embedded code blocks rot silently — the doc still parses fine after the
underlying code has been refactored, and the agent reads stale context
without any indicator. Anchors of the form `path/to/file.ext:Lstart-Lend`
are cheap to verify (just check the file exists and has that many
lines) and force the reader to actually open the source when they need
detail. Stale anchors are noisy in a way that stale code blocks are
not — exactly the property we want.

## Limits of the pattern

The retrieval-led format works best when modules are well-bounded. If
the repo's modules leak into each other constantly, the per-module docs
will keep cross-referencing and the agent will end up loading
everything anyway. In that case the right answer is to fix the module
boundary, not to stuff everything into `core.md`. The skill surfaces
this when it sees a module doc whose anchors keep escaping its own
directory.
