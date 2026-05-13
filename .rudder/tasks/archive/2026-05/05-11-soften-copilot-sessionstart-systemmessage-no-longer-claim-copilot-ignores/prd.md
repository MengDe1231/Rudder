# soften copilot SessionStart systemMessage — no longer claim "Copilot ignores"

## Goal

Address GitHub issue #248 by removing/softening the misleading `systemMessage` that Rudder's own Copilot SessionStart hook emits to the user. The current message states Copilot ignores SessionStart hook output as if it were a permanent fact, but Microsoft's official Copilot agent hooks documentation (updated 2026-05-06) now documents `SessionStart.hookSpecificOutput.additionalContext` as a working injection mechanism.

## Problem

`packages/cli/src/templates/copilot/hooks/session-start.py` lines 411-418 emit:

```python
"systemMessage": (
    f"Rudder SessionStart diagnostics emitted ({len(context)} chars); "
    "Copilot currently ignores sessionStart hook output."
),
```

`systemMessage` is rendered by VS Code Copilot as a user-visible diagnostic. Issue #248 is essentially a user pasting this exact string back as a bug report — they have no way to know it is Rudder's own hardcoded text, not a Copilot error.

The accompanying docstring at the top of the same file claims:

> GitHub Copilot's documented SessionStart behavior ignores hook output, so this script must not be treated as proof that model-visible context was injected.

This claim is **out of date**:

- [Microsoft VS Code Agent hooks documentation](https://code.visualstudio.com/docs/copilot/customization/hooks) (last updated 2026-05-06) documents 8 lifecycle hooks including `SessionStart`, and explicitly states the `hookSpecificOutput.additionalContext` field "can inject additional context into the agent's conversation."
- Hooks shipped in VS Code 1.110 (February 2026); still labeled `(Preview)` but documented as functional.
- Rudder's hook JSON shape already matches the Microsoft spec, so when consumed, the existing emission already works.

## Scope

Out of scope:
- Verifying end-to-end that Copilot actually consumes `additionalContext` (blocked locally — testing requires a Copilot subscription on the test account).
- Reclassifying Copilot from class-2 (pull-based) to class-1 (hook-driven) in configurators. That is a separate, larger task contingent on the verification above.
- Modifying SubagentStart / sub-agent context delivery for Copilot.

In scope:
- Remove the `Copilot currently ignores sessionStart hook output.` claim from the runtime `systemMessage`.
- Update the file-level docstring to reflect the current Microsoft documentation status (preview, but documented).
- Keep the hook JSON shape unchanged — it already matches the Microsoft spec.

## Decision

**Remove `systemMessage` entirely.** A neutral approach is preferable to any text:

- If Copilot consumes `additionalContext` → the user sees nothing extra (clean UX).
- If Copilot does not yet consume → silence is still safer than a misleading absolute claim ("currently ignores"). Hook diagnostics belong in logs (`/tmp/rudder-plugin-debug.log`-equivalent), not in a user-facing systemMessage.

Alternative considered: replace text with a neutral diagnostic such as `"Rudder SessionStart hook emitted N chars of additionalContext."` Rejected because it still leaks implementation detail without giving the user actionable information.

## Acceptance Criteria

- [ ] `packages/cli/src/templates/copilot/hooks/session-start.py` no longer emits `systemMessage` referencing "currently ignores" / Copilot ignoring hook output.
- [ ] The file-level docstring is updated to reference Microsoft's Agent hooks documentation status (preview, documented since VS Code 1.110, 2026-02) rather than asserting Copilot ignores hook output as a permanent fact.
- [ ] The hook output JSON still produces `hookSpecificOutput.hookEventName == "SessionStart"` and `hookSpecificOutput.additionalContext` (the actual injection path) unchanged.
- [ ] Existing tests for the Copilot session-start hook still pass (`packages/cli/test/templates/copilot.test.ts` and any session-start integration tests).
- [ ] If any existing test pins the `systemMessage` text, it is updated.
- [ ] Spec `.rudder/spec/cli/backend/platform-integration.md` Copilot section is updated to note Microsoft hooks are documented (preview) so future readers know not to re-introduce the pessimistic claim.

## Out of Scope (separate follow-ups, do not bundle)

- End-to-end verification of `additionalContext` consumption — requires a Copilot subscription. Tracked as a separate item only after this task lands; not blocking this task.
- Migrating Copilot from class-2 (`pull-based prelude`) to class-1 in `configurators/copilot.ts` for sub-agents. Larger refactor.
- Adding `SubagentStart` / `SubagentStop` hooks for Copilot.
- Touching any other platform's hook scripts.

## Technical Notes

- Source file: `packages/cli/src/templates/copilot/hooks/session-start.py` (lines 4-9 docstring; lines 411-418 result dict)
- Related (do not touch in this task): `packages/cli/src/configurators/copilot.ts` "Copilot is a class-2 (pull-based) platform" comment
- Microsoft hooks docs: https://code.visualstudio.com/docs/copilot/customization/hooks
- VS Code 1.110 changelog (Feb 2026): https://github.blog/changelog/2026-03-06-github-copilot-in-visual-studio-code-v1-110-february-release/
- Related Rudder spec: `.rudder/spec/cli/backend/platform-integration.md` (Copilot section)
