# Research: OpenCode as Rudder Code Foundation

- **Query**: Should Rudder build a first-party coding surface on top of OpenCode instead of only integrating with third-party AI coding tools?
- **Scope**: Local repo inspection + existing OpenCode driver research from `.rudder/tasks/05-02-rudder-spec-compounding-benchmark-toy-phase/research/opencode-driver.md`.
- **Date**: 2026-05-02

## Findings

OpenCode is already the strongest candidate for a Rudder-native execution surface.

Existing research verified that OpenCode provides:

- Headless batch execution through `opencode run --format json`.
- Per-run JSONL telemetry with token, cost, tool, and timing events.
- Custom OpenAI-compatible providers.
- Project-local agents, skills, plugins, and MCP configuration.
- Permission controls that can deny tools by default and allow only a narrow set.
- Per-attempt state isolation through `XDG_*` directories.

The current Rudder repo already has a substantial OpenCode integration:

- `packages/cli/src/configurators/opencode.ts` installs `.opencode/` assets.
- `packages/cli/src/templates/opencode/plugins/*.js` inject workflow state, session-start context, and sub-agent context.
- `packages/cli/src/templates/opencode/lib/rudder-context.js` resolves session-scoped current-task state.
- `.rudder/spec/cli/backend/platform-integration.md` treats OpenCode as a first-class platform pattern with JS plugins.

This means "Rudder Code" does not need to start as a fork. The lowest-risk path is to ship a thin Rudder-owned distribution layer that configures and drives OpenCode with Rudder defaults.

## Product Shape Options

### Option A: Thin Rudder launcher

Create a `rudder code` command that shells out to installed `opencode`, writes/updates Rudder-managed `.opencode/` config, and launches OpenCode in either interactive or headless mode.

Pros:
- Fastest path.
- Keeps upstream OpenCode updates available.
- Avoids owning editor/terminal UI internals.
- Uses the integration code Rudder already has.

Cons:
- Depends on OpenCode CLI behavior staying compatible.
- Some branding and UX control remains limited.

### Option B: Curated OpenCode distribution

Ship a Rudder-managed wrapper package that pins OpenCode, provides default agents/plugins/providers, and exposes `rudder-code` as the main executable.

Pros:
- More control over version skew, defaults, telemetry, and onboarding.
- Still avoids a full fork.
- Better foundation for benchmark runner and product dogfooding.

Cons:
- Adds release and dependency management surface.
- Needs a clean upgrade path when OpenCode changes plugin/config schemas.

### Option C: Fork OpenCode

Fork OpenCode and build Rudder semantics directly into the runtime.

Pros:
- Maximum control.
- Can remove token bloat and workflow impedance at the source.
- Enables deeper UI/runtime integration.

Cons:
- High maintenance cost.
- OpenCode internals move quickly.
- Risks spending effort on runtime ownership before Rudder proves the product layer.

## Recommendation

Start with **Option B**, but implement it in thin slices:

1. `rudder code doctor`: validate OpenCode install, version, config, provider auth, MCP availability, and Rudder plugin health.
2. `rudder code run`: deterministic headless runner around `opencode run`, with Rudder session identity and JSONL capture.
3. `rudder code`: interactive launcher that enters OpenCode with Rudder-managed defaults.
4. Optional packaged `rudder-code` binary once the wrapper semantics are stable.

This gives Rudder a first-party coding surface without committing to a fork. If upstream limitations block core behavior, fork later with evidence.

## Key Risks

- OpenCode default agents can add large token overhead. Rudder Code must use slim agents by default.
- OpenCode custom provider behavior has had sub-session quirks. Rudder Code should treat provider smoke tests as part of `doctor`.
- Plugin hooks are OpenCode-version-sensitive. Pinning and compatibility tests are mandatory.
- Credentials must stay in OpenCode/user auth stores or environment variables; Rudder must not copy or print secrets.

