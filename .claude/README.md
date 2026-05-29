# `.claude/` — Claude Code tooling

This directory holds **generic Claude Code agent tooling**, not documentation
for the VivanceData Learning Platform itself. It is by far the largest source
of markdown in the repo and should not be mistaken for project docs.

Contents:

| Folder | What it is |
|--------|-----------|
| `agents/` | 24 reusable subagent definitions (many are general-purpose, e.g. `chaos-engineer`, `fintech-engineer`, `llm-architect`) |
| `commands/` | ~55 slash-command definitions (`misc/`, `api/`, `frameworks/`, `supabase/`, `ui/`) |
| `skills/` | 14 auto-invoked skills |
| `rules/` | Project rules consumed by Claude (see `rules/PROJECT-RULES.md`) |
| `orchestrators/`, `hooks/`, `handoffs/`, `ledger/`, `memory/`, `docs/` | Supporting agent infrastructure |

This is a kitchen-sink toolkit; most of it is **not** specific to this
codebase. Project-specific guidance lives in the root `CLAUDE.md`. If you are
looking for how the app works, start there and in `README.md` / `docs/`.

> Note: `rules/PROJECT-RULES.md` is a partially-customized template — defer to
> the root `CLAUDE.md` and `package.json` where they disagree (e.g. this repo
> uses Jest + Next.js 16, not the vitest/Next 15 the template mentions).
