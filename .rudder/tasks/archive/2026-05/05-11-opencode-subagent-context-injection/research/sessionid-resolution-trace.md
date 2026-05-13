# #264 失败链路：精确溯源

## 结论（一句话）

**OpenCode 没有丢 sessionID**。`tool.execute.before` 的 input 类型签名上 `sessionID: string` 是必传字段（非 optional）；JS 端 `getContextKey()` 也确实拿到了它。"no current task" 的真因是 **`.rudder/.runtime/sessions/<key>.json` 在 task 启动时没被写出，或写出的 key 与 JS 查的 key 不一致**。

## JS 查找链路（`packages/cli/src/templates/opencode/lib/rudder-context.js`）

`getContextKey(input)` 优先级（line 83-105）：

1. `process.env.RUDDER_CONTEXT_ID` — 显式覆盖
2. `process.env.OPENCODE_RUN_ID` → `opencode_session_<sanitized-runID>`
3. `input.session_id` / `sessionId` / `sessionID` → `opencode_session_<sanitized-sessionID>`
4. `input.conversation_id` 等
5. `input.transcript_path`
6. 全部失败 → `null`

`readContext(contextKey)` 读 `.rudder/.runtime/sessions/${contextKey}.json` (line 109)。

`getActiveTask()` (line 120-138)：拿不到 contextKey 或文件不存在或 `current_task` 为空 → 返回 `{ taskPath: null, source: "none" }`。

**没有 fallback**。这是 JS 端缺口。

## Python 写入链路（`.rudder/scripts/common/active_task.py`）

`_context_key(platform, kind, value)` (line 191-197)：

```python
return f"{platform_name}_{safe_value}"   # 例如 "opencode_session_abc123"
```

`_lookup_env_context_key()` (line 216-244)：按平台读环境变量。OpenCode 注册的环境变量名：

```python
("opencode", ("OPENCODE_SESSION_ID", "OPENCODE_SESSIONID", "OPENCODE_RUN_ID"))
```

`set_active_task()` (line 548-574)：

1. `resolve_context_key(platform_input, platform)` — 由 `task.py start` 调用，**没有 platform_input**（这是 CLI 子命令，不是 OpenCode hook）
2. 退化到 env 查询
3. 没有 env → 返回 None → 不写文件
4. 有 env（值 X）→ 写 `.rudder/.runtime/sessions/opencode_session_<sanitize(X)>.json`

`resolve_active_task()` 读路径已经有**单 session fallback**（line 497-519）：runtime 目录里只剩唯一一份 session 文件时，无视 key 强行用它。**Python 已有，JS 没有**。

## 这里的 runtime 现状（证据）

```
$ ls .rudder/.runtime/sessions/
claude_*.json   (4 份)
codex_*.json    (15 份)
opencode_*.json (0 份)
```

证明文件名 schema 与代码一致：`<platform>_<sessionID>.json`。Claude / Codex 平台正常落盘；OpenCode 在本 repo 当前没活跃任务，所以没文件——这与"OpenCode 写不出文件"无关，是本地无活跃 task。

## 三种导致 #264 的具体场景

| # | 用户操作 | 实际发生 | JS 看到 |
| -- | -- | -- | -- |
| **A** | OpenCode TUI 外另开 terminal 跑 `task.py start <dir>` | 那个 shell 没有 `OPENCODE_SESSION_ID` / `OPENCODE_RUN_ID` env → Python `resolve_context_key` → None → 不写文件 | sessionID 解析出来了，但文件不存在 → "no current task" |
| **B** | 在 OpenCode 内通过 Bash tool 跑 `task.py start` | **happy path，无 bug**。`injectRudderContextIntoBash` 注入 `export RUDDER_CONTEXT_ID=opencode_<sessionID>` → Python `resolve_context_key` 直接取值并 sanitize（不二次包装）→ 写 `opencode_<sessionID>.json` → JS 后续按相同 key 命中。详见下方"场景 B 验证"。 |
| **C** | 用户在某个 sessionID 下启动 task，然后开新 OpenCode 会话用 subagent | 旧 session 文件存在，但新 session 文件不存在 → JS 按新 sessionID 查 → miss | "no current task" |

## 场景 B 验证（决定性证据）

### Python 端如何处理 `RUDDER_CONTEXT_ID`

`active_task.py:380-391`：

```python
def resolve_context_key(platform_input=None, platform=None):
    """`RUDDER_CONTEXT_ID` is an explicit context-key override used by CLI
    scripts and subprocesses. It does not store the task itself."""
    override = _string_value(os.environ.get("RUDDER_CONTEXT_ID"))
    if override:
        return _sanitize_key(override) or _hash_value(override)
    ...
```

**关键点**：`RUDDER_CONTEXT_ID` 被当成 **raw context_key 直接使用**，只走一次 `_sanitize_key`，**不会**再拼平台前缀。注释明确说："an explicit context-key override"。

### JS 端 inject Bash 时塞什么

`inject-subagent-context.js:288-294 + 326-330`：

```js
function buildRudderContextPrefix(contextKey, ...) {
  return `export RUDDER_CONTEXT_ID=${shellQuote(contextKey)}; `
}

// 调用处：
const contextKey = ctx.getContextKey(input)   // 来自 rudder-context.js
args[commandKey] = `${buildRudderContextPrefix(contextKey, ...)}${command}`
```

`rudder-context.js:83-105` 的 `getContextKey`：OpenCode sessionID 走到的分支是

```js
const sessionID = lookupString(input, [...])
if (sessionID) return buildContextKey("opencode", "session", sessionID)
```

`buildContextKey` (line 58-64)：

```js
function buildContextKey(platformName, kind, value) {
  if (kind === "transcript") return `${platformName}_transcript_${hashValue(value)}`
  const safeValue = sanitizeKey(value)
  return safeValue ? `${platformName}_${safeValue}` : `${platformName}_${hashValue(value)}`
}
```

注意 `kind === "session"` 时**没有 `_session_` 中间段**，输出形如 `opencode_<sanitized-sessionID>`。

### 端到端对齐（场景 B）

| 时刻 | 谁 | 操作 | key |
| -- | -- | -- | -- |
| 1 | JS（Bash inject 时） | `getContextKey(input)` from input.sessionID=`abc-123` | `opencode_abc-123` |
| 2 | JS | `export RUDDER_CONTEXT_ID='opencode_abc-123'; task.py start ...` | env=`opencode_abc-123` |
| 3 | Python `task.py start` | `resolve_context_key` 取 env override → `_sanitize_key("opencode_abc-123")` | `opencode_abc-123`（已合法字符，原样返回） |
| 4 | Python | `_write_json(.runtime/sessions/opencode_abc-123.json)` | 文件名 `opencode_abc-123.json` ✓ |
| 5 | JS（后续 Task tool） | `getContextKey(input)` → `buildContextKey("opencode", "session", "abc-123")` | `opencode_abc-123` ✓ |
| 6 | JS | 读 `.runtime/sessions/opencode_abc-123.json` | **命中** ✓ |

**结论：场景 B 不是 bug**。Python 注释里把 `RUDDER_CONTEXT_ID` 明确定义为"raw context-key override"，JS 写入也确实是 raw key。两端约定一致，没有二次包裹。

### `_sanitize_key` 双端一致性

| | 实现 |
| -- | -- |
| JS | `raw.trim().replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^[._-]+\|[._-]+$/g, "").slice(0,160)` |
| Python | `re.sub(r"[^A-Za-z0-9._-]+", "_", raw.strip()).strip("._-")[:160]` |

正则字符类、起止 strip、160 截断完全一致 ✓。所以 sanitize 不会在某一端"意外变形"。

### 唯一仍需注意的小风险

如果 OpenCode 的 sessionID 里出现 `[^A-Za-z0-9._-]` 字符（比如 `:` 或 `/`），JS inject 时 sanitize 一次 → Python override 时再 sanitize 一次。**两次 sanitize 是幂等的**（结果一样），所以仍对齐。

更极端的情况：sessionID 全是非法字符 → 第一次 sanitize 后变空 → JS `sanitizeKey` 走 `hashValue(value)` 分支（contextKey = `opencode_<24字符hash>`），Python override 时已经是合法字符串，原样保留 → 仍对齐。

→ 没有发现破坏对齐的边缘情况。

## 子 agent `chat.message` 链路（与上面独立的另一个 bug）

父 session 触发 Task tool → OpenCode 调 `sessions.create({ parentID })` 起子 session → 子 session 有**自己的 sessionID** → 子 session 跑 `chat.message`，input：

```ts
{ sessionID: <child-id>, agent: "rudder-implement" }
```

`session-start.js` / `inject-workflow-state.js` 没看 `input.agent`，把子 session 当主 session：

- 查 `.rudder/.runtime/sessions/opencode_session_<child-id>.json` — 必然不存在（子 session 没人为它写文件）
- 注入通用 SessionStart 内容 + 通用 workflow-state breadcrumb
- 这就是 #264 日志里的 `[session] Injected context into chat.message text part` 和 `[workflow-state] Injected breadcrumb for task none status no_task`

这部分是**纯粹的 agent skip 逻辑缺失**，与上面 task-state 写入/查找完全独立。即使父 session 的 task-state 文件齐了、`tool.execute.before` 成功 inject 了正确 prompt，子 session 的两个 chat.message 插件还是会把那段 prompt 之外**额外**塞主会话上下文进去，破坏 subagent 的纯净度。

## 修正版的 root cause 列表

| 原 design.md 说法 | 修正版 |
| -- | -- |
| #1 "Task tool event lacks a session id" | **错。** sessionID 在 plugin 类型上是必传；真因是 `.rudder/.runtime/sessions/opencode_<sessionID>.json` 未被写入。场景 A 和 C 是真实 miss 路径；场景 B（TUI 内 Bash inject 启动 task）实际是 happy path，端到端 key 对齐。 |
| #2 "JS getActiveTask 缺单 session fallback" | **对，但补一句**：Python 端已经有 `_resolve_single_session_fallback`（active_task.py:497），JS 端要镜像。 |
| #3 "不解析 prompt 里 `Active task:`" | **对**，且这是用户驱动的显式兜底，独立于环境。 |
| #4 "buildPrompt 不带 `<!-- rudder-hook-injected -->` marker" | **对**，但要说明这是 Rudder 内部 agent 模板侧约定，OpenCode 不感知。 |
| #5 "chat.message 插件不区分 sub-agent" | **对，且最关键**。`input.agent` 字段就是判别器，类型签名上是 `agent?: string`，subagent 子 session 一定带它。 |

## 给 PRD/Design 的修订建议

1. PRD "Problem" 段把 "JS resolver returns no current task even though parent has one" 改成 "session 文件因外部 terminal 启动或新窗口未写入，JS sessionID lookup miss"。
2. Design root cause #1 重写为 "JS 的 sessionID → context file 查找会 miss（场景 A：外部 terminal 启动；场景 C：跨窗口）"。
3. ~~Acceptance criterion 加一条：场景 B 双重 sanitize 验证~~ —— 已证实场景 B 不存在双重包裹，删掉此项。
4. 在 design.md 的 "Target Flow → Task Tool Prompt Mutation → step 3" 解析顺序里，单 session fallback 必须**晚于** prompt 里的 `Active task:` 显式兜底——单 session fallback 只在恰好 1 个 session 文件时生效；多 session（用户开了多个 OpenCode 窗口）时显式 hint 优先。
