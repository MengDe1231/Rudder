# Add Project-Local Conventions

Often the user does not need to change Rudder mechanics; they need local AI to understand their team's conventions. In that case, prefer `.rudder/spec/` or a project-local skill instead of editing `rudder-meta`.

## Where To Put Things

| Content type | Location |
| --- | --- |
| Rules code must follow | `.rudder/spec/<layer>/` |
| Cross-layer thinking methods | `.rudder/spec/guides/` |
| AI capability for a project-specific flow | Platform-local skill |
| One-off task material | `.rudder/tasks/<task>/` |
| Session summary | `.rudder/workspace/<developer>/journal-N.md` |

## Create A Project-Local Skill

If the user wants AI to know "how this project customizes Rudder," create a local skill:

```text
.claude/skills/rudder-local/
└── SKILL.md
```

Example:

```md
---
name: rudder-local
description: "Project-local Rudder customizations for this repository. Use when changing this project's Rudder workflow, hooks, local agents, or team-specific conventions."
---

# Rudder Local

## Local Scope

This skill documents this repository's Rudder customizations only.

## Custom Workflow Rules

- ...

## Local Hook Changes

- ...

## Local Agent Changes

- ...
```

For multi-platform projects, place equivalent versions in other platform skill directories, or use `.agents/skills/` for platforms that support the shared layer.

## Write To `.rudder/spec/`

If the content is a coding convention, write it to spec. Examples:

```text
.rudder/spec/backend/error-handling.md
.rudder/spec/frontend/components.md
.rudder/spec/guides/cross-platform-thinking-guide.md
```

After writing it, update the corresponding `index.md` so AI can find the new rule from the entry point.

## Make The Current Task Use New Conventions

After writing a spec, add it to the current task context:

```bash
python3 ./.rudder/scripts/task.py add-context <task> implement ".rudder/spec/backend/error-handling.md" "Error handling conventions"
python3 ./.rudder/scripts/task.py add-context <task> check ".rudder/spec/backend/error-handling.md" "Review error handling"
```

## Do Not Store Project-Private Rules In `rudder-meta`

`rudder-meta` is a public skill for understanding Rudder architecture and local customization entry points. Put project-private content in:

- `.rudder/spec/`
- a project-local skill
- the current task
- workspace journal

This prevents future updates to Rudder's built-in `rudder-meta` from overwriting the team's own conventions.
