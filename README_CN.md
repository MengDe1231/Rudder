<p align="center">
<picture>
<source srcset="assets/rudder-logo.png" media="(prefers-color-scheme: dark)">
<source srcset="assets/rudder-logo.png" media="(prefers-color-scheme: light)">
<img src="assets/rudder-logo.png" alt="Rudder Logo" width="500" style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">
</picture>
</p>

<p align="center">
<strong>让 AI 帮你写代码？先让它读懂你的项目。</strong><br/>
<sub>Gemini 写前端、Claude Code 写后端、Codex 审查 —— 换个平台不用从头解释，队友接手也不用写八页文档。Rudder 把规范、记忆和任务上下文全部沉淀到仓库里，谁接手都一样丝滑。</sub>
</p>

<p align="center">
<a href="./README.md">English</a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@mengde1231/rudder"><img src="https://img.shields.io/npm/v/@mengde1231/rudder.svg?style=flat-square&color=2563eb" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@mengde1231/rudder"><img src="https://img.shields.io/npm/dw/@mengde1231/rudder?style=flat-square&color=cb3837&label=downloads" alt="npm downloads" /></a>
<a href="https://github.com/MengDe1231/Rudder/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-16a34a.svg?style=flat-square" alt="license" /></a>
<a href="https://github.com/MengDe1231/Rudder/stargazers"><img src="https://img.shields.io/github/stars/MengDe1231/Rudder?style=flat-square&color=eab308" alt="stars" /></a>
</p>

## 解决了什么痛点？

用过 AI 写代码的都懂 —— 每次新会话打开，AI 就像喝了孟婆汤，一切从头来。

Rudder 做的事很简单：**把你的项目规范、记忆、任务状态全部落盘到仓库里，每次会话自动按需注入，AI 不再"失忆"。**

| 能力 | 带来的改变 |
| --- | --- |
| **自动注入规范** | 规范写好一次放 `.rudder/spec/` 里，Rudder 会根据当前任务自动把相关文件塞给 AI，不用每次会话都重新解释。 |
| **任务驱动** | PRD、实现记录、审查上下文全在 `.rudder/tasks/` 里，AI 不是瞎写一通完事就走。 |
| **项目记忆** | `.rudder/workspace/` 工作日志帮你续上回话的上下文，新会话一上来就知道昨天干了啥。 |
| **团队共享** | 规范跟着代码一起走 git 版本管理，一个人总结出的最佳实践，全团队直接用。 |
| **14 个平台通用** | 同一套 Rudder 结构，随便切 Claude Code / Gemini / Cursor / Codex，不用每个工具都重新搭。 |

## 支持平台

14 个 AI coding 平台，一套 Rudder 通吃：

| 平台 | 类型 |
| --- | --- |
| Claude Code | CLI / VS Code / JetBrains / Web |
| Gemini | CLI |
| Cursor | IDE |
| Codex | VS Code |
| OpenCode | IDE |
| CodeBuddy | IDE |
| Qoder | IDE |
| Kiro | IDE |
| Pi | CLI |
| Windsurf | IDE |
| Copilot | VS Code / JetBrains |
| Antigravity | CLI |
| Kilo | CLI |
| Droid | Factory IDE |

## 跑起来要啥

- **Node.js** >= 18
- **Python** >= 3.9

## 快速开始

```bash
# 1. 装
npm install -g @mengde1231/rudder@latest

# 2. 初始化（全平台）
rudder init -u your-name

# 3. 或者只初始化你用的平台（推荐，干净）
rudder init --cursor --opencode --codex -u your-name
```

## 工作流程

Rudder 每次会话自动跑 4 个阶段：

1. **Plan（规划）** — `rudder-brainstorm` 一问一答捋清需求，写进 `prd.md`；需要调研的部分派 `rudder-research` 子代理去查。最后产出精选的 Spec + 研究文件清单，通过 `implement.jsonl` / `check.jsonl` 编排给后面的步骤用。
2. **Implement（实现）** — `rudder-implement` 子代理按 PRD 写代码，上下文已经自动注入。这步不碰 git commit。
3. **Verify（验证）** — `rudder-check` 子代理对着 spec 逐项审查，跑 lint、type-check、编译和测试，能修的修，修不了的报给你。
4. **Finish（收尾）** — `rudder-update-spec` 把这轮学到的新认知沉淀回 `.rudder/spec/`，下次会话开局就聪明了。

## FAQ

<details>
<summary><strong>这玩意儿跟 <code>CLAUDE.md</code> / <code>AGENTS.md</code> / <code>.cursorrules</code> 有啥区别？</strong></summary>

这些文件确实有用，但用久了都会变成几千行的缝合怪。Rudder 做了分层：规范按作用域拆分、任务有独立 PRD、工作流有关卡控制、跨平台自动适配。一句话：**不把所有东西塞进一个文件里。**

</details>

<details>
<summary><strong>Rudder 是不是只支持 Claude Code？</strong></summary>

不是。Rudder 是项目层的基础设施，14 个 AI coding 平台都能用。你可以今天用 Gemini 写前端，明天切 Claude Code 写后端，后天让 Codex 审查。

</details>

<details>
<summary><strong>适合一个人用还是团队？</strong></summary>

都行。一个人用主要是项目记忆 + 可复用流程；团队用收益更大 —— 标准统一、任务边界清晰、上下文可审查，换平台不换脑子。

</details>

<details>
<summary><strong>Spec 文件是不是得手动一个一个写？</strong></summary>

不用。大多数团队的做法是让 AI 先基于现有代码生成初稿，然后人工收紧关键规则。Rudder 的核心思想是：把高价值的规则显式化、版本化，剩下的让 AI 自己搞定。

</details>

<details>
<summary><strong>团队协作会不会经常冲突？</strong></summary>

不会。个人工作区的 journal 是每个开发者独立维护的，共享的 Spec 和任务进仓库走 git —— 跟其他项目代码一样，冲突就合并不就完了。

</details>

## 作者的话

**为什么从 0.5 开始？**

版本号不是跳过的，是本地默默迭代了很多轮。Rudder 诞生在 5 月，所以主版本用了 0.5，从 0.5.30 开始公开发布。

**写在后面**

Rudder 借鉴了市面上众多开源项目的优点，我也是在开源中成长起来的。但开源面向的是广泛群体，大部分场景没有经过真实业务的打磨。作为一名 Java 全栈开发，我日常一直用自己的这套产品，也在不断迭代更新，所以对 Java 全栈工程师来说相对来说会更加友好——Java 的 spec 模板也在积极更新中。当然，其他语言也同样兼容，Rudder 本身是平台无关的。

一个人的精力有限，做不到面面俱到，但会把每一个踩过的坑都填上。希望能帮到正在用 AI 写代码的你。

## 致谢

Rudder 的诞生离不开开源 AI coding 社区。我们研究了社区里众多项目如何解决上下文注入、工作流关卡、跨平台支持这些老问题，然后做了我们理想中该有的样子。

## Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=MengDe1231/Rudder&type=Date)](https://star-history.com/#MengDe1231/Rudder&Date)

<p align="center">
<a href="https://github.com/MengDe1231/Rudder">GitHub</a> •
<a href="https://discord.com/invite/tWcCZ3aRHc">Discord</a> •
<a href="https://github.com/MengDe1231/Rudder/blob/main/LICENSE">AGPL-3.0 License</a>
</p>
