# 竞品 README 与网站对比总结

> 调研日期：2026-01-19
> 分析产品总数：9

---

## 快速对比表

| 产品 | 网站 | Stars | 标语 | 字数 | README 风格 | 语言数 | GIF | 徽章 |
|---------|---------|-------|--------|-------|--------------|-----------|------|--------|
| **Aider** | aider.chat | 39.9K | "AI pair programming in your terminal" | 5 | 中等 | 1 | 1 | 5 |
| **Continue** | continue.dev | 30.9K | "Ship faster with Continuous AI" | 5 | 中等 | 1 | 1+ | 3+ |
| **Cursor** | cursor.com | 32K | "The best way to build software" | 5 | 完整 | 1 | 5+ | - |
| **Cline** | cline.bot | 57.0K | "AI Coding, Open Source and Uncompromised" | 6 | 中等-完整 | **7** | 1+ | 6+ |
| **OpenCode** | opencode.ai | 77.3K | "The open source AI coding agent" | 6 | 完整 | **3** | 2 | 4+ |
| **Claude Code** | claude.com | 58K | "Go from prompt to production" | 4-7 | 中等-完整 | 1 | 0 | - |
| **Roo Code** | roocode.com | 21.8K | "Your AI Software Engineering Team..." | 18 | 中等 | 1 | 视频 | 5+ |
| **Copilot** | github.com | N/A | "Your AI pair programmer" | 4 | N/A (文档) | 多语言 | 多个 | - |
| **Windsurf** | windsurf.ai | N/A | "Where developers are doing their best work" | 7 | N/A (闭源) | 1 | 6+ | 多个 |

---

## 标语分析

### 按字数统计

| 字数 | 产品 | 示例 |
|-------|----------|----------|
| **4** | Copilot, Claude Code | "Your AI pair programmer" |
| **5** | Aider, Continue, Cursor | "AI pair programming in your terminal" |
| **6** | Cline, OpenCode | "The open source AI coding agent" |
| **7** | Windsurf | "Where developers are doing their best work" |
| **18** | Roo Code | 长句式双重能力描述 |

### 标语模式

| 模式 | 示例 | 产品 |
|---------|---------|----------|
| **角色定义** | "Your AI pair programmer" | Copilot, Aider |
| **价值主张** | "Ship faster with..." | Continue |
| **大胆宣言** | "The best way to build software" | Cursor |
| **价值观声明** | "Open Source and Uncompromised" | Cline |
| **品类定义** | "The open source AI coding agent" | OpenCode |
| **体验聚焦** | "Where developers do their best work" | Windsurf |

### Rudder 建议
**5-6 个词**是最佳范围。大多数成功产品都使用这个长度。

---

## README 风格对比

### 长度分类

| 分类 | 行数 | 产品 |
|----------|-------|----------|
| **极简** | <100 | - |
| **中等** | 100-200 | Continue, Roo Code |
| **中等-完整** | 200-400 | Aider, Claude Code, Cline |
| **完整** | 400+ | Cursor, OpenCode |

### README 作为入口 vs 完整文档

| 方式 | 产品 | 策略 |
|----------|----------|----------|
| **入口导向** | Aider, Continue, Cline, Claude Code | README → 外部文档站 |
| **完整文档** | OpenCode, Cursor | 详尽 README + 文档 |
| **无公开 README** | Windsurf, Copilot | 仅网站/文档 |

### Rudder 建议
**中等长度（100-200 行）**作为入口，附带文档站链接。

---

## 多语言支持

| 语言数 | 产品 |
|-----------|----------|
| **1（仅英文）** | Aider, Continue, Cursor, Claude Code, Roo Code, Windsurf |
| **3** | OpenCode（英文、简中、繁中） |
| **7** | Cline（英文、西班牙文、德文、日文、简中、繁中、韩文） |

### Rudder 建议
先支持英文，如果面向中国市场则添加简体中文（ZH-CN）。

---

## 视觉资源对比

### GIF/视频演示

| 数量 | 产品 |
|-------|----------|
| **0** | Claude Code |
| **1** | Aider, Cline |
| **1+** | Continue |
| **2** | OpenCode |
| **5+** | Cursor |
| **6+** | Windsurf |
| **视频优先** | Roo Code（YouTube） |

### 使用的徽章类型

| 徽章类型 | 使用产品 |
|------------|----------------|
| GitHub Stars | 所有公开仓库 |
| 安装量 | Aider（410 万）、Cline（400 万）、Roo Code（116 万） |
| 周使用量 | Aider（150 亿 tokens） |
| 许可证 | 大多数开源项目 |
| 平台支持 | Cline, OpenCode |
| 构建状态 | OpenCode |

### Rudder 建议
**至少 1 个 GIF 演示**，展示核心流程 `/start` → 开发 → `/finish-work`

---

## 功能展示风格

| 风格 | 产品 | 描述 |
|-------|----------|-------------|
| **图标 + 网格** | Aider | 9 个带图标的功能卡片 |
| **编号列表** | Continue | 带编号的纯文本 |
| **可视化演示** | Cursor | 每个功能配交互式演示 |
| **项目符号** | Cline, OpenCode | 简单的项目符号列表 |
| **模式列表** | Cline, Roo Code | 命名模式（Code、Architect 等） |

### Rudder 建议
**图标 + 简短描述**格式便于快速浏览。

---

## 安装方式

| 方式数量 | 产品 |
|---------|----------|
| **1-2** | Continue, Claude Code |
| **4** | Claude Code（npm、原生、brew、winget） |
| **9** | OpenCode（最全面） |

### 常见安装方式
1. npm/npx（最常见）
2. Homebrew（macOS）
3. curl 一行命令
4. 包管理器（scoop、winget、paru）

### Rudder 建议
展示**主要方式 + 1-2 个备选**：
```bash
# 主要方式
npx @mengde1231/rudder init

# 备选方式
npm install -g @mengde1231/rudder
```

---

## 社会认同元素

### 头部项目展示内容

| 元素 | 使用产品 |
|---------|----------------|
| GitHub Stars | 所有开源项目 |
| 安装/下载量 | Aider, Cline, Roo Code, OpenCode |
| 企业 Logo | Cline（12 个 Logo）、Windsurf、Copilot |
| 用户指标 | Windsurf（100 万+ 用户）、OpenCode（65 万月活） |
| 用户评价 | Aider（"Kind Words"）、Copilot |
| 性能指标 | Aider（88% 独立性）、Copilot（94% 效率提升） |

### Rudder 建议
有一定影响力后，先展示 **GitHub stars 徽章**。

---

## 社区链接对比

| 渠道 | 使用产品 |
|---------|----------------|
| Discord | Aider, Continue, Cline, OpenCode, Roo Code, Windsurf |
| GitHub Issues | 全部 |
| GitHub Discussions | Aider, Claude Code, Cursor |
| Reddit | Cline（r/cline）、Roo Code（r/RooCode） |
| 论坛 | Cursor（forum.cursor.com） |
| Twitter/X | Cline, OpenCode, Roo Code |

### Rudder 建议
**GitHub Issues** 为主，考虑使用 **Discord** 建设社区。

---

## 定价展示

### 开源项目
| 项目 | 模式 |
|---------|-------|
| Aider | 免费（用户自付 LLM API） |
| Cline | 免费 + Teams（$20/月）+ 企业版 |
| OpenCode | 免费（开源） |

### 免费增值/付费
| 项目 | 免费版 | 付费版 |
|---------|-----------|------|
| Continue | Solo 免费 | Team $10/月, 企业版定制 |
| Cursor | Hobby 免费 | Pro $20, Pro+ $60, Ultra $200 |
| Copilot | 50 次/月 | Pro $10, Pro+ $39 |
| Windsurf | 免费版 | 付费版 |

### Rudder 建议
即使免费，也应有"定价"部分说明免费。

---

## 值得采用的关键模式

### 必须具备
1. **5-6 个词的标语** - 清晰定位
2. **1 个 GIF 演示** - 展示核心流程
3. **安装命令** - 可直接复制粘贴
4. **带图标的功能** - 便于快速浏览
5. **快速开始（3-5 步）** - 快速实现价值
6. **文档链接** - 不要让 README 臃肿

### 可选优化
1. 多语言 README（中文）
2. 多种安装方式
3. 企业 Logo（有时再加）
4. 用户评价区
5. README 中的 FAQ（如 OpenCode）

### 避免
1. README 作为完整文档
2. 没有视觉演示
3. 无结构的大段文字
4. 缺少安装说明
5. 没有社区链接

---

## Rudder README 建议

基于分析：

```markdown
# Rudder

> The missing workflow layer for AI coding (6 words)

![Demo](./assets/demo.gif)

[![npm](badge)] [![license](badge)] [![stars](badge)]

## What is Rudder?

One paragraph explaining workflow templates for AI development.

## Features

- 📋 Workflow Templates - Pre-defined development commands
- 🤖 Agent Delegation - Delegate to specialized agents
- 📁 Feature Tracking - Track development progress
- 📝 Session Context - Maintain context across sessions
- 🔧 Multi-Tool Support - Claude Code, OpenCode

## Quick Start

1. Initialize: `npx @mengde1231/rudder init`
2. Start session: `/start`
3. Develop with AI assistance
4. Complete: `/finish-work`

## Supported Tools

| Tool | Status |
|------|--------|
| Claude Code | ✅ Supported |
| OpenCode | ✅ Supported |

## Commands

| Command | Description |
|---------|-------------|
| /start | Start development session |
| /finish-work | Pre-commit checklist |
| /parallel | Multi-agent pipeline |

## Documentation

- [Workflow Guide](.rudder/workflow.md)
- [Commands Reference](docs/commands.md)

## Community

- [GitHub Issues](link)

## License

MIT
```

**预计长度**：约 100-150 行
**风格**：中等长度，入口导向
