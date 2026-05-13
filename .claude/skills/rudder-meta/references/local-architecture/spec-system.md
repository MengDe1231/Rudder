# Local Spec System

`.rudder/spec/` is the user's project-specific engineering spec library. Rudder is not about making AI memorize conventions; it injects relevant specs or requires the AI to read them at the right time.

## Directory Model

A common single-repository structure:

```text
.rudder/spec/
├── backend/
│   ├── index.md
│   └── ...
├── frontend/
│   ├── index.md
│   └── ...
└── guides/
    ├── index.md
    └── ...
```

A common monorepo structure:

```text
.rudder/spec/
├── cli/
│   ├── backend/
│   │   ├── index.md
│   │   └── ...
│   └── unit-test/
│       ├── index.md
│       └── ...
├── docs-site/
│   └── docs/
│       ├── index.md
│       └── ...
└── guides/
    ├── index.md
    └── ...
```

`index.md` is the entry point for each layer. It should list the Pre-Development Checklist and Quality Check. Specific guidelines live in other Markdown files in the same directory.

## Package Configuration

`.rudder/config.yaml` can declare packages:

```yaml
packages:
  cli:
    path: packages/cli
  docs-site:
    path: docs-site
    type: submodule
default_package: cli
```

The AI can run:

```bash
python3 ./.rudder/scripts/get_context.py --mode packages
```

This command lists packages and spec layers for the current project. Use this output as the reference when configuring context JSONL.

## How Specs Enter Tasks

Before a task enters implementation, Phase 1.3 should write relevant specs into `implement.jsonl` / `check.jsonl`:

```jsonl
{"file": ".rudder/spec/cli/backend/index.md", "reason": "CLI backend conventions"}
{"file": ".rudder/spec/cli/unit-test/conventions.md", "reason": "Test expectations"}
```

Sub-agents or platform preludes read these JSONL files and load the referenced specs. On platforms without sub-agent support, the AI should read the relevant specs directly according to the workflow.

## What Specs Should Contain

Specs should contain executable engineering conventions for the project, not generic best practices:

- Where files should live.
- How error handling should be expressed.
- Input/output contracts for APIs, hooks, and commands.
- Patterns that are forbidden.
- Cases that require tests.
- Project-specific pitfalls and how to avoid them.

When the AI learns a new rule during implementation or debugging, it should update `.rudder/spec/` rather than only summarizing it in chat.

## Local Customization Points

| Need | Edit location |
| --- | --- |
| Add a new spec layer | `.rudder/spec/<package>/<layer>/index.md` and corresponding guideline files. |
| Change monorepo spec mapping | `packages` / `default_package` / `spec_scope` in `.rudder/config.yaml`. |
| Change which specs AI reads before implementation | The task's `implement.jsonl`. |
| Change which specs AI reads during checking | The task's `check.jsonl`. |
| Change when specs should be updated | Phase 3.3 in `.rudder/workflow.md` and the `rudder-update-spec` skill. |

## Boundaries

`.rudder/spec/` is the user's project specification, not a permanent copy of Rudder built-in templates. The AI should encourage the user to update it according to the actual project code instead of treating Rudder default templates as immutable documents.
