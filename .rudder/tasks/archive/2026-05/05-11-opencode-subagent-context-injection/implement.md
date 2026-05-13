# Implementation Plan

## Steps

- [ ] Add OpenCode sub-agent detection helper for `input.agent`.
- [ ] Make `session-start.js` skip `rudder-implement`, `rudder-check`, and `rudder-research`.
- [ ] Make `inject-workflow-state.js` skip the same Rudder sub-agents.
- [ ] Add JS single-session fallback to `RudderContext.getActiveTask()`.
- [ ] Add `Active task: <path>` prompt fallback to `inject-subagent-context.js`.
- [ ] Make sub-agent context readers resolve task paths through `ctx.resolveTaskDir()`.
- [ ] Add `<!-- rudder-hook-injected -->` marker to OpenCode injected sub-agent prompts.
- [ ] Add OpenCode regression tests.
- [ ] Update `.rudder/spec/cli/backend/platform-integration.md`.
- [ ] Run targeted tests, lint, and typecheck.

## Validation Commands

```bash
pnpm --filter @mengde1231/rudder test -- test/templates/opencode.test.ts
pnpm --filter @mengde1231/rudder lint
pnpm --filter @mengde1231/rudder typecheck
```

## Rollback

Revert changes to:

- `packages/cli/src/templates/opencode/plugins/inject-subagent-context.js`
- `packages/cli/src/templates/opencode/plugins/session-start.js`
- `packages/cli/src/templates/opencode/plugins/inject-workflow-state.js`
- `packages/cli/src/templates/opencode/lib/rudder-context.js`
- `packages/cli/test/templates/opencode.test.ts`
- `.rudder/spec/cli/backend/platform-integration.md`

