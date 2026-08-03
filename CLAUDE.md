# Claude Code Preferences

Pulse Server — Node.js/Express TypeScript backend for a health/wellness forum with auth, CSRF protection, and community features.
Architecture: MVC — Controller → Service → Model → Database.

## Model Selection
- **Haiku**: sub-agents, file lookups, search queries, simple edits (<50 lines), code explanation, formatting fixes, style enforcement
- **Sonnet/Opus**: complex debugging, architecture decisions, multi-file refactors, reasoning-heavy tasks

## Token Efficiency
- Grep/Glob over Bash find/ls/grep. Read with offset+limit when line known.
- Edit over Write. Write only for new files or full rewrites.
- Parallel independent tool calls. Sequential only when output feeds next.
- Sub-agents for >3 searches, large scans, slow multi-call tasks. Don't sub-agent tasks <100 lines.
- Don't re-read files already in context. Don't read full file to confirm small detail.
- No preamble/postamble. No restating request. No summarizing visible diffs.
- No speculative refactors. No "just in case" error handling.

## Behavior
**Before coding:** State assumptions. Ask when uncertain — don't implement until 95% confident. Surface tradeoffs. If multiple interpretations exist, present them — don't pick silently.
**Simplicity:** Minimum code that solves the problem. No extra features, abstractions, flexibility, or impossible-scenario handling. 200 lines that could be 50 → rewrite.
**Surgical:** Touch only what you must. Don't improve adjacent code. Match existing style. Mention unrelated dead code — don't delete it. Remove only imports/vars YOUR changes made unused.
**Learn from mistakes:** Save feedback memory on any correction or confirmed non-obvious choice. User should never repeat the same correction. Check memory before similar work.
**Goal-driven:** Define success criteria before starting. For multi-step tasks, state a plan: `1. [step] → verify: [check]`. Loop until verified.

## File Structure
See `docs/STRUCTURE.md` for the full directory layout and subdirectory rules.

## Docs Sync
New feature added → update server PRD, server README, AND client README same time, every time.

## AI Eval Sync
Any change to AI provider logic, prompts, insight types, or generation config
(`src/services/aiProviders/`, `src/lib/aiInsight/`, `aiInsightGeneratorService.ts`,
`config/default.ts` ai section) → check `scripts/eval-ai-models/` still reflects it:
scenarios cover the current insight types, prompts match `insightsPrompts.ts`,
model ids match config defaults. Update the eval scripts in the same change if
they've drifted — don't let them silently test stale prompts/models.

## AWS EC2 Migration — Pre-Deploy Checklist
Before deploying off Render to AWS EC2, resolve these items deferred in
`docs/review/07-fix-plan.md` (blocked on this migration, not actionable under Render):
- ~~REVIEW #4 — pick one bundler~~ Done: `tsc` is the only bundler now (Dockerfile builder
  stage already used it). Removed webpack toolchain, `start:prod`/`prod` scripts, and
  `webpack.config.ts` — all were Render-only leftovers.
- DECIDE #5 / REVIEW #3 — decide whether `prisma` (CLI) can move from `dependencies` to
  `devDependencies`. Depends on which image runs `npm run release`
  (`prisma migrate deploy`) in the EC2 pipeline — only safe if that step runs from an
  image that still has full `devDependencies`. Not yet decided: EC2 deploy pipeline
  (how `release` gets invoked — CI step, SSH command, ECS/EB task, etc.) isn't built yet.

## Project Roadmap
[Pulse Roadmap](https://www.notion.so/Pulse-Development-Timeline-3129e15469d28100be18df6e1ce0a984?source=copy_link)

## Code Style
Rules in `CORE_RULES.md`. Non-negotiable — follow exactly.

### Quick Checklist
Arrow functions | Single quotes | 4-space indent | PascalCase classes/types, camelCase everything else
Env vars via config exports only — never `process.env` | No commented-out code
MVC layers: controller → service → model → Prisma (never skip layers)

**Never:** `function` declarations | `interface` (except declaration merging/Express extension) | `console.log`
**Never:** Direct `process.env` access | Commented-out code | String literal object keys | Hardcoded values

## Testing
Integration tests (`npm run test:integration`) need Postgres on `localhost:5433` — not running by default. Start it with `docker-compose -f docker-compose.test.yml up -d` before running them locally. CI provisions its own Postgres service, so this is local-only.

## Git & Commits
**Read `GIT_RULES.md` before committing or when instructed to commit.** Do not skip it.
Full rules there. Key constraint: never invoke `/commit` skill on small fixes, formatting, or docs changes — use plain `git commit` for those.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

**`graphify` is not a bare PATH command in this environment.** The CLI is a Python package installed to a uv/pipx venv, not on PATH here. `graphify query ...` will fail with "command not found" if invoked directly — that failure is not a signal that the graph is unavailable, it just means the wrong invocation was used. Before concluding graphify isn't available, always try:

```bash
$(cat graphify-out/.graphify_python) -m graphify query "<question>"
```

`graphify-out/.graphify_python` holds the absolute path to the Python interpreter that has graphify installed (saved by the graphify skill itself). Same pattern for `path`/`explain`/`update`. Only fall back to inline NetworkX traversal of `graphify-out/graph.json` (see the graphify skill's `references/query.md`) if that invocation itself errors.

Rules:
- For codebase questions, first run the query above when graphify-out/graph.json exists. Use `path "<A>" "<B>"` for relationships and `explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- **Do not spawn an Explore/general-purpose subagent for a codebase question until graphify has been tried (with the correct invocation above) and either failed or come up short.** Spawning an agent to do raw file exploration when the graph could have answered directly wastes tokens for nothing — try graphify first, every time, no exceptions for "seems faster to just delegate."
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- `explain "<name>"` needs a bare node name with no file extension (e.g. `explain "forumRoute"`, not `explain "forumRoute.ts"`) — extension-qualified names reliably fail with "no node matching." `path "<A>" "<B>"` accepts either form fine.
- After modifying code, run `$(cat graphify-out/.graphify_python) -m graphify update .` to keep the graph current (AST-only, no API cost).