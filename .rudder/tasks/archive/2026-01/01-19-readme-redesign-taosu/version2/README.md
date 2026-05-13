<!-- 🖼️ [IMAGE] Logo: 居中显示的品牌 Logo
     尺寸: 120x120 (已设置)
     文件: rudder.png
     注意: 极简风格只需要 Logo，不需要其他图片
-->
<p align="center">
  <img src="./rudder.png" alt="Rudder" width="120" />
</p>

<h1 align="center">Rudder</h1>

<p align="center">
  <strong>Workflow templates for AI coding assistants</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mengde1231/rudder"><img src="https://img.shields.io/npm/v/@mengde1231/rudder" alt="npm"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
</p>

<p align="center">
  <a href="#install">Install</a> •
  <a href="./docs/README.md">Docs</a> •
  <a href="./README-zh.md">中文</a>
</p>

---

## Install

```bash
npm install -g @mengde1231/rudder@latest
cd your-project && rudder init -u your-name
```

## Use

```
/start                    # Begin session
/parallel                 # Multi-agent pipeline
/record-agent-flow        # Save progress
```

## What's Inside

```
.rudder/
├── structure/       → Development guidelines
├── agent-traces/    → Session history
└── scripts/         → Automation
```

## Works With

- [Claude Code](https://claude.ai/code) — Full support
- [Cursor](https://cursor.sh) — Commands only

## Links

- [Documentation](./docs/README.md)
- [GitHub Issues](https://github.com/MengDe1231/Rudder/issues)

---

<p align="center">
  <sub>MIT License • <a href="https://github.com/MengDe1231">Mindfold</a></sub>
</p>
