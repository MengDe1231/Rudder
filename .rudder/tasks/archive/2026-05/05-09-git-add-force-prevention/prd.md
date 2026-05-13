# fix(scripts): prevent AI from inventing `git add -f` when `.rudder` is gitignored

## Goal

社群真用户事故：项目 `.gitignore` 里写了 `.rudder/`（公司模板默认 / 个人习惯），AI 跑 Rudder 流程时碰到 `add_session.py` 的 fallback 提示 `git add .rudder && git commit`，自己脑补 `-f` 强行 add，结果把 `.rudder/.backup-*` `.rudder/worktrees/` 等 **548 文件 / 83474 行垃圾全 commit 进了仓**。

修法：让脚本在用户 `.gitignore` 排除 `.rudder/` 时仍然能正确 commit 关键产物，而 AI 即便看到错误也不会脑补 `-f`。

## Decisions (locked)

- **A. 智能 fallback 提示**：`add_session.py` / `task.py archive` 检测 git stderr 是否含 `ignored by`，换成精准提示，**显式说"不要 `git add -f`"**
- **C. 收紧 add 路径范围**：脚本只 add 真正的产物文件（具体子路径），不依赖用户 `.gitignore` 配置；这样即使 `.gitignore` 排除了 `.rudder/` 整体，关键产物也能 add 进去（git `--force-with-lease` 不需要——只要 add 路径精确，git 自己就 OK）

  实际：用 `git add -f <specific-file>` 是安全的（只 force 我们 owned 的具体文件），**不**用 `git add -f .rudder/`（整个目录）

  注意：这跟 PRD 标题"prevent -f"看起来矛盾，但实际是：**脚本可以 -f 自己 owned 的具体路径；AI 不能 -f 整个目录**。差别在 grain。

- **B（推迟）**：workflow.md 加 negative rule "Do NOT use `git add -f`" —— 留下个 task

## Requirements

### add_session.py (`_auto_commit_workspace`)

- 路径范围：从 `.rudder/workspace .rudder/tasks` 收紧到具体产物：
  - `.rudder/workspace/<session>/journal-*.md`
  - `.rudder/workspace/<session>/index.md`
  - `.rudder/tasks/<task-dir>/`（活跃 task 目录）
  - `.rudder/tasks/archive/`（归档目录）
- **不**加：`.rudder/.backup-*`、`.rudder/worktrees/`、`.rudder/.template-hashes.json`、`.rudder/.runtime/`
- 检测 `git add` exit non-zero 且 stderr 含 `ignored by`：
  - 改用 `git add -f <specific-paths>` 重试（仅 force 这次脚本知道的具体路径）
  - 如果 -f 也失败 → fallback 提示加强：明示用户 `.gitignore` 排除了关键路径，建议把 `.rudder/` exclusion 改成 `.rudder/.backup-*` / `.rudder/worktrees/` / `.rudder/.template-hashes.json` / `.rudder/.runtime/` 这种 specific 子路径
  - 提示文本里**显式带 negative rule**：`Do NOT use 'git add -f .rudder/' — that pulls in backups/worktrees/runtime caches.`

### task.py archive (auto-commit)

- 同样的 ignored-detection + 自动 -f 重试（限定到 archive 目录的具体子路径）
- 同样的反例提示

### 路径白名单 helper

- 抽 `_safe_rudder_paths_to_add(repo_root)` helper：返回当前应该 add 的 specific 路径列表
- 两个 caller 共用

## Acceptance Criteria

- [ ] 用户项目 `.gitignore` 含 `.rudder/` 时，`add_session.py` 不再走 plain `git add` 失败 → 自动用 `git add -f <specific>` 成功 commit 真产物
- [ ] 不会 add `.rudder/.backup-*` / `.rudder/worktrees/` / `.rudder/.template-hashes.json` 等不该入仓的
- [ ] 错误提示明确说 "**Do NOT use 'git add -f .rudder/'**"
- [ ] `task.py archive` 同行为
- [ ] 单元测试：合成 git repo + 写 `.gitignore` 含 `.rudder/`，跑 add_session 后验证只有产物入仓
- [ ] 现有用例（`.rudder/` 不被 ignored）行为不变
- [ ] `pnpm lint / typecheck / test` 全绿（这些是 Python 脚本测试，看仓里 Python 测试是否跑或者补一份）

## Definition of Done

- 1 个 commit on main
- 起一版 0.5.10 stable + cherry-pick 到 feat/v0.6.0-beta 起 0.6.0-beta.5
- changelog 重点：用户 `.gitignore` 含 `.rudder/` 不再坑
- B 项（workflow.md negative rule）单独 follow-up task

## Out of Scope

- 改我们 init 时 ship 的 `gitignore.txt` 模板（不动用户 .gitignore）
- 改 workflow.md commit 段（B 留 follow-up）
- 写 git pre-commit hook 拦截 `git add -f .rudder/`（侵入式，不必）
- 教育用户怎么写正确的 .gitignore（让脚本主动适配，不教）

## Technical Notes

- `add_session.py` 已经在 templates/rudder/scripts/，是会被 ship 出去的
- `task.py archive` 在同目录
- `git add -f <path>` 跟 `git add -f .rudder/`（整个目录）的关键差别：前者只 force 我们 owned 的具体路径，后者 fan-out 到 ignored 的所有子树。脚本里前者安全
- 测试入口：现有 Python 脚本的测试在哪？看 `packages/cli/test/` 和 `.rudder/scripts/` 各处
