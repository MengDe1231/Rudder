<p align="center">
<picture>
<source srcset="assets/rudder.png" media="(prefers-color-scheme: dark)">
<source srcset="assets/rudder.png" media="(prefers-color-scheme: light)">
<img src="assets/rudder.png" alt="Rudder Logo (占位图)" width="500" style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">
</picture>
<br/><em>Logo 和官方网站仍在建设中，欢迎贡献设计！</em>
</p>

<p align="center">
<strong>让 AI Agent 真正具备生产力的 Coding Harness</strong><br/>
<sub>用 Gemini 写前端，Claude Code 写后端，Codex 代码审查，或者交给团队接力开发 —— Rudder 将上下文、规范与标准在所有平台和团队内部之间共享，任何人的最佳实践都能提升整个团队的能力。</sub>
</p>

<p align="center">
<a href="./README.md">English</a> •
<a href="https://docs.tryrudder.app/zh">文档</a> •
<a href="https://docs.tryrudder.app/zh/start/install-and-first-task">快速开始</a> •
<a href="https://docs.tryrudder.app/zh/advanced/multi-platform">支持平台</a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@mengde1231/rudder"><img src="https://img.shields.io/npm/v/@mengde1231/rudder.svg?style=flat-square&color=2563eb" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@mengde1231/rudder"><img src="https://img.shields.io/npm/dw/@mengde1231/rudder?style=flat-square&color=cb3837&label=downloads" alt="npm downloads" /></a>
<a href="https://github.com/MengDe1231/Rudder/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-16a34a.svg?style=flat-square" alt="license" /></a>
<a href="https://github.com/MengDe1231/Rudder/stargazers"><img src="https://img.shields.io/github/stars/MengDe1231/Rudder?style=flat-square&color=eab308" alt="stars" /></a>
<a href="https://docs.tryrudder.app/zh"><img src="https://img.shields.io/badge/docs-tryrudder.app-0f766e?style=flat-square" alt="docs" /></a>
</p>

<p align="center">
<img src="assets/rudder-demo-zh.gif" alt="Rudder 工作流演示" width="100%">
</p>

## 为什么用 Rudder？

| 能力 | 带来的改变 |
| --- | --- |
| **自动注入规范** | 将规范沉淀到 `.rudder/spec/` 之后，Rudder 会在每次会话中按当前任务自动按需注入相关上下文，无需反复说明。 |
| **任务驱动工作流** | PRD、实现上下文、审查上下文与任务状态统一存放于 `.rudder/tasks/`，AI 开发过程保持结构化、可追溯。 |
| **项目记忆** | `.rudder/workspace/` 中的工作日志（journal）会保留上一次会话的脉络，因此每次新会话都能基于真实上下文开始。 |
| **团队共享标准** | Spec 随仓库一同版本化，个人总结出的规则与流程可以直接成为整个团队的基础设施。 |
| **多平台复用** | 同一套 Rudder 结构覆盖 14 个 AI coding 平台，无需为每个工具单独搭建工作流。 |

## 前置要求

- **Node.js** >= 18
- **Python** >= 3.9

## 快速开始

```bash
# 1. 安装 Rudder
npm install -g @mengde1231/rudder@latest

# 2. 在仓库中初始化
rudder init -u your-name

# 3. 或仅初始化你实际使用的平台
rudder init --cursor --opencode --codex -u your-name
```

查看 [快速开始](https://docs.tryrudder.app/zh/start/install-and-first-task) 与 [支持平台](https://docs.tryrudder.app/zh/advanced/multi-platform) 指南以了解详细配置步骤。

## 工作原理

Rudder 内部运行一个 4 阶段循环，skill 与子代理均由系统自动调用：

1. **Plan（规划）** —— `rudder-brainstorm` 逐题梳理需求并写入 `prd.md`；涉及资料调研的部分派发给 `rudder-research` 子代理处理。阶段产出为一组精选的 Spec 与研究文件，由 `implement.jsonl` / `check.jsonl` 编排。
2. **Implement（实现）** —— `rudder-implement` 子代理依据 PRD 编写代码，所需上下文已按 `implement.jsonl` 自动注入，不会执行 git commit。
3. **Verify（验证）** —— `rudder-check` 子代理基于 diff 对照 Spec 逐项核查，并运行 lint、type-check 与测试，在能力范围内自动修复。
4. **Finish（收尾）** —— 执行最终检查后，`rudder-update-spec` 将本轮新增的认知沉淀回 `.rudder/spec/`，为下一次会话积累上下文。

## 常见问题

<details>
<summary><strong>Rudder 与 <code>CLAUDE.md</code>、<code>AGENTS.md</code>、<code>.cursorrules</code> 有何区别？</strong></summary>

这些文件本身是有用的入口，但容易在长期使用中变得冗长臃肿。Rudder 在此之上补充了：作用域明确的 Spec、按任务划分的 PRD、工作流关卡、工作区记忆，以及按平台自动生成的适配文件。

</details>

<details>
<summary><strong>Rudder 是否仅支持 Claude Code？</strong></summary>

并非如此。Rudder 是项目层基础设施，可在多种 coding agent 与 IDE 中使用。

</details>

<details>
<summary><strong>Rudder 适合个人开发者还是团队？</strong></summary>

两者皆可。个人开发者主要受益于记忆机制与可复用的工作流；团队使用收益更大——标准统一、任务边界清晰、上下文可审查，且具备跨平台可移植性。

</details>

<details>
<summary><strong>是否需要手动编写每一个 Spec 文件？</strong></summary>

并不需要。多数团队的做法是先由 AI 基于现有代码生成初稿，再人工收紧关键规则。Rudder 的效果取决于是否将高价值规则显式化并纳入版本管理。

</details>

<details>
<summary><strong>团队协作时是否会频繁产生冲突？</strong></summary>

不会。个人工作区的 journal 按开发者独立维护，共享的 Spec 与任务则进入仓库，可以像其他项目产物一样进行评审与改进。

</details>

## Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=MengDe1231/Rudder&type=Date)](https://star-history.com/#MengDe1231/Rudder&Date)

<p align="center">
<a href="https://docs.tryrudder.app/zh">文档</a> •
<a href="https://github.com/MengDe1231/Rudder">GitHub</a> •
<a href="https://discord.com/invite/tWcCZ3aRHc">Discord</a> •
<a href="https://github.com/MengDe1231/Rudder/blob/main/LICENSE">AGPL-3.0 License</a>
</p>
