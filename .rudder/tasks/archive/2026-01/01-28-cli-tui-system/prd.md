# Refactor Command Paths to rudder/ Namespace

## Goal

将所有 Rudder 提供的 slash commands 从扁平目录结构迁移到 `rudder/` 命名空间子目录，使命令调用从 `/start` 变为 `/rudder:start`，与业界惯例（OpenSpec 的 `/openspec:*`、Spec-Kit 的 `/speckit:*`）保持一致。

## Why

1. **品牌识别** - 用户一眼就能识别这是 Rudder 提供的命令
2. **避免冲突** - 用户自定义命令不会与 Rudder 命令冲突
3. **符合业界惯例** - OpenSpec、Spec-Kit 等项目都采用类似的命名空间模式
4. **可扩展性** - 为将来添加更多命令类别预留空间

## Requirements

### 1. 目录结构变更

**Before:**
```
.claude/commands/
├── start.md
├── finish-work.md
└── ...

.cursor/commands/
├── start.md
├── finish-work.md
└── ...
```

**After:**
```
.claude/commands/
└── rudder/
    ├── start.md          # 调用: /rudder:start
    ├── finish-work.md    # 调用: /rudder:finish-work
    └── ...

.cursor/commands/
└── rudder/
    ├── start.md          # 调用: /rudder:start
    ├── finish-work.md    # 调用: /rudder:finish-work
    └── ...
```

### 2. 命令重命名映射

| 旧命令 | 新命令 |
|--------|--------|
| `/start` | `/rudder:start` |
| `/finish-work` | `/rudder:finish-work` |
| `/record-session` | `/rudder:record-session` |
| `/parallel` | `/rudder:parallel` |
| `/before-frontend-dev` | `/rudder:before-frontend-dev` |
| `/before-backend-dev` | `/rudder:before-backend-dev` |
| `/check-frontend` | `/rudder:check-frontend` |
| `/check-backend` | `/rudder:check-backend` |
| `/check-cross-layer` | `/rudder:check-cross-layer` |
| `/break-loop` | `/rudder:break-loop` |
| `/create-command` | `/rudder:create-command` |
| `/integrate-skill` | `/rudder:integrate-skill` |
| `/update-spec` | `/rudder:update-spec` |
| `/onboard` | `/rudder:onboard` |

## Implementation Plan

### Phase 1: 文件移动

移动模板文件到 rudder/ 子目录：

```bash
# Claude commands (14 files)
src/templates/claude/commands/*.md → src/templates/claude/commands/rudder/*.md

# Cursor commands (13 files)
src/templates/cursor/commands/*.md → src/templates/cursor/commands/rudder/*.md
```

### Phase 2: TypeScript 代码修改

| 文件 | 行号 | 修改 |
|------|------|------|
| `src/templates/claude/index.ts` | 66 | `listFiles("commands")` → `listFiles("commands/rudder")` |
| `src/templates/claude/index.ts` | 71 | `` `commands/${file}` `` → `` `commands/rudder/${file}` `` |
| `src/templates/cursor/index.ts` | 44 | `listFiles("commands")` → `listFiles("commands/rudder")` |
| `src/templates/cursor/index.ts` | 49 | `` `commands/${file}` `` → `` `commands/rudder/${file}` `` |
| `src/commands/update.ts` | 224 | `.claude/commands/${name}.md` → `.claude/commands/rudder/${name}.md` |
| `src/commands/update.ts` | 230 | `.cursor/commands/${name}.md` → `.cursor/commands/rudder/${name}.md` |
| `src/templates/extract.ts` | 134, 145 | 更新文档注释中的路径示例 |

### Phase 3: Python Hooks 修改

**inject-subagent-context.py** (两个位置: `.claude/hooks/` 和 `src/templates/claude/hooks/`)

| 行号 | 修改 |
|------|------|
| 328-331 | 更新 check_files 列表中的路径 |
| 372, 375 | 更新 finish-work.md 路径 |
| 411-413 | 更新 check_files 列表中的路径 |

**session-start.py** (两个位置)

| 行号 | 修改 |
|------|------|
| 112 | `commands / "start.md"` → `commands / "rudder" / "start.md"` |

### Phase 4: Shell 脚本修改

**task.sh** (两个位置: `.rudder/scripts/` 和 `src/templates/rudder/scripts/`)

| 行号 | 修改 |
|------|------|
| 90 | `.claude/commands/finish-work.md` → `.claude/commands/rudder/finish-work.md` |
| 95, 108 | `.claude/commands/check-backend.md` → `.claude/commands/rudder/check-backend.md` |
| 98, 111 | `.claude/commands/check-frontend.md` → `.claude/commands/rudder/check-frontend.md` |

**create-bootstrap.sh** (两个位置)

| 行号 | 修改 |
|------|------|
| 163 | `/before-*-dev` → `/rudder:before-*-dev` |
| 164 | `/check-*` → `/rudder:check-*` |

### Phase 5: Markdown 文档批量替换

使用 sed 或脚本进行批量替换：

```bash
# 替换规则 (注意顺序，先替换长的避免误替换)
/before-frontend-dev → /rudder:before-frontend-dev
/before-backend-dev → /rudder:before-backend-dev
/check-cross-layer → /rudder:check-cross-layer
/record-session → /rudder:record-session
/integrate-skill → /rudder:integrate-skill
/create-command → /rudder:create-command
/check-frontend → /rudder:check-frontend
/check-backend → /rudder:check-backend
/finish-work → /rudder:finish-work
/break-loop → /rudder:break-loop
/update-spec → /rudder:update-spec
/parallel → /rudder:parallel
/onboard → /rudder:onboard
/start → /rudder:start
```

**需要处理的文件**:

1. **README 文件**
   - `README.md`
   - `README_CN.md`
   - `AGENTS.md`

2. **文档目录**
   - `docs/guide.md`
   - `docs/guide-zh.md`

3. **Workflow 文档**
   - `.rudder/workflow.md`
   - `src/templates/rudder/workflow.md`

4. **Spec 文件**
   - `.rudder/spec/backend/logging-guidelines.md`

5. **模板 Markdown**
   - `src/templates/markdown/agents.md`

6. **Command 文件本身** (互相引用)
   - `src/templates/claude/commands/rudder/*.md` (14 files)
   - `src/templates/cursor/commands/rudder/*.md` (13 files)

### Phase 6: 项目自身 .claude/.cursor 目录更新

由于 Rudder 项目自身也使用这些命令（dogfooding），需要同步更新：

```bash
# 移动文件
.claude/commands/*.md → .claude/commands/rudder/*.md
.cursor/commands/*.md → .cursor/commands/rudder/*.md
```

## Acceptance Criteria

- [ ] 所有命令文件移动到 `commands/rudder/` 子目录
- [ ] TypeScript 代码能正确读取和写入新路径
- [ ] Python hooks 能正确引用新路径下的文件
- [ ] Shell 脚本中的路径引用更新完成
- [ ] 所有文档中的命令引用更新为 `/rudder:*` 格式
- [ ] `rudder init` 在新项目中生成正确的目录结构
- [ ] `rudder update` 能正确更新现有项目的命令文件
- [ ] Lint 和 TypeCheck 通过
- [ ] 项目自身的 .claude/.cursor 目录同步更新

## Technical Notes

### 注意事项

1. **替换顺序很重要** - 先替换长命令名避免误替换（如 `/check-frontend` 要在 `/check` 之前）
2. **不要替换路径中的斜杠** - `.claude/commands/` 中的 `/` 不是命令前缀
3. **保留历史记录** - `.rudder/workspace/*/journal-*.md` 中的历史记录可以不更新
4. **模板和运行时同步** - `src/templates/` 和项目根目录的文件要同步修改

### 文件统计

| 类型 | 文件数 | 预估修改点 |
|------|--------|-----------|
| 文件移动 | 27 | - |
| TypeScript | 5 | ~10 |
| Python Hooks | 4 | ~20 |
| Shell Scripts | 4 | ~10 |
| Markdown 文档 | 40+ | 300+ |
| **总计** | **80+** | **340+** |

## Migration Guide (for existing users)

用户升级到新版本后，需要运行：

```bash
rudder update
```

这会自动将 `.claude/commands/*.md` 和 `.cursor/commands/*.md` 迁移到新的 `rudder/` 子目录结构。
