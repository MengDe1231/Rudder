# Issue 264 Context

## Source

GitHub issue #264: "OpenCode平台, 调用subagent沒有注入context"

Reported version: Rudder `0.6.0-beta.8`, Linux.

## User-Visible Logs

```text
[inject] Task tool called, subagent_type: rudder-implement
[inject] Skipping - no current task
[workflow-state] Injected breadcrumb for task none status no_task
[session] chat.message called, sessionID: ... agent: rudder-implement
[session] Injected context into chat.message text part
```

Same pattern occurs for `rudder-check`.

## Local Code Findings

- `inject-subagent-context.js` already handles Task tool prompt mutation, but only uses `ctx.getCurrentTask(input)`.
- `RudderContext.getActiveTask()` only resolves an exact context key and lacks Python's single-session fallback.
- OpenCode agent definitions expect `<!-- rudder-hook-injected -->`, but `buildPrompt()` does not emit that marker.
- `session-start.js` and `inject-workflow-state.js` do not skip Rudder sub-agent turns even though OpenCode exposes `input.agent`.

## Design Implication

The fix should address both sides:

- Make sub-agent prompt mutation more resilient.
- Prevent generic chat-message injection from running inside Rudder sub-agent turns.

