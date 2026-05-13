# bump default hook timeouts to survive Windows Python cold start

## Goal

Fix GitHub issue #267 — Claude on Windows silently drops SessionStart hook output because Python cold start + `session-start.py` (780 lines) + nested `subprocess` calls + git commands routinely exceed the current 10s timeout. Apply the bump consistently across all hook-based platforms (Rudder sets identical timeouts on all 7), so the cold-start cliff vanishes for everyone, not just Claude.

## Problem

User report (#267, Rudder 0.5.10, Windows):

- Default config → SessionStart hook doesn't auto-inject
- Manually raising the `timeout` value in `.claude/settings.json` → injection works

Rudder template hard-codes `"timeout": 10` for SessionStart and `"timeout": 5` for UserPromptSubmit across all hook-based platforms. These numbers are untouched since `efccf6f feat: add hooks + agents for 7 platforms`.

Claude Code's own protocol default is **60s**. Rudder actively tightens to 10s, presumably to surface hook failures fast. The cost: a hard cliff on slow Python cold-start environments (Windows + antivirus + monorepo git).

## Scope

7 template config files, hook-based platforms only. Pi is extension-based and out of scope. Codex has no SessionStart hook; only its UserPromptSubmit gets adjusted.

| Platform | File | Current SessionStart | Current UserPromptSubmit | Unit |
| -- | -- | -- | -- | -- |
| claude | `packages/cli/src/templates/claude/settings.json` | 10 (×3 matchers) | 5 | seconds |
| codebuddy | `packages/cli/src/templates/codebuddy/settings.json` | 10 (×3) | 5 | seconds |
| droid | `packages/cli/src/templates/droid/settings.json` | 10 (×3) | 5 | seconds |
| qoder | `packages/cli/src/templates/qoder/settings.json` | 10 (×3) | 5 | seconds |
| copilot | `packages/cli/src/templates/copilot/hooks.json` | 10 | 5 | seconds |
| cursor | `packages/cli/src/templates/cursor/hooks.json` | 10 | 5 | seconds |
| gemini | `packages/cli/src/templates/gemini/settings.json` | 10000 | 5000 | **milliseconds** ← do not forget ×1000 |
| codex | `packages/cli/src/templates/codex/hooks.json` | — | 5 | seconds |

## Decision

- **SessionStart**: 10 → **30** seconds (gemini: 30000 ms). Half of Claude Code's protocol default; comfortably covers Windows 5–15s observed cold-start range.
- **UserPromptSubmit**: 5 → **15** seconds (gemini: 15000 ms). 3× headroom for the per-turn breadcrumb hook.
- **PreToolUse**: unchanged at 30s. Already generous; not implicated in #267.

## Acceptance Criteria

- [ ] All 7 platform config templates updated; gemini correctly stays in ms with ×1000.
- [ ] No timeout left at the old 10/5 values for SessionStart/UserPromptSubmit anywhere in templates.
- [ ] Existing template tests (`test/templates/*.test.ts`) still pass; new test asserts default timeouts are ≥30 / ≥15 across all hook-based platforms (regression guard against future drift).
- [ ] `rudder init` on a fresh project writes the new defaults — verified by integration test `init.integration.test.ts`.
- [ ] No code changes to `shared-hooks/session-start.py` or related scripts (that's Option C scope, separate task).

## Out of Scope

- Optimizing `session-start.py` cold start (Option C) — separate task if/when needed.
- Windows-specific dynamic timeout per `process.platform` (Option B) — increases init complexity, not justified at this scale.
- Pi extension timeouts.
- Bumping PreToolUse 30s — already generous.

## Technical Notes

- Issue: https://github.com/MengDe1231/Rudder/issues/267
- Gemini CLI 0.40.x is the only hook-based platform that expects ms (per `inject-workflow-state.py` `_detect_platform` notes); see `.rudder/spec/cli/backend/platform-integration.md` for the per-platform hook protocol details.
- Existing tests touching settings.json hashing: `test/utils/template-hash.test.ts` will fail if hashes are pinned — verify and update fixtures if so.
- Related but distinct issues we should NOT touch in this task: #248 (Copilot SessionStart stdout ignored, needs prompt-layer fallback), #256 (OpenCode readability, fixed in 2abafba), #261 (Windows shell dialect, fixed in bbdd0f0), #264 (OpenCode subagent context, fixed in 2abafba).
