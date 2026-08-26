#!/usr/bin/env python3
"""Readiness checks for entering the implementation phase."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


_SECTION_RE = re.compile(r"^##\s+(.+?)\s*$", re.IGNORECASE)
_CHECKBOX_RE = re.compile(r"^\s*[-*+]\s+\[[ xX]\]\s+\S+")
_EMPTY_QUESTIONS = {
    "none",
    "no",
    "n/a",
    "na",
    "resolved",
    "\u65e0",
    "\u65e0\u95ee\u9898",
    "\u5df2\u89e3\u51b3",
}

# Conservative checks for unambiguous mutually exclusive rules.
_CONFLICT_RULES: tuple[tuple[str, str, str], ...] = (
    (
        "automatic save vs explicit save",
        r"(?:automatic|auto[- ]?)save|自动保存",
        r"(?:click(?:s|ed)?|button|manual|explicit)[ -]?save|点击保存|手动保存|点击[“\"]?保存",
    ),
    (
        "lock after success vs continue editing",
        r"(?:lock|locked|read[- ]only)\b.{0,50}(?:after|on|when)?\s*success|成功后锁定|成功后只读",
        r"(?:continue|仍可|继续)\s*(?:edit|editing)|成功后继续编辑|成功后仍可编辑",
    ),
    (
        "row mutation allowed vs forbidden",
        r"(?:allow|支持|允许).{0,30}(?:add|delete|remove)\s*(?:row|rows)?|允许新增|允许删除|可新增|可删除",
        r"(?:cannot|must not|禁止|不允许).{0,30}(?:add|delete|remove)\s*(?:row|rows)?|禁止新增|禁止删除|不可新增|不可删除",
    ),
)


def prd_hash(prd_path: Path) -> str:
    """Return a stable SHA-256 hash for a UTF-8 PRD file."""
    return hashlib.sha256(prd_path.read_bytes()).hexdigest()


def _section_body(content: str, title: str) -> list[str] | None:
    lines = content.splitlines()
    in_section = False
    body: list[str] = []
    for line in lines:
        match = _SECTION_RE.match(line.strip())
        if match:
            if in_section:
                break
            in_section = match.group(1).strip().lower() == title.lower()
            continue
        if in_section:
            body.append(line)
    return body if in_section else None


def _has_unresolved_questions(body: list[str]) -> bool:
    for line in body:
        value = re.sub(r"^\s*(?:[-*+]\s+|\d+[.)]\s+)", "", line).strip()
        if not value or value.startswith("<!--") or value.endswith("-->"):
            continue
        if value.lower().rstrip("。.!！") in _EMPTY_QUESTIONS:
            continue
        return True
    return False


def validate_prd(prd_path: Path) -> list[str]:
    """Validate the minimum PRD contract required before implementation."""
    errors: list[str] = []
    if not prd_path.is_file():
        return ["prd.md is missing"]

    try:
        content = prd_path.read_text(encoding="utf-8")
    except OSError as exc:
        return [f"prd.md cannot be read: {exc}"]
    if not content.strip():
        errors.append("prd.md is empty")

    acceptance = _section_body(content, "Acceptance Criteria")
    if acceptance is None:
        errors.append("prd.md is missing an 'Acceptance Criteria' section")
    elif not any(_CHECKBOX_RE.match(line) for line in acceptance):
        errors.append("Acceptance Criteria must contain at least one checklist item")

    questions = _section_body(content, "Open Questions")
    if questions is not None and _has_unresolved_questions(questions):
        errors.append("prd.md contains unresolved Open Questions")
    lowered = content.lower()
    for label, left, right in _CONFLICT_RULES:
        if re.search(left, lowered, re.IGNORECASE) and re.search(right, lowered, re.IGNORECASE):
            errors.append(f"prd.md contains conflicting rules: {label}")
    return errors


def _jsonl_entries(path: Path, repo_root: Path) -> tuple[int, list[str]]:
    if not path.is_file():
        return 0, [f"{path.name} is missing"]
    entries = 0
    errors: list[str] = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            errors.append(f"{path.name}:{line_number} contains invalid JSON")
            continue
        file_path = data.get("file")
        if not file_path:
            continue
        entries += 1
        target = repo_root / str(file_path).rstrip("/")
        if data.get("type", "file") == "directory":
            if not target.is_dir():
                errors.append(f"{path.name}:{line_number} references missing directory: {file_path}")
        elif not target.is_file():
            errors.append(f"{path.name}:{line_number} references missing file: {file_path}")
    return entries, errors


def validate_context_files(task_dir: Path, repo_root: Path) -> list[str]:
    """Validate JSONL only when the task opted into sub-agent context files."""
    files = [task_dir / "implement.jsonl", task_dir / "check.jsonl"]
    if not any(path.exists() for path in files):
        return []
    errors: list[str] = []
    for path in files:
        entries, entry_errors = _jsonl_entries(path, repo_root)
        errors.extend(entry_errors)
        if entries == 0:
            errors.append(f"{path.name} has no curated context entries (seed-only or empty)")
    return errors


def validate_task_readiness(
    task_dir: Path,
    repo_root: Path,
    task_data: dict,
) -> list[str]:
    """Return blocking reasons for a planning task entering implementation."""
    errors = validate_prd(task_dir / "prd.md")
    errors.extend(validate_context_files(task_dir, repo_root))

    requirements = task_data.get("requirements")
    if not isinstance(requirements, dict) or requirements.get("status") != "confirmed":
        errors.append("requirements are not confirmed; run 'task.py confirm <task-dir>'")
    else:
        expected_hash = requirements.get("prd_hash")
        prd_path = task_dir / "prd.md"
        current_hash: str | None = None
        if prd_path.is_file():
            try:
                current_hash = prd_hash(prd_path)
            except OSError:
                current_hash = None
        if not isinstance(expected_hash, str) or expected_hash != current_hash:
            errors.append("prd.md changed after confirmation; reconfirm the requirements")
    return errors
