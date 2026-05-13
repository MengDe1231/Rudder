# spec sweep: capture this session's lessons (2026-05-08 / 2026-05-09 / 2026-05-10)

## Goal

把这几次 session 沉淀的反模式 / 正模式 / 教训写进 `.rudder/spec/`，让未来 contributor 不再重蹈覆辙。

## 6 个主题

### A. Git 交互（→ `script-conventions.md` 扩展）
- 反模式：AI 看到脚本 fallback 提示后脑补 `git add -f .rudder/` 整个目录 → 拉进 backup/worktree/runtime（pre-0.5.10 真用户事故 83474 行垃圾）
- 反模式：脚本主动 `-f` 覆盖用户 `.gitignore`（0.5.10 引入 → 0.5.11 撤）—— 即便范围窄也是无视用户意图
- 正模式：路径白名单 + plain `git add` + `ignored by` 时 warn-and-skip
- 配置：`session_auto_commit: true|false`（0.5.11 加）governs `add_session.py` + `task.py archive`
- AI 防御：warning 文本必带 `Do NOT use git add -f .rudder/` 字面反例 + centralized 单一文本源
- 路径白名单源：`safe_commit.py:safe_rudder_paths_to_add` 是 canonical 实现

### B. Config 解析（→ `script-conventions.md` 加 "Config helpers" 节）
- 反模式：自己写 YAML 解析路径绕过 `_strip_inline_comment`（codex.dispatch_mode 踩过、session_auto_commit 也差点踩）
- 正模式：所有新 key 必须走 `common/config.py:_load_config` 链 → `parse_simple_yaml` → `_strip_inline_comment` → `_unquote`
- Boolean 宽容：`true/false/yes/no/1/0/on/off` case-insensitive；无效 → fallback default + stderr warn
- 必须在 `templates/rudder/config.yaml` 加 commented-out 示例
- 测试 fixture 必须含 `key: value  # comment`（带尾注释形式）

### C. 平台集成（→ `platform-integration.md` 扩展 Pi 节 + Cross-platform consistency 节）
- Extension-backed 平台（Pi）禁止接收 `.rudder/templates/shared-hooks/*.py` Python hook；逻辑必须 TS-port
- TS-port workflow-state parser 必须用 byte-identical regex（`\1` backreference）保跨平台一致性
- Workflow-state 注入双点：`input` hook（per-turn）+ `before_agent_start` hook（per-agent）
- Subagent 工具注册必带 `promptSnippet` 含 `Active task: <path>` dispatch protocol
- Class-1（hook 注入）vs Class-2（pull-based prelude）平台分类已在现有 spec，但 Pi（extension-backed）是第三类，spec 节标题要明确

### D. mem.ts 经验（→ `commands-mem.md` fix stale + add lessons）
- **Stale fix 优先**：Platform coverage 表关于 Codex 的 "degrade" 描述已经过时（`collectCodexTurnsAndEvents` 实际支持 phase）—— rudder-check 之前就提过
- 跨天 session 过滤必须用区间重叠（`inRangeOverlap(created, updated, f)`）不能单点 `inRange`
- Shell-arg 解析：`$(...)` 闭合括号要 strip、multi-task.py-per-command 要全识别、prose 要拒绝（"bare-word + space + letters"启发）、`MM-DD-` 前缀比对时要 strip
- 性能：chunked sync streaming + byte-prefix fast-reject `0x7b` 模式（`readJsonl` canonical 实现）
- OpenCode 0.6.0-beta.4 reverted to degraded（之前 0.6.0-beta.3 加的 SQLite reader 因 native dep 问题撤掉）—— 当前 spec 章节是 stub 状态

### E. Native dep 政策（→ `quality-guidelines.md` 新加 "Native dependency policy" 节，或者新文件 `release-policy.md`）
- 教训：0.6.0-beta.3 加 `better-sqlite3` 在 Windows + 中国网络上挂掉（prebuild-install timeout → node-gyp fallback → 缺 VS2017+ → 整个 rudder 装不上），4 小时后紧急 0.6.0-beta.4 revert
- 正策略：避免 native dep；必需时用 `optionalDependencies` + soft-degrade fallback；prefer pure JS / WASM (sql.js) / shell-out 现有 CLI
- 必测：Windows + 受限网络环境（即使 prebuilt 在，下载失败 fallback 编译会要求 user 装 C 工具链）
- 决策框架：native dep 收益必须 dramatically 大于跨平台兼容成本

### F. Submodule + 跨 branch 发版口径（→ 新文件 `release-process.md` 或扩 `migrations.md`）
- main / feat/v0.6.0-beta / docs-site / marketplace 各自 ownership
- 跨 branch 发版时 manifest restore 套路：每次发新版前 `check-manifest-continuity` 必跑；published-but-missing → `git show <other-branch>:packages/cli/src/migrations/manifests/<v>.json > <local>` 恢复
- docs-site / marketplace submodule 是独立 repo，commit + push 必须先 sub-repo 后主仓
- pnpm release / release:beta 内部先 stage docs-site 之外的所有改动 → commit "pre-release updates" → bump version → commit version → tag → push
- branch protection on main 要求 review approval，merge PR 时主仓维护者 self-approve OK

## Acceptance Criteria

- [ ] A + B 写入 `script-conventions.md`（"Git interaction" + "Config helpers" 子节）
- [ ] C 写入 `platform-integration.md`（Pi 节扩展 + 加 cross-platform consistency 节）
- [ ] D 改 `commands-mem.md`：修 Codex degrade stale + 加 shell-arg / cross-day / perf 经验子节
- [ ] E 写入 `quality-guidelines.md` 加 "Native dependency policy" 子节
- [ ] F 新文件 `.rudder/spec/cli/backend/release-process.md` 或扩 `migrations.md` 加 "Cross-branch release flow" 子节
- [ ] 引用代码用 `path/file.ts:symbolName` 而非纯行号
- [ ] 不新增 commands/ utils/ 子层；保持 backend/ flat
- [ ] 不动代码（`packages/cli/src/`）
- [ ] `pnpm lint / typecheck / test` 仍全绿（spec-only 改动应 noop）

## Definition of Done

- 5 个 spec 文件 modified / 1 个新加
- 1 个 commit on main，跟 0.5.11 准备一起 ship 或单独 doc commit
- 不需要发 npm package（spec 是项目内部 doc）

## Out of Scope

- workflow.md 主体改造（B 项的 negative rule 已经在 safe_commit.py 警告文本里，不动 workflow.md）
- docs-site 用户文档同步（spec 是 internal）
- 重写整个 platform-integration.md（只扩展 Pi 节 + 新加 cross-platform consistency 节）
- 重写整个 commands-mem.md（只修 stale + 加新子节）
- 重做 batch E 的其他 4 个 spec 文件

## Sub-agent 拆分（按文件聚类避免 race）

| Sub-agent | Owns | 主题 |
|---|---|---|
| 1 | `script-conventions.md` | A + B（Git 交互 + Config 解析） |
| 2 | `platform-integration.md` | C（Pi extension + cross-platform consistency） |
| 3 | `commands-mem.md` | D（stale fix + 新经验子节） |
| 4 | `quality-guidelines.md` + new `release-process.md` | E + F |

每个 owns 不同文件，无 race。最后主 session 整合 commit。

## Technical Notes

- 现有 spec 风格参考：`platform-integration.md` 是 audit 公认 best-maintained
- 引用约定：`commands/mem.ts:functionName` / `templates/rudder/scripts/common/safe_commit.py:safe_git_add` / 等
- 长度：每个新加子节 ≤ 200 行；不灌水
- 存在不动 `commands-mem.md` Phase slicing 节（已经写得好）
