# fix(scripts): respect .gitignore — `session_auto_commit` config + remove 0.5.10 auto -f retry

## Goal

修两件事一并解决，覆盖两个 issue：

1. **0.5.10 auto -f retry 是过度修复**（regression）：当用户 `.gitignore` 把 `.rudder/` 整体排除时，我们的脚本自动 `git add -f -- <specific>` 把 journal/task 强行入仓，绕过用户意图。bug 现象：群友截图显示 finish-work 自动 commit `.rudder/workspace/` 进了 repo，违反"`.rudder/` 留本地"的预期
2. **#245 cryzlasm**："想 auto add 但不 auto commit，让我手动 review" —— 当前没有这个开关

合一修：加一个 `session_auto_commit` 配置项三档（full / stage / none），同时**完全撤掉 0.5.10 的 auto -f retry**。

## Decisions (locked)

- **Config key**：`session_auto_commit`（顶层 flat，跟 `session_commit_message` / `max_journal_lines` 风格一致）
- **值**：`true | false`（boolean）
- **默认**：`true`（保持现有 behavior，不破坏现有用户预期）
- **作用范围**：governs 两处 auto-commit
  - `add_session.py:_auto_commit_workspace`
  - `task_store.py:_auto_commit_archive`（即 `task.py archive`）
- **0.5.10 auto -f retry**：完全取消。任一情况下 plain `git add` 失败含 `ignored by` → warn + skip，**不再自动 -f**
- **warning 文本**：保留 0.5.10 的反例（`Do NOT use \`git add -f .rudder/\``）。加一段：用户可设 `session_auto_commit: false` 让脚本不动 git，然后自己 `git status` / `git add` / `git commit` 决定是否入仓

## 行为表

| `session_auto_commit` | git add | git commit | ignored 时 |
|---|---|---|---|
| `true` (default) | plain `git add <specific>` | ✓ | warn + skip 整个 auto-commit（不 -f） |
| `false` | ✗ | ✗ | n/a（journal/archive 文件还是写出，只是不动 git；用户自行 review + manual git） |

`false` 同时覆盖两个 use case：
- screenshot user：`.rudder/` 留本地，脚本不动 git ✓
- #245 cryzlasm "auto add 但不 commit"：用户跑 `git add .rudder/workspace .rudder/tasks` + 自己 `git commit`，只多一步但获得 review window ✓

## Requirements

### `templates/rudder/scripts/common/safe_commit.py`

修改 `safe_git_add(paths, repo_root)` 函数：
- **删除** auto -f retry 分支
- 行为简化：plain `git add -- <paths>` 一次。成功 → returns `(True, False, "")`；失败 → returns `(False, False, stderr)`
- 第二个返回值 `used_force` 一律 `False`（保留 signature 兼容，但永远不会 -f）

更新 `print_gitignore_warning(paths)`：
- 保留反例 `Do NOT use \`git add -f .rudder/\``
- 加新行说明 `session_auto_commit` 配置的三档语义 + 让用户决定

### `templates/rudder/scripts/common/config.py`

新加：
```python
def get_session_auto_commit(repo_root) -> bool:
    """Returns True (default) or False. Accepts true/false/yes/no/1/0/on/off
    case-insensitively. Invalid values fall back to True with stderr warn."""
    cfg = read_rudder_config(repo_root)
    raw = cfg.get("session_auto_commit", True)
    if isinstance(raw, bool):
        return raw
    s = str(raw).strip().lower()
    if s in ("true", "yes", "1", "on"):
        return True
    if s in ("false", "no", "0", "off"):
        return False
    print(f"[WARN] invalid session_auto_commit value: {raw!r}; using true (default)", file=sys.stderr)
    return True
```

### `templates/rudder/scripts/add_session.py:_auto_commit_workspace`

```python
def _auto_commit_workspace(repo_root):
    if not get_session_auto_commit(repo_root):
        return  # session_auto_commit: false → skip entirely

    paths = safe_rudder_paths_to_add(repo_root)
    if not paths:
        return

    success, _, stderr = safe_git_add(paths, repo_root)
    if not success:
        print_gitignore_warning(paths, stderr)
        return

    # ... existing commit logic (unchanged)
```

### `templates/rudder/scripts/common/task_store.py:_auto_commit_archive`

同上结构改造。

### `templates/rudder/config.yaml`

加注释段说明新 key：
```yaml
# Auto-commit behavior for session journal + task archive operations.
# - full (default): auto-add + auto-commit
# - stage: auto-add but no auto-commit (you commit manually after review)
# - none: skip auto-add and auto-commit entirely (journal/archive files
#   are still written to disk; just not staged in git)
#
# session_auto_commit: full
```

## Acceptance Criteria

- [ ] 用户在 `.rudder/config.yaml` 写 `session_auto_commit: stage` → 跑 `finish-work` / `add_session.py` 后只 stage、不 commit；status 看到 staged journal/task
- [ ] `session_auto_commit: none` → 既不 add 也不 commit，文件依然写入 `.rudder/workspace/...`
- [ ] `session_auto_commit: full` (default) → 跟现状一样 add + commit
- [ ] 用户 `.gitignore` 含 `.rudder/` 时（任意 mode）→ plain `git add` 失败 → warn + skip，**绝不 -f**
- [ ] warning 文本含 `Do NOT use \`git add -f .rudder/\`` + `session_auto_commit` 配置说明
- [ ] 无效 value（如 `session_auto_commit: maybe`）→ stderr warn + fallback `true`
- [ ] **YAML inline comment 兼容**：`session_auto_commit: false  # disable for this project` 必须正确解析为 `False`，不能因为尾随注释失效（之前 codex.dispatch_mode 踩过同坑，已有 `rudder_config.py:_strip_inline_comment` helper 必须覆盖此 key 路径）
- [ ] 大小写 / 同义词宽容：`true / True / TRUE / yes / 1 / on` → True；`false / False / FALSE / no / 0 / off` → False；boolean YAML 原生 `true` / `false` 也认
- [ ] `task.py archive` 同样三档 governed
- [ ] 单元测试覆盖三档 × ignored / not-ignored × add_session / task_archive
- [ ] regression test 删掉 0.5.10 加的"auto-commits via -f when .rudder/ is ignored"用例，改成"warns and skips when ignored"
- [ ] `pnpm lint / typecheck / test` 全绿

## Definition of Done

- 1 个 commit on main
- ship 0.5.11 (cherry-pick 到 feat/v0.6.0-beta → 0.6.0-beta.6)
- close issue #245
- changelog: 新 config + 0.5.10 -f retry 撤销
- spec：`commands-mem.md` 不动；可能动 `script-conventions.md` 描述 session auto-commit

## Out of Scope

- 把 `session_commit_message` 也 migrate 到 nested `session.*`（schema 重构留 follow-up）
- 加 `task_auto_commit` 单独 key（先共用 `session_auto_commit`）
- 改 `templates/markdown/gitignore.txt` 默认模板（不主动加 `.rudder/`）
- 教育文档（如何写正确的 .gitignore）

## Technical Notes

- `safe_commit.py` 已经在 0.5.10 加了。这次是窄 patch 改它的 retry 行为
- 测试入口：`packages/cli/test/regression.test.ts` 里 0.5.10 加的 4 个 cases 之一需要重写
- 群友截图（screenshot）跟 issue #245 是同一个 root cause（auto-commit 不可控），用同一 fix 解决
- **YAML 解析坑**：`scripts/common/rudder_config.py` 已有 `_strip_inline_comment` helper（在 codex.dispatch_mode 时引入）。新 `get_session_auto_commit` 必须复用同一解析路径——sub-agent 应当 grep 现有 `cfg.get("session_commit_message")` / `cfg.get("max_journal_lines")` 怎么读的，**遵循同样路径**确保 inline comment 已被剥离。fixture 测试必须含 `session_auto_commit: false  # comment` 这种带尾注释的形式
