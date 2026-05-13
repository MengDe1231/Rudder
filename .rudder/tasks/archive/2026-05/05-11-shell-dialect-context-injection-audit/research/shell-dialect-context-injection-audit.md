# Shell dialect context injection audit

## Executive summary

Issue #261 is a real bug in OpenCode's Bash tool context bridge. The bug is not
"Windows support" in general; it is specifically a shell-dialect detection bug.
The current OpenCode plugin chooses the `RUDDER_CONTEXT_ID` assignment syntax
from `process.platform`. That collapses at least two Windows execution shells
into one branch:

- PowerShell needs `$env:RUDDER_CONTEXT_ID = 'value'; command`.
- POSIX-like shells on Windows, including Git Bash / MSYS2, need
  `export RUDDER_CONTEXT_ID='value'; command`.

The confirmed affected runtime path is OpenCode's JS plugin command mutation.
Pi has an adjacent watchlist risk because it also mutates Bash command text, but
the current code always emits POSIX syntax and does not have the exact #261
failure mode unless Pi's Windows Bash surface can run through PowerShell.
Claude, Cursor, Codex, Copilot, and Python command selection do not currently
show the same bug pattern.

Issue link: https://github.com/MengDe1231/Rudder/issues/261

## External facts

- Node.js `process.platform` reports the operating system platform, such as
  `win32`, `darwin`, or `linux`. It does not identify whether a command string
  will be interpreted by PowerShell, Bash, cmd.exe, or another shell.
  Source: https://nodejs.org/docs/latest/api/process.html#processplatform
- PowerShell environment variables are accessed and assigned through the
  environment provider syntax, for example `$Env:Path` and assignments through
  `$Env:<name>`.
  Source: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables
- Git for Windows launches a Bash/MSYS environment on Windows rather than a
  native PowerShell shell, and its wrapper configures the environment before
  launching Git Bash.
  Source: https://gitforwindows.org/git-wrapper.html
- MSYS2 uses `MSYSTEM` to select the active environment, with values such as
  `MINGW64`, `UCRT64`, and `CLANG64`.
  Source: https://www.msys2.org/docs/environments/
- OpenCode documents `OPENCODE_GIT_BASH_PATH` for the Windows Git Bash path.
  That means OpenCode can have a Windows host and a Git Bash execution layer.
  Source: https://opencode.ai/docs/cli/

## Affected path: OpenCode Bash command prefix

Files:

- `packages/cli/src/templates/opencode/plugins/inject-subagent-context.js`
- `packages/cli/test/templates/opencode.test.ts`
- `.rudder/spec/guides/cross-platform-thinking-guide.md`
- `packages/cli/src/templates/markdown/spec/guides/cross-platform-thinking-guide.md.txt`
- `.rudder/spec/cli/backend/script-conventions.md`
- `.rudder/spec/cli/backend/platform-integration.md`

Current behavior:

```js
function buildRudderContextPrefix(contextKey, hostPlatform = process.platform) {
  if (hostPlatform === "win32") {
    return `$env:RUDDER_CONTEXT_ID = ${powershellQuote(contextKey)}; `
  }

  return `export RUDDER_CONTEXT_ID=${shellQuote(contextKey)}; `
}
```

Why it fails:

- `hostPlatform === "win32"` tells us the process is running on Windows.
- It does not tell us that OpenCode's Bash tool command will be parsed by
  PowerShell.
- In issue #261, the command is parsed by Git Bash, so the PowerShell prefix is
  invalid shell syntax.

Recommended implementation:

- Keep PowerShell as the Windows default when there is no POSIX-shell signal.
- Add shell-dialect detection for Windows command prefixing.
- Treat the following as POSIX-shell signals:
  - `MSYSTEM` is set.
  - `MINGW_PREFIX` is set.
  - `OSTYPE` contains `msys`, `mingw`, or `cygwin`.
  - `SHELL` basename is `bash`, `sh`, or `zsh`.
  - `OPENCODE_GIT_BASH_PATH` is set.
- Pass an injectable env object into the plugin factory for unit tests.
- Keep duplicate-injection detection shell-aware for all supported forms:
  `RUDDER_CONTEXT_ID=...`, `export RUDDER_CONTEXT_ID=...`,
  `env RUDDER_CONTEXT_ID=...`, and `$env:RUDDER_CONTEXT_ID = ...`.

Regression tests to add:

- `win32` without shell env still emits PowerShell syntax.
- `win32` plus `MSYSTEM=MINGW64` emits POSIX `export`.
- `win32` plus `OSTYPE=msys` emits POSIX `export`.
- `win32` plus `SHELL=/usr/bin/bash` emits POSIX `export`.
- `win32` plus `OPENCODE_GIT_BASH_PATH=...` emits POSIX `export`.
- Existing explicit assignment dedupe tests still pass for both syntax families.

Spec updates needed:

- The cross-platform guide currently says Windows Bash surfaces may execute
  through PowerShell and shows `process.platform === "win32"` as the "good"
  shell-aware branch. That example should be revised because it is now the
  exact class of bug reported in #261.
- Backend `script-conventions.md` and `platform-integration.md` already state
  that OpenCode needs a shell-aware prefix, but they do not define how to choose
  the shell on Windows. Add the dialect detection contract there.

## Adjacent watchlist: Pi Bash tool mutation

Files:

- `packages/cli/src/templates/pi/extensions/rudder/index.ts.txt`
- `packages/cli/test/templates/pi.test.ts`
- `packages/cli/test/configurators/platforms.test.ts`
- `.rudder/spec/cli/backend/platform-integration.md`

Current behavior:

```ts
toolCall.input.command = `export RUDDER_CONTEXT_ID=${shellQuote(contextKey)}; ${rawCommand}`;
```

Classification:

- Adjacent risk, not confirmed affected.
- Pi mutates a Bash tool command string and always emits POSIX syntax.
- This is correct if Pi's `tool_call` named `"bash"` is always executed by a
  POSIX shell.
- It would fail in the opposite direction if a Windows Pi Bash surface actually
  routes through PowerShell.

Recommended handling:

- Do not change Pi in the #261 fix unless there is evidence that Pi's Windows
  command parser is PowerShell.
- Add a spec note that any future Pi shell-dialect support must use the same
  dialect abstraction instead of copying OpenCode-specific env heuristics.

## Not the same class: Claude SessionStart env-file bridge

Files:

- `packages/cli/src/templates/shared-hooks/session-start.py`
- `.rudder/spec/cli/backend/script-conventions.md`
- `.rudder/spec/cli/backend/platform-integration.md`

Current behavior:

```py
handle.write(f"export RUDDER_CONTEXT_ID={shlex.quote(context_key)}\n")
```

Classification:

- Not the same bug class.
- This writes to `CLAUDE_ENV_FILE`, a Claude Code env-file bridge, not to an
  arbitrary user command string.
- It does not branch on `process.platform` or mutate a command that Git Bash may
  parse.
- If Claude Code ever documents a PowerShell-specific env-file format, that
  would be a separate Claude contract change.

## Not the same class: Cursor shell ticket bridge

Files:

- `packages/cli/src/templates/shared-hooks/inject-shell-session-context.py`
- `packages/cli/src/templates/cursor/hooks.json`
- `packages/cli/test/templates/shared-hooks.test.ts`

Classification:

- Not affected by #261.
- Cursor does not prefix user command text with `export` or `$env:`.
- It writes a short-lived runtime ticket for matching `task.py` commands and
  lets the Python active-task resolver consume that ticket.
- The command parsing uses `shlex.split(command, posix=os.name != "nt")`, which
  is a separate Windows command-parsing concern, not the shell assignment
  syntax bug reported in #261.

## Not the same class: Codex and Copilot SessionStart hooks

Files:

- `packages/cli/src/templates/codex/hooks/session-start.py`
- `packages/cli/src/templates/copilot/hooks/session-start.py`

Classification:

- Not affected by #261.
- These hooks pass `RUDDER_CONTEXT_ID` through a subprocess `env` object when
  launching local Rudder scripts.
- They do not build a user-facing shell assignment prefix.
- Copilot's hook config also has separate `bash` and `powershell` command
  fields in `hooks.json`, so the host can select the command family.

## Not the same class: Python executable selection

Files:

- `packages/cli/src/configurators/shared.ts`
- `packages/cli/src/commands/init.ts`
- `packages/cli/src/templates/opencode/lib/rudder-context.js`
- `packages/cli/src/templates/opencode/lib/session-utils.js`
- `packages/cli/src/templates/pi/extensions/rudder/index.ts.txt`

Classification:

- Not affected by #261.
- `process.platform === "win32"` is appropriate here because the decision is
  about the executable name available on the operating system (`python` vs
  `python3`), not about command assignment syntax.
- The `init.ts` probe is even stronger because it tests actual Python
  candidates and caches the detected command.

## Implementation scope for a follow-up

Minimum code changes:

- Add a Windows POSIX-shell detector to
  `packages/cli/src/templates/opencode/plugins/inject-subagent-context.js`.
- Thread an optional env object through the plugin factory and command injection
  helper for tests.
- Add regression tests in `packages/cli/test/templates/opencode.test.ts`.

Minimum spec changes:

- Update `.rudder/spec/guides/cross-platform-thinking-guide.md`.
- Update
  `packages/cli/src/templates/markdown/spec/guides/cross-platform-thinking-guide.md.txt`.
- Update `.rudder/spec/cli/backend/script-conventions.md`.
- Update `.rudder/spec/cli/backend/platform-integration.md`.

Likely generated/local template mirrors:

- `.opencode/plugins/inject-subagent-context.js` if this worktree's generated
  project-local template mirror should stay in sync with package templates.

Quality checks:

- `pnpm --dir packages/cli exec vitest run test/templates/opencode.test.ts`
- `pnpm --dir packages/cli exec vitest run test/templates/pi.test.ts`
- `pnpm --dir packages/cli exec vitest run test/configurators/platforms.test.ts`
- `pnpm --dir packages/cli typecheck`
- `pnpm --dir packages/cli lint`
