# Start Session

Initialize a Rudder-managed development session. This platform has no session-start hook, so manually load the equivalent context by following these steps (each one mirrors a section the hook would otherwise inject).

---

## Step 1: Current state
Identity, git status, current task, active tasks, journal location.

```bash
{{PYTHON_CMD}} ./.rudder/scripts/get_context.py
```

If this output includes a line beginning `Rudder update available:`, copy the full line verbatim when summarizing session context. Do not shorten operational command hints.

## Step 2: Workflow overview
Phase Index + skill routing table + DO-NOT-skip rules.

```bash
{{PYTHON_CMD}} ./.rudder/scripts/get_context.py --mode phase
```

Full guide in `.rudder/workflow.md` (read on demand).

## Step 3: Guideline indexes
Discover packages + spec layers, then read each relevant index file.

```bash
{{PYTHON_CMD}} ./.rudder/scripts/get_context.py --mode packages
cat .rudder/spec/guides/index.md
cat .rudder/spec/<package>/<layer>/index.md   # for each relevant layer
```

Index files list the specific guideline docs to read when you actually start coding.

## Step 4: Decide next action
Apply **Request routing** in `.rudder/workflow.md` before resuming any phase:

1. Questions, code inspection, scheduler administration, and commit-message drafting are direct requests. Do not create or advance a task; only provide the requested output/action. Business features involving scheduled jobs follow normal routing.
2. Check whether the request serves an unfinished task's **business objective and acceptance scope**. Read its PRD and status before reuse; same session/module or an active pointer alone does not establish relevance. Supplements, corrections, pre-acceptance fixes, continuation, and design-to-development reuse that task and update relevant artifacts. Check other unfinished tasks when needed; ask one focused question only if ownership is unclear.
3. A clear, local, low-risk independent edit can be made directly with relevant guidelines and checks; no special bypass phrase or file-count threshold is required.
4. Otherwise create a task for the independent objective needing durable tracking; an unrelated active task must not absorb it. Use `task.py create "<title>" --slug <name> --platform {{CLI_FLAG}}`, then load `rudder-brainstorm`.

For a related task, follow {{CMD_REF:continue}}'s status/approval/mode-aware routing. A planning task with a PRD is **not automatically ready for implementation**. Resolve missing requirements and open questions first; user approval of the agreed plan counts as confirmation without another prompt. Curate both JSONL files only for sub-agent execution, record approval via `task.py confirm`, then run `task.py start <task-dir> --platform {{CLI_FLAG}}`. Codex inline does not require JSONL, including old seed files.

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
