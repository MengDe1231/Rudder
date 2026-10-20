# Unify task routing and execution readiness

## Goal

Choose direct work, task reuse, or a new task by business objective and acceptance scope. Keep workflow guidance, session entry skills, and runtime readiness checks consistent across inline and sub-agent execution.

## Requirements

- Route questions, code inspection, commit-message drafting, and scheduler administration directly. Business feature development involving scheduled jobs follows normal task routing.
- Reuse an unfinished task for additions, fixes, continuation, and design-to-development work serving the same objective. Check relevance before following an active task; independent objectives requiring tracking get separate tasks.
- Handle clear, local, low-risk independent edits directly with relevant checks. File count alone is not a risk or task-boundary criterion.
- Resume planning by PRD completeness, open decisions, recorded confirmation, and execution mode; PRD existence alone never means implementation is ready.
- Use the invoking platform and Codex dispatch setting consistently for task creation and startup. Inline execution must ignore existing JSONL seed files; sub-agent execution must require valid curated implement and check context, including when files are absent.
- Treat an explicit instruction to implement an agreed plan as approval. Ask again only for new business decisions. Keep existing whole-PRD confirmation hashing.
- Leave all changes uncommitted as explicitly requested by the user.

## Acceptance Criteria

- [ ] Shared workflow, start, continue, and brainstorm instructions agree on direct/reuse/new routing and confirmation reuse.
- [ ] Active unrelated tasks cannot implicitly absorb a new objective; design-to-development continuation reuses its task.
- [ ] Planning with a missing/incomplete/unconfirmed PRD does not route directly to implementation.
- [ ] Codex inline create/start succeeds without JSONL curation, including tasks with existing seeds and multi-platform repositories when Codex is explicitly selected.
- [ ] Codex sub-agent and other sub-agent modes reject missing, seed-only, malformed, or invalid JSONL context and accept valid curated files.
- [ ] Existing PRD approval/hash checks remain enforced in inline mode.
- [ ] Relevant regression tests, lint, typecheck, and build pass; local changes are reviewed without committing.

## Definition of Done

Review the complete diff for mode-selection drift, platform compatibility, and unrelated changes. Record validation evidence in this task.

## Technical Approach

Use a shared execution-context requirement helper for create/start, reusing the existing Codex effective-platform resolver. Add an explicit platform option for multi-platform callers and preserve a conservative fallback for existing callers. Keep semantic task relevance in Agent instructions rather than inventing keyword-based runtime classification.

## Decision

The user approved the first-phase scope in this conversation with “ok，帮我优化一下，先不提交到git”. This is authorization to implement the agreed plan without another confirmation round.

## Out of Scope

- Requirement-scoped persistent workflow bypass state.
- Semantic or section-level PRD confirmation hashing.
- Release, commit, push, public documentation-site changes, and upstream synchronization.

## Technical Notes

- Product source: packages/cli/src/templates/ and regression tests under packages/cli/test/.
- Shared platform command/skill templates are emitted from common/, not the legacy platform-specific start/brainstorm files.
- The installed dogfood runtime predates the source readiness gate; run source scripts directly for this task rather than performing a broad runtime upgrade.
