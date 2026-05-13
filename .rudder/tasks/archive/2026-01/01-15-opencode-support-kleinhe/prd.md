# PRD: OpenCode Support for Rudder

## Background

Rudder 目前仅支持 Claude Code（通过 `.claude/` 目录配置）。为了让更多用户能够使用 Rudder 的 AI 辅助开发工作流，需要适配 [OpenCode](https://opencode.ai/) —— 一个开源的终端 AI 编码助手。

## Goal

让 Rudder 同时支持 Claude Code 和 OpenCode，用户可以根据自己的偏好选择使用哪个工具。

## OpenCode 配置格式研究

### 配置文件位置

| 类型 | Claude Code | OpenCode |
|------|-------------|----------|
| 项目配置 | `.claude/` | `.opencode/` |
| 全局配置 | `~/.claude/` | `~/.config/opencode/` |
| 规则/指令文件 | `CLAUDE.md` | `AGENTS.md` |

### OpenCode 核心配置

1. **AGENTS.md** - 项目根目录，包含项目规则和指令（类似 CLAUDE.md）
2. **.opencode.json** - JSON 配置文件，支持：
   - `instructions`: 可引用外部文件 `["docs/guidelines.md", "packages/*/AGENTS.md"]`
   - `agents`: 自定义 agent 配置
   - `mcpServers`: MCP 服务器配置
3. **.opencode/commands/** - 自定义命令（Markdown 文件）
4. **.opencode/agent/** - 自定义 agent（Markdown + YAML frontmatter）

### OpenCode Agent 格式

```markdown
---
description: Agent 用途描述
mode: primary|subagent|all
model: claude-3.7-sonnet (可选)
tools:
  bash: true|false
  write: true|false
permission:
  bash: allow|ask|deny
---
System prompt 内容...
```

---

## 技术调研报告：OpenCode Dispatch 可行性分析

### 调研日期：2026-01-15

### 核心问题

Rudder 的 Multi-Agent Pipeline 依赖 dispatch agent 协调 implement → check → debug 流程。Claude Code 使用 Hook 机制自动注入 context 到 subagent。OpenCode 能否实现类似的工作流？

### 关键发现

#### 1. OpenCode 支持 Agent-to-Agent 调用 ✅

OpenCode 通过 **Task Tool** 支持 agent 调用 subagent：

```
Primary Agent → Task Tool → Subagent (独立 session)
```

**调用方式**：
- 用户手动：`@agent-name task description`
- Agent 编程调用：通过 Task tool

**Task Tool 特性**：
- 为 subagent 创建独立的 session 和 context window
- Subagent 可以使用不同的 model
- 调用者只收到 subagent 的最终输出
- 每次调用都是无状态的（不能 resume）

**权限控制**（`permission.task`）：
```json
{
  "permission": {
    "task": {
      "*": "deny",
      "implement": "allow",
      "check": "allow",
      "debug": "allow"
    }
  }
}
```

**结论**：OpenCode 的 Task tool 可以实现 dispatch → subagent 的调用模式。

#### 2. Context Injection 机制对比

| 机制 | Claude Code | OpenCode |
|------|-------------|----------|
| Hook 系统 | 原生支持，功能完整 | 通过 Plugin 实现（实验性） |
| 自动注入 | Hook 自动注入 jsonl 里的文件 | 无原生支持 |
| 手动注入 | 不需要 | Agent 需要自己读取 context 文件 |
| Plugin | 无 | 支持 JS/TS plugin，有 22+ hooks |

**OpenCode Plugin Hooks**（部分）：
- `tool.execute.before` / `tool.execute.after` - 拦截工具执行
- `experimental.session.compacting` - 注入 compaction context
- `session.create` - session 创建时注入

**oh-my-opencode 插件** 提供了更完整的 hook 系统：
- `PreToolUse` / `PostToolUse`
- `UserPromptSubmit` - 用户提交 prompt 时注入
- `compaction-context-injector` - 保留关键 context

**结论**：OpenCode 没有 Claude Code 那样的原生 Hook 注入，但可以通过 Plugin 实现类似功能。

#### 3. Dispatch Agent 实现方案对比

| 方案 | 描述 | 复杂度 | 用户门槛 |
|------|------|--------|----------|
| A | 手动工作流（无 dispatch） | 低 | 低 |
| B-1 | Self-Reading Dispatch | 中 | 低 |
| B-2 | Plugin-Assisted Dispatch | 高 | 中 |
| B-3 | Hybrid Dispatch | 中 | 低 |

---

**方案 A：手动工作流（无 Dispatch）**

用户手动按顺序调用 `@implement` → `@check` → `@debug`，不使用 dispatch 协调。

```
用户工作流:
1. /start 初始化 session
2. @implement 实现功能
3. @check 检查代码
4. @debug 修复问题（如有）
5. /finish-work 完成
```

| 优点 | 缺点 |
|------|------|
| 实现简单，无额外代码 | 没有自动化 pipeline |
| 符合 OpenCode 轻量级设计 | 用户需要记住调用顺序 |
| 每步可控，出错易排查 | 无法实现复杂的多阶段工作流 |

---

**方案 B-1：Self-Reading Dispatch（不依赖 Plugin）**

让 dispatch agent 自己读取 context 并传递给 subagent：

```
dispatch 工作流:
1. 读取 .rudder/.current-feature
2. 读取 feature.json 获取 next_action
3. 读取 implement.jsonl 获取 context 文件列表
4. 将 context 文件内容拼接到 Task prompt
5. 调用 Task tool 启动 subagent
```

| 优点 | 缺点 |
|------|------|
| 不依赖 Plugin，纯 prompt 实现 | Dispatch 不再是 "pure dispatcher" |
| 与 Claude Code 逻辑一致 | 需要读取大量文件，prompt 变长 |
| 用户门槛低 | Token 消耗增加 |
| 渐进式，可后续优化 | Subagent context window 被预填充 |

---

**方案 B-2：Plugin-Assisted Dispatch**

使用 OpenCode Plugin 实现类似 Claude Code Hook 的功能：

```javascript
// .opencode/plugin/rudder-context-injector.ts
export default (ctx) => ({
  hooks: {
    "session.create": async ({ session }) => {
      if (session.agent === "implement") {
        const context = await loadContextFromJsonl("implement.jsonl");
        session.systemPrompt += context;
      }
    }
  }
});
```

| 优点 | 缺点 |
|------|------|
| Dispatch 保持简洁 | 依赖实验性 Plugin 系统 |
| Context 注入自动化 | 需要额外维护 Plugin 代码 |
| 与 Claude Code 体验一致 | 用户需要安装/配置 Plugin |
| Token 效率更高 | Plugin API 可能变化 |

---

**方案 B-3：Hybrid Dispatch（混合模式）**

Dispatch 读取 jsonl 获取文件列表，但只传递**文件路径**给 subagent，让 subagent 自己读取：

```
dispatch 工作流:
1. 读取 feature.json 获取 next_action
2. 读取 implement.jsonl 获取文件路径列表
3. 调用 Task tool，prompt 包含：
   - 任务描述
   - 需要读取的文件路径列表（不是内容）
4. Subagent 自己读取这些文件
```

| 优点 | 缺点 |
|------|------|
| Dispatch 相对简洁 | Subagent 需要额外读取步骤 |
| 不预填充 context window | 增加 subagent 的 tool call 次数 |
| 不依赖 Plugin | 整体 token 消耗可能更高 |
| 灵活性高 | 实现复杂度中等 |

---

### 方案对比总结

| 维度 | A (手动) | B-1 (Self-Read) | B-2 (Plugin) | B-3 (Hybrid) |
|------|----------|-----------------|--------------|--------------|
| 自动化程度 | ❌ 无 | ✅ 全自动 | ✅ 全自动 | ✅ 全自动 |
| 实现复杂度 | 低 | 中 | 高 | 中 |
| 用户门槛 | 低 | 低 | 中 | 低 |
| Token 效率 | 高 | 低 | 高 | 中 |
| 维护成本 | 低 | 中 | 高 | 中 |
| 稳定性 | 高 | 高 | 中 | 高 |

### 建议方案

**短期推荐：方案 A（手动工作流）**

理由：
1. **快速可用**：无需额外开发
2. **降低风险**：不依赖对 OpenCode Task tool 的深度理解
3. **用户可控**：每步都可以检查和调整

**中期推荐：方案 B-1 或 B-3**

等 OpenCode 生态更成熟、Task tool 文档更完善后，再实现自动化 dispatch。

**长期考虑：方案 B-2**

如果 OpenCode Plugin 系统稳定下来，可以考虑用 Plugin 实现更优雅的 context 注入。

### 实现要点

1. **创建 OpenCode 版 dispatch agent**
   - 在 `metadata.ts` 中将 `dispatch.supportsOpenCode` 改为 `true`
   - 创建 OpenCode 专用的 dispatch body（包含 context 读取逻辑）

2. **修改 dispatch body 模板**
   - 添加读取 jsonl 文件的指令
   - 添加将 context 拼接到 Task prompt 的指令

3. **配置 Task 权限**
   - 在 `.opencode.json` 中配置 `permission.task`

### 参考资料

- [OpenCode Agents 文档](https://opencode.ai/docs/agents/)
- [OpenCode Plugins 文档](https://opencode.ai/docs/plugins/)
- [OpenCode Tools 文档](https://opencode.ai/docs/tools/)
- [OpenCode Subagent Feature Issue #1293](https://github.com/sst/opencode/issues/1293)
- [How Coding Agents Work: OpenCode Deep Dive](https://cefboud.com/posts/coding-agents-internals-opencode-deepdive/)
- [oh-my-opencode Plugin](https://github.com/code-yeongyu/oh-my-opencode)

---

## 适配方案（更新）

### Phase 1: 基础支持 ✅ (已实现)

1. **创建 AGENTS.md**
   - 从现有 CLAUDE.md 转换或新建
   - 包含项目基本规则和工作流指引

2. **创建 .opencode/ 目录结构**
   ```
   .opencode/
   ├── commands/           # 自定义命令
   │   ├── start.md
   │   ├── finish-work.md
   │   └── ...
   └── agents/             # 自定义 agent
       ├── implement.md
       ├── check.md
       ├── debug.md
       └── research.md
   ```

3. **创建 .opencode.json**
   - 配置 instructions 引用 `.rudder/structure/` 下的文档
   - 配置项目特定设置

### Phase 2: 命令迁移 ✅ (已实现)

将 `.claude/commands/` 下的命令迁移到 `.opencode/commands/`

### Phase 3: Agent 模板统一 ✅ (已实现)

- 重构 agent 模板，共享 body 内容
- 通过 metadata.ts 集中管理元数据
- 动态生成 Claude/OpenCode 格式的 frontmatter

### Phase 4: Dispatch Agent 支持 🔜 (待实现)

1. **创建 OpenCode 版 dispatch agent**
   - Self-reading 模式：dispatch 自己读取 context
   - 配置 Task 权限允许调用 implement/check/debug

2. **更新 start 命令**
   - 支持通过 dispatch 协调完整工作流

3. **（可选）创建 Rudder Plugin**
   - 实现自动 context 注入
   - 提供更流畅的用户体验

## 实现范围

### In Scope

- [x] 创建 .opencode/ 目录结构
- [x] 迁移核心命令到 .opencode/commands/
- [x] 创建 .opencode.json 配置
- [x] 统一 agent 模板（Claude/OpenCode 共享）
- [ ] 创建 OpenCode 版 dispatch agent
- [ ] 更新文档说明如何使用 OpenCode

### Out of Scope

- 自动同步 Claude Code 和 OpenCode 配置
- Rudder OpenCode Plugin（Phase 4 可选）
- 移除 Claude Code 支持

## 验证标准

1. 用户可以用 `opencode` 启动并使用 Rudder 工作流
2. `/start`、`/finish-work` 等核心命令可用
3. 项目结构和指南文档被正确加载
4. **（新增）** dispatch agent 可以协调 implement → check 流程

## 参考资料

- [OpenCode 官网](https://opencode.ai/)
- [OpenCode GitHub](https://github.com/opencode-ai/opencode)
- [OpenCode 文档 - Rules](https://opencode.ai/docs/rules)
- [OpenCode 文档 - Agents](https://opencode.ai/docs/agents)
- [OpenCode 文档 - Plugins](https://opencode.ai/docs/plugins)
