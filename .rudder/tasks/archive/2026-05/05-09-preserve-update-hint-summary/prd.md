# Preserve Update Hint In Rudder Start Summaries

## Goal

Ensure `$rudder-start` instructions preserve the full Rudder update hint when summarizing session context, so operational install commands are not dropped from the assistant's final summary.

## Requirements

- Update the source template that generates Codex `.agents/skills/rudder-start/SKILL.md`.
- Update the current local `.agents/skills/rudder-start/SKILL.md` copy in this repository.
- Keep the wording narrow: only require preserving operational command hints, specifically the `Rudder update available:` line.
- Do not change `.rudder/scripts/get_context.py` behavior or update-check logic.

## Acceptance Criteria

- [x] `packages/cli/src/templates/common/commands/start.md` instructs agents not to shorten operational command hints and to copy the full `Rudder update available:` line verbatim.
- [x] `.agents/skills/rudder-start/SKILL.md` contains the same effective instruction.
- [x] Generated Codex `rudder-start` output remains consistent with the source template.

## Definition of Done

- Relevant template/local files updated.
- Focused verification run for generated template parity or existing init/configurator coverage.
- No unrelated summary template or script behavior introduced.

## Out of Scope

- Changing update version detection.
- Changing hook injection behavior.
- Adding broad session summary formatting rules.

## Technical Notes

- The Codex `rudder-start` skill is generated from `packages/cli/src/templates/common/commands/start.md` via `resolveCodexRudderStartSkill`.
- The repository-local installed copy is `.agents/skills/rudder-start/SKILL.md`.
