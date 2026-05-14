# `rudder init` 完整流程文档

## 概述

`rudder init` 是 Rudder 框架的核心初始化命令，用于在项目目录下生成 `.rudder/` 工作流目录结构、配置 AI 平台 hooks、创建引导任务。

入口文件：`packages/cli/src/commands/init.ts`（`init()` 函数，第 999 行）

---

## 命令参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `--force` | flag | 强制覆盖已有文件（writeMode = force） |
| `--skip-existing` | flag | 跳过已存在文件（writeMode = skip） |
| `-y` / `--yes` | flag | 非交互模式，冲突默认 skip |
| `--user <name>` | string | 指定开发者名称，跳过 git 检测 |
| `--monorepo` | flag | 强制开启 monorepo 模式 |
| `--no-monorepo` | flag | 强制关闭 monorepo 模式 |
| `--template <id>` | string | 指定远程模板 ID |
| `--registry <source>` | string | 自定义 registry 源（如 `gh:myorg/myrepo/specs`） |
| `--overwrite` | flag | 模板冲突时覆盖 |
| `--append` | flag | 模板冲突时追加缺失文件 |

---

## 全流程（9 个阶段）

### 阶段 1：初始化准备（第 999-1038 行）

**1.1 Banner 展示**（1010 行）
- 使用 FIGlet "Rebel" 字体生成 ASCII art
- 打印副标题 "All-in-one AI framework & toolkit for Claude Code & Cursor"

**1.2 代理设置**（1019 行）
- `setupProxy()` 读取环境变量（HTTP_PROXY / HTTPS_PROXY 等）
- 如果配置了代理，打印代理地址（已脱敏）

**1.3 写入模式设定**（1025-1038 行）
- `--force` → `"force"`：覆盖所有文件
- `--skip-existing` → `"skip"`：跳过已存在文件
- `-y` → `"skip"`：非交互模式默认保护用户文件
- 默认 → `"ask"`：冲突时询问用户

**1.4 关键状态捕获**（1001-1007 行）
- `isFirstInit`：`.rudder/` 不存在 = 首次初始化
- `hadDeveloperFileAtStart`：`.developer` 文件在 init 前是否存在

> **设计意图**：这两个值在创建任何文件之前捕获，用于后续的"三分支任务调度"区分"项目创建者"和"项目加入者"。

---

### 阶段 2：开发者身份检测（第 1040-1106 行）

**2.1 优先级**：
1. `--user` 命令行参数
2. `git config user.name`（仅在 `.git` 目录存在时检测）
3. 都未获取到时，交互式询问 `Your name:`

**2.2 行为**：
- 检测到后打印 `👤 Developer: xxx`，**不二次确认**
- 未检测到且非 `-y` 模式时弹出输入框
- 输入为空时循环要求重新输入

> **注意**：自动检测后不确认是一个已知体验问题。如果 git config 名称不对，用户需要通过 `--user` 参数手动指定。

---

### 阶段 3：Re-init 快速路径（第 1067-1089 行）

**触发条件**（同时满足）：
- `isFirstInit = false`（`.rudder/` 已存在）
- 未使用 `--force`
- 未使用 `--skip-existing`
- `tasks/` 目录非空

**快速路径行为**（`handleReinit()` 函数，第 740 行起）：
- 提示已初始化，已配置的平台名称
- 交互式三选一菜单：
  - `Add AI platform(s)` — 添加未配置的 AI 平台
  - `Set up developer identity` — 设置开发者身份
  - `Full re-initialize` — 退回完整初始化流程
- `-y` 模式下直接返回，不做任何操作

**返回 `false`**（用户选了 Full re-initialize）→ 继续走完整流程  
**返回 `true`** → 结束 init

---

### 阶段 4：Monorepo 检测（第 1134-1306 行）

**4.1 检测规则**（`detectMonorepo()`）：
- 检测 6 种 monorepo 特征文件：
  - `pnpm-workspace.yaml`
  - `package.json` 的 `workspaces` 字段
  - `Cargo.toml` 的 `[workspace]` 段
  - `go.work`
  - `pyproject.toml` 的 `[tool.uv.workspace]` 段
  - `.gitmodules` 或多个 `.git` 目录（≥ 2 个）

**4.2 交互**（非 `-y` 模式）：
- 展示检测到的所有子包（名称、路径、类型）
- 确认是否启用 monorepo 模式
- 对每个子包单独选择 spec 来源：
  - `From scratch (Rudder default)` — 空白模板
  - `Download remote template` — 远程模板（拉取索引后选择具体 ID）

**4.3 输出**：
- `monorepoPackages`：检测到的子包列表
- `remoteSpecPackages`：选择了远程模板的包名集合

---

### 阶段 5：AI 平台选择（第 1308-1350 行）

**5.1 平台来源**：
- 从 `getInitToolChoices()` 获取可选平台列表（Cursor、Claude Code、Codex、Gemini、Qoder、CodeBuddy、Droid、Copilot 等）

**5.2 选择方式**：
- 显式 flag（如 `--cursor --claude`）→ 直接使用
- `-y` 模式无显式 flag → 默认勾选 Cursor + Claude
- 交互模式 → 复选框多选

**5.3 校验**：
- 至少选择一个平台，否则提示并退出

---

### 阶段 6：模板选择（第 1352-1629 行）

**跳过条件**：
- monorepo 模式（已在阶段 4 处理）
- 指定了 `--template` 参数
- 使用了 `-y` 模式

**6.1 拉取模板索引**（1377-1401 行）：
- 从 `TEMPLATE_INDEX_URL` 或自定义 registry 拉取 `index.json`
- 带超时控制，显示加载计时器（如 `Loading... 3s/10s`）
- 支持自定义 registry 源（`gh:myorg/myrepo/specs` 格式）

**6.2 交互式选择**（1428-1599 行）：
- `from scratch (default)` — 空白模板
- `<id> (<name>)` — 远程模板（按 ID 下载）
- `custom (enter a registry source)` — 自定义 registry（循环回选择器）

**6.3 冲突处理**：
- 如果 `spec/` 目录已存在，询问策略：
  - `Skip (keep existing)` — 保留现有
  - `Overwrite (replace all)` — 全部替换
  - `Append (add missing files only)` — 仅添加缺失文件

**6.4 失败降级**：
- 模板拉取失败（网络不通、索引为空）→ 打印 gray 提示，使用空白模板继续

> **体验问题**：失败降级时提示文字使用 gray 颜色，容易被忽略。用户可能没意识到模板选择被跳过了。

**6.5 `-y` + `--registry` 特殊处理**（1603-1629 行）：
- 探测 registry 是否有 `index.json`
- 有 → 报错（无法自动选择模板，需 `--template` 指定）
- 无 → 进入 direct download 模式

---

### 阶段 7：模板下载（第 1631-1724 行）

**两种模式**：

| 模式 | 触发条件 | 行为 |
|---|---|---|
| **Marketplace** | `index.json` 存在 | 按 ID 下载指定模板 |
| **Direct download** | 无 `index.json`，仅有 registry | 下载整个 registry 目录 |

**失败处理**：
- 下载失败 → 打印 yellow 警告，降级为空白模板
- 打印重试命令提示（如 `rudder init --template xxx`）

---

### 阶段 8：创建工作流结构（第 1726-1775 行）

**8.1 创建目录和文件**（1732-1737 行）：
```
createWorkflowStructure({
  projectType,           // frontend | backend | fullstack
  skipSpecTemplates,     // 已使用远程模板时跳过
  packages,              // monorepo 子包列表
  remoteSpecPackages     // 已下载远程模板的包名
})
```

**8.2 Monorepo 配置**（1739-1743 行）：
- 将子包信息写入 `.rudder/config.yaml`（非破坏性 patch）

**8.3 版本追踪**（1746-1747 行）：
- 写入 `.rudder/.version` 记录当前 CLI 版本号

**8.4 平台配置**（1749-1764 行）：
- 对每个选中的平台调用 `configurePlatform()` 写入对应 hooks
- 如果平台使用 Python hooks，自动检测 python 可执行文件路径

**8.5 根文件**（1767 行）：
- 创建 `AGENTS.md`（根目录）

**8.6 哈希初始化**（1769-1775 行）：
- 计算所有模板文件的哈希值，写入 `.rudder/.template-hashes.json`
- 用于后续 `rudder init` 时检测模板更新

---

### 阶段 9：开发者初始化 + 三分支任务调度（第 1777-1831 行）

**9.1 开发者身份初始化**（1778-1787 行）：
- 执行 `scripts/init_developer.py <name>`
- 静默执行（`stdio: "pipe"`），失败不阻塞

**9.2 三分支任务调度**（1804-1830 行）：

```
分支判断逻辑：
┌─────────────────────────────────────────────┐
│ isFirstInit=true 或 tasks/为空               │
│ → createBootstrapTask()                     │
│   新项目创建者，生成 00-bootstrap-guidelines │
├─────────────────────────────────────────────┤
│ hadDeveloperFileAtStart=false               │
│ → createJoinerOnboardingTask()              │
│   fresh clone 加入者，生成 00-join-{slug}    │
├─────────────────────────────────────────────┤
│ 以上都不是                                  │
│ → 不创建任务（同一开发者重新初始化）           │
└─────────────────────────────────────────────┘
```

**分支详解**：

| 场景 | isFirstInit | hadDeveloper | tasks/为空 | 结果 |
|---|---|---|---|---|
| 新项目首次 init | true | false | true | Bootstrap 任务 |
| 之前 init 中断（tasks 未创建） | false | false | true | Bootstrap 任务（fallback） |
| clone 他人项目首次 init | false | false | false | Joiner 任务 |
| 自己的项目 re-init | false | true | false | 不创建任务 |

> **设计意图**：`hadDeveloperFileAtStart` 在创建任何文件前捕获（1005 行），不受 `init_developer.py` 的影响，所以能准确区分"你是项目创建者"还是"你刚 clone 下来"。

---

## 流程图

```
rudder init
  │
  ├─ 1. 打印 Banner + 代理设置 + 写入模式
  │
  ├─ 2. 开发者检测
  │    ├─ --user 参数 → 直接使用
  │    ├─ git config user.name → 自动检测
  │    └─ 都无 → 交互式询问
  │
  ├─ 3. Re-init 快速路径？（.rudder/ 已存在 + tasks/非空）
  │    ├─ 是 → 菜单：添加平台 / 设置开发者 / 完整重初始化
  │    └─ 否 / 选了完整重初始化 → 继续
  │
  ├─ 4. Monorepo 检测
  │    ├─ 检测到多包 → 逐个选择 spec 来源
  │    └─ 未检测到 → 跳过
  │
  ├─ 5. AI 平台选择
  │    └─ 复选框选择（-y 模式默认 Cursor + Claude）
  │
  ├─ 6. 模板选择（非 monorepo 时）
  │    ├─ 拉取模板索引
  │    ├─ 选择：from scratch / 远程模板 / 自定义 registry
  │    └─ 拉取失败 → 降级空白模板
  │
  ├─ 7. 模板下载（如果选了远程模板）
  │    ├─ Marketplace 模式（有 index.json）
  │    └─ Direct download 模式（无 index.json）
  │
  ├─ 8. 创建工作流结构
  │    ├─ createWorkflowStructure()
  │    ├─ 写入 monorepo 配置到 config.yaml
  │    ├─ 写入 .version
  │    ├─ configurePlatform()（每个选中平台）
  │    ├─ 创建 AGENTS.md
  │    └─ initializeHashes()（模板文件哈希）
  │
  └─ 9. 开发者初始化 + 三分支任务调度
       ├─ init_developer.py（静默）
       └─ 三分支：
            ├─ Bootstrap 任务（新项目创建者）
            ├─ Joiner 任务（clone 加入者）
            └─ 不创建任务（同一开发者 re-init）
```

---

## 关键设计

### 状态捕获时机
所有判断后续分支的关键状态都在 `init()` 开头几行捕获，不受后续文件创建的影响：
- `isFirstInit`：检查 `.rudder/` 是否存在
- `hadDeveloperFileAtStart`：检查 `.rudder/developer.md` 是否存在

### 幂等性
- `writeTaskSkeleton()` 是幂等的，重复调用安全
- `createWorkflowStructure()` 根据写入模式决定是否覆盖
- Hash 初始化会在重复 init 时重新计算

### 失败降级
- 模板拉取失败 → 空白模板继续
- `init_developer.py` 失败 → 静默忽略，可手动运行
- 网络不通 → 不阻塞，使用本地模板

### 已知体验问题
1. 模板拉取失败时提示文字太不显眼（gray 颜色），用户可能不知道选择被跳过
2. 开发者名称自动检测后不二次确认，git config 不对时需要 `--user` 参数纠正
