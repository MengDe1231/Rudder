# Technical Design

## Current Behavior

`session_context.py` builds Git context in four paths:

- default JSON: `get_context_json()`
- default text: `get_context_text()`
- record JSON: `get_context_record_json()`
- record text: `get_context_text_record()`

Each path currently runs Git commands at `repo_root` without first proving that `repo_root` is inside a Git worktree. Package Git sections are appended later and are sourced only from `packages.*.git: true`.

## Target Behavior

Git context generation has one canonical model:

1. Probe root with `git rev-parse --is-inside-work-tree`.
2. If root is a Git worktree, collect root branch, working tree count, short status, and recent commits.
3. If root is not a Git worktree, represent that state explicitly and skip root status/log commands.
4. Collect package repository info from configured `git: true` packages.
5. If no configured package repositories exist and root is not a Git worktree, discover child repositories with the bounded polyrepo scan.
6. Render all text modes from that model.
7. Return JSON from that model without reporting root as clean when it is not a Git repository.

## Data Model

Use in-memory dictionaries only. Do not add persistent schema.

Root Git dictionary:

```python
{
    "isRepo": bool,
    "branch": str,
    "isClean": bool,
    "uncommittedChanges": int,
    "recentCommits": list[dict],
}
```

When `isRepo` is `False`, `branch` is empty, `isClean` is `False`, `uncommittedChanges` is `0`, and `recentCommits` is empty. `isClean=False` avoids the misleading "clean root" interpretation.

Package Git dictionary keeps the existing fields:

```python
{
    "name": str,
    "path": str,
    "branch": str,
    "isClean": bool,
    "uncommittedChanges": int,
    "recentCommits": list[dict],
}
```

## Child Repository Discovery

Runtime fallback mirrors the init polyrepo rules:

- Scan up to two levels: immediate children and grandchildren.
- Skip dot-prefixed directories and common generated/vendor directories.
- Treat `.git` as present if the path exists, regardless of whether it is a file or directory.
- Stop descending once a repository is found.
- Return fallback repositories only when at least two are found.
- Use deterministic sorted output.

Configured `git: true` packages take precedence. Runtime fallback only runs when the root is not a Git repo and no configured package Git repositories are available.

## Rendering Contract

For root Git repositories:

```text
## GIT STATUS
Branch: <branch>
Working directory: Clean

## RECENT COMMITS
...
```

For root non-Git projects:

```text
## GIT STATUS
Root is not a Git repository.
Run Git commands from the package repository paths listed below.

## RECENT COMMITS
Root has no Git commit history because it is not a Git repository.
```

Package sections retain their current headers:

```text
## GIT STATUS (<name>: <path>)
...
## RECENT COMMITS (<name>: <path>)
...
```

## Compatibility

- Existing root Git projects keep their current text output.
- Existing configured polyrepo projects get clearer root context.
- Older projects without `git: true` config gain bounded child-repository discovery.
- The implementation remains dependency-free Python and compatible with shipped templates.

