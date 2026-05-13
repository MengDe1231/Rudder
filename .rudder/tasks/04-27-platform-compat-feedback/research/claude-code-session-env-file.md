# Claude Code Session Env File

## Finding

Claude Code SessionStart hooks receive hook input with `session_id` and `transcript_path`, but later AI-run `Bash(...)` commands do not receive that hook stdin. A Rudder task start command therefore needs a session key through process environment.

Claude Code provides that bridge through `CLAUDE_ENV_FILE` on SessionStart. A hook can append shell exports to this file, and Claude Code makes those variables available to later Bash commands in the same session.

## Source

- Official Claude Code hooks reference: https://code.claude.com/docs/en/hooks
  - Section "Persist environment variables" documents `CLAUDE_ENV_FILE`.
  - It states that variables written there are available to subsequent Bash commands in the session.

## Rudder Implication

`shared-hooks/session-start.py` must:

1. Resolve the Rudder context key from hook input.
2. Continue passing `RUDDER_CONTEXT_ID` to subprocesses it launches.
3. Also append `export RUDDER_CONTEXT_ID=<context-key>` to `CLAUDE_ENV_FILE` when the variable exists.

This keeps active task state session-scoped while allowing Claude Code's normal AI-run Bash commands to run:

```bash
python3 ./.rudder/scripts/task.py start <task-dir>
python3 ./.rudder/scripts/task.py current
python3 ./.rudder/scripts/task.py finish
```

without manual environment setup by the user.

## Follow-up Finding: Codex Desktop

Current Codex Desktop shell environment exposes `CODEX_THREAD_ID`, not `CODEX_SESSION_ID`:

```text
CODEX_CI=1
CODEX_INTERNAL_ORIGINATOR_OVERRIDE=Codex Desktop
CODEX_SHELL=1
CODEX_THREAD_ID=<thread-id>
```

Rudder must treat `CODEX_THREAD_ID` as a Codex session identity source so plain AI-run shell commands can use session-scoped task state without manual `RUDDER_CONTEXT_ID`.

## Follow-up Finding: OpenCode

An actual `opencode run` shell test with Codex environment stripped shows OpenCode exposes:

```text
OPENCODE_PID=<pid>
OPENCODE_PROCESS_ROLE=main
OPENCODE_RUN_ID=<uuid>
```

It does not expose `OPENCODE_SESSION_ID` to the Bash tool. OpenCode plugin events still carry `sessionID`, so the Python resolver and JS `RudderContext` resolver must agree on the same context key. Rudder should prefer `OPENCODE_RUN_ID` when it exists, then fall back to plugin `sessionID`.

Observed OpenCode TUI 1.14.22 can still fail on a plain AI-run Bash command:

```bash
python3 ./.rudder/scripts/task.py start .rudder/tasks/<task>
```

with "Cannot set active task without a session identity." The model can manually invent `RUDDER_CONTEXT_ID=test-session-...`, but that creates an arbitrary runtime file unrelated to the real OpenCode session and should not be treated as a valid workflow.

The correct OpenCode fix is plugin-side propagation: in `tool.execute.before`, when `input.tool` is Bash and `output.args.command` does not already set `RUDDER_CONTEXT_ID`, prefix the command with a shell-aware assignment from `ctx.getContextKey(input)`. This uses `OPENCODE_RUN_ID` for hosts that expose it and falls back to the plugin `sessionID` for TUI sessions. POSIX shells use `export RUDDER_CONTEXT_ID=<context-key>;`. On Windows, OpenCode's Bash tool can run through PowerShell, so the prefix must be `$env:RUDDER_CONTEXT_ID = '<context-key>';`. The assignment must happen before the user command so compound commands keep the same identity after `&&`, `;`, or pipelines.

## Follow-up Finding: Cursor

Observed Cursor Agent can create a task with:

```bash
python3 ./.rudder/scripts/task.py create "..." --slug ...
```

but a following plain shell command fails:

```bash
python3 ./.rudder/scripts/task.py start .rudder/tasks/<task>
```

with "Cannot set active task without a session identity." The model can then invent `RUDDER_CONTEXT_ID=manual-test`, which succeeds technically but creates a fake runtime session disconnected from the Cursor conversation.

Follow-up user testing showed the SessionStart `env` assumption is wrong for current Cursor IDE behavior: a fresh Cursor chat still runs AI shell commands without `RUDDER_CONTEXT_ID`. The model can detect the failure and invent `RUDDER_CONTEXT_ID=manual-test`, but that is still a fake context disconnected from the Cursor conversation.

The correct Cursor bridge is `beforeShellExecution`, because Cursor passes the exact shell command plus `conversation_id` before the command runs. Rudder should:

1. Register `.cursor/hooks/inject-shell-session-context.py` under `beforeShellExecution`.
2. When the command contains `task.py start`, `task.py current`, or `task.py finish`, write a short-lived `.rudder/.runtime/cursor-shell/*.json` ticket with `context_key=cursor_<conversation_id>`, the command, cwd, and parsed `task.py` subcommands.
3. Let `task.py` consume that ticket only when no env identity exists, the current subcommand matches, and exactly one fresh context key matches.

This avoids a global current-task pointer while still letting plain Cursor AI-run shell commands work without the model manually inventing a context id.

## Follow-up Finding: Pi Agent

Pi Agent extension docs show:

- `tool_call` fires after tool execution starts but before the tool runs.
- `event.input` is mutable; changing `event.input.command` changes the Bash execution.
- Extension handlers receive `ctx.sessionManager`, whose read-only surface includes `getSessionId()` and `getSessionFile()`.

Observed Pi Agent behavior matches the other shell-bridge failures: the model can create a task directory, but plain Bash has no `RUDDER_CONTEXT_ID`. It can manually run:

```bash
RUDDER_CONTEXT_ID=pi-test-session python3 ./.rudder/scripts/task.py start <task>
```

but that creates an arbitrary runtime file unrelated to the real Pi session.

The correct Pi fix is extension-side propagation. The project-local
`.pi/extensions/rudder/index.ts` extension should:

1. Derive the context key from `ctx.sessionManager.getSessionId()` as `pi_<session-id>`.
2. In `tool_call`, when `event.toolName === "bash"` and the command does not already set `RUDDER_CONTEXT_ID`, mutate `event.input.command` to prefix `export RUDDER_CONTEXT_ID=<context-key>;`.
3. Pass the same `RUDDER_CONTEXT_ID` env var to spawned `pi --mode json -p --no-session` subagent processes.

This keeps Pi task state session-scoped without a global current-task pointer and without model-invented fake context ids.
