# fix OpenCode subagent context injection

## Goal

Fix GitHub issue #264: OpenCode `rudder-implement` / `rudder-check` sub-agents must receive task-specific Rudder context, and OpenCode must not inject normal SessionStart / workflow-state context into those sub-agent turns.

## Problem

User report from OpenCode 0.6.0-beta.8 shows (reproduced locally — see `research/sessionid-resolution-trace.md`):

```text
[inject] Task tool called, subagent_type: rudder-implement
[inject] Skipping - no current task
[workflow-state] Injected breadcrumb for task none status no_task
[session] chat.message called ... agent: rudder-implement
[session] Injected context into chat.message text part
```

There are **two independent bugs** stacked:

1. **Task-state lookup miss.** `tool.execute.before` for the Task tool gets `input.sessionID` (it is a required field per OpenCode plugin types), but `.rudder/.runtime/sessions/opencode_<sessionID>.json` is missing. This happens when the user starts the task from a terminal outside OpenCode (no `OPENCODE_*` env exported → Python writer returns None) or across separate OpenCode sessions/windows. JS lacks Python's single-session fallback and ignores any explicit `Active task:` hint in the dispatch prompt.

2. **Subagent chat.message pollution.** When OpenCode dispatches a subagent via the Task tool, the child session runs its own `chat.message` event with `input.agent = "rudder-implement"` (or `rudder-check` / `rudder-research`). `session-start.js` and `inject-workflow-state.js` read `input.agent` only for logging — they do not filter on it, so they inject the full main-session SessionStart (~38KB in our repro) and a generic `workflow-state` breadcrumb into the subagent's prompt, drowning the parent's intended context injection.

## Requirements

- OpenCode `tool.execute.before` must inject sub-agent context for `rudder-implement` and `rudder-check` when a current task can be discovered.
- Current task discovery must work when the Task tool event lacks a usable session id:
  - Prefer normal session runtime resolution when available.
  - Support the existing single-session fallback used by Python active-task resolution.
  - Support an `Active task: <path>` line in the dispatch prompt as an explicit fallback.
- Injected prompts must include the `<!-- rudder-hook-injected -->` marker because generated OpenCode agent definitions look for it.
- OpenCode `session-start` and `workflow-state` chat-message plugins must skip Rudder sub-agent turns (`rudder-implement`, `rudder-check`, `rudder-research`) so generic session context does not overwrite or duplicate sub-agent context.
- Keep behavior for the main OpenCode session unchanged.
- Add regression tests for prompt mutation, fallback task discovery, marker presence, and sub-agent chat-message skip behavior.
- Update platform integration spec if the OpenCode injection contract changes.

## Acceptance Criteria

- [ ] A `rudder-implement` Task tool call with only one session runtime file gets a prompt containing `<!-- rudder-hook-injected -->`, `prd.md`, and JSONL-referenced context.
- [ ] A `rudder-check` Task tool call can resolve the task from `Active task: <path>` in the prompt when runtime session resolution fails. `Active task:` hint takes precedence over the single-session fallback (multi-window safety).
- [ ] OpenCode `session-start` plugin returns early when `input.agent` matches `rudder-implement` / `rudder-check` / `rudder-research`.
- [ ] OpenCode `inject-workflow-state` plugin returns early on the same agent set.
- [ ] Reproduction logs in `research/sessionid-resolution-trace.md` no longer appear after the fix: no `Skipping - no current task` for the case where a single session file exists or `Active task:` is in the prompt; no `chat.message ... agent: rudder-implement` followed by a 38KB SessionStart injection.
- [ ] Existing main-session SessionStart, workflow-state, and Bash `RUDDER_CONTEXT_ID` behavior remains covered.

## Out of Scope

- Changing OpenCode's external API or plugin registration mechanism.
- Moving OpenCode from class-1 hook-inject to class-2 pull-based behavior.
- Reworking non-OpenCode platforms.
- Closing #264 on GitHub before changes are pushed/released.

## Technical Notes

- Issue: https://github.com/MengDe1231/Rudder/issues/264
- Main files:
  - `packages/cli/src/templates/opencode/plugins/inject-subagent-context.js`
  - `packages/cli/src/templates/opencode/plugins/session-start.js`
  - `packages/cli/src/templates/opencode/plugins/inject-workflow-state.js`
  - `packages/cli/src/templates/opencode/lib/rudder-context.js`
  - `packages/cli/test/templates/opencode.test.ts`
- Relevant spec: `.rudder/spec/cli/backend/platform-integration.md`

