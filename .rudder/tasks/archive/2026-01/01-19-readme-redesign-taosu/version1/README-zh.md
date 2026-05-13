# Rudder

<!-- 🖼️ [IMAGE] Banner: 品牌横幅图，包含 Logo + "结构化. 引导. 交付." 标语
     尺寸建议: 1280x640 或 1200x300
     文件: assets/banner.png (可复用英文版)
-->

**结构化. 引导. 交付.**

[English](./README.md) | 中文

[![npm version](https://img.shields.io/npm/v/@mengde1231/rudder)](https://www.npmjs.com/package/@mengde1231/rudder)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Compatible-blueviolet)](https://claude.ai/code)
[![Cursor](https://img.shields.io/badge/Cursor-Compatible-blue)](https://cursor.sh)

> AI 能力如藤蔓般生长 —— 生机勃勃却四处蔓延。
> Rudder 提供支架，引导它们沿着规范的路径攀升。

---

## 为什么选择 Rudder？

**你的 AI 助手在会话之间会忘记一切。**

每次对话都从零开始。同样的错误反复出现。规范写了却没人遵守。多 Agent 协作像在放羊。

Rudder 解决这些问题。

| 问题 | Rudder 方案 |
|------|--------------|
| AI 缺乏项目上下文 | 规范持久化存储在 `.rudder/structure/`，团队共享 |
| 规范写了但被忽略 | 按需注入 —— 每个 Agent 只接收它需要的内容 |
| 工作流需要人工监督 | 斜杠命令封装完整流程（`/start`、`/parallel`） |
| 多 Agent 并行很难 | 一键启动，Git Worktree 物理隔离 |

---

## 快速开始

### 安装

```bash
npm install -g @mengde1231/rudder@latest
```

### 初始化

```bash
cd your-project
rudder init -u your-name
```

### 开始使用

**Claude Code:**
```
/start → 描述你的任务 → /record-agent-flow
```

**复杂功能（多 Agent 流水线）:**
```
/parallel → 描述需求 → /record-agent-flow
```

---

## 核心概念

### 三大支柱

```
.rudder/
├── structure/      # 📚 规范 — 团队知识，AI 的行为准则
├── agent-traces/   # 📝 记忆 — 会话历史，功能追踪
└── scripts/        # ⚙️ 自动化 — 确定性、可重复的操作
```

| 支柱 | 作用 | 价值 |
|------|------|------|
| **Structure** | 存储编码规范、架构决策 | 规范真正被遵守 |
| **Agent-traces** | 记录工作历史、功能上下文 | 恢复任意会话，追溯任意决策 |
| **Scripts** | 封装复杂操作 | AI 执行一致，不会遗漏步骤 |

### 斜杠命令

| 命令 | 用途 |
|------|------|
| `/start` | 初始化会话，加载上下文 |
| `/parallel` | 启动多 Agent 流水线（Claude Code） |
| `/before-frontend-dev` | 编码前读取前端规范 |
| `/before-backend-dev` | 编码前读取后端规范 |
| `/check-frontend` | 根据规范审查代码 |
| `/check-backend` | 根据规范审查代码 |
| `/check-cross-layer` | 跨层数据流验证 |
| `/finish-work` | 提交前检查清单 |
| `/record-agent-flow` | 记录会话到 traces |

### 多 Agent 流水线

<!-- 🖼️ [IMAGE] 架构图: 替换下方 ASCII 流程图
     内容: Plan → Implement → Check → Create PR 四阶段流程
     风格: 简洁的流程图，带图标
     尺寸建议: 800x400
     文件: assets/pipeline.png (可复用英文版)
-->

```
/parallel
    ↓
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Plan Agent  │ →  │  Implement  │ →  │ Check Agent │ →  │  Create PR  │
│             │    │    Agent    │    │             │    │             │
│ 分析需求    │    │ 编写代码    │    │ 审查 +      │    │ 提交 +      │
│ 配置上下文  │    │ 运行测试    │    │ 自动修复    │    │ 推送 + PR   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
   feature.json      implement.jsonl    Ralph Loop
   prd.md            (上下文注入)        (质量门禁)
```

**核心特性：**
- **Git Worktree 隔离** — 每个 Agent 在独立目录工作
- **分阶段上下文注入** — Hook 按阶段只注入相关文件
- **Ralph Loop** — 质量门禁，lint/typecheck 全通过才能结束

---

## 支持的工具

| 工具 | 支持程度 |
|------|----------|
| **Claude Code** | 完整支持（斜杠命令 + Agents + Hooks + 多 Agent 流水线） |
| **Cursor** | 仅支持斜杠命令 |

---

## 项目结构

```
your-project/
├── AGENTS.md                    # 轻量级 AI 指令
├── .rudder/                    # 工作流中心
│   ├── workflow.md              # 开发流程（优先阅读）
│   ├── worktree.yaml            # 多 Agent 配置
│   ├── structure/               # 开发规范
│   │   ├── backend/             # 后端规范
│   │   ├── frontend/            # 前端规范
│   │   └── guides/              # 思考指南
│   ├── agent-traces/            # 会话记录
│   │   └── {developer}/
│   │       ├── traces-N.md      # 会话日志
│   │       └── features/        # 功能目录
│   ├── backlog/                 # 需求池
│   └── scripts/                 # 自动化脚本
├── .claude/                     # Claude Code 配置
│   ├── commands/                # 斜杠命令
│   ├── agents/                  # Agent 定义
│   └── hooks/                   # 自动化钩子
└── .cursor/                     # Cursor 配置
    └── commands/                # 斜杠命令
```

---

## 工作原理

### 1. 规范系统（`.rudder/structure/`）

团队的知识资产。AI 在实现和审查代码时参考这些规范。

```
structure/
├── backend/
│   ├── index.md                 # 入口
│   ├── database-guidelines.md   # 数据库规范
│   ├── error-handling.md        # 错误处理策略
│   └── ...
├── frontend/
│   ├── index.md                 # 入口
│   ├── component-guidelines.md  # 组件规范
│   ├── state-management.md      # 状态管理
│   └── ...
└── guides/
    ├── cross-layer-thinking-guide.md    # 跨层开发前思考
    └── code-reuse-thinking-guide.md     # 创建新代码前思考
```

**核心理念：** 规范越清晰 = AI 执行越好。发现问题就更新规范。

### 2. 会话追踪（`.rudder/agent-traces/`）

记录所有 AI 工作历史。支持多开发者协作。

```
agent-traces/
└── {developer}/
    ├── index.md                 # 个人会话索引
    ├── traces-N.md              # 会话记录
    └── features/                # 功能目录
        └── {day}-{name}/
            ├── feature.json     # 元数据
            ├── prd.md           # 需求文档
            ├── implement.jsonl  # 实现阶段上下文
            └── check.jsonl      # 检查阶段上下文
```

**可追溯性：** 每个功能都记录了使用了哪些规范、参考了哪些代码、为什么这样做。

### 3. 自动化钩子（`.claude/hooks/`）

两个 Python 脚本驱动自动化：

**`inject-subagent-context.py`** — 上下文注入
- 在 Task 工具调用前触发
- 读取 `.jsonl` 文件确定需要注入哪些文件
- 每个 Agent 只接收相关上下文

**`ralph-loop.py`** — 质量控制
- 在 Check Agent 尝试停止时触发
- 运行验证命令（lint、typecheck）
- 全部通过才允许结束（最多 5 次迭代）

---

## 配置

### `worktree.yaml` — 多 Agent 流水线配置

```yaml
worktree_dir: ../rudder-worktrees
copy:
  - .env
  - .rudder/.developer
post_create:
  - pnpm install --frozen-lockfile
verify:
  - pnpm lint
  - pnpm typecheck
```

| 字段 | 说明 |
|------|------|
| `worktree_dir` | Git Worktree 创建位置 |
| `copy` | 需要复制到 Worktree 的文件 |
| `post_create` | Worktree 创建后运行的命令 |
| `verify` | Check Agent 结束前必须通过的命令 |

---

## 对比

### vs Planning-with-Files

| 维度 | Planning-with-Files | Rudder |
|------|---------------------|---------|
| 范围 | 会话级（单次任务） | 项目级（跨会话） |
| 文件 | 3 个固定文件 | 灵活结构 |
| 多 Agent | 不支持 | 支持（Git Worktree 隔离） |
| 规范系统 | 无 | 完整的规范系统 |

### vs BMAD-METHOD

| 维度 | BMAD-METHOD | Rudder |
|------|-------------|---------|
| 复杂度 | 重型（21 agents，50+ workflows） | 轻量（6 agents，13 commands） |
| 学习曲线 | 陡峭 | 渐进 |
| 定制方式 | 框架驱动 | 模板驱动 |

---

## 文档

- [完整文档](./docs/README.md) — 完整参考
- [用 K8s 概念理解 Rudder](./docs/use-k8s-to-know-rudder.md) — 适合 K8s 用户

---

## 社区

- [GitHub Issues](https://github.com/MengDe1231/Rudder/issues) — Bug 报告、功能请求
- [GitHub Discussions](https://github.com/MengDe1231/Rudder/discussions) — 问题、想法

---

## 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解贡献指南。

---

## 许可证

[MIT](./LICENSE)

---

<p align="center">
  <sub>由 <a href="https://github.com/MengDe1231">Mindfold</a> 构建</sub>
</p>
