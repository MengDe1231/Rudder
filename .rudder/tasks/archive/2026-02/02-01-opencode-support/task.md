# OpenCode 适配任务清单

基于 PRD 中的 36 个设计决策，整理需要实现的具体任务。

## 整体进度

| Phase | 状态 | 描述 |
|-------|------|------|
| Phase 1 | ✅ 已完成 | CLI Adapter（2026-02-02） |
| Phase 2 | ✅ 已完成 | Multi-Session 脚本适配（2026-02-02） |
| Phase 3 | ✅ 已完成 | Plugins（2026-02-02 完成并验证） |
| Phase 4 | ✅ 已完成 | Agent 定义 |
| Phase 5 | ✅ 已完成 | Commands 迁移 |
| Phase 6 | ✅ 已完成 | Init 流程适配（2026-02-02） |
| Phase 7 | ✅ 已完成 | 日志解析适配（2026-02-02） |

### Phase 3 验证结果（2026-02-02）

| 功能 | 场景 | 状态 |
|------|------|------|
| session-start | OpenCode + omo（交互式） | ✅ omo 处理 |
| session-start | OpenCode + omo（非交互式） | ✅ 两者都跳过 |
| session-start | 纯 OpenCode（交互式） | ✅ plugin 处理 |
| session-start | 纯 OpenCode（非交互式） | ✅ plugin 跳过 |
| inject-subagent | OpenCode + omo | ✅ omo + Python hook 处理 |
| inject-subagent | 纯 OpenCode | ⚠️ 架构限制，使用 Self-Loading 降级 |

---

## 🔥 重大发现：oh-my-opencode 兼容层

**发现时间**：2026-02-01
**更新时间**：2026-02-02

### 核心发现

**oh-my-opencode (omo)** 插件提供了 Claude Code 兼容层，会自动加载 `.claude/` 目录下的资源：

| 资源类型 | Claude Code 路径 | oh-my-opencode 行为 |
|----------|------------------|---------------------|
| Hooks | `.claude/hooks/*.py` | ✅ 自动加载执行 |
| Commands | `.claude/commands/` | ✅ 自动加载 |
| Agents | `.claude/agents/` | ✅ 自动加载 |
| MCP Servers | `.claude/` | ✅ 自动加载 |

**来源**：https://deepwiki.com/fractalmind-ai/oh-my-opencode/8.1-claude-code-compatibility

### omo 检测方式（2026-02-02 更新）

```javascript
// 优先级顺序
1. ~/.config/opencode/oh-my-opencode.json 存在 → omo 已安装
2. ~/.config/opencode/opencode.json 的 plugin 数组包含 "oh-my-opencode" → omo 已安装
```

### 与 omo 共存的解决方案

**问题**：omo 会注入自己的上下文（Sisyphus agent），我们的 plugin 也注入 Rudder 上下文，两者需要共存。

**解决方案**：使用 `prepend to text` 方式注入（而非 `synthetic part`）

```javascript
// ✅ 正确方式：直接修改 text（与 omo 兼容）
const originalText = lastUserMessage.parts[textPartIndex].text || ""
lastUserMessage.parts[textPartIndex].text = `${context}\n\n---\n\n${originalText}`

// ❌ 错误方式：synthetic part（可能与 omo 冲突）
lastUserMessage.parts.splice(textPartIndex, 0, syntheticPart)
```

**结果**：Rudder 和 omo 的上下文都能成功注入。

### 兼容性矩阵

| 环境 | 处理者 | 说明 |
|------|--------|------|
| 纯 OpenCode（无 omo） | `.opencode/plugin/*.js` | plugin 处理 |
| OpenCode + omo（无 .claude/hooks/） | `.opencode/plugin/*.js` | plugin 处理 |
| OpenCode + omo（有 .claude/hooks/） | `.claude/hooks/*.py` | omo 处理，plugin 跳过 |

---

## 新发现的 Edge Cases

1. ✅ **Phase 追踪缺失**：`inject-subagent-context.js` 已添加 `updateCurrentPhase()` 逻辑
2. ✅ **Session ID 提取**（2026-02-02 验证）：
   - OpenCode 日志格式：`{"sessionID": "ses_xxx", ...}`
   - 正则提取：`ses_[a-zA-Z0-9]+` ✅ 工作正常
   - Session Resume：`opencode run --session <id>` ✅ 已验证能恢复上下文
3. ✅ **Non-Interactive 环境变量**（2026-02-02 完善）

   **⚠️ 重要设计决策**：Multi-Agent 脚本需设置非交互标识防止 session-start 重复注入

   | 平台 | 环境变量 | 设置者 |
   |------|---------|--------|
   | Claude Code | `CLAUDE_NON_INTERACTIVE=1` | start.py, plan.py |
   | OpenCode | `OPENCODE_NON_INTERACTIVE=1` | start.py, plan.py |

   **必须检测两个变量的文件**：
   - `.claude/hooks/session-start.py` ✅ 已支持
   - `.opencode/plugin/session-start.js` ✅ 已支持

   **不需要检测的文件**：
   - `inject-subagent-context.*` - subagent 始终需要上下文
4. ✅ **Plugins 目录结构**：工具模块放 `.opencode/lib/`，plugin 放 `.opencode/plugin/`
5. ✅ **日志格式差异**（2026-02-02 完成）：`status.py` 支持两种日志格式
6. ✅ **恢复命令差异**（2026-02-02 验证）：
   - Claude Code: `claude --resume <id>`
   - OpenCode: `opencode run --session <id>`
   - `status.py` 使用 `get_cli_adapter(platform)` 生成平台特定命令
7. ✅ **Registry Platform 字段**（2026-02-02 完成）：`registry.json` 记录 `"platform": "opencode"`
8. ❌ **Ralph Loop**：OpenCode/omo 不需要，已删除

## ⚠️ 模板注意事项

**当前本地配置使用 Claude Max 反代 (localhost:3456)**，做模板时需要：
- [ ] Research OpenCode 标准 provider 配置方式
- [ ] 提供多种 provider 选项（Anthropic API、OpenAI、本地模型等）
- [ ] 模板中不能硬编码 localhost 地址

---

## Phase 1: CLI Adapter (P0) ✅ 已完成（2026-02-02）

### 1.1 创建 CLI Adapter 模块
- [x] 创建 `.rudder/scripts/common/cli_adapter.py`
- [x] 实现 `CLIAdapter.build_run_command()` - 构建运行命令
- [x] 实现 `CLIAdapter.get_agent_name()` - agent 名称映射（plan → rudder-plan）
- [x] 实现 `CLIAdapter.get_agent_path()` - 获取 agent 定义文件路径
- [x] 实现 `CLIAdapter.get_non_interactive_env()` - 非交互环境变量
- [x] 实现 `CLIAdapter.build_resume_command()` - 恢复命令
- [x] 实现 `CLIAdapter.extract_session_id_from_log()` - 从日志提取 session ID（OpenCode）

### 1.2 参数映射表

| 功能 | Claude Code | OpenCode |
|-----|-------------|----------|
| 非交互模式 | `-p` | `run` |
| 指定 agent | `--agent <name>` | `--agent <name>` |
| Session ID | `--session-id <uuid>` | 不支持创建时指定 |
| 恢复会话 | `--resume <id>` | `--session <id>` |
| 跳过权限 | `--dangerously-skip-permissions` | `--yolo` |
| JSON 输出 | `--output-format stream-json` | `--format json` |
| 详细日志 | `--verbose` | `--log-level DEBUG --print-logs` |
| 环境变量 | `CLAUDE_NON_INTERACTIVE=1` | 不需要（run 本身非交互） |

---

## Phase 2: Multi-Session 脚本适配 (P1) ✅ 已完成（2026-02-02）

### 2.1 修改 `start.py`
- [x] 添加 `--platform` 参数（默认 claude）
- [x] 使用 CLI adapter 构建命令
- [x] 根据平台设置非交互环境变量
- [x] 保存 platform 到 `registry.json`
- [x] OpenCode 分支：不传 `--session-id`
- [x] OpenCode 分支：启动后从日志提取 session ID（`ses_xxx` 格式）
- [x] 根据平台验证 agent 路径

### 2.2 修改 `plan.py`
- [x] 添加 `--platform` 参数
- [x] 使用 CLI adapter 构建命令
- [x] 验证 agent 存在（各平台路径不同）
- [x] Agent 名称映射：`plan` → `rudder-plan`（OpenCode）
- [x] 根据平台设置非交互环境变量

### 2.3 修改 `status.py`
- [x] 从 registry 读取 platform 字段
- [x] 根据 platform 输出正确的恢复命令
- [ ] 日志解析适配（移至 Phase 7）

### 2.4 修改 `registry.py`
- [x] `registry_add_agent()` 添加 platform 参数
- [x] 记录 `"platform": "claude"` 或 `"platform": "opencode"`

### 2.5 修改 `create_pr.py`
- [ ] 无需改动（纯 git 操作，平台无关）

### 2.6 修改 `cleanup.py`
- [ ] 无需改动（纯文件系统操作）

---

## Phase 3: Hooks → Plugins (P1) ✅ 已完成（2026-02-02 重构）

### 3.1 最终目录结构 ✅
```
.opencode/
├── lib/
│   └── rudder-context.js      # 统一上下文管理模块（非 plugin）
├── plugin/
│   ├── session-start.js        # chat.message + messages.transform
│   └── inject-subagent-context.js  # tool.execute.before (Task)
├── commands/
│   └── rudder/                # 命令文件（已从 .claude 复制）
└── agents/                     # Agent 定义（已从 .claude 复制）
```

**注意**：
- 工具模块放 `lib/`，不能放 `plugin/`（否则 OpenCode 会尝试加载为 plugin）
- 不需要 `opencode.json`（OpenCode 自动加载 plugin/ 和 commands/）
- 不需要 `ralph-loop.js`（OpenCode/omo 不需要此机制）

### 3.2 统一上下文管理模块 ✅ `rudder-context.js`
- [x] `RudderContext` 类：封装所有上下文操作
- [x] `isOmoInstalled()`: 检测 omo 安装（优先 oh-my-opencode.json）
- [x] `isOmoHooksEnabled()`: 检测 omo hooks 是否启用
- [x] `hasClaudeHook(hookName)`: 检测 .claude/hooks/ 文件
- [x] `shouldSkipHook(hookName)`: 决策是否跳过（让 omo 处理）
- [x] `readJsonlWithFiles()`: 读取 JSONL 并加载引用的文件/目录
- [x] `readDirectoryMdFiles()`: 读取目录下所有 .md 文件
- [x] `ContextCollector`: 跨 hook 通信的上下文收集器

### 3.3 Session Start Plugin ✅ `session-start.js`
- [x] 使用 `chat.message` + `experimental.chat.messages.transform` hooks
- [x] 调用 `get_context.py` 获取动态上下文
- [x] 注入 workflow、guidelines、instructions
- [x] 使用 `prepend to text` 方式注入（与 omo 兼容）
- [x] Non-Interactive 检测（`OPENCODE_NON_INTERACTIVE=1`）
- [x] 首次消息检测（通过 ContextCollector）

**已验证**（2026-02-02）：
- ✅ 交互模式：Rudder + omo 上下文同时注入成功
- ✅ Non-Interactive 模式：正确跳过注入（日志显示 `Skipping - non-interactive mode`）

**关键发现**：
- `chat.message` hook 用于构建和存储上下文
- `experimental.chat.messages.transform` hook 用于注入上下文
- 必须用 `prepend to text` 方式，不能用 `synthetic part`（与 omo 冲突）

### 3.4 Subagent Context Injection Plugin ⚠️ `inject-subagent-context.js`

**🔴 重大发现（2026-02-02）**：

**项目级 plugin (.opencode/plugin/) 不支持 `tool.execute.before` hook！**

测试验证：
1. 添加 `event` hook 监听所有事件 → 收到 `session.*`, `message.*` 事件
2. 触发 Task 工具调用 → **tool.execute.before 不触发**
3. 禁用 omo 后重新测试 → **仍然不触发**
4. 查看 omo 源码 → omo 作为**全局 plugin** 能正常使用此 hook

**根本原因**：
- `tool.execute.before` 只对**全局 plugin**（npm 包）可用
- 项目级 plugin（`.opencode/plugin/*.js`）不支持此 hook
- 这是 OpenCode 的架构限制，不是 bug

**结论**：
- 上下文注入**必须依赖 omo + Python hooks**
- 纯 OpenCode（无 omo）场景**无法拦截 Task 工具调用**
- 要支持纯 OpenCode，需要将 Rudder 打包成全局 plugin（npm 包）

**当前状态**：
- [x] 代码已实现，逻辑与 Python 版本一致
- [x] 但 hook 不会被 OpenCode 触发
- [x] 已添加注释说明限制

**实际工作方式**：
| 场景 | 处理者 | 状态 |
|------|--------|------|
| OpenCode + omo | `.claude/hooks/inject-subagent-context.py` | ✅ 工作 |
| 纯 OpenCode | `.opencode/plugin/inject-subagent-context.js` | ❌ 不触发 |

**验证测试（2026-02-02）**：
```bash
# 测试 research agent
opencode run "Use Task tool with subagent_type='research'..."
# 返回: "Research Agent" ✅ 上下文注入成功

# 测试 implement agent
opencode run "Use Task tool with subagent_type='implement'..."
# 返回: "OpenCode 平台集成支持" ✅ prd.md 上下文注入成功
```

**解决方案**：
1. 要求用户安装 omo（主要方案）
2. **Context Self-Loading**（降级方案，已实现 2026-02-02）
   - 在 `.opencode/agents/*.md` 添加自检逻辑
   - Agent 检测是否有预注入上下文，没有则自己读取文件
   - 已更新：implement.md, check.md, debug.md, research.md

### 3.5 已删除的文件
- ❌ `ralph-loop.js`: OpenCode/omo 不需要
- ❌ `opencode.json`: 不需要配置文件

---

## Phase 4: Agent 定义 (P1)

### 4.1 创建 OpenCode Agent 配置

在 `opencode.json` 中添加：

```json
{
  "agent": {
    "dispatch": { ... },
    "rudder-plan": { ... },
    "implement": { ... },
    "check": { ... },
    "research": { ... },
    "debug": { ... }
  }
}
```

### 4.2 各 Agent 配置
- [x] `dispatch` - primary mode，纯调度器
- [x] `rudder-plan` - primary mode，评估需求（避开内置 plan）
- [x] `implement` - subagent mode，实现代码
- [x] `check` - subagent mode，检查和自修复
- [x] `research` - subagent mode，只读研究
- [x] `debug` - subagent mode，修复问题

### 4.3 Agent Mode 分类（已完成）
| Agent | Mode | 理由 |
|-------|------|------|
| dispatch | primary | 被 CLI 直接启动 |
| rudder-plan | primary | 被 CLI 直接启动 |
| implement | subagent | 被 Task() 调用 |
| check | subagent | 被 Task() 调用 |
| research | subagent | 被 Task() 调用 |
| debug | subagent | 被 Task() 调用 |

### 4.4 Agent Prompt 差异
- [ ] Dispatch Agent 需要两个版本（Claude Code / OpenCode）
- [ ] Task 工具调用语法可能不同
- [ ] TaskOutput 轮询机制需要验证

---

## Phase 5: Commands 迁移 (P2) ✅ 已完成

### 5.1 复制 Commands 到 OpenCode 目录
```bash
cp -r .claude/commands/rudder/ .opencode/commands/rudder/
```
✅ 已复制 15 个 commands

### 5.2 命名差异
- Claude Code: `/rudder:start`
- OpenCode: `/rudder:start` (project) 或 `/rudder/start`

### 5.3 验证 Commands 格式兼容性
- [x] YAML frontmatter 格式 - 兼容
- [x] `$ARGUMENTS` 变量 - 兼容
- [x] 路径引用已更新 (`.claude` → `.opencode`)

---

## Phase 6: Init 流程适配 (P2) ✅ 已完成（2026-02-02）

### 6.1 修改 `rudder init`
- [x] 添加 OpenCode 平台选项（`--opencode` flag）
- [x] 选择 OpenCode 时生成：
  - `.opencode/plugin/` 下的 plugin 文件
  - `.opencode/commands/` 下的 command 文件
  - `.opencode/agents/` 下的 agent 定义
  - `.opencode/lib/` 下的工具模块
  - `package.json` plugin 依赖

### 6.2 实现细节
- [x] 创建 `src/templates/opencode/` 目录（从项目 `.opencode/` 复制）
- [x] 添加 `getOpenCodeTemplatePath()` 到 `src/templates/extract.ts`
- [x] 实现 `configureOpenCode()` 使用 dogfooding 模式复制目录
- [x] 取消 CLI 和 init 命令中的 OpenCode 选项注释

---

## Phase 7: 日志解析适配 (P2) ✅ 已完成（2026-02-02）

### 7.1 修改 `status.py` 日志解析

Claude Code 格式：
```json
{"type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Read"}]}}
```

OpenCode 格式：
```json
{"type": "tool_use", "tool": "bash", "state": {"status": "completed"}}
{"type": "text", "text": "..."}
```

- [x] 实现 `get_last_tool(log_file, platform)` - 支持双平台格式
- [x] 实现 `get_last_message(log_file, platform)` - 支持双平台格式
- [x] 更新 `cmd_log()` 支持 OpenCode 事件类型（text, tool_use, step_start, step_finish, error）
- [x] 更新所有调用点传递 platform 参数

---

## 验收标准

### 基础功能
- [ ] `opencode run --agent dispatch` 能正确启动（primary mode）
- [ ] `opencode run --agent rudder-plan` 能正确启动（primary mode）
- [x] Dispatch 调用 `Task(implement)` 能正确注入上下文（✅ 2026-02-02 验证，需 omo）
- [x] Dispatch 调用 `Task(check)` 能正确注入上下文（✅ 同上）
- [x] Session Start 能注入 workflow 和 guidelines（✅ 2026-02-02 验证通过）
- [ ] Phase 追踪在 OpenCode 下正常工作

### 完整流程
- [ ] `/rudder:parallel` 能在 OpenCode 下完整运行
- [ ] Plan → Implement → Check → Create PR 流程正常
- ~~[ ] Ralph Loop 能正确阻止未通过验证的 agent~~ （已删除，不需要）
- [ ] `status.py` 能正确显示 OpenCode agent 状态
- [ ] `status.py` 能正确输出 OpenCode 恢复命令

### 混合使用
- [x] 同一项目可以同时使用 Claude Code 和 OpenCode（✅ Rudder + omo 上下文共存）
- [x] Registry 能区分不同平台的 agent（✅ `platform` 字段已实现）
- [x] 恢复命令能正确输出对应平台的命令（✅ 2026-02-02 验证）
- [x] 日志解析能正确处理两种格式（✅ 2026-02-02 完成）

### ⚠️ 前置条件
- [x] **推荐安装 oh-my-opencode**（完整功能，自动上下文注入）
- [x] **无 omo 也可工作**（Context Self-Loading 降级方案，agent 自己读取文件）

---

## 已知限制

1. OpenCode 无法在创建时指定 session ID，需要启动后获取
2. OpenCode `plan` agent 名称被占用，需要用 `rudder-plan`
3. OpenCode `opencode run` 可能在 API 错误时挂住（Issue #8203）
4. OpenCode 没有内置 retry 机制（Issue #3011）
5. **🔴 项目级 plugin 不支持 `tool.execute.before` hook**（2026-02-02 验证）
   - `.opencode/plugin/*.js` 的 `tool.execute.before` 事件**不会被触发**
   - 只有**全局 plugin**（npm 包）才能使用此 hook
   - Subagent 上下文注入**必须依赖 omo + `.claude/hooks/`**
   - **建议**：要求 Rudder + OpenCode 用户安装 oh-my-opencode
   - **未来选项**：将 Rudder 打包成 npm 全局 plugin

---

## 2026-02-02 更新总结

### Agent 定义格式更新

**Permission 格式**（OpenCode 正确格式）：
```yaml
---
description: |
  Agent description here
mode: primary  # or subagent
permission:
  read: allow
  write: allow
  edit: allow
  bash: allow
  glob: allow
  grep: allow
  task: allow  # for agents that call subagents
---
```

**注意**：
- 使用 `permission:` 而非已弃用的 `tools:`
- 不写 `model:` 字段，继承用户全局配置
- 已更新所有 6 个 agent 文件

### --platform flag 使用

| 脚本 | 命令 | 默认值 |
|------|------|--------|
| `plan.py` | `--platform opencode` | `claude` |
| `start.py` | `--platform opencode` | `claude` |
| `status.py` | 无需指定 | 从 registry 读取 |

### OpenCode Session 机制

**Session ID 格式**：`ses_[a-zA-Z0-9]+`（如 `ses_3e23a7056ffeR09OSfYsr3J83u`）

**日志输出**：
```json
{"type":"step_start","sessionID":"ses_xxx",...}
{"type":"text","sessionID":"ses_xxx","part":{"text":"..."}}
{"type":"step_finish","sessionID":"ses_xxx",...}
```

**恢复命令**：
- `opencode run --session <id>` - 恢复指定会话
- `opencode run --continue` - 恢复最后会话

### 模板同步状态

| 目录 | 源 | 目标 | 状态 |
|------|-----|------|------|
| agents | `.opencode/agents/` | `src/templates/opencode/agents/` | ✅ |
| commands | `.opencode/commands/` | `src/templates/opencode/commands/` | ✅ |
| plugin | `.opencode/plugin/` | `src/templates/opencode/plugin/` | ✅ |
| scripts | `.rudder/scripts/` | `src/templates/rudder/scripts/` | ✅ |
| hooks | `.claude/hooks/` | `src/templates/claude/hooks/` | ✅ |

### 平台功能对比

| 功能 | Claude Code | OpenCode + omo | 纯 OpenCode |
|------|-------------|----------------|-------------|
| Session Start 注入 | ✅ hooks | ✅ omo 加载 hooks | ✅ plugin |
| Subagent 上下文注入 | ✅ hooks | ✅ omo 加载 hooks | ⚠️ Self-Loading |
| Session ID | 创建时指定 | 日志提取 | 日志提取 |
| Session Resume | `--resume` | `--session` | `--session` |
| Agent 命名 | `plan` | `rudder-plan` | `rudder-plan` |

---

## 参考文档

- PRD: `prd.md`
- Claude Code Hooks: `.claude/hooks/`
- Multi-Session Scripts: `.rudder/scripts/multi_agent/`
- Agent Definitions: `.claude/agents/`, `.opencode/agents/`
- Templates: `src/templates/opencode/`, `src/templates/claude/`
