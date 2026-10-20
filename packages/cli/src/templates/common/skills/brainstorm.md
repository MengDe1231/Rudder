# Brainstorm - Requirements Discovery (AI Coding Enhanced)

**CoreRule**: Resolve business decisions and acceptance boundaries before implementation. Ask only questions that remain unanswered, one at a time, with a recommended option. An explicit instruction to implement a clearly agreed plan is approval; record it and continue without repeating the same confirmation.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.

---

Guide AI through collaborative requirements discovery **before implementation**, optimized for AI coding workflows:

* **Task-first** (capture ideas immediately)
* **Action-before-asking** (reduce low-value questions)
* **Research-first** for technical choices (avoid asking users to invent options)
* **Diverge → Converge** (expand thinking, then lock MVP)

---

## When to Use

Triggered from {{CMD_REF:start}} when the user describes a development task, especially when:

* requirements are unclear or evolving
* there are multiple valid implementation paths
* trade-offs matter (UX, reliability, maintainability, cost, performance)
* the user might not know the best options up front

---

## Core Principles (Non-negotiable)

1. **Route first, then capture**
   Apply Request routing in `.rudder/workflow.md` before entering this skill. Direct answers, scheduler administration, commit-message drafting, and independent low-risk edits do not need a task. For tracked work, reuse a related unfinished task or create one for a new objective.

2. **Action before asking**
   If you can derive the answer from repo code, docs, configs, conventions, or quick research — do that first.

3. **One question per message**
   Never overwhelm the user with a list of questions. Ask one, update PRD, repeat.

4. **Prefer concrete options**
   For preference/decision questions, present 2–3 feasible, specific approaches with trade-offs.

5. **Research-first for technical choices**
   If the decision depends on industry conventions / similar tools / established patterns, do research first, then propose options.

6. **Diverge → Converge**
   After initial understanding, proactively consider future evolution, related scenarios, and failure/edge cases — then converge to an MVP with explicit out-of-scope.

7. **No meta questions**
   Do not ask "should I search?" or "can you paste the code so I can continue?"
   If you need information: search/inspect. If blocked: ask the minimal blocking question.

---

## Step 0: Establish Task Ownership

Compare the request with the current and, when relevant, other unfinished tasks' business objectives and acceptance scopes. Reuse a related task for supplements, fixes, continuation, or design-to-development; update its PRD rather than creating a duplicate. Same session/module or an active pointer alone is not evidence of relevance. If ownership is genuinely unclear, ask one focused question.

For a new objective requiring durable tracking, create a task even when an unrelated task is active. Direct work was already routed out before this skill. Preserve any previous task's artifacts and status.

* Use a **temporary working title** derived from the user's message.
* It's OK if the title is imperfect — refine later in PRD.

```bash
TASK_DIR=$(python3 ./.rudder/scripts/task.py create "brainstorm: <short goal>" --slug <auto> --platform <platform>)
```

Use a slug without a date prefix. `task.py create` adds the `MM-DD-`
directory prefix automatically.

Replace `<platform>` with the actual invoking CLI flag (e.g. `codex`, `claude`, `gemini`), not the last platform that wrote this shared skill. Task creation and startup must use that same platform; Codex resolves its inline/sub-agent setting from `.rudder/config.yaml`.

For a new task, create/seed `prd.md` immediately with what you know. For a related task, update its existing sections and preserve prior decisions:

```markdown
# brainstorm: <short goal>

## Goal

<one paragraph: what + why>

## What I already know

* <facts from user message>
* <facts discovered from repo/docs>

## Assumptions (temporary)

* <assumptions to validate>

## Open Questions

* <ONLY Blocking / Preference questions; keep list short>

## Requirements (evolving)

* <start with what is known>

## Acceptance Criteria (evolving)

* [ ] <testable criterion>

## Definition of Done (team quality bar)

* Tests added/updated (unit/integration where appropriate)
* Lint / typecheck / CI green
* Docs/notes updated if behavior changes
* Rollout/rollback considered if risky

## Out of Scope (explicit)

* <what we will not do in this task>

## Technical Notes

* <files inspected, constraints, links, references>
* <research notes summary if applicable>
```

---

## Step 1: Auto-Context (DO THIS BEFORE ASKING QUESTIONS)

Before asking questions like "what does the code look like?", gather context yourself:

### Repo inspection checklist

* Identify likely modules/files impacted
* Locate existing patterns (similar features, conventions, error handling style)
* Check configs, scripts, existing command definitions
* Note any constraints (runtime, dependency policy, build tooling)

### Documentation checklist

* Look for existing PRDs/specs/templates
* Look for command usage examples, README, ADRs if any

Write findings into PRD:

* Add to `What I already know`
* Add constraints/links to `Technical Notes`

---

## Step 2: Choose Discovery Depth

| Complexity   | Criteria                                               | Action                                      |
| ------------ | ------------------------------------------------------ | ------------------------------------------- |
| **Clear**    | Goal, scope, and acceptance are already agreed         | Persist the plan; reuse approval and proceed |
| **Moderate** | Some unresolved business decisions                     | Ask only the remaining high-value questions |
| **Complex**  | Vague goal, architectural choices, multiple approaches | Explore options and converge on acceptance   |

> Discovery depth does not determine task boundaries. File count alone is neither a risk measure nor a reason to ask for confirmation. If the user has already approved the scope, skip settled questions and expansion sweeps; revisit only new business decisions or material changes.

---

## Step 3: Question Gate (Ask ONLY high-value questions)

Before asking ANY question, run the following gate:

### Gate A — Can I derive this without the user?

If answer is available via:

* repo inspection (code/config)
* docs/specs/conventions
* quick market/OSS research

→ **Do not ask.** Fetch it, summarize, update PRD.

### Gate B — Is this a meta/lazy question?

Examples:

* "Should I search?"
* "Can you paste the code so I can proceed?"
* "What does the code look like?" (when repo is available)

→ **Do not ask.** Take action.

### Gate C — What type of question is it?

* **Blocking**: cannot proceed without user input
* **Preference**: multiple valid choices, depends on product/UX/risk preference
* **Derivable**: should be answered by inspection/research

→ Only ask **Blocking** or **Preference**.

---

## Step 4: Research-first Mode (Mandatory for technical choices)

### Trigger conditions (any → research-first)

* The task involves selecting an approach, library, protocol, framework, template system, plugin mechanism, or CLI UX convention
* The user asks for "best practice", "how others do it", "recommendation"
* The user can't reasonably enumerate options

### Delegate to `rudder-research` sub-agent (don't research inline)

For each research topic, **spawn a `rudder-research` sub-agent via the Task tool** — don't do WebFetch / WebSearch / `gh api` inline in the main conversation.

Why:
- The sub-agent has its own context window → doesn't pollute brainstorm context with raw tool output
- It persists findings to `{TASK_DIR}/research/<topic>.md` (the contract — see `workflow.md` Phase 1.2)
- It returns only `{file path, one-line summary}` to the main agent
- Independent topics can be **parallelized** — spawn multiple sub-agents in one tool call

> **Codex exception**: on Codex CLI, do NOT dispatch `rudder-research` for research-first mode — do the research inline (WebFetch / WebSearch in the main session) and write findings to `{TASK_DIR}/research/<topic>.md` yourself. Reason: Codex `spawn_agent` runs sub-agents with `fork_turns="none"` (isolated context, no parent session inheritance), so the research sub-agent cannot resolve the active task path via `task.py current` and silently aborts without producing files. Inline research on Codex avoids this failure mode. The 3+ inline research calls limit (B rule in `workflow.md`) is relaxed for Codex specifically.

Agent type: `rudder-research`
Task description template: "Research <specific question>; persist findings to `{TASK_DIR}/research/<topic-slug>.md`."

❌ Bad (what you must NOT do):
```
Main agent: WebFetch(url-A) → WebFetch(url-B) → Bash(gh api ...)
          → WebSearch(q1) → WebSearch(q2) → ... (10+ inline calls)
          → Write(research/topic.md)
```
→ Pollutes main context with raw HTML/JSON, burns tokens.

✅ Good:
```
Main agent: Task(subagent_type="rudder-research",
                 prompt="Research topic A; persist to research/topic-a.md")
          + Task(subagent_type="rudder-research",
                 prompt="Research topic B; persist to research/topic-b.md")
          + Task(subagent_type="rudder-research",
                 prompt="Research topic C; persist to research/topic-c.md")
→ Reads research/topic-{a,b,c}.md after they finish.
```

### Research steps (to pass into each sub-agent prompt)

Each `rudder-research` sub-agent should:

1. Identify 2–4 comparable tools/patterns for its topic
2. Summarize common conventions and why they exist
3. Map conventions onto our repo constraints
4. Write findings to `{TASK_DIR}/research/<topic>.md`

Main agent then reads the persisted files and produces **2–3 feasible approaches** in PRD.

### Research output format (PRD)

The PRD itself should only reference the persisted research files, not duplicate their content. Add a `## Research References` section pointing at `research/*.md`.

Optionally, add a convergence section with feasible approaches derived from the research:

```markdown
## Research References

* [`research/<topic-a>.md`](research/<topic-a>.md) — <one-line takeaway>
* [`research/<topic-b>.md`](research/<topic-b>.md) — <one-line takeaway>

## Research Notes

### What similar tools do

* ...
* ...

### Constraints from our repo/project

* ...

### Feasible approaches here

**Approach A: <name>** (Recommended)

* How it works:
* Pros:
* Cons:

**Approach B: <name>**

* How it works:
* Pros:
* Cons:

**Approach C: <name>** (optional)

* ...
```

Then ask **one** preference question:

* "Which approach do you prefer: A / B / C (or other)?"

---

## Step 5: Expansion Sweep (DIVERGE) — Required after initial understanding

After you can summarize the goal, proactively broaden thinking before converging.

### Expansion categories (keep to 1–2 bullets each)

1. **Future evolution**

   * What might this feature become in 1–3 months?
   * What extension points are worth preserving now?

2. **Related scenarios**

   * What adjacent commands/flows should remain consistent with this?
   * Are there parity expectations (create vs update, import vs export, etc.)?

3. **Failure & edge cases**

   * Conflicts, offline/network failure, retries, idempotency, compatibility, rollback
   * Input validation, security boundaries, permission checks

### Expansion message template (to user)

```markdown
I understand you want to implement: <current goal>.

Before diving into design, let me quickly diverge to consider three categories (to avoid rework later):

1. Future evolution: <1–2 bullets>
2. Related scenarios: <1–2 bullets>
3. Failure/edge cases: <1–2 bullets>

For this MVP, which would you like to include (or none)?

1. Current requirement only (minimal viable)
2. Add <X> (reserve for future extension)
3. Add <Y> (improve robustness/consistency)
4. Other: describe your preference
```

Then update PRD:

* What's in MVP → `Requirements`
* What's excluded → `Out of Scope`

---

## Step 6: Q&A Loop (CONVERGE)

### Rules

* One question per message
* Prefer multiple-choice when possible
* After each user answer:

  * Update PRD immediately
  * Move answered items from `Open Questions` → `Requirements`
  * Update `Acceptance Criteria` with testable checkboxes
  * Clarify `Out of Scope`

### Question priority (recommended)

1. **MVP scope boundary** (what is included/excluded)
2. **Preference decisions** (after presenting concrete options)
3. **Failure/edge behavior** (only for MVP-critical paths)
4. **Success metrics & Acceptance Criteria** (what proves it works)

### Preferred question format (multiple choice)

```markdown
For <topic>, which approach do you prefer?

1. **Option A** — <what it means + trade-off>
2. **Option B** — <what it means + trade-off>
3. **Option C** — <what it means + trade-off>
4. **Other** — describe your preference
```

---

## Step 7: Propose Approaches + Record Decisions (Complex tasks)

After requirements are clear enough, propose 2–3 approaches (if not already done via research-first):

```markdown
Based on current information, here are 2–3 feasible approaches:

**Approach A: <name>** (Recommended)

* How:
* Pros:
* Cons:

**Approach B: <name>**

* How:
* Pros:
* Cons:

Which direction do you prefer?
```

Record the outcome in PRD as an ADR-lite section:

```markdown
## Decision (ADR-lite)

**Context**: Why this decision was needed
**Decision**: Which approach was chosen
**Consequences**: Trade-offs, risks, potential future improvements
```

---

## Step 8: Final Confirmation + Implementation Plan

When open questions are resolved, persist the complete requirements and implementation plan. If the user has already instructed you to implement that agreed plan, reuse that approval and continue. Otherwise present the structured summary once and ask only for the outstanding approval. Do not repeat confirmation between workflow phases or for implementation-detail adjustments.

### Final confirmation format

```markdown
Here's my understanding of the complete requirements:

**Goal**: <one sentence>

**Requirements**:

* ...
* ...

**Acceptance Criteria**:

* [ ] ...
* [ ] ...

**Definition of Done**:

* ...

**Out of Scope**:

* ...

**Technical Approach**:
<brief summary + key decisions>

**Implementation Plan (small PRs)**:

* PR1: <scaffolding + tests + minimal plumbing>
* PR2: <core behavior>
* PR3: <edge cases + docs + cleanup>

Does this look correct? If yes, I'll proceed with implementation.
```

### Subtask Decomposition (Complex Tasks)

For complex tasks with multiple independent work items, create subtasks:

```bash
# Create child tasks
CHILD1=$(python3 ./.rudder/scripts/task.py create "Child task 1" --slug child1 --parent "$TASK_DIR" --platform <platform>)
CHILD2=$(python3 ./.rudder/scripts/task.py create "Child task 2" --slug child2 --parent "$TASK_DIR" --platform <platform>)

# Or link existing tasks
python3 ./.rudder/scripts/task.py add-subtask "$TASK_DIR" "$CHILD_DIR"
```

---

## PRD Target Structure (final)

`prd.md` should converge to:

```markdown
# <Task Title>

## Goal

<why + what>

## Requirements

* ...

## Acceptance Criteria

* [ ] ...

## Definition of Done

* ...

## Technical Approach

<key design + decisions>

## Decision (ADR-lite)

Context / Decision / Consequences

## Out of Scope

* ...

## Technical Notes

<constraints, references, files, research notes>
```

---

## Anti-Patterns (Hard Avoid)

* Asking user for code/context that can be derived from repo
* Asking user to choose an approach before presenting concrete options
* Meta questions about whether to research
* Staying narrowly on the initial request without considering evolution/edges
* Letting brainstorming drift without updating PRD

---

## Integration with Start Workflow

After requirements are complete and approved (including approval already given for the agreed plan), continue within `.rudder/workflow.md` Phase 1:

```text
Brainstorm
  Step 0: Reuse related task or create a new tracked objective
  Step 1–7: Discover requirements, research, converge
  Step 8: Persist complete requirements → reuse approval or ask once
  ↓
Phase 1.3: Curate both JSONL files for sub-agent execution; skip for inline
  → Phase 1.4: task.py confirm <task-dir>
  → task.py start <task-dir> --platform <platform>
  ↓
Phase 2 (Execute)
  Implement → Check → Verify → Phase 3 (Finish)
```

Do not recreate the task or discard the PRD when moving from design to implementation. A PRD file alone does not mean planning is complete: requirements, approval/hash, and applicable context must pass the startup gate. Inline startup ignores existing JSONL seed files.

---

## Related Commands

| Command | When to Use |
|---------|-------------|
| `{{CMD_REF:start}}` | Entry point that triggers brainstorm |
| `{{CMD_REF:finish-work}}` | After implementation is complete |
| `{{CMD_REF:update-spec}}` | If new patterns emerge during work |
