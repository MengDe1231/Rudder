# docs-site config.yaml advanced guide

## Goal

Add a dedicated docs-site guide for `.rudder/config.yaml` under the Advanced / 进阶 section. The page should explain what the file controls, how to edit it safely, and the most important current keys, including the newly released `session_auto_commit` option.

## What I already know

- The user pointed at the docs-site "进阶" sidebar and asked to add a `config.yaml` configuration explanation there.
- `docs-site/docs.json` has four Advanced / 进阶 navigation lists: English Beta, English Release, Chinese Beta, Chinese Release.
- Existing docs mention `.rudder/config.yaml` in scattered places (`appendix-a`, `everyday-use`, `appendix-f`), but there is no dedicated configuration page.
- The canonical config template is `packages/cli/src/templates/rudder/config.yaml`.
- The current top-level sections are Session Recording, Session Auto-Commit, Task Lifecycle Hooks, Monorepo / Packages, and Codex dispatch behavior.
- The docs-site spec requires new pages to be mirrored across English and Chinese paths and added to `docs.json`.

## Assumptions

- The page should be named `configuration.mdx`, with Chinese sidebar text rendered through the page title/frontmatter rather than a different filename.
- The page should be added before `multi-platform` in the Advanced / 进阶 list because configuration is a general prerequisite for team/platform setup.
- Release and Beta docs can share the same content for this page because `0.5.11` and `0.6.0-beta.6` both include `session_auto_commit` and the same config section.

## Requirements

- Add an English `.rudder/config.yaml` guide under:
  - `docs-site/advanced/configuration.mdx`
  - `docs-site/beta/advanced/configuration.mdx`
- Add a Chinese mirror under:
  - `docs-site/zh/advanced/configuration.mdx`
  - `docs-site/zh/beta/advanced/configuration.mdx`
- Update `docs-site/docs.json` so all four Advanced / 进阶 navigation lists include the new page.
- The guide must cover:
  - File purpose and edit model.
  - `session_commit_message` and `max_journal_lines`.
  - `session_auto_commit`.
  - `hooks`.
  - `packages` / `default_package`.
  - `codex.dispatch_mode`.
  - `rudder update` behavior for additive config sections.
- Keep code blocks in English / code syntax and translate only prose in Chinese pages.

## Acceptance Criteria

- [x] The new page appears in English Beta and Release navigation.
- [x] The new page appears in Chinese Beta and Release navigation under 进阶.
- [x] English and Chinese page structures match.
- [x] `docs-site/docs.json` parses as valid JSON.
- [x] No dev/build/start/serve command is run for the frontend docs-site.

## Definition of Done

- Specs used for docs-site edits are listed in `implement.jsonl` / `check.jsonl`.
- Implementation is reviewed against docs-site MDX/navigation conventions.
- JSON syntax is verified.

## Out of Scope

- No CLI behavior changes.
- No new migration manifest.
- No docs-site dev server or production build.

## Technical Notes

- Relevant specs:
  - `.rudder/spec/docs-site/docs/index.md`
  - `.rudder/spec/docs-site/docs/directory-structure.md`
  - `.rudder/spec/docs-site/docs/mdx-guidelines.md`
  - `.rudder/spec/docs-site/docs/config-guidelines.md`
  - `.rudder/spec/docs-site/docs/style-guide.md`
  - `.rudder/spec/docs-site/docs/sync-on-change.md`
- Canonical config source: `packages/cli/src/templates/rudder/config.yaml`.
