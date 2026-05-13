# Implementation Plan

## Steps

- [x] Add shared helpers to `session_context.py`:
  - `_is_git_worktree(path)`
  - `_parse_recent_commits(output)`
  - `_collect_root_git_info(repo_root)`
  - `_discover_child_git_repos(repo_root)`
  - `_collect_git_repo_info(...)`
- [x] Change package collection to use the shared collector and support fallback discovered repositories.
- [x] Change default JSON and record JSON to use `_collect_root_git_info()`.
- [x] Change default text and record text rendering to avoid misleading root Git output when `isRepo` is false.
- [x] Sync `.rudder/scripts/common/session_context.py` and `packages/cli/src/templates/rudder/scripts/common/session_context.py`.
- [x] Add regression tests for:
  - root non-Git + configured `git: true` package
  - root non-Git + unconfigured multiple child repositories
  - JSON root non-Git state
- [x] Update backend specs for the session-context root/non-root Git contract.
- [x] Run targeted tests, lint, and typecheck as appropriate.

## Validation Commands

```bash
pnpm test packages/cli/test/regression.test.ts -- --runInBand
pnpm lint
pnpm typecheck
```

If the exact Vitest invocation is not accepted by the project runner, use the closest package-script-supported targeted test command and then run the full relevant checks.

## Verification Results

- `pnpm --filter @mengde1231/rudder test -- test/regression.test.ts`
- `pnpm --filter @mengde1231/rudder test -- test/regression.test.ts -t "issue #252"`
- `pnpm --filter @mengde1231/rudder lint`
- `pnpm --filter @mengde1231/rudder typecheck`
- `python3 -m py_compile .rudder/scripts/common/session_context.py packages/cli/src/templates/rudder/scripts/common/session_context.py`
- `python3 ./.rudder/scripts/task.py validate 05-11-polyrepo-git-status-context`

## Rollback

Revert changes to:

- `.rudder/scripts/common/session_context.py`
- `packages/cli/src/templates/rudder/scripts/common/session_context.py`
- `packages/cli/test/regression.test.ts`
- `.rudder/spec/cli/backend/script-conventions.md`
- `.rudder/spec/cli/backend/directory-structure.md`

No persistent user schema or migration rollback is required.
