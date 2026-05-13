# investigate Pi extension subagent context double-injection

## Goal

Determine whether Pi platform has a class of bug similar to OpenCode issue #264 — specifically, whether the Pi extension at `.pi/extensions/rudder/index.ts` injects Rudder context **twice** when a subagent is dispatched via the `subagent` tool, and define a fix if so.

## Background

Discovered while researching the OpenCode fix (#264, task `05-11-opencode-subagent-context-injection`). Pi is the second platform Rudder ships an in-process extension/plugin to (alongside OpenCode). Architecturally Pi is similar enough to warrant suspicion but different enough that the OpenCode fix does not apply directly.

Source: `packages/cli/src/templates/pi/extensions/rudder/index.ts.txt`

## Suspected Failure Mode

1. AI in parent Pi session calls the `subagent` tool with `{ agent, prompt }`.
2. `runSubagent()` → `buildSubagentPrompt()` constructs a prompt that already contains:
   - the agent definition,
   - Rudder context built via `buildRudderContext(projectRoot, normalizedAgentName, ...)`,
   - the delegated user prompt.
3. `runSubagent` spawns a **child Pi process** via `runPi`, feeding the constructed prompt over stdin.
4. The child Pi process loads the **same** Rudder extension.
5. `before_agent_start` fires in the child → injects another Rudder context with a **hardcoded** `"rudder-implement"` agent type (regardless of the real subagent type):

   ```ts
   pi.on?.("before_agent_start", (event, ctx) => {
     const context = buildRudderContext(projectRoot, "rudder-implement", ...)
     return { systemPrompt: [current, context, perTurn].filter(Boolean).join("\n\n") }
   })
   ```

6. `input` fires per turn → adds a `<workflow-state>` breadcrumb on top.

Net effect: the subagent prompt is **double-injected** (parent-built + child-extension-built) and the child injection has wrong agent type (always implement template).

## Key Difference vs OpenCode #264

OpenCode child sessions expose `input.agent` so the fix is simply `if (input.agent?.startsWith("rudder-")) return`. Pi child processes are **plain Pi processes from the extension's POV** — there is no native field that says "I am a subagent". A fix on Pi must therefore:

- Either pass an env var (e.g. `RUDDER_PI_SUBAGENT=1`) from `runSubagent` to the child and have the extension early-return when it sees that env;
- Or wrap the dispatch so the child loads the extension in a different mode;
- Or restructure the parent-built prompt so it carries a marker the child extension can detect and skip on.

## Investigation Requirements

- [ ] Confirm child Pi process actually loads `.pi/extensions/rudder/index.ts` (vs being a pure stdin-pipe runtime).
- [ ] Confirm `before_agent_start` fires inside the child process.
- [ ] Confirm `input` event fires per turn in the child.
- [ ] Quantify the duplicate injection (count lines / bytes of Rudder context appearing in the final subagent prompt vs the parent-constructed one).
- [ ] Check whether `runPi` already passes any subagent-discriminating env / flag to the child process.

## Out of Scope

- Implementing the fix (this task is investigate-only; implement gets its own follow-up).
- OpenCode #264 fix (covered by `05-11-opencode-subagent-context-injection`).
- Pi `buildRudderContext` hardcoded `"rudder-implement"` agent type — flag it but don't fix here.

## Acceptance Criteria

- [ ] Decision recorded: "Pi has double-injection bug: Y/N" with reproduction logs or rationale.
- [ ] If Y: a follow-up implement task is created with a concrete fix mechanism chosen from the candidate list.
- [ ] If N: a research note explains why the suspected flow does not double-inject (e.g. child process doesn't reload the extension).

## Technical Notes

- Related task: `.rudder/tasks/05-11-opencode-subagent-context-injection/`
- Pi extension source (template): `packages/cli/src/templates/pi/extensions/rudder/index.ts.txt`
- Pi extension event reference: `pi.on("session_start" | "before_agent_start" | "context" | "input" | "tool_call")`, `pi.registerTool({ name: "subagent" })`
- Pi CLI binary required to test; check whether installed: `which pi`
