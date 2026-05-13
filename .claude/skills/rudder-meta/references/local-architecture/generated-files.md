# Local Files Generated After Init

`rudder init` writes the Rudder runtime into the user project. Later, `rudder update` tries to update Rudder-managed template files, but it uses `.rudder/.template-hashes.json` to determine which files have already been modified by the user.

This page only describes files that are visible and editable inside the user project.

## `.rudder/`

```text
.rudder/
├── workflow.md
├── config.yaml
├── .developer
├── .version
├── .template-hashes.json
├── .runtime/
├── scripts/
├── spec/
├── tasks/
└── workspace/
```

| Path | Usually editable? | Notes |
| --- | --- | --- |
| `.rudder/workflow.md` | Yes | Local workflow documentation and AI routing rules. |
| `.rudder/config.yaml` | Yes | Project configuration, hooks, packages, journal line limits, and related settings. |
| `.rudder/spec/` | Yes | Project specs, intended to be updated regularly by users and AI. |
| `.rudder/tasks/` | Yes | Task material and research artifacts, maintained by the task workflow. |
| `.rudder/workspace/` | Yes | Session records, usually written by `add_session.py`. |
| `.rudder/scripts/` | Carefully | Local runtime. It can be customized, but only after understanding the call chain. |
| `.rudder/.runtime/` | No | Runtime state, usually written automatically by hooks/scripts. |
| `.rudder/.developer` | Carefully | Current developer identity. |
| `.rudder/.version` | No | Rudder version record used by update/migration logic. |
| `.rudder/.template-hashes.json` | No | Template hash record. Do not hand-write business rules here. |

## Platform Directories

Different platforms generate different directories. Common categories:

| Category | Example paths | Purpose |
| --- | --- | --- |
| hooks | `.claude/hooks/`, `.codex/hooks/`, `.cursor/hooks/` | Inject session context, workflow-state, and sub-agent context. |
| settings | `.claude/settings.json`, `.codex/hooks.json`, `.qoder/settings.json` | Tell the platform when to run hooks or plugins. |
| agents | `.claude/agents/`, `.codex/agents/`, `.kiro/agents/` | Define agents such as `rudder-research`, `rudder-implement`, and `rudder-check`. |
| skills | `.claude/skills/`, `.agents/skills/`, `.qoder/skills/` | Skills that auto-trigger or can be read by AI. |
| commands/prompts/workflows | `.cursor/commands/`, `.github/prompts/`, `.windsurf/workflows/` | Explicit user-invoked command or workflow entry points. |

When modifying a platform directory, also confirm whether `.rudder/workflow.md` still describes the same flow.

## Meaning Of Template Hashes

`.rudder/.template-hashes.json` records the content hash from the last time Rudder wrote a template file. `rudder update` uses it to distinguish three cases:

| Case | Update behavior |
| --- | --- |
| File was not modified by the user | It can be updated automatically. |
| File was modified by the user | Prompt the user to overwrite, keep, or generate `.new`. |
| File is no longer a current template | It may be deleted, renamed, or preserved according to migration rules. |

When an AI customizes local Rudder files, it does not need to maintain hashes manually. It is normal for Rudder update to recognize the result as "modified by the user."

## Local Customization Boundaries

Editable by default:

- `.rudder/workflow.md`
- `.rudder/config.yaml`
- `.rudder/spec/**`
- `.rudder/scripts/**`
- Platform hooks, settings, agents, skills, commands, prompts, and workflows

Do not edit by default:

- Global npm install directory
- `node_modules/@mengde1231/rudder`
- Rudder GitHub repository source code
- Concrete state files under `.rudder/.runtime/**`
- Hash contents inside `.rudder/.template-hashes.json`

Switch to the Rudder CLI source-code perspective only when the user explicitly wants to contribute upstream.
