"""
Safe git-add helpers for Rudder-owned paths.

Why this module exists
----------------------
A real user incident: a project's `.gitignore` listed `.rudder/` (company-wide
template / personal habit). When `add_session.py` and `task.py archive` ran
their auto-commit and `git add` failed with `ignored by .gitignore`, the AI
agent driving the workflow "fixed" it by retrying with
`git add -f .rudder/` — which fan-out-included every ignored subtree
(`.rudder/.backup-*/`, `.rudder/worktrees/`, `.rudder/.template-hashes.json`,
`.rudder/.runtime/`), committing 548 files / 83474 lines of caches/backups.

Design
------
- Scripts only stage SPECIFIC product paths (journal files, index.md, the
  current task dir, the archive dir). Never the whole `.rudder/` tree.
- If plain `git add <specific>` fails with "ignored by", DO NOT retry with
  ``-f``. The presence of `.rudder/` in `.gitignore` is treated as user
  intent ("keep .rudder/ local-only"). The script warns and skips the
  auto-commit; users who want auto-staging can either fix their `.gitignore`
  or set ``session_auto_commit: false`` and manage git themselves.
- The warning includes a negative example: ``Do NOT use `git add -f .rudder/` ...``
  so any AI rereading the log doesn't reinvent the bug.

History note: 0.5.10 introduced an automatic ``git add -f`` retry on the
specific paths. That was reverted in 0.5.11 — auto-forcing into a tree the
user had gitignored violates user intent even when the path list is narrow.
The wider-grain forbidden command stays forbidden, and the narrow-grain auto
``-f`` is gone too.
"""

from __future__ import annotations

import sys
from pathlib import Path

from .git import run_git
from .paths import (
    DIR_ARCHIVE,
    DIR_TASKS,
    DIR_WORKFLOW,
    DIR_WORKSPACE,
    FILE_JOURNAL_PREFIX,
    get_developer,
)


# Paths under .rudder/ that must NEVER be auto-staged. Listed here so the
# warning to the user can show concrete subpaths to ignore individually
# instead of ignoring the whole `.rudder/` tree.
RUDDER_IGNORED_SUBPATHS = (
    ".rudder/.backup-*",
    ".rudder/worktrees/",
    ".rudder/.template-hashes.json",
    ".rudder/.runtime/",
    ".rudder/.cache/",
)


def safe_rudder_paths_to_add(repo_root: Path) -> list[str]:
    """Return the list of repo-relative paths the auto-commit should stage.

    Only includes paths that exist on disk so callers don't pass non-existent
    arguments to git. The caller is responsible for `git diff --cached`
    checking afterwards.

    Included:
      - .rudder/workspace/<developer>/journal-*.md
      - .rudder/workspace/<developer>/index.md
      - .rudder/tasks/<task-dir>/   (every active task directory)
      - .rudder/tasks/archive/      (whole archive subtree, if present)

    Excluded (intentionally — these must not be staged):
      - .rudder/.backup-*, .rudder/worktrees/,
        .rudder/.template-hashes.json, .rudder/.runtime/, .rudder/.cache/
    """
    paths: list[str] = []

    # Workspace journal files + index.md
    developer = get_developer(repo_root)
    if developer:
        ws = repo_root / DIR_WORKFLOW / DIR_WORKSPACE / developer
        if ws.is_dir():
            for f in sorted(ws.glob(f"{FILE_JOURNAL_PREFIX}*.md")):
                if f.is_file():
                    paths.append(
                        f"{DIR_WORKFLOW}/{DIR_WORKSPACE}/{developer}/{f.name}"
                    )
            index_md = ws / "index.md"
            if index_md.is_file():
                paths.append(
                    f"{DIR_WORKFLOW}/{DIR_WORKSPACE}/{developer}/index.md"
                )

    # Active tasks: each direct child of tasks/ that is a directory and not
    # the archive root. The archive subtree is added as a single path below.
    tasks_dir = repo_root / DIR_WORKFLOW / DIR_TASKS
    if tasks_dir.is_dir():
        for child in sorted(tasks_dir.iterdir()):
            if not child.is_dir():
                continue
            if child.name == DIR_ARCHIVE:
                continue
            paths.append(f"{DIR_WORKFLOW}/{DIR_TASKS}/{child.name}")

        archive_dir = tasks_dir / DIR_ARCHIVE
        if archive_dir.is_dir():
            paths.append(f"{DIR_WORKFLOW}/{DIR_TASKS}/{DIR_ARCHIVE}")

    return paths


def safe_archive_paths_to_add(repo_root: Path) -> list[str]:
    """Return paths to stage after `task.py archive`.

    Limited to the archive subtree (where the freshly-moved task lives) plus
    the source task directory's parent area to capture the deletion in the
    same commit. We pass the whole `.rudder/tasks/` path so deletions of the
    pre-move path are tracked, but only as a SPECIFIC subpath — not the whole
    `.rudder/` tree.
    """
    paths: list[str] = []
    tasks_dir = repo_root / DIR_WORKFLOW / DIR_TASKS
    if tasks_dir.is_dir():
        # The archive copy.
        archive_dir = tasks_dir / DIR_ARCHIVE
        if archive_dir.is_dir():
            paths.append(f"{DIR_WORKFLOW}/{DIR_TASKS}/{DIR_ARCHIVE}")
        # Active tasks (some may have been re-touched, e.g. parent's
        # children list). This captures the source-path deletion too because
        # `git add` on a directory records removals.
        for child in sorted(tasks_dir.iterdir()):
            if not child.is_dir():
                continue
            if child.name == DIR_ARCHIVE:
                continue
            paths.append(f"{DIR_WORKFLOW}/{DIR_TASKS}/{child.name}")
    return paths


def _stderr_indicates_ignored(stderr: str) -> bool:
    """git add error indicates the path is excluded by .gitignore."""
    if not stderr:
        return False
    lowered = stderr.lower()
    return "ignored by" in lowered


def safe_git_add(
    paths: list[str], repo_root: Path
) -> tuple[bool, bool, str]:
    """Run `git add` on specific paths; never retry with -f.

    Returns ``(success, used_force, stderr)``. The ``used_force`` field is
    kept for signature compatibility with the 0.5.10 implementation but is
    always ``False`` — we never auto-force.

    Behavior:
      - No paths passed → success, no force, empty stderr.
      - Plain ``git add -- <paths>`` succeeds → return success.
      - Plain fails (any reason — ignored or otherwise) → return failure with
        the stderr. Callers should inspect the stderr (see
        :func:`print_gitignore_warning`) and skip the auto-commit.
    """
    if not paths:
        return True, False, ""

    rc, _, err = run_git(["add", "--", *paths], cwd=repo_root)
    if rc == 0:
        return True, False, ""
    return False, False, err


def print_gitignore_warning(paths: list[str]) -> None:
    """Explain to the user (and any AI reading the log) what to do.

    CRITICAL: includes the negative example
    ``Do NOT use `git add -f .rudder/``` — agents reading the warning are
    known to invent that command, which fans out to ignored caches/backups.
    """
    print(
        "[WARN] git add failed because .rudder/ paths are ignored by your .gitignore.",
        file=sys.stderr,
    )
    print(
        "[WARN] Skipping auto-commit. The journal/task files were still written to disk;",
        file=sys.stderr,
    )
    print(
        "[WARN] git was not touched.",
        file=sys.stderr,
    )
    print("[WARN]", file=sys.stderr)
    print(
        "[WARN] Rudder manages these specific paths and they should be tracked:",
        file=sys.stderr,
    )
    if paths:
        for p in paths:
            print(f"[WARN]   {p}", file=sys.stderr)
    else:
        print(
            "[WARN]   .rudder/workspace/<developer>/{journal-*.md,index.md}",
            file=sys.stderr,
        )
        print(
            "[WARN]   .rudder/tasks/<task-dir>/",
            file=sys.stderr,
        )
        print(
            "[WARN]   .rudder/tasks/archive/",
            file=sys.stderr,
        )
    print("[WARN]", file=sys.stderr)
    print(
        "[WARN] Recommended: change your .gitignore from `.rudder/` to specific",
        file=sys.stderr,
    )
    print(
        "[WARN] subpaths that should remain ignored, e.g.:",
        file=sys.stderr,
    )
    for sub in RUDDER_IGNORED_SUBPATHS:
        print(f"[WARN]   {sub}", file=sys.stderr)
    print("[WARN]", file=sys.stderr)
    print(
        "[WARN] Or, if you intentionally keep .rudder/ local-only, set in",
        file=sys.stderr,
    )
    print(
        "[WARN] .rudder/config.yaml:",
        file=sys.stderr,
    )
    print(
        "[WARN]   session_auto_commit: false",
        file=sys.stderr,
    )
    print(
        "[WARN] so the scripts skip git entirely and you can review / commit",
        file=sys.stderr,
    )
    print(
        "[WARN] manually with `git status` / `git add` / `git commit`.",
        file=sys.stderr,
    )
    print("[WARN]", file=sys.stderr)
    print(
        "[WARN] Do NOT use `git add -f .rudder/` — it pulls in backups, worktrees,",
        file=sys.stderr,
    )
    print(
        "[WARN] and runtime caches that should never be committed.",
        file=sys.stderr,
    )
