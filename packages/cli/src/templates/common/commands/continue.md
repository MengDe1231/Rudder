# Continue Current Task

Resume work on the current task — pick up at the right phase/step in `.rudder/workflow.md`.

---

## Step 1: Load Current Context

```bash
{{PYTHON_CMD}} ./.rudder/scripts/get_context.py
```

Confirms: current task, git state, recent commits.

## Step 2: Load the Phase Index

```bash
{{PYTHON_CMD}} ./.rudder/scripts/get_context.py --mode phase
```

Shows the Phase Index (Plan / Execute / Finish) with routing + skill mapping.

## Step 3: Decide Where You Are

First apply **Request routing** in `.rudder/workflow.md`: direct questions, code inspection, scheduler administration, and commit-wording requests do not advance a task. Verify that any development request serves the task's business objective and acceptance scope. Supplements, fixes, continuation, and moving from design to implementation reuse related unfinished work; an unrelated objective follows direct-low-risk/new-task routing instead. Same session/module alone does not establish relevance.

For a related task, route by `status`, PRD completeness, approval, and the invoking platform's execution mode (`codex.dispatch_mode` for Codex; inline by default):

- `status=planning` + missing/incomplete PRD or unresolved business decisions → **1.1** (load `rudder-brainstorm`). File existence alone is insufficient.
- `status=planning` + complete PRD + no user approval → **1.1**, ask only for the unresolved approval/decision. An explicit instruction to implement the agreed plan is already approval; do not ask again.
- `status=planning` + approved PRD + missing/stale recorded confirmation → record it using `task.py confirm <task-dir>`; do not request the same approval again unless requirements materially changed.
- `status=planning` + confirmed PRD + sub-agent execution + either JSONL missing, invalid, or seed-only → **1.3**, curate both `implement.jsonl` and `check.jsonl`.
- `status=planning` + confirmed PRD + (inline execution, or sub-agent execution with both JSONL files valid/curated) → **1.4**, run `task.py start <task-dir> --platform {{CLI_FLAG}}`. Inline ignores old JSONL seeds. A failed readiness gate leaves status planning; resolve the reported blockers instead of entering Phase 2.
- `status=in_progress` + implementation not started → **2.1**
- `status=in_progress` + implementation done, not yet checked → **2.2**
- `status=in_progress` + check passed → **3.1**
- `status=completed` (rare; usually archived immediately) → archive flow

Phase rules (full detail in `.rudder/workflow.md`):

1. Run steps **in order** within a phase — `[required]` steps must not be skipped
2. Skip `[once]` steps only when their completion conditions hold: a complete/approved PRD, current confirmation, and both valid curated JSONL files when applicable. Artifact presence alone is insufficient.
3. You may go back to an earlier phase if discoveries require it

## Step 4: Load the Specific Step

Once you know which step to resume at:

```bash
{{PYTHON_CMD}} ./.rudder/scripts/get_context.py --mode phase --step <X.X> --platform {{CLI_FLAG}}
```

Follow the loaded instructions. After each `[required]` step completes, move to the next.

---

## Reference

Full workflow, skill routing table, and the DO-NOT-skip table live in `.rudder/workflow.md`. This command is only an entry point — the canonical guidance is there.
