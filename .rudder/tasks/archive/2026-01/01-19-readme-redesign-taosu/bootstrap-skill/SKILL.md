---
name: rudder-bootstrap
description: Initialize Rudder AI workflow system in a project. Use when user mentions "Rudder", "初始化 Rudder", "setup Rudder", "install Rudder", or wants to add AI-assisted development workflow to their project. This is a one-time setup skill.
allowed-tools: Bash, Read, AskUserQuestion
---

# Rudder Bootstrap

One-time setup for Rudder - the AI workflow system that helps your AI assistant remember project context across sessions.

## What is Rudder?

Rudder provides:
- **Structure** - Store coding guidelines in `.rudder/structure/` that AI follows
- **Memory** - Track session history in `.rudder/agent-traces/`
- **Automation** - Slash commands like `/start`, `/parallel`, `/finish-work`

## Prerequisites Check

Before starting, verify:

```bash
# Check Node.js (required: v18+)
node --version

# Check npm
npm --version
```

If Node.js is not installed, ask the user to install it first.

## Installation Steps

### Step 1: Install Rudder CLI

```bash
npm install -g @mengde1231/rudder@latest
```

Verify installation:
```bash
rudder --version
```

### Step 2: Get Developer Name

Ask the user for their name/username. This will be used for tracking their sessions.

Example question: "What name should I use for your developer profile? (e.g., your GitHub username)"

### Step 3: Initialize in Project

Run in the project root:

```bash
rudder init -u <developer-name>
```

This creates:
```
.rudder/
├── workflow.md                # Start here
├── structure/                 # Development guidelines
│   ├── frontend/
│   └── backend/
├── agent-traces/<name>/       # Your session history
└── scripts/                   # Automation scripts

.claude/
├── commands/                  # 13 slash commands
├── agents/                    # 6 agent definitions
└── hooks/                     # Automation hooks

.cursor/
└── commands/                  # 12 slash commands

AGENTS.md                      # AI reads this first
```

### Step 4: Verify Setup

```bash
# Check created files
ls -la .rudder/
ls -la .claude/commands/
```

## Post-Setup Instructions

Tell the user:

1. **Start using Rudder** - Run `/start` at the beginning of each session
2. **Add guidelines** - Edit files in `.rudder/structure/` to customize AI behavior
3. **Track progress** - Run `/record-agent-flow` at the end of sessions

## Quick Reference

| Command | When to Use |
|---------|-------------|
| `/start` | Beginning of every session |
| `/parallel` | Complex features (multi-agent pipeline) |
| `/before-frontend-dev` | Before frontend coding |
| `/before-backend-dev` | Before backend coding |
| `/finish-work` | Before committing |
| `/record-agent-flow` | End of session |

## Success Criteria

Setup is complete when:
- [ ] `rudder --version` shows version number
- [ ] `.rudder/` directory exists with `workflow.md`
- [ ] `.claude/commands/` contains slash command files
- [ ] `AGENTS.md` exists in project root

After successful setup, this skill is no longer needed. The user should use `/start` to begin working with Rudder.

---

**Note**: This is a bootstrap skill. Once Rudder is initialized, use the built-in `/start` command instead of this skill.
