# Implementation and verification

## Delivered

- Unified direct/reuse/new routing in the product workflow and shared start,
  continue, and brainstorm templates, including active-task relevance,
  design-to-development reuse, low-risk independent edits, and approval reuse.
- Replaced PRD-existence-based resume shortcuts with completeness, approval,
  confirmation, and execution-mode checks; both context files matter in
  sub-agent mode.
- Shared `requires_task_context` between task creation and readiness. Added
  optional `--platform` to create/start and carried it into creation hints.
  Codex reuses the existing dispatch-mode resolver. Explicit platform wins over
  environment selection; configured-directory fallback is conservative.
- Inline startup ignores old JSONL seeds while retaining PRD/approval gates.
  Sub-agent startup rejects missing/seed-only/invalid context. Invalid JSONL
  objects report errors rather than causing a traceback.
- Updated bundled task-system/workflow reference material and the local
  workflow-state contract. Replaced a source-layout assertion with behavioral
  tests executing generated scripts.

## Automated verification

- Targeted regression run: 323 passed (297 existing + 26 new cases).
- Full test suite: 33 files passed; 1041 tests passed, 1 skipped.
- `pnpm typecheck`: passed.
- `pnpm build`: passed; script/template packaging succeeded.
- ESLint on changed TypeScript tests: passed.
- Whitespace check respecting Windows CRLF: passed.
- Full `pnpm lint`: 4 existing errors in unchanged files:
  - `src/commands/update.ts:705`: unused `collectSpecFiles`.
  - `src/utils/template-hash.ts:407`: dynamic property deletion.
  - `src/utils/trellis-migrate.ts:109-110`: unused `TRELLIS_RE` and `REPLACEMENT`.
  - These files have no working-tree diff; unrelated cleanup was excluded.
- Release verification: version `0.6.22` is not yet on npm; manifest continuity
  passes with 120 local manifests and 16 published versions.

## Routing review

| Scenario | Required route checked across the shared instructions |
| --- | --- |
| Unrelated goal while a task is active | Direct low-risk work or a separate tracked task; never silently reuse |
| Supplement/fix before acceptance | Reuse related unfinished task and update its artifacts |
| Design approved for development | Preserve task identity and reuse existing approval |
| Clear local independent low-risk edit | Direct edit, relevant guidelines and checks |
| Commit-message-only request | Return wording; no task advancement, commit, or archive |
| Planning PRD incomplete/unapproved | Resolve only outstanding requirements/approval; no direct implementation shortcut |
| Codex inline with historical JSONL seeds | Start without curation when PRD/approval gates pass |

Routing is Agent policy, not a keyword classifier. Template review and runtime
tests do not claim to guarantee every model's interpretation.

## Local state

The user has now authorized committing and publishing. Work is on branch
`release/v0.6.22-task-routing-readiness`; the repository requires a PR before
merging into protected `main`. CI publishes npm when a version tag is pushed.
The local npm token returns 401, so the GitHub Actions npm secret must be used
for the release. Requirement-scoped bypass persistence and semantic
confirmation hashing remain outside this phase.

The installed dogfood runtime was already older than product sources. This
change targets the product templates; generated-script tests validate their
installation behavior without broadly upgrading the local runtime.
