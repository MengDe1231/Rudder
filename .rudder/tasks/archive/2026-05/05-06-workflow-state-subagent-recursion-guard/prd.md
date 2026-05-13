# Fix workflow-state sub-agent recursion guard

## Goal

Prevent Rudder per-turn workflow-state breadcrumbs from causing sub-agents to recursively dispatch Rudder sub-agents. The immediate bug is GitHub issue #237: Codex `rudder-implement` sub-agents can receive the same `in_progress` breadcrumb as the main session, interpret the "dispatch rudder-implement / rudder-check" rule as applying to themselves, and spawn nested agents instead of implementing directly.

## What I already know

- Issue #237 reports Codex sub-agent nesting after upgrading to 0.5.3.
- Codex `UserPromptSubmit` / SessionStart hooks do not expose a stable main-vs-sub-agent identity field today, so the workflow-state hook cannot reliably filter sub-agents at runtime.
- Rudder installs `inject-workflow-state.py` or equivalent per-turn workflow-state injection on most hook-capable platforms. Kiro is the notable exception for this path.
- The workflow-state hook is parser-only: it reads `[workflow-state:STATUS]` blocks from `.rudder/workflow.md` and injects the body verbatim.
- Current `workflow-state-contract.md` says breadcrumbs are only visible to the main AI session. That is too strong given Codex evidence and other platforms' per-agent hook semantics.
- Existing Codex agent templates already have a prompt-level recursion guard in `packages/cli/src/templates/codex/agents/rudder-{implement,check}.toml`, but the per-turn breadcrumb still needs to be safe when injected into sub-agent context.

## Assumptions

- The most robust immediate fix is prompt-contract hardening: make the `in_progress` breadcrumb explicitly distinguish main-session duties from sub-agent duties.
- We should not add heuristic sub-agent detection to `inject-workflow-state.py` because available hook payload fields are not stable identity signals.
- Existing users should receive the updated workflow-state block via `rudder update` managed-block replacement.

## Requirements

- Update `.rudder/workflow.md` and the packaged workflow template so `[workflow-state:in_progress]` is safe if read by a sub-agent.
- Update the Phase 2 workflow text that instructs the main session to spawn implement/check agents so it also requires a dispatch-prompt guard.
- The updated block must preserve existing Phase 2 / Phase 3 requirements:
  - main session dispatches `rudder-implement` / `rudder-check`;
  - class-2 dispatch prompts start with `Active task: ...`;
  - Phase 3.4 commit remains required before `/rudder:finish-work`;
  - inline override remains per-turn and explicit.
- The updated block must explicitly say that if the reader is already a `rudder-implement` or `rudder-check` sub-agent, it should implement/check directly and must not spawn another same-kind Rudder sub-agent.
- Implement/check agent definitions must explicitly say they are already the dispatched sub-agent and must not recursively spawn implement/check agents.
- Update the workflow-state contract spec to reflect the real risk: breadcrumbs are intended for main sessions, but some host platforms may inject per-turn breadcrumbs into sub-agent turns; therefore breadcrumb text must be sub-agent-safe.
- Add or update regression tests so future edits cannot remove the sub-agent self-exemption from the packaged workflow template.

## Acceptance Criteria

- [ ] Packaged `workflow.md` `[workflow-state:in_progress]` contains a clear sub-agent self-exemption.
- [ ] Local `.rudder/workflow.md` matches the packaged workflow-state behavior.
- [ ] `workflow-state-contract.md` no longer claims sub-agents categorically cannot see breadcrumbs.
- [ ] Tests cover the `in_progress` breadcrumb self-exemption and existing commit / Active task invariants still pass.
- [ ] Relevant lint/typecheck/test commands pass.

## Definition of Done

- [ ] Implementation completed through `rudder-implement`.
- [ ] Review/self-fix completed through `rudder-check`.
- [ ] Spec update reviewed.
- [ ] Work changes are ready for a normal Rudder Phase 3.4 commit plan.

## Out of Scope

- Implementing heuristic main/sub-agent detection inside hooks.
- Waiting for upstream Codex hook payload changes.
- Changing sub-agent spawn depth, wait behavior, or lifecycle propagation.
- Fixing unrelated local `.codex/agents/*` dogfood files unless required by generated template sync.
- Reworking the overall Rudder workflow phase model.

## Technical Notes

- GitHub issue: https://github.com/MengDe1231/Rudder/issues/237
- Relevant source files:
  - `.rudder/workflow.md`
  - `packages/cli/src/templates/rudder/workflow.md`
  - `.rudder/spec/cli/backend/workflow-state-contract.md`
  - `packages/cli/test/templates/rudder.test.ts`
  - `packages/cli/test/regression.test.ts`
- Existing related tests:
  - `packages/cli/test/templates/rudder.test.ts` checks class-2 `Active task:` protocol.
  - `packages/cli/test/regression.test.ts` checks commit and workflow-state parser invariants.
