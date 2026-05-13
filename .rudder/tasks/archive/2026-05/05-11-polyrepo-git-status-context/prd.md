# fix polyrepo git status context

## Goal

Fix issue #252: when the Rudder project root is not a Git repository but child package directories are independent Git repositories, SessionStart / `get_context.py` must not inject misleading root Git status. It must guide the AI to run Git commands in the actual package repositories and include those repositories' status.

## Problem

Current session context always runs root-level Git commands first:

- `git branch --show-current`
- `git status --porcelain`
- `git log --oneline -5`

When the Rudder root has no `.git`, those commands fail internally and produce context like `Branch: unknown`, `Working directory: Clean`, and `(no commits)`. The package-specific Git sections may appear later, but the first Git section still implies the root is the working repository. This can lead agents into repeated root-level `git status` loops with `fatal: not a git repository`.

## Requirements

- Detect whether the Rudder root is inside a Git worktree before rendering root Git status.
- If the root is a Git repository, preserve existing root Git status and recent commits output.
- If the root is not a Git repository:
  - Do not render `Branch: unknown`, `Working directory: Clean`, or `(no commits)` for the root.
  - Render an explicit note that the root is not a Git repository.
  - Tell the AI to run Git commands from the listed package repository paths.
- Continue to support packages marked with `git: true` in `.rudder/config.yaml`.
- Add a runtime fallback scan for child `.git` repositories when no `git: true` packages are configured, using the same bounded polyrepo assumptions as init: immediate children and grandchildren, ignore hidden/vendor/build directories, accept `.git` as a directory or file.
- Apply the change to both the dogfooded `.rudder/scripts/` copy and the packaged template under `packages/cli/src/templates/rudder/scripts/`.
- Cover the bug with regression tests.
- Update relevant CLI backend specs so the root-non-git context behavior is documented.

## Acceptance Criteria

- [ ] `get_context.py` text output for a root without `.git` no longer says the root branch is `unknown` or the root working directory is `Clean`.
- [ ] `get_context.py` text output for configured `git: true` packages includes package Git status and recent commits.
- [ ] `get_context.py` text output for unconfigured child repositories includes discovered package repository status when multiple child repos are found.
- [ ] JSON context represents root non-Git state without pretending the root is clean.
- [ ] Record mode follows the same root/non-root Git behavior as default mode.
- [ ] Regression tests fail on the old behavior and pass on the new behavior.
- [ ] Specs describe the runtime contract.

## Out of Scope

- Changing `rudder init` polyrepo detection semantics.
- Adding a new persistent metadata field to `task.json` or config files.
- Deep recursive repository scans beyond the existing two-level polyrepo heuristic.
- Automatically rewriting existing user `config.yaml` files.

## Technical Notes

- Issue: https://github.com/MengDe1231/Rudder/issues/252
- Main runtime file: `packages/cli/src/templates/rudder/scripts/common/session_context.py`
- Dogfooded copy: `.rudder/scripts/common/session_context.py`
- Existing config reader: `get_git_packages()` in `common/config.py`
- Existing init detector: `parsePolyrepo()` in `packages/cli/src/utils/project-detector.ts`
- Relevant specs:
  - `.rudder/spec/cli/backend/script-conventions.md`
  - `.rudder/spec/cli/backend/directory-structure.md`
  - `.rudder/spec/cli/unit-test/conventions.md`

