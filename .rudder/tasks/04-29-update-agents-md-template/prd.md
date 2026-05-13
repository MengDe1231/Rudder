# fix: update AGENTS.md via rudder update

## Goal

Make `rudder update` manage the root `AGENTS.md` Rudder block the same way it manages other Rudder templates, so template changes added after `rudder init` reach existing projects when the file is safe to update.

## What I already know

- `rudder init` creates root `AGENTS.md` from `agentsMdContent`.
- `rudder update` currently collects `.rudder/*` templates and configured platform templates, but it does not collect root `AGENTS.md`.
- `.rudder/.template-hashes.json` does not track `AGENTS.md`, so update cannot distinguish an old pristine `AGENTS.md` from a user-modified one.
- The new `## Subagents` block is present in the source and dist `agents.md` template, but old projects do not receive it through update.

## Requirements

- Add root `AGENTS.md` to the update template collection.
- Add root `AGENTS.md` to initialization hash tracking for new projects.
- Preserve user edits through the existing update conflict behavior.
- Preserve content outside the Rudder-managed `AGENTS.md` block when updating that block.
- Add regression coverage for pristine old `AGENTS.md` auto-update.
- Keep the change narrowly scoped to root `AGENTS.md` lifecycle behavior.

## Acceptance Criteria

- [x] `rudder update` auto-updates `AGENTS.md` when the current file hash matches the stored old template hash.
- [x] `rudder init` records `AGENTS.md` in `.rudder/.template-hashes.json`.
- [x] User-modified `AGENTS.md` remains protected by existing conflict handling.
- [x] Targeted tests pass.

## Out of Scope

- Changing the user-facing `AGENTS.md` content beyond the already-added Subagents section.
- Reworking the broader template update mechanism.
- Generalizing block-level merge behavior beyond root `AGENTS.md`.

## Technical Notes

- Key files:
  - `packages/cli/src/commands/update.ts`
  - `packages/cli/src/utils/template-hash.ts`
  - `packages/cli/test/commands/update.integration.test.ts`
  - `packages/cli/test/commands/init.integration.test.ts`
