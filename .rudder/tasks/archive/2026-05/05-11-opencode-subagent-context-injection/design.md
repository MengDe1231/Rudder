# Technical Design

## Current Flow

OpenCode currently has three plugin paths:

- `inject-subagent-context.js`
  - fires on `tool.execute.before`
  - handles Task tool calls
  - mutates `output.args.prompt`
- `session-start.js`
  - fires on `chat.message`
  - injects full SessionStart context once per session
- `inject-workflow-state.js`
  - fires on every `chat.message`
  - injects per-turn `<workflow-state>`

Issue #264 shows that OpenCode sub-agent turns also pass through the two `chat.message` plugins with `input.agent = rudder-implement/check`. Those plugins currently do not distinguish main-session chat messages from Rudder sub-agent chat messages.

## Root Causes

OpenCode's `tool.execute.before` `input.sessionID` is **always present** (required by the plugin type — verified in `packages/plugin/src/index.ts`). The miss in #264 is not a missing session id but a missing `.rudder/.runtime/sessions/opencode_<sessionID>.json` file at lookup time. See `research/sessionid-resolution-trace.md` for the full trace.

1. **JS task-state lookup miss.** `inject-subagent-context.js` → `ctx.getCurrentTask(input)` → builds `opencode_<sessionID>` and reads the runtime file. The file is absent in two real-world scenarios:
   - **Scenario A**: User runs `task.py start` from a terminal outside OpenCode. That shell has no `OPENCODE_SESSION_ID` / `OPENCODE_RUN_ID` → Python `resolve_context_key()` returns None → no file written.
   - **Scenario C**: User started the task in OpenCode session X; opens new OpenCode window Y; dispatches a subagent from Y. File exists for X but JS in Y looks up Y's key.
   - **Scenario B** (TUI-internal Bash-tool start) is the happy path: `injectRudderContextIntoBash` exports `RUDDER_CONTEXT_ID=opencode_<sessionID>` → Python treats it as a raw context-key override (no double wrapping per `active_task.py:380-391`) → writes the matching file. No bug.
2. `RudderContext.getActiveTask()` lacks Python's `_resolve_single_session_fallback()` (`active_task.py:497-519`), so even when the user has only one OpenCode session active locally, JS still misses.
3. `inject-subagent-context.js` does not parse an `Active task: <path>` hint from `args.prompt`, leaving no explicit per-dispatch override.
4. `buildPrompt()` does not include `<!-- rudder-hook-injected -->`, while OpenCode agent definitions in `.opencode/agents/*.md` check for that marker (Rudder-internal contract, OpenCode itself is unaware).
5. `session-start.js` and `inject-workflow-state.js` log `input.agent` but do not filter on it. Reproduced locally: subagent dispatch causes a 38642-byte main-session SessionStart to be injected into the subagent's `chat.message` (`research/sessionid-resolution-trace.md` repro logs).

## Target Flow

### Task Tool Prompt Mutation

For OpenCode Task tool calls:

1. Normalize `subagent_type` by stripping the `rudder-` prefix.
2. If the sub-agent is unsupported, do nothing.
3. Resolve the task in this order (later steps only run if earlier ones miss):
   - `ctx.getCurrentTask(input)` — normal session runtime lookup
   - **`Active task: <path>` line from `args.prompt`** — explicit per-dispatch hint, beats fallback inference so multi-window users can disambiguate
   - JS single-session fallback inside `ctx.getActiveTask()` — only when exactly 1 session file exists in the runtime, mirrors Python's `_resolve_single_session_fallback()`; refuses to guess when 0 or ≥2 files exist
4. Resolve the task directory with `ctx.resolveTaskDir(taskRef)`.
5. Read `prd.md` and JSONL context from that resolved directory.
6. Mutate `args.prompt` in place.
7. Include `<!-- rudder-hook-injected -->` at the top of the new prompt.

### Chat Message Plugins

For OpenCode `chat.message` plugins:

- If `input.agent` is one of `rudder-implement`, `rudder-check`, or `rudder-research`, return without mutating `output.parts`.
- Main session behavior is unchanged.

## Compatibility

- Existing Bash command context-prefix behavior remains unchanged.
- Existing main-session SessionStart injection remains unchanged.
- Existing workflow-state injection remains unchanged for main-session turns.
- Prompt-based task fallback is additive; it does not replace session runtime resolution.
- Single-session fallback mirrors Python behavior and refuses to guess when zero or multiple session files exist.

## Scope

OpenCode-only. Other platforms (Claude, Codex, Cursor, Copilot, Gemini, Qoder, CodeBuddy, Droid) are architecturally immune:

- They use **shell-invoked hooks** (not in-process plugins) and Python `resolve_context_key()` already has `_resolve_single_session_fallback()` for class-2 platforms.
- Their subagent / Task tool dispatch does not fire a per-message hook inside a child session — Claude's `PreToolUse(Task/Agent)` runs in the parent session only; subagents inherit the mutated prompt without re-firing `SessionStart`. Class-2 platforms have no true child-session model.

This task does not touch any non-OpenCode template.

## Tests

Add tests in `packages/cli/test/templates/opencode.test.ts`:

- `tool.execute.before` mutates implement prompt using single-session fallback.
- `tool.execute.before` mutates check prompt using `Active task:` fallback.
- `Active task:` hint takes precedence over single-session fallback when both could apply.
- Injected prompt includes `<!-- rudder-hook-injected -->`.
- `session-start` early-returns when `input.agent` ∈ {`rudder-implement`, `rudder-check`, `rudder-research`} — verify `output.parts` is unchanged.
- `inject-workflow-state` early-returns on the same agent set.
- Main-session `chat.message` (no `input.agent` or `agent: "build"`) still gets full SessionStart + workflow-state injection (regression guard).

