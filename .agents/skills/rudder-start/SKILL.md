---
name: rudder-start
description: "Initializes an AI development session by reading workflow guides, developer identity, git status, active tasks, and project guidelines from .rudder/. Classifies incoming tasks and routes to brainstorm, direct edit, or task workflow. Use when beginning a new coding session, resuming work, starting a new task, or re-establishing project context."
---

# Start Session

Initialize a Rudder-managed development session. This platform has no session-start hook, so manually load the equivalent context by following these steps (each one mirrors a section the hook would otherwise inject).

---

## Step 1: Current state
Identity, git status, current task, active tasks, journal location.

```bash
python3 ./.rudder/scripts/get_context.py
```

## Step 2: Workflow overview
Phase Index + skill routing table + DO-NOT-skip rules.

```bash
python3 ./.rudder/scripts/get_context.py --mode phase
```

Full guide in `.rudder/workflow.md` (read on demand).

## Step 3: Guideline indexes
Discover packages + spec layers, then read each relevant index file.

```bash
python3 ./.rudder/scripts/get_context.py --mode packages
cat .rudder/spec/guides/index.md
cat .rudder/spec/<package>/<layer>/index.md   # for each relevant layer
```

Index files list the specific guideline docs to read when you actually start coding.

## Step 4: Decide next action
From Step 1 you know the current task. Check the task directory:

- **Active task + `prd.md` exists** → Phase 2 step 2.1. Load the step detail:
  ```bash
  python3 ./.rudder/scripts/get_context.py --mode phase --step 2.1
  ```
- **Active task + no `prd.md`** → Phase 1.1. Load the `rudder-brainstorm` skill.
- **No active task** → when the user describes multi-step work, load the `rudder-brainstorm` skill to clarify requirements, then create a task via `task.py create`. For simple one-off questions or trivial edits, skip this and just answer directly — no task needed.

---

## Skill routing (quick reference)

| User intent | Skill |
|---|---|
| New feature / unclear requirements | `rudder-brainstorm` |
| About to write code | `rudder-before-dev` |
| Done coding / quality check | `rudder-check` |
| Stuck / fixed same bug multiple times | `rudder-break-loop` |
| Learned something worth capturing | `rudder-update-spec` |

Full rules + anti-rationalization table in `.rudder/workflow.md`.
