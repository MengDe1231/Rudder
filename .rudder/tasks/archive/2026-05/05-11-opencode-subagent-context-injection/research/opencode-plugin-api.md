# OpenCode Plugin & Subagent API — Verified Signatures

Source pulled 2026-05-11 from official docs + `sst/opencode` `dev` branch + community references.

## 1. Hook signatures (authoritative)

From `packages/plugin/src/index.ts` (verbatim TypeScript):

```ts
"tool.execute.before"?: (
  input: { tool: string; sessionID: string; callID: string },
  output: { args: any },
) => Promise<void>

"tool.execute.after"?: (
  input: { tool: string; sessionID: string; callID: string; args: any },
  output: { title: string; output: string; metadata: any },
) => Promise<void>

"chat.message"?: (
  input: {
    sessionID: string
    agent?: string
    model?: { providerID: string; modelID: string }
    messageID?: string
    variant?: string
  },
  output: { message: UserMessage; parts: Part[] },
) => Promise<void>

"chat.params"?: (
  input: { sessionID: string; agent: string; model: Model;
           provider: ProviderContext; message: UserMessage },
  output: { temperature: number; topP: number; topK: number;
            maxOutputTokens: number | undefined; options: Record<string, any> },
) => Promise<void>
```

Key facts:

- `tool.execute.before` **always** carries `sessionID` and `callID`. There is no "missing session id" case — `sessionID` is required. (Issue #264 logs saying "no current task" are a Rudder-side resolution failure, not an OpenCode payload gap.)
- `chat.message` carries an optional `agent` field. This is the discriminator we need for subagent skip logic.
- `output.args` on `tool.execute.before` is typed `any` — in-place mutation of `output.args.prompt` is the documented pattern.

## 2. Task tool input schema

From `packages/opencode/src/tool/task.ts`:

| Field | Required | Description |
| --- | --- | --- |
| `description` | yes | 3-5 word task description |
| `prompt` | yes | The task prompt for the subagent — **this is what we mutate** |
| `subagent_type` | yes | Subagent name (e.g. `rudder-implement`) |
| `task_id` | no | Resume an existing subagent task |
| `command` | no | Originating command |

So `tool.execute.before` for `input.tool === "task"` exposes `output.args.{description, prompt, subagent_type, task_id?, command?}`.

## 3. Parent ↔ child session relationship

Task tool execution path (from `task.ts`):

1. Validates `subagent_type` exists.
2. Calls `sessions.create({ parentID: ctx.sessionID, title, permissions })` — creates a **new** child session with its own `sessionID`.
3. Calls internal `Session/SessionPrompt` with `nextSession.id` (the child's id) and the (possibly mutated) `prompt`.
4. Returns subagent output, formatted with `task_id` for resumption.

Timing of hooks:

- `tool.execute.before` for `tool: "task"` fires **in the parent session** — `input.sessionID` is the parent's. This is the moment to inject task context.
- `chat.message` for the dispatched prompt fires **in the child session** — `input.sessionID` is the child's, and `input.agent` is set to the subagent name (`rudder-implement`, etc.).

**Implication for #264**: child-session `chat.message` plugins (session-start, workflow-state) see a sessionID they have no record of and `agent === "rudder-implement"`. They must early-return on `agent` match, not try to inject.

## 4. Why "no current task" was logged

Rudder' JS `getCurrentTask(input)` likely resolves task state keyed by `sessionID`. At `tool.execute.before` time, `sessionID` is the parent's — which is correct — but if the parent's task state was set up via Python hook in a different session-runtime file (i.e. mismatched id), JS can't find it. Hence the design's plan to add:

- single-session-file fallback (mirror Python),
- explicit `Active task: <path>` line in the dispatch prompt,
- task resolution via `ctx.resolveTaskDir(taskRef)`.

These are all additive — they don't replace the runtime resolution path.

## 5. `<!-- rudder-hook-injected -->` marker

OpenCode does **not** define or check for this marker — it's a Rudder-internal contract between the injection hook and the generated agent prompt template (the agent system prompt looks for it to know context was injected). The design's requirement to add it to `buildPrompt()` output is Rudder-side housekeeping, not an OpenCode API requirement.

## 6. Other hooks that exist but we don't use

- `experimental.chat.system.transform` — injects context into the system prompt (not the user message).
- `experimental.session.compacting` — preserves state during compaction.
- `event` — general event subscriber.
- Session lifecycle: `session.created`, `session.idle`, `session.updated`, etc. — could be used to discover child-session creation, but `chat.message` with `input.agent` is the simpler signal.

## 7. Confirmed vs. assumed (going into implement)

| Claim in design.md | Status |
| --- | --- |
| `tool.execute.before` may lack session id | **Wrong** — sessionID is required. Real failure is task-state lookup, not missing id. |
| `chat.message` fires for subagent turns with `input.agent` | **Confirmed** — `agent?: string` in signature; set for subagent child sessions. |
| Mutating `output.args.prompt` is the right injection point | **Confirmed** — task tool reads `prompt` from args. |
| `<!-- rudder-hook-injected -->` is required by OpenCode | **No** — Rudder-internal only. |
| Need Python-style single-session fallback in JS | **Still valid** — but reframe as "robust task lookup", not "OpenCode dropped sessionID". |

## Sources

- [Plugins | OpenCode](https://opencode.ai/docs/plugins/)
- [Agents | OpenCode](https://opencode.ai/docs/agents/)
- [sst/opencode plugin/src/index.ts (dev)](https://github.com/sst/opencode/blob/dev/packages/plugin/src/index.ts)
- [sst/opencode tool/task.ts (dev)](https://github.com/sst/opencode/blob/dev/packages/opencode/src/tool/task.ts)
- [OpenCode plugin guide — johnlindquist gist](https://gist.github.com/johnlindquist/0adf1032b4e84942f3e1050aba3c5e4a)
- [OpenCode plugin guide — rstacruz gist](https://gist.github.com/rstacruz/946d02757525c9a0f49b25e316fbe715)
- [Agent System | DeepWiki](https://deepwiki.com/sst/opencode/3.2-agent-system)
