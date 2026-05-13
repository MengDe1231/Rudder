# fix(pi): inject [workflow-state] / session-overview / subagent prompts (#249)

## Goal

修 Pi 平台 Rudder 工作流"完全失效"的真 bug：用户用 Pi 时 AI 不会走 `task.py create → brainstorm → implement → check` 流程，直接开写代码。原因是 Pi extension 的 hook 没注入 workflow-state breadcrumb、session-overview 和 subagent dispatch protocol。

来源：issue #249 by RenaLio（同 PR #246 作者，已给完整诊断 + 当前坏代码片段）。

## What I already know

- Pi extension 入口：`packages/cli/src/templates/pi/extensions/rudder/index.ts.txt`（997 行 TS，会被 init 写到用户项目的 `.pi/extensions/rudder/index.ts`）
- 当前 hook 实现（issue 里 reporter 给的）：
  ```typescript
  // input hook 只解析 context key，不注入任何 prompt
  pi.on?.("input", (event, ctx) => {
      getContextKey(event, ctx);
      return { action: "continue" };
  });
  
  // before_agent_start 只注入 PRD + jsonl，没 workflow-state
  pi.on?.("before_agent_start", (event, ctx) => {
      const context = buildRudderContext(...);
      return { systemPrompt: [current, context].join("\n\n") };
  });
  ```
- 应当注入的内容（参考其他平台 hook，如 Claude Code 的 `inject-workflow-state.py`）：
  - **`<workflow-state>` breadcrumb**：当前 task 状态 + Phase 指引（来自 `.rudder/workflow.md` 里 `[workflow-state:STATUS]...[/workflow-state:STATUS]` 标签块）
  - **`<session-overview>`**：developer 身份、git 分支、活跃 task list
  - **`subagent` 工具的 `promptSnippet` / `promptGuidelines`**：sub-agent dispatch protocol（必带 `Active task:` 行）
- 已有 Python 脚本：`templates/rudder/scripts/common/inject-workflow-state.py`（其他平台用），可参考逻辑或直接 spawn

## Decisions (locked)

- **注入策略**：在 `input` hook 注入 `<workflow-state>` + `<session-overview>`（每轮对话都更新，跟 Claude Code 的 UserPromptSubmit hook 等价语义）
- **subagent 工具 promptSnippet**：注册时（extension load 时一次性）注入 dispatch protocol 文本（`Active task: ...` 行 + 反例）
- **复用 Python 脚本**：spawn `python3 .rudder/scripts/common/inject-workflow-state.py --platform pi`（能调到现成 logic，避免重写跨平台一致性丢失）。如果 Python 调用太慢，再考虑 TS port
  - 注意：Pi extension 是 TS，但 Pi 允许 spawn 子进程
- **保留现有逻辑**：`before_agent_start` 的 PRD + jsonl 注入仍在，加上 workflow-state；不删既有功能

## Requirements

- `pi/extensions/rudder/index.ts.txt`:
  - `input` hook 加：spawn `inject-workflow-state.py --platform pi`，把 stdout 注入到对话上下文（Pi API 怎么"per-turn 加 prompt"看 Pi docs / 现有 input hook 返回结构）
  - `before_agent_start` hook 加：把同样的 workflow-state 内容拼到 systemPrompt
  - subagent 工具注册时加 `promptSnippet`（dispatch protocol：`Active task: <path>` 行 + class-1/class-2 平台说明 + 反例）
- 测试：
  - `test/templates/pi.test.ts` 加测试覆盖三个注入点的存在性
  - 端到端 fixture 难做（需要真 Pi runtime），用文本断言代替（生成的 index.ts 含特定 string）

## Acceptance Criteria

- [ ] Pi extension 在用户项目里跑起来后，AI 看到 `<workflow-state>` block（包含 task status / phase 指引）
- [ ] AI 看到 `<session-overview>`（dev name / git branch / active tasks）
- [ ] AI 派发 sub-agent 时 prompt 包含 `Active task:` 行
- [ ] 测试覆盖：生成的 Pi extension TS 含 `inject-workflow-state.py` spawn / `Active task` literal / 等关键字符串
- [ ] 不破坏现有 PRD + jsonl 注入逻辑
- [ ] `pnpm lint / typecheck / test` 全绿

## Definition of Done

- 1 个 commit on main（合 `5a5e5db` 一起进 0.5.10）
- close issue #249
- changelog 加一行

## Out of Scope

- 重写 Pi extension 整体（这次只 patch hook 注入逻辑）
- 把 Pi 注入移到 Python（依然 TS spawn Python）
- Pi 平台其他 issue（#256 OpenCode 跟此不相关）
- TS port `inject-workflow-state.py`（性能优化留 follow-up）

## Technical Notes

- 参考实现：Claude Code 的 `templates/claude/hooks/inject-workflow-state.py` —— Claude 直接 hook 跑 Python script
- Pi 是 TS extension，调 `child_process.spawn("python3", [...])` 拿 stdout
- 错误处理：Python script 失败时 fallback 到当前行为（不阻塞对话）
- workflow-state 标签解析逻辑见 `inject-workflow-state.py:resolve_breadcrumb_key`
- subagent promptSnippet 内容参考 Claude Code 的 dispatch protocol（在 workflow-state breadcrumb 文本里）
