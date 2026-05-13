# Rudder Local Skill Template

Copy this template to create a project-specific `rudder-local` skill.

---

## How to Use

1. Create directory: `mkdir -p .claude/skills/rudder-local`
2. Copy the template below to `.claude/skills/rudder-local/SKILL.md`
3. Replace `[PROJECT_NAME]` with your project name
4. Update version info

---

## Template

```markdown
---
name: rudder-local
description: |
  Project-specific Rudder customizations for [PROJECT_NAME].
  This skill documents all modifications made to the vanilla Rudder system.
  Inherits from rudder-meta for base architecture documentation.
  Use this skill to understand what's been customized in this project's Rudder setup.
---

# Rudder Local - [PROJECT_NAME]

## Overview

This skill documents all customizations made to Rudder in this project. For vanilla Rudder documentation, see the `rudder-meta` skill.

## Base Information

| Field | Value |
|-------|-------|
| Rudder Version | X.X.X |
| Date Initialized | YYYY-MM-DD |
| Last Updated | YYYY-MM-DD |

---

## Customizations Summary

Quick reference of what's been modified:

- **Commands**: X added, Y modified
- **Agents**: X added, Y modified
- **Hooks**: X modified
- **Specs**: X categories added
- **Workflow**: [summary of changes]

---

## Commands

### Added Commands

<!-- Template for new command:
#### /rudder:command-name [ALL]
- **File**: `.claude/commands/rudder/command-name.md`
- **Platform**: [ALL] or [CC] (Claude Code only)
- **Purpose**: [what it does]
- **Added**: YYYY-MM-DD
- **Reason**: [why it was added]
-->

(none yet)

### Modified Commands

<!-- Template for modified command:
#### /rudder:command-name
- **File**: `.claude/commands/rudder/command-name.md`
- **Change**: [what was changed]
- **Date**: YYYY-MM-DD
- **Reason**: [why it was changed]
-->

(none yet)

---

## Agents

> **Note**: Agent auto-loading is [CC] (Claude Code only). On Cursor, agents are read manually.

### Added Agents

<!-- Template for new agent:
#### agent-name [CC]
- **File**: `.claude/agents/agent-name.md`
- **Platform**: [CC] (auto-load) or [ALL] (manual read works on Cursor)
- **Purpose**: [what it does]
- **Tools**: [allowed tools]
- **Added**: YYYY-MM-DD
- **Reason**: [why it was added]
-->

(none yet)

### Modified Agents

<!-- Template for modified agent:
#### agent-name
- **File**: `.claude/agents/agent-name.md`
- **Change**: [what was changed]
- **Date**: YYYY-MM-DD
- **Reason**: [why it was changed]
-->

(none yet)

---

## Hooks [CC]

> **Claude Code Only**: Hooks require Claude Code's hook system. Not available on Cursor.

### Modified Hooks

<!-- Template for hook modification:
#### hook-filename.py [CC]
- **Hook Event**: [SessionStart/PreToolUse/SubagentStop]
- **Change**: [description of change]
- **Lines Modified**: [line numbers]
- **Date**: YYYY-MM-DD
- **Reason**: [why it was changed]

**Before**:
```python
# original code
```

**After**:
```python
# modified code
```
-->

(none yet)

---

## Specs

### Added Categories

<!-- Template for new spec category:
#### Category Name
- **Path**: `.rudder/spec/category-name/`
- **Files**: [list of files]
- **Purpose**: [what standards it covers]
- **Added**: YYYY-MM-DD
-->

(none yet)

### Modified Specs

<!-- Template for modified spec:
#### spec-name.md
- **Path**: `.rudder/spec/category/spec-name.md`
- **Change**: [what was changed]
- **Date**: YYYY-MM-DD
- **Reason**: [why it was changed]
-->

(none yet)

---

## Workflow Changes

### Task Configuration

<!-- Template for task config changes:
#### Change Name
- **What**: [description]
- **Files Affected**: [list]
- **Date**: YYYY-MM-DD
-->

(none yet)

### JSONL Templates

<!-- Template for JSONL template changes:
#### jsonl-file.jsonl
- **Default Type**: [which dev_type]
- **Change**: [what was changed]
- **Date**: YYYY-MM-DD
-->

(none yet)

---

## worktree.yaml Customizations

```yaml
# Document any changes to worktree.yaml here
```

(using defaults)

---

## Changelog

Record all changes chronologically.

### YYYY-MM-DD - Initial Setup
- Initialized rudder-local skill
- Base Rudder version: X.X.X

<!-- Template for changelog entry:
### YYYY-MM-DD - Change Title
- [Change 1]
- [Change 2]
- Reason: [why these changes were made]
-->

---

## Migration Notes

Document any special steps needed when upgrading Rudder.

<!-- Template:
### Upgrade to Rudder X.Y.Z
- [ ] Check if custom hooks conflict with new version
- [ ] Merge new agent definitions
- [ ] Update JSONL templates
- [ ] Test custom commands
-->

(none yet)

---

## Known Issues

Track any issues with customizations.

<!-- Template:
### Issue Title
- **Status**: Open/Resolved
- **Description**: [what's wrong]
- **Workaround**: [if any]
- **Related Files**: [list]
-->

(none yet)
```

---

## Automation Script

To auto-create the skill, run:

```bash
#!/bin/bash
# create-rudder-local.sh

PROJECT_NAME="${1:-$(basename $(pwd))}"
SKILL_DIR=".claude/skills/rudder-local"

mkdir -p "$SKILL_DIR"

cat > "$SKILL_DIR/SKILL.md" << 'EOF'
---
name: rudder-local
description: |
  Project-specific Rudder customizations for PROJECT_NAME_PLACEHOLDER.
  This skill documents all modifications made to the vanilla Rudder system.
  Inherits from rudder-meta for base architecture documentation.
---

# Rudder Local - PROJECT_NAME_PLACEHOLDER

## Base Information

| Field | Value |
|-------|-------|
| Rudder Version | $(cat package.json 2>/dev/null | grep version | head -1 | cut -d'"' -f4 || echo "unknown") |
| Date Initialized | $(date +%Y-%m-%d) |
| Last Updated | $(date +%Y-%m-%d) |

## Customizations

(none yet - document changes as you make them)

## Changelog

### $(date +%Y-%m-%d) - Initial Setup
- Initialized rudder-local skill
EOF

sed -i '' "s/PROJECT_NAME_PLACEHOLDER/$PROJECT_NAME/g" "$SKILL_DIR/SKILL.md"

echo "Created $SKILL_DIR/SKILL.md for project: $PROJECT_NAME"
```
