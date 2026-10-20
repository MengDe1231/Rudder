import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAllScripts } from "../../src/templates/rudder/index.js";

describe("task execution readiness", () => {
  let root: string;
  const python = process.platform === "win32" ? "python" : "python3";
  const manifests = ["implement.jsonl", "check.jsonl"];

  function write(relativePath: string, content: string): void {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf-8");
  }

  function run(
    args: string[],
    overrides: NodeJS.ProcessEnv = {},
  ): {
    status: number | null;
    output: string;
    stdout: string;
  } {
    const result = spawnSync(
      python,
      [path.join(root, ".rudder/scripts/task.py"), ...args],
      {
        cwd: root,
        encoding: "utf-8",
        env: {
          ...process.env,
          RUDDER_CONTEXT_ID: "readiness-test",
          RUDDER_PLATFORM: "",
          ...overrides,
        },
      },
    );
    expect(result.error).toBeUndefined();
    return {
      status: result.status,
      output: result.stdout + result.stderr,
      stdout: result.stdout,
    };
  }

  function configure(mode?: string): void {
    write(
      ".rudder/config.yaml",
      mode ? `codex:\n  dispatch_mode: ${mode}\n` : "",
    );
  }

  function create(platform?: string, env: NodeJS.ProcessEnv = {}): string {
    const result = run(
      [
        "create",
        "Example",
        "--slug",
        "example",
        "--assignee",
        "test-dev",
        ...(platform ? ["--platform", platform] : []),
      ],
      env,
    );
    expect(result.status, result.output).toBe(0);
    return result.stdout.trim();
  }

  function approve(task: string): void {
    write(
      `${task}/prd.md`,
      "# Example\n\n## Acceptance Criteria\n\n- [ ] Expected behavior works\n",
    );
    const result = run(["confirm", task]);
    expect(result.status, result.output).toBe(0);
  }

  function readStatus(task: string): string {
    return (
      JSON.parse(
        fs.readFileSync(path.join(root, task, "task.json"), "utf-8"),
      ) as {
        status: string;
      }
    ).status;
  }

  function curate(task: string): void {
    write(".rudder/spec/guides/index.md", "# Guidelines\n");
    for (const name of manifests) {
      write(
        `${task}/${name}`,
        '{"file":".rudder/spec/guides/index.md","reason":"Guidelines"}\n',
      );
    }
  }

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "rudder-readiness-"));
    for (const [name, content] of getAllScripts()) {
      write(`.rudder/scripts/${name}`, content);
    }
    write(".rudder/.developer", "name=test-dev\n");
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it.each([undefined, "inline", "invalid"])(
    "Codex %s mode creates and starts without JSONL in a mixed-platform repo",
    (mode) => {
      configure(mode);
      fs.mkdirSync(path.join(root, ".claude"));
      fs.mkdirSync(path.join(root, ".codex"));
      const task = create("codex");
      for (const name of manifests) {
        expect(fs.existsSync(path.join(root, task, name))).toBe(false);
      }
      approve(task);
      const result = run(["start", task, "--platform", "codex"]);
      expect(result.status, result.output).toBe(0);
      expect(readStatus(task)).toBe("in_progress");
    },
  );

  it("inline starts an older task containing seed-only JSONL without changing the files", () => {
    const task = create("claude");
    const seeds = manifests.map((name) =>
      fs.readFileSync(path.join(root, task, name), "utf-8"),
    );
    approve(task);
    const result = run(["start", task, "--platform", "codex"]);
    expect(result.status, result.output).toBe(0);
    expect(readStatus(task)).toBe("in_progress");
    expect(
      manifests.map((name) =>
        fs.readFileSync(path.join(root, task, name), "utf-8"),
      ),
    ).toEqual(seeds);
  });

  it.each(["kilo", "antigravity", "windsurf"])(
    "%s inline execution ignores other installed sub-agent platforms",
    (platform) => {
      fs.mkdirSync(path.join(root, ".claude"));
      const task = create(platform);
      approve(task);
      expect(run(["start", task, "--platform", platform]).status).toBe(0);
      expect(fs.existsSync(path.join(root, task, "implement.jsonl"))).toBe(
        false,
      );
    },
  );

  it.each(["codex", "claude", "gemini", "pi"])(
    "%s sub-agent execution seeds context, blocks seeds, and accepts curated files",
    (platform) => {
      configure("sub-agent");
      const task = create(platform);
      approve(task);
      const blocked = run(["start", task, "--platform", platform]);
      expect(blocked.status, blocked.output).toBe(1);
      for (const name of manifests) {
        expect(blocked.output).toContain(
          `${name} has no curated context entries`,
        );
      }
      expect(readStatus(task)).toBe("planning");
      curate(task);
      const started = run(["start", task, "--platform", platform]);
      expect(started.status, started.output).toBe(0);
      expect(readStatus(task)).toBe("in_progress");
    },
  );

  it.each([
    ["missing", undefined, "is missing"],
    [
      "seed-only",
      '{"_example":"Fill context"}\n',
      "has no curated context entries",
    ],
    ["malformed", "{bad json}\n", "contains invalid JSON"],
    ["non-object", "[]\n", "must contain a JSON object"],
    ["missing target", '{"file":"missing.md"}\n', "references missing file"],
  ] as const)(
    "sub-agent startup rejects %s context even for a task created inline",
    (_label, content, reason) => {
      const task = create("codex");
      approve(task);
      if (content !== undefined) {
        for (const name of manifests) write(`${task}/${name}`, content);
      }
      const result = run(["start", task, "--platform", "claude"]);
      expect(result.status, result.output).toBe(1);
      for (const name of manifests) expect(result.output).toContain(name);
      expect(result.output).toContain(reason);
      expect(result.output).not.toContain("Traceback");
      expect(readStatus(task)).toBe("planning");
    },
  );

  it("both context files are required, not only implement.jsonl", () => {
    const task = create("claude");
    approve(task);
    curate(task);
    write(`${task}/check.jsonl`, '{"_example":"Still pending"}\n');
    const blocked = run(["start", task, "--platform", "claude"]);
    expect(blocked.status).toBe(1);
    expect(blocked.output).toContain(
      "check.jsonl has no curated context entries",
    );
    expect(blocked.output).not.toContain(
      "implement.jsonl has no curated context entries",
    );
  });

  it.each([
    "unconfirmed",
    "changed",
    "missing acceptance",
    "open questions",
  ] as const)(
    "inline still blocks %s requirements before changing task state",
    (condition) => {
      const task = create("codex");
      approve(task);
      const prdPath = path.join(root, task, "prd.md");
      if (condition === "unconfirmed") {
        const jsonPath = path.join(root, task, "task.json");
        const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as {
          requirements?: unknown;
        };
        delete data.requirements;
        fs.writeFileSync(jsonPath, JSON.stringify(data));
      } else if (condition === "missing acceptance") {
        write(`${task}/prd.md`, "# Incomplete PRD\n");
      } else {
        fs.appendFileSync(
          prdPath,
          condition === "changed"
            ? "\nChanged requirement\n"
            : "\n## Open Questions\n\n- Unresolved choice\n",
        );
      }
      const result = run(["start", task, "--platform", "codex"]);
      expect(result.status, result.output).toBe(1);
      expect(result.output).toContain(
        {
          unconfirmed: "requirements are not confirmed",
          changed: "prd.md changed after confirmation",
          "missing acceptance": "missing an 'Acceptance Criteria' section",
          "open questions": "unresolved Open Questions",
        }[condition],
      );
      expect(readStatus(task)).toBe("planning");
    },
  );

  it("RUDDER_PLATFORM selects inline in a mixed repository, explicit platform takes precedence", () => {
    fs.mkdirSync(path.join(root, ".claude"));
    const task = create(undefined, { RUDDER_PLATFORM: "codex" });
    approve(task);
    const blocked = run(["start", task, "--platform", "claude"], {
      RUDDER_PLATFORM: "codex",
    });
    expect(blocked.status).toBe(1);
    expect(blocked.output).toContain("implement.jsonl is missing");
    const started = run(["start", task], { RUDDER_PLATFORM: "codex" });
    expect(started.status, started.output).toBe(0);
  });

  it.each([
    ["codex only", [".codex"], false],
    ["mixed platforms", [".codex", ".claude"], true],
    ["no platform", [], false],
  ] as const)(
    "legacy calls use conservative directory fallback: %s",
    (_label, dirs, seeded) => {
      for (const dir of dirs) fs.mkdirSync(path.join(root, dir));
      const task = create();
      for (const name of manifests)
        expect(fs.existsSync(path.join(root, task, name))).toBe(seeded);
      approve(task);
      const result = run(["start", task]);
      expect(result.status, result.output).toBe(seeded ? 1 : 0);
    },
  );

  it("new tracked work switches only the session pointer and preserves the previous task", () => {
    const first = create("codex");
    approve(first);
    expect(run(["start", first, "--platform", "codex"]).status).toBe(0);
    const original = fs.readFileSync(
      path.join(root, first, "task.json"),
      "utf-8",
    );
    const created = run([
      "create",
      "Independent goal",
      "--slug",
      "independent",
      "--platform",
      "codex",
    ]);
    expect(created.status, created.output).toBe(0);
    expect(fs.readFileSync(path.join(root, first, "task.json"), "utf-8")).toBe(
      original,
    );
    const current = run(["current", "--source"]);
    expect(current.stdout).toContain(created.stdout.trim());
    expect(current.stdout).not.toContain(first);
  });
});
