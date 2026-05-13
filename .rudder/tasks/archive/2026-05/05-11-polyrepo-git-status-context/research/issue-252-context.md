# Issue 252 Context

## Source

GitHub issue #252: "一直循环git状态检查"

User report:

- Maven-style root directory is not a Git repository.
- Each child module has its own independent `.git`.
- Agent repeatedly runs Git commands from the root and receives `fatal: not a git repository`.
- Expected behavior: SessionStart should scan child Git repositories and inject correct Git status, or clearly tell the agent which child directories are Git repositories.

## Existing Implementation

`session_context.py` already supports configured package Git repositories through:

- `get_git_packages(repo_root)` in `common/config.py`
- `_collect_package_git_info(repo_root)` in `common/session_context.py`
- `## GIT STATUS (<name>: <path>)` package sections

But root Git status is collected unconditionally before package sections. A local reproduction with root non-Git and one configured `git: true` package produced:

```text
## GIT STATUS
Branch: unknown
Working directory: Clean

## RECENT COMMITS
(no commits)

## GIT STATUS (module_a: module-a)
Branch: main
Working directory: Clean
```

The first section is misleading and can drive the agent back to root-level Git commands.

## Existing Polyrepo Detection

`rudder init` already detects polyrepo layouts in `packages/cli/src/utils/project-detector.ts`:

- sibling/grandchild `.git` scan
- two-level maximum depth
- hidden/build/vendor ignore set
- `.git` can be a directory or file
- only returns polyrepo candidates when two or more repositories are found

The runtime context generator should reuse the same assumptions rather than invent a deeper or broader scan.

