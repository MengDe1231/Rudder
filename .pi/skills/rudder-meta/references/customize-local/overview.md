# Local Customization Overview

This directory is for local AI working in a user project where Rudder was installed through npm and `rudder init` has already been run. The AI should modify generated `.rudder/` and platform directories inside the project, not Rudder CLI upstream source code.

## First Determine What The User Actually Wants To Change

| User wording | Read first |
| --- | --- |
| "Change the Rudder flow / phases / next prompt" | `change-workflow.md` |
| "Change task creation, status, archive, or hooks" | `change-task-lifecycle.md` |
| "AI did not read context / change injected content" | `change-context-loading.md` |
| "A platform hook is not behaving as expected" | `change-hooks.md` |
| "Change implement/check/research agent behavior" | `change-agents.md` |
| "Add a skill/command/workflow/prompt" | `change-skills-or-commands.md` |
| "Adjust the project spec structure" | `change-spec-structure.md` |
| "Add team conventions and local notes" | `add-project-local-conventions.md` |

## General Operation Order

1. **Confirm platform and directories**: inspect which directories exist, such as `.claude/`, `.codex/`, `.cursor/`.
2. **Confirm the current active task**: run `python3 ./.rudder/scripts/task.py current --source`.
3. **Read the local source of truth**: prefer `.rudder/workflow.md`, `.rudder/config.yaml`, and relevant platform files.
4. **Modify narrowly**: edit only files related to the user's request.
5. **Synchronize semantics**: if a shared flow changes, check whether platform entry points also need changes; if a platform entry changes, check whether `.rudder/workflow.md` still agrees.

## Local File Priority

| Layer | Files |
| --- | --- |
| Workflow | `.rudder/workflow.md` |
| Project configuration | `.rudder/config.yaml` |
| Task material | `.rudder/tasks/<task>/` |
| Project specs | `.rudder/spec/` |
| Runtime scripts | `.rudder/scripts/` |
| Platform integration | `.claude/`, `.codex/`, `.cursor/`, `.opencode/`, and similar directories |
| Shared skill | `.agents/skills/` |

## Things Not To Do By Default

- Do not edit the global npm install directory.
- Do not edit `node_modules/@mengde1231/rudder`.
- Do not assume the user has the Rudder GitHub repository.
- Do not overwrite local files already modified by the user with default templates.
- Do not put team project rules into public `rudder-meta`; project rules belong in `.rudder/spec/` or a local skill.

## When To Inspect Upstream Source

Switch to an upstream source-code perspective only when the user explicitly expresses one of these goals:

- "I want to open a PR to Rudder"
- "I want to change npm package publish contents"
- "I want to fork Rudder"
- "I want to modify the generation logic for `rudder init/update`"

Otherwise, default to modifying local Rudder files inside the user project.
