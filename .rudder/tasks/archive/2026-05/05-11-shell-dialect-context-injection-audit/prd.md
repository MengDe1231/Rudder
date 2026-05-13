# Audit shell dialect context injection

## Goal

Investigate issue #261 and audit adjacent Rudder context-injection paths for
the same class of bug: code that chooses shell assignment syntax from the host
OS instead of the actual shell that will execute the command.

## What I already know

- Issue #261 reports OpenCode on Windows Git Bash receiving a PowerShell
  prefix:
  `$env:RUDDER_CONTEXT_ID = '...'; git diff --name-only`.
- Git Bash then runs that command in `/usr/bin/bash` and fails with
  `:RUDDER_CONTEXT_ID: command not found`.
- The reported code path is
  `packages/cli/src/templates/opencode/plugins/inject-subagent-context.js`.
- The current implementation maps every `win32` host to PowerShell syntax.
- The user asked to check related places for the same class of problem and
  complete a research pass before implementation.

## Requirements

- Audit all Rudder paths that pass `RUDDER_CONTEXT_ID` into shell commands or
  subprocesses.
- Distinguish shell-syntax command mutation from safe process-environment
  forwarding.
- Identify which paths are confirmed affected, which are adjacent risks, and
  which are intentionally out of scope.
- Use external references for the Windows shell-dialect facts behind the
  recommendation.
- Record the research in task artifacts so a later implementation can proceed
  without relying on chat history.

## Acceptance Criteria

- [x] A research artifact maps the affected and adjacent code paths.
- [x] The report explains why `process.platform === "win32"` is insufficient
  for shell syntax selection.
- [x] The report separates OpenCode, Pi, Claude, Cursor, Codex, Copilot, and
  Python command selection behavior.
- [x] The report lists concrete files and tests to change if implementation
  proceeds.
- [x] Implementation, tests, and specs are updated in the execution phase.
- [x] No changelog is required for this task because it is not a release or
  migration-manifest change.

## Implementation Notes

- OpenCode now detects Windows POSIX shell signals before choosing the
  `RUDDER_CONTEXT_ID` command prefix.
- Windows with no POSIX-shell signal still uses PowerShell syntax.
- Windows Git Bash / MSYS2 indicators use POSIX `export` syntax.
- The explicit `env FOO=bar RUDDER_CONTEXT_ID=...` form is now covered by the
  duplicate-injection guard.
- The local `.opencode` plugin mirror was updated with the same behavior as
  the CLI template source.

## Out of Scope

- No release, commit, or issue closure in this pass.
- No broad rewrite of the session identity model.
- No Pi shell-dialect change without evidence that Pi's Windows Bash tool
  parses commands through PowerShell.

## Research References

- `research/shell-dialect-context-injection-audit.md`
