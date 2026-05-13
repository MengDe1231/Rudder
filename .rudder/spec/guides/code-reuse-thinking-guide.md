# Code Reuse Thinking Guide

> **Purpose**: Stop and think before creating new code - does it already exist?

---

## The Problem

**Duplicated code is the #1 source of inconsistency bugs.**

When you copy-paste or rewrite existing logic:
- Bug fixes don't propagate
- Behavior diverges over time
- Codebase becomes harder to understand

---

## Before Writing New Code

### Step 1: Search First

```bash
# Search for similar function names
grep -r "functionName" .

# Search for similar logic
grep -r "keyword" .
```

### Step 2: Ask These Questions

| Question | If Yes... |
|----------|-----------|
| Does a similar function exist? | Use or extend it |
| Is this pattern used elsewhere? | Follow the existing pattern |
| Could this be a shared utility? | Create it in the right place |
| Am I copying code from another file? | **STOP** - extract to shared |

---

## Common Duplication Patterns

### Pattern 1: Copy-Paste Functions

**Bad**: Copying a validation function to another file

**Good**: Extract to shared utilities, import where needed

### Pattern 2: Similar Components

**Bad**: Creating a new component that's 80% similar to existing

**Good**: Extend existing component with props/variants

### Pattern 3: Repeated Constants

**Bad**: Defining the same constant in multiple files

**Good**: Single source of truth, import everywhere

---

## When to Abstract

**Abstract when**:
- Same code appears 3+ times
- Logic is complex enough to have bugs
- Multiple people might need this

**Don't abstract when**:
- Only used once
- Trivial one-liner
- Abstraction would be more complex than duplication

---

## After Batch Modifications

When you've made similar changes to multiple files:

1. **Review**: Did you catch all instances?
2. **Search**: Run grep to find any missed
3. **Consider**: Should this be abstracted?

---

## Checklist Before Commit

- [ ] Searched for existing similar code
- [ ] No copy-pasted logic that should be shared
- [ ] Constants defined in one place
- [ ] Similar patterns follow same structure

---

## Gotcha: Python if/elif/else Exhaustive Check

**Problem**: Python's if/elif/else chains have no compile-time exhaustive check. When you add a new value to a `Literal` type (e.g., `Platform`), existing if/elif/else chains silently fall through to `else` with wrong defaults.

**Symptom**: New platform works partially — some methods return Claude defaults instead of platform-specific values. No error is raised.

**Example** (`cli_adapter.py`):
```python
# BAD: "gemini" falls through to else, returns "claude"
@property
def cli_name(self) -> str:
    if self.platform == "opencode":
        return "opencode"
    else:
        return "claude"  # gemini silently gets "claude"!

# GOOD: explicit branch for every platform
@property
def cli_name(self) -> str:
    if self.platform == "opencode":
        return "opencode"
    elif self.platform == "gemini":
        return "gemini"
    else:
        return "claude"
```

**Prevention**: When adding a new value to a Python `Literal` type, search for ALL if/elif/else chains that switch on that type and add explicit branches. Don't rely on `else` being correct for new values.

---

## Gotcha: Asymmetric Mechanisms Producing Same Output

**Problem**: When two different mechanisms must produce the same file set (e.g., recursive directory copy for init vs. manual `files.set()` for update), structural changes (renaming, moving, adding subdirectories) only propagate through the automatic mechanism. The manual one silently drifts.

**Symptom**: Init works perfectly, but update creates files at wrong paths or misses files entirely.

**Prevention**:
- **Best**: Eliminate the asymmetry — have the manual path call the automatic one (e.g., `collectTemplateFiles()` calls `getAllScripts()` instead of maintaining its own list)
- **If asymmetry is unavoidable**: Add a regression test that compares outputs from both mechanisms
- When migrating directory structures, search for ALL code paths that reference the old structure

**Real example**: `rudder update` had a manual `files.set()` list for 11 scripts that `getAllScripts()` already tracked. Fix: replaced the manual list with a `for..of getAllScripts()` loop. See `update.ts` refactor in v0.4.0-beta.3.

---

## Template File Registration (Rudder-specific)

When adding new files to `src/templates/rudder/scripts/`:

**Single registration point**: `src/templates/rudder/index.ts`

1. Add `export const xxxScript = readTemplate("scripts/path/file.py");`
2. Add to `getAllScripts()` Map

That's it. `commands/update.ts` uses `getAllScripts()` directly — no manual sync needed.

**Why this matters**: Without registration in `getAllScripts()`, `rudder update` won't sync the file to user projects. Bug fixes and features won't propagate.

**History**: Before v0.4.0-beta.3, `update.ts` had its own hand-maintained file list that frequently fell out of sync with `getAllScripts()`. This caused 11 Python files to be silently skipped during `rudder update`. The fix was to eliminate the duplicate list and use `getAllScripts()` as the single source of truth.

### Quick Checklist for New Scripts

```bash
# After adding a new .py file, verify it's in getAllScripts():
grep -l "newFileName" src/templates/rudder/index.ts  # Should match
```

### Template Sync Convention

`.rudder/scripts/` (dogfooded) and `packages/cli/src/templates/rudder/scripts/` (template) must stay identical. After editing `.rudder/scripts/`, always sync:

```bash
rsync -av --delete --exclude='__pycache__' .rudder/scripts/ packages/cli/src/templates/rudder/scripts/
```

**Gotcha**: Running rsync with wrong source/destination paths can create nested garbage directories (e.g., `.rudder/scripts/packages/cli/...`). Always double-check paths before running.
