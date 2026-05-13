# Rudder

> The workflow layer for AI coding

<!-- TODO: 设计流程图 init→start→work→finish -->
<!-- ![Workflow](./assets/workflow.png) -->

[![npm version](https://img.shields.io/npm/v/@mengde1231/rudder)](https://www.npmjs.com/package/@mengde1231/rudder)
[![License](https://img.shields.io/badge/License-FSL--1.1--MIT-blue)](LICENSE)

English | [中文](./README-zh.md)

## Why Rudder?

AI coding tools are powerful — but every session starts from scratch. Your AI doesn't remember yesterday's decisions, patterns, or progress.

**Rudder adds a persistent workflow layer.** It gives your AI agents:

- Context that survives across sessions
- Structured commands for common tasks
- Project-specific guidelines to follow
- Progress tracking that carries forward

Works with Claude Code, Cursor, and OpenCode (coming soon).

## Quick Start

```bash
# Install
npm install -g @mengde1231/rudder

# Initialize in your project
cd your-project
rudder init

# Start your AI session
# Then tell your AI: /start
```

That's it. Your AI now has structure.

## Features

| Feature | Description |
|---------|-------------|
| **Persistent Context** | Progress and decisions survive across sessions |
| **Structured Commands** | `/start`, `/finish-work`, `/check-backend`, and more |
| **Project Guidelines** | AI follows your frontend/backend standards |
| **Feature Tracking** | Directory-based task management with PRDs |
| **Multi-Tool Support** | Same workflow for Claude Code, Cursor, OpenCode |
| **Session Recording** | Automatic progress documentation |

## How It Works

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   /start    │ →  │    Work     │ →  │ /finish-work│ →  │ Next Session│
│ Read context│    │  AI follows │    │  Validate   │    │   Repeat    │
│ & guidelines│    │  guidelines │    │  & commit   │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

1. **Initialize** — `rudder init` creates the workflow structure in your project
2. **Start Session** — AI reads context, guidelines, and previous progress
3. **Work** — AI follows project-specific patterns and updates progress
4. **Finish** — Validate changes and record progress for next session

## Commands

| Command | Purpose |
|---------|---------|
| `/start` | Initialize session with full context |
| `/finish-work` | Pre-commit checklist and validation |
| `/before-frontend-dev` | Load frontend guidelines before coding |
| `/before-backend-dev` | Load backend guidelines before coding |
| `/check-frontend` | Validate against frontend standards |
| `/check-backend` | Validate against backend standards |
| `/check-cross-layer` | Verify cross-layer consistency |
| `/record-agent-flow` | Record session progress |

## Supported Tools

| Tool | Status |
|------|--------|
| Claude Code | Full support |
| Cursor | Full support |
| OpenCode | Coming soon |

## Project Structure

After `rudder init`, your project will have:

```
your-project/
├── .rudder/
│   ├── workflow.md            # Workflow guide
│   ├── structure/             # Development guidelines
│   │   ├── frontend/          # Frontend standards
│   │   ├── backend/           # Backend standards
│   │   └── guides/            # Thinking guides
│   ├── agent-traces/          # Session tracking
│   │   └── {developer}/       # Per-developer progress
│   └── scripts/               # Utility scripts
├── .cursor/commands/          # Cursor slash commands
├── .claude/commands/          # Claude Code slash commands
└── AGENTS.md                  # Agent instructions
```

## Philosophy

> "Context Window = RAM, Filesystem = Disk"

AI context windows are volatile and limited. Rudder treats your filesystem as persistent memory for AI agents.

It's not about making AI smarter — it's about making AI remember.

## Roadmap

| Feature | Status |
|---------|--------|
| Monorepo Support | Planned |
| Worktree Isolation | Planned |
| Parallel Sessions | Planned |
| Conversation Persistence | Planned |

## Acknowledgments

Built upon ideas from:

- [Anthropic](https://www.anthropic.com/) — [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [OpenSkills](https://github.com/numman-ali/openskills) — Skills system for extending AI capabilities
- [Exa](https://exa.ai/) — Web search and code context capabilities

## License

FSL-1.1-MIT (Functional Source License, MIT future license)

Copyright MengDe1231
