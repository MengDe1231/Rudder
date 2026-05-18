#!/usr/bin/env python3
"""
Standalone reader for .rudder/config.yaml.

Mirrors a minimal subset of common.config so callers (hooks, workflow_phase)
can read configuration without importing the full task/repo helpers. Returns
an empty dict on missing/malformed files so callers stay simple.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional


CONFIG_REL_PATH = ".rudder/config.yaml"


def _unquote(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
        return value[1:-1]
    return value


def _strip_inline_comment(value: str) -> str:
    """Strip ` # …` inline comments while preserving `#` inside quoted strings.

    YAML treats ` #` (space-hash) as a comment opener; bare `#` inside a token
    is part of the value. Quoted strings are immune.
    """
    in_quote: str | None = None
    for idx, ch in enumerate(value):
        if in_quote:
            if ch == in_quote:
                in_quote = None
            continue
        if ch in ('"', "'"):
            in_quote = ch
            continue
        if ch == "#" and (idx == 0 or value[idx - 1].isspace()):
            return value[:idx]
    return value


def _next_content_line(lines: list[str], start: int) -> tuple[int, str]:
    i = start
    while i < len(lines):
        stripped = lines[i].strip()
        if stripped and not stripped.startswith("#"):
            return i, lines[i]
        i += 1
    return i, ""


def _parse_yaml_block(
    lines: list[str], start: int, min_indent: int, target: dict
) -> int:
    i = start
    current_list: list | None = None

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped or stripped.startswith("#"):
            i += 1
            continue

        indent = len(line) - len(line.lstrip())
        if indent < min_indent:
            break

        if stripped.startswith("- "):
            if current_list is not None:
                current_list.append(_unquote(stripped[2:].strip()))
            i += 1
        elif ":" in stripped:
            key, _, value = stripped.partition(":")
            key = key.strip()
            value = _strip_inline_comment(value).strip()
            value = _unquote(value)
            current_list = None

            if value:
                target[key] = value
                i += 1
            else:
                next_i, next_line = _next_content_line(lines, i + 1)
                if next_i >= len(lines):
                    target[key] = {}
                    i = next_i
                elif next_line.strip().startswith("- "):
                    current_list = []
                    target[key] = current_list
                    i += 1
                else:
                    next_indent = len(next_line) - len(next_line.lstrip())
                    if next_indent > indent:
                        nested: dict = {}
                        target[key] = nested
                        i = _parse_yaml_block(lines, i + 1, next_indent, nested)
                    else:
                        target[key] = {}
                        i += 1
        else:
            i += 1

    return i


def parse_simple_yaml(content: str) -> dict:
    """Parse a small subset of YAML. See common.config for full doc."""
    lines = content.splitlines()
    result: dict = {}
    _parse_yaml_block(lines, 0, 0, result)
    return result


def read_rudder_config(repo_root: Optional[Path] = None) -> dict:
    """Read .rudder/config.yaml. Returns {} on missing or malformed file."""
    root = repo_root or Path.cwd()
    config_file = root / CONFIG_REL_PATH
    try:
        content = config_file.read_text(encoding="utf-8")
    except (FileNotFoundError, OSError):
        return {}
    try:
        parsed = parse_simple_yaml(content)
    except Exception:
        return {}
    return parsed if isinstance(parsed, dict) else {}


# =============================================================================
# Tool Path Configuration (mirrors config.py for hook usage)
# =============================================================================

LOCAL_CONFIG_FILE = "config_local.yml"


def _load_local_config(repo_root: Optional[Path] = None) -> dict:
    """Load .rudder/config_local.yml (personal overrides). Returns {} on missing."""
    root = repo_root or Path.cwd()
    local_config_file = root / ".rudder" / LOCAL_CONFIG_FILE
    try:
        content = local_config_file.read_text(encoding="utf-8")
        return parse_simple_yaml(content)
    except (OSError, IOError):
        return {}


def resolve_tools(repo_root: Optional[Path] = None) -> dict[str, dict]:
    """Merge tools from config.yaml with local path overrides.

    config_local.yml wins on path; config.yaml declares what tools are needed.
    """
    root = repo_root or Path.cwd()
    config = read_rudder_config(root)
    tools = config.get("tools")
    if not isinstance(tools, dict):
        return {}

    local = _load_local_config(root)
    local_tools = local.get("tools")
    overrides: dict[str, dict] = {}
    if isinstance(local_tools, dict):
        for name, cfg in local_tools.items():
            if isinstance(cfg, dict):
                overrides[name] = cfg

    result: dict[str, dict] = {}
    for name, cfg in tools.items():
        merged = cfg if isinstance(cfg, dict) else {"version": str(cfg)}
        if name in overrides:
            for k, v in overrides[name].items():
                merged[k] = v
        result[name] = merged

    return result


def get_code_auto_commit(repo_root: Optional[Path] = None) -> bool:
    """Whether Phase 3.4 should auto-commit code without user confirmation.

    Default: False — AI shows changes, states commit message, and asks
    for user confirmation (Y/n) before committing.
    Set ``code_auto_commit: true`` to skip the confirmation step.
    """
    root = repo_root or Path.cwd()
    config = read_rudder_config(root)
    raw = config.get("code_auto_commit", False)
    if isinstance(raw, bool):
        return raw
    s = str(raw).strip().lower()
    return s in ("true", "yes", "1", "on")
