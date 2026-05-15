<p align="center">
<picture>
<source srcset="assets/rudder.png" media="(prefers-color-scheme: dark)">
<source srcset="assets/rudder.png" media="(prefers-color-scheme: light)">
<img src="assets/rudder.png" alt="Rudder Logo (placeholder)" width="500" style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">
</picture>
<br/><em>Logo and official website are still in progress — design contributions welcome!</em>
</p>

<p align="center">
<strong>The harness that makes coding agents production-ready</strong><br/>
<sub>Start a feature in Gemini, continue in Claude Code, ship it with Codex — or hand it off to a teammate at any step. Context, specs, and standards are shared across every agent and every teammate.</sub>
</p>

<p align="center">
<a href="./README_CN.md">简体中文</a> •
<a href="https://docs.tryrudder.app/">Docs</a> •
<a href="https://docs.tryrudder.app/start/install-and-first-task">Quick Start</a> •
<a href="https://docs.tryrudder.app/advanced/multi-platform">Supported Platforms</a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@mengde1231/rudder"><img src="https://img.shields.io/npm/v/@mengde1231/rudder.svg?style=flat-square&color=2563eb" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@mengde1231/rudder"><img src="https://img.shields.io/npm/dw/@mengde1231/rudder?style=flat-square&color=cb3837&label=downloads" alt="npm downloads" /></a>
<a href="https://github.com/MengDe1231/Rudder/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-16a34a.svg?style=flat-square" alt="license" /></a>
<a href="https://github.com/MengDe1231/Rudder/stargazers"><img src="https://img.shields.io/github/stars/MengDe1231/Rudder?style=flat-square&color=eab308" alt="stars" /></a>
<a href="https://docs.tryrudder.app/"><img src="https://img.shields.io/badge/docs-tryrudder.app-0f766e?style=flat-square" alt="docs" /></a>
</p>

<p align="center">
<img src="assets/rudder-demo.gif" alt="Rudder workflow demo" width="100%">
</p>

## Why Rudder?

| Capability | What it changes |
| --- | --- |
| **Auto-injected specs** | Write conventions once in `.rudder/spec/`, then let Rudder inject the relevant context into each session instead of repeating yourself. |
| **Task-centered workflow** | Keep PRDs, implementation context, review context, and task status in `.rudder/tasks/` so AI work stays structured. |
| **Project memory** | Journals in `.rudder/workspace/` preserve what happened last time, so each new session starts with real context. |
| **Team-shared standards** | Specs live in the repo, so one person's hard-won workflow or rule can benefit the whole team. |
| **Multi-platform setup** | Bring the same Rudder structure to 14 AI coding platforms instead of rebuilding your workflow per tool. |

## Prerequisites

- **Node.js** >= 18
- **Python** >= 3.9

## Quick Start

```bash
# 1. Install Rudder
npm install -g @mengde1231/rudder@latest

# 2. Initialize in your repo
rudder init -u your-name

# 3. Or initialize with the platforms you actually use
rudder init --cursor --opencode --codex -u your-name
```

See the [Quick Start](https://docs.tryrudder.app/start/install-and-first-task) and [Supported Platforms](https://docs.tryrudder.app/advanced/multi-platform) guides for setup details.

## How It Works

Rudder runs a 4-phase loop with auto-invoked skills and sub-agents:

1. **Plan** — `rudder-brainstorm` walks through requirements one question at a time and writes `prd.md`. Research-heavy items go to a `rudder-research` sub-agent. The result is curated specs + research files referenced from `implement.jsonl` / `check.jsonl`.
2. **Implement** — a `rudder-implement` sub-agent writes code from the PRD with the curated context auto-injected, no git commit.
3. **Verify** — a `rudder-check` sub-agent reviews the diff against specs and runs lint, type-check, and tests, self-fixing where it can.
4. **Finish** — a final check runs, then `rudder-update-spec` promotes new learnings back into `.rudder/spec/` so the next session starts smarter.

## FAQ

<details>
<summary><strong>How is Rudder different from <code>CLAUDE.md</code>, <code>AGENTS.md</code>, or <code>.cursorrules</code>?</strong></summary>

Those files are useful entry points, but they tend to become monolithic. Rudder adds scoped specs, task PRDs, workflow gates, workspace memory, and platform-aware generated files around them.

</details>

<details>
<summary><strong>Is Rudder only for Claude Code?</strong></summary>

No. Rudder is a project layer that works across multiple coding agents and IDEs.

</details>

<details>
<summary><strong>Is Rudder for solo developers or teams?</strong></summary>

Both. Solo developers use it for memory and repeatable workflow. Teams get the larger benefit: shared standards, task boundaries, reviewable context, and platform portability.

</details>

<details>
<summary><strong>Do I have to write every spec file manually?</strong></summary>

No. Many teams start by letting AI draft specs from existing code and then tighten the important parts by hand. Rudder works best when you keep the high-signal rules explicit and versioned.

</details>

<details>
<summary><strong>Can teams use this without constant conflicts?</strong></summary>

Yes. Personal workspace journals stay separate per developer, while shared specs and tasks stay in the repo where they can be reviewed and improved like any other project artifact.

</details>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=MengDe1231/Rudder&type=Date)](https://star-history.com/#MengDe1231/Rudder&Date)

<p align="center">
<a href="https://docs.tryrudder.app/">Docs</a> •
<a href="https://github.com/MengDe1231/Rudder">GitHub</a> •
<a href="https://discord.com/invite/tWcCZ3aRHc">Discord</a> •
<a href="https://github.com/MengDe1231/Rudder/blob/main/LICENSE">AGPL-3.0 License</a>
</p>
