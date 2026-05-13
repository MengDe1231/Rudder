import { describe, expect, it } from "vitest";
import {
  SHARED_HOOKS_BY_PLATFORM,
  getSharedHookScripts,
  getSharedHookScriptsForPlatform,
  type SharedHookPlatform,
} from "../../src/templates/shared-hooks/index.js";

const ALL_HOOK_FILES = [
  "session-start.py",
  "inject-shell-session-context.py",
  "inject-workflow-state.py",
  "inject-subagent-context.py",
] as const;

describe("shared-hooks capability table", () => {
  it("every capability-table entry names a real shared-hook file", () => {
    const realFiles = new Set(getSharedHookScripts().map((h) => h.name));
    for (const [platform, hooks] of Object.entries(
      SHARED_HOOKS_BY_PLATFORM,
    )) {
      for (const hook of hooks) {
        expect(
          realFiles.has(hook),
          `${platform} declares ${hook} but no such file exists under shared-hooks/`,
        ).toBe(true);
      }
    }
  });

  it("every shared-hook file is distributed to at least one platform", () => {
    const distributed = new Set<string>();
    for (const hooks of Object.values(SHARED_HOOKS_BY_PLATFORM)) {
      for (const h of hooks) distributed.add(h);
    }
    for (const hook of getSharedHookScripts()) {
      expect(
        distributed.has(hook.name),
        `${hook.name} exists under shared-hooks/ but no platform installs it — dead template`,
      ).toBe(true);
    }
  });

  it("statusline.py is not distributed by default", () => {
    const realFiles = new Set(getSharedHookScripts().map((h) => h.name));
    expect(realFiles.has("statusline.py")).toBe(false);
    for (const [platform, hooks] of Object.entries(
      SHARED_HOOKS_BY_PLATFORM,
    )) {
      expect(
        (hooks as readonly string[]).includes("statusline.py"),
        `${platform} must not install the generated statusline.py hook by default`,
      ).toBe(false);
    }
  });

  it("inject-subagent-context.py is restricted to class-1 push-based platforms", () => {
    // Class-2 (pull-based) platforms load context via agent-definition prelude,
    // not a hook-mutated prompt.
    const class2 = new Set(["codex", "copilot", "gemini", "qoder"]);
    for (const [platform, hooks] of Object.entries(
      SHARED_HOOKS_BY_PLATFORM,
    )) {
      const has = hooks.includes("inject-subagent-context.py");
      if (class2.has(platform))
        expect(
          has,
          `${platform} is class-2 pull-based and must not ship inject-subagent-context.py`,
        ).toBe(false);
    }
  });

  it("codex + copilot do not take the shared session-start.py (they bundle their own)", () => {
    expect(SHARED_HOOKS_BY_PLATFORM.codex).not.toContain("session-start.py");
    expect(SHARED_HOOKS_BY_PLATFORM.copilot).not.toContain("session-start.py");
  });

  it("inject-shell-session-context.py goes to Cursor only", () => {
    for (const [platform, hooks] of Object.entries(
      SHARED_HOOKS_BY_PLATFORM,
    )) {
      const has = hooks.includes("inject-shell-session-context.py");
      if (platform === "cursor") expect(has).toBe(true);
      else
        expect(
          has,
          `${platform} declares inject-shell-session-context.py but does not use Cursor beforeShellExecution`,
        ).toBe(false);
    }
  });

  it("kiro registers only inject-subagent-context.py (agentSpawn is its only hook event)", () => {
    expect([...SHARED_HOOKS_BY_PLATFORM.kiro]).toEqual([
      "inject-subagent-context.py",
    ]);
  });

  it("getSharedHookScriptsForPlatform returns exactly the declared set per platform", () => {
    for (const platform of Object.keys(
      SHARED_HOOKS_BY_PLATFORM,
    ) as SharedHookPlatform[]) {
      const names = getSharedHookScriptsForPlatform(platform)
        .map((h) => h.name)
        .sort();
      const expected = [...SHARED_HOOKS_BY_PLATFORM[platform]].sort();
      expect(names).toEqual(expected);
    }
  });

  it("shared-hooks directory only contains files enumerated by ALL_HOOK_FILES", () => {
    // Guards against a new shared hook being added without the capability
    // table being updated.
    const actual = new Set(getSharedHookScripts().map((h) => h.name));
    const expected = new Set(ALL_HOOK_FILES);
    expect(actual).toEqual(expected);
  });

  it("shared hooks do not read legacy .current-task state", () => {
    for (const hook of getSharedHookScripts()) {
      expect(
        hook.content,
        `${hook.name} must use the session-scoped active task resolver`,
      ).not.toContain(".current-task");
      expect(hook.content).not.toContain("global fallback");
    }
  });

  // A-soft (issue #234 mirror): shared session-start.py — used by Claude /
  // Cursor / Gemini / Qoder / CodeBuddy / Droid / Kiro — must include the
  // same sub-agent self-exemption clauses that codex/hooks/session-start.py
  // carries, so a sub-agent reading inherited SessionStart guidance does not
  // spawn another rudder-implement / rudder-check.
  it("shared session-start.py includes sub-agent self-exemption (A-soft)", () => {
    const sessionStart = getSharedHookScripts().find(
      (h) => h.name === "session-start.py",
    );
    expect(sessionStart, "session-start.py is missing from shared-hooks/").toBeDefined();
    const content = sessionStart ? sessionStart.content : "";
    // Both READY-state status block AND <guidelines> block carry the
    // exemption phrase (kept verbatim across both writers — see workflow-
    // state-contract.md "Audit ALL Writers").
    const matches = content.match(/Sub-agent self-exemption/g);
    expect(matches, "expected at least 2 occurrences (status + guidelines)").not.toBeNull();
    expect(matches ? matches.length : 0).toBeGreaterThanOrEqual(2);
    // Anchor on the scope (does not apply / no spawn) so a future rewording
    // still has to cover the actual contract.
    expect(content).toMatch(/does NOT apply/);
    expect(content).toMatch(/spawn another sub-agent|Do NOT spawn/i);
  });
});
