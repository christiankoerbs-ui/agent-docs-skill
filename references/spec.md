# Spec alignment

This skill produces output that conforms to two adjacent conventions:
the **agents.md** convention (a top-level `AGENTS.md` file as a single
entry point for agents) and the **Open Skill** spec (`SKILL.md` with
YAML frontmatter, progressive disclosure via bundled resources).

The two are complementary. The skill itself is an Open Skill; the docs
it generates are an agents.md-compatible context tree.

## Mapping to agents.md

The agents.md convention says: put a top-level `AGENTS.md` (or
`CLAUDE.md`) in your repo so coding agents have a known entry point.

This skill respects that convention without owning it. The user adds a
single one-line pointer to `AGENTS.md`/`CLAUDE.md` once, after the
first `bootstrap` run:

```
For agent context, read .agents/docs/index.md first, then load only
the domain files relevant to your task.
```

After that, this skill's output (`.agents/docs/`) becomes the
authoritative context tree. The pointer is stable; the target evolves.
The skill never writes to `AGENTS.md` or `CLAUDE.md` directly because
those files often contain user-specific instructions, persona, or other
content this skill must not stomp on.

## Mapping to the Open Skill spec

The Open Skill spec (the format used by `SKILL.md`) defines:

| Spec field          | Where it lives in this skill                              |
|---------------------|-----------------------------------------------------------|
| `name` (frontmatter)| `agent-docs-skill`                                        |
| `description`       | One paragraph in `SKILL.md` frontmatter, lists triggers   |
| Skill body          | `SKILL.md` (`< 400 lines`); workflows + conventions       |
| Bundled references  | `references/templates/*.md`, `references/spec.md`, `references/vercel-rationale.md` |
| Bundled scripts     | (none — this skill is 100% Markdown-driven)               |
| Bundled assets      | (none)                                                    |
| Compatibility       | Any harness with `Read`, `Write`, `Edit`, and a way to run `git`/manifest reads. |

Progressive disclosure: the SKILL.md body is loaded whenever the skill
triggers. The templates and the rationale doc are loaded only when the
agent reaches a step that needs them. This keeps cold-start tokens low.

## Mapping to retrieval-led context patterns

The format of `.agents/docs/index.md` (single pipe-delimited block,
explicit module list, hint and directive lines) is chosen so that *the
index alone* is enough for a downstream agent to decide which detail
files to load. See `vercel-rationale.md` for why this beats
retrieval-on-demand for typical coding-agent workloads.
