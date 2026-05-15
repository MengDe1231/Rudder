import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { hasTrellisProject, migrateFromTrellis } from "../../src/utils/trellis-migrate.js";

describe("trellis-migrate", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rudder-migrate-"));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // Helpers
  function createTrellisProject(cwd: string): void {
    // .trellis/ directory structure
    const dirs = [
      ".trellis",
      ".trellis/tasks",
      ".trellis/tasks/00-bootstrap",
      ".trellis/tasks/archive",
      ".trellis/tasks/archive/old-task",
      ".trellis/spec",
      ".trellis/spec/backend",
      ".trellis/workspace",
      ".trellis/workspace/testuser",
    ];
    for (const d of dirs) {
      fs.mkdirSync(path.join(cwd, d), { recursive: true });
    }

    // System files with .trellis/ path references
    fs.writeFileSync(
      path.join(cwd, ".trellis/.version"),
      "0.5.15",
    );
    fs.writeFileSync(
      path.join(cwd, ".trellis/config.yaml"),
      "# config\nupdate:\n  skip: []\n",
    );
    fs.writeFileSync(
      path.join(cwd, ".trellis/workflow.md"),
      "# Workflow\n\nRefer to `.trellis/spec/` for conventions.\n",
    );
    fs.writeFileSync(
      path.join(cwd, ".trellis/.template-hashes.json"),
      JSON.stringify({
        ".trellis/workflow.md": "abc123",
        ".trellis/spec/backend/index.md": "def456",
        "tasks/00-bootstrap/task.json": "ghi789",
      }),
    );

    // Python hook file with .trellis/ reference
    fs.writeFileSync(
      path.join(cwd, ".trellis/task.py"),
      'DIR = ".trellis/"\n',
    );

    // Task files — must NOT be modified
    fs.writeFileSync(
      path.join(cwd, ".trellis/tasks/00-bootstrap/task.json"),
      JSON.stringify({ id: "00-bootstrap", title: "Bootstrap" }),
    );
    fs.writeFileSync(
      path.join(cwd, ".trellis/tasks/00-bootstrap/prd.md"),
      "# Bootstrap\n\nPRD content here.\n",
    );

    // Archived task
    fs.writeFileSync(
      path.join(cwd, ".trellis/tasks/archive/old-task/task.json"),
      JSON.stringify({ id: "old-task", title: "Old" }),
    );

    // Workspace journal
    fs.writeFileSync(
      path.join(cwd, ".trellis/workspace/testuser/journal-2026-05.md"),
      "# Journal\n\nSession notes.\n",
    );

    // Old platform files
    fs.mkdirSync(path.join(cwd, ".claude/skills/trellis-brainstorm"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".claude/skills/trellis-brainstorm/SKILL.md"),
      "# Brainstorm\n",
    );
    fs.mkdirSync(path.join(cwd, ".claude/commands"), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, ".claude/commands/trellis-implement.md"),
      "# Implement\n",
    );

    // Trellis subdirectory without hyphen (regression: was not removed)
    fs.mkdirSync(path.join(cwd, ".claude/commands/trellis"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".claude/commands/trellis/start.md"),
      "# Start\n",
    );

    // Shared skills with trellis-* prefix
    fs.mkdirSync(path.join(cwd, ".agents/skills/trellis-meta"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".agents/skills/trellis-meta/SKILL.md"),
      "# Meta\n",
    );

    // A user-added file that should NOT be removed
    fs.mkdirSync(path.join(cwd, ".claude/skills/my-skill"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".claude/skills/my-skill/SKILL.md"),
      "# My Skill\n",
    );
  }

  // -----------------------------------------------------------------------
  // Tests
  // -----------------------------------------------------------------------

  describe("hasTrellisProject", () => {
    it("returns true when .trellis/ exists", () => {
      fs.mkdirSync(path.join(tmpDir, ".trellis"));
      expect(hasTrellisProject(tmpDir)).toBe(true);
    });

    it("returns false when .trellis/ does not exist", () => {
      expect(hasTrellisProject(tmpDir)).toBe(false);
    });
  });

  describe("migrateFromTrellis", () => {
    it("returns not-migrated when no .trellis/ exists", () => {
      const result = migrateFromTrellis(tmpDir);
      expect(result.migrated).toBe(false);
    });

    it("renames .trellis/ to .rudder/", () => {
      createTrellisProject(tmpDir);
      const result = migrateFromTrellis(tmpDir);

      expect(result.migrated).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, ".trellis"))).toBe(false);
      expect(fs.existsSync(path.join(tmpDir, ".rudder"))).toBe(true);
    });

    it("updates .version to current CLI version", () => {
      createTrellisProject(tmpDir);
      migrateFromTrellis(tmpDir);

      const version = fs.readFileSync(
        path.join(tmpDir, ".rudder/.version"),
        "utf-8",
      );
      expect(version).not.toBe("0.5.15"); // should be updated
    });

    it("replaces .trellis/ → .rudder/ in system files", () => {
      createTrellisProject(tmpDir);
      const result = migrateFromTrellis(tmpDir);

      expect(result.filesReplaced).toBeGreaterThan(0);

      const workflow = fs.readFileSync(
        path.join(tmpDir, ".rudder/workflow.md"),
        "utf-8",
      );
      expect(workflow).toContain(".rudder/spec/");
      expect(workflow).not.toContain(".trellis/");

      const hashes = JSON.parse(
        fs.readFileSync(
          path.join(tmpDir, ".rudder/.template-hashes.json"),
          "utf-8",
        ),
      );
      expect(Object.keys(hashes).some((k) => k.startsWith(".rudder/"))).toBe(
        true,
      );

      const taskPy = fs.readFileSync(
        path.join(tmpDir, ".rudder/task.py"),
        "utf-8",
      );
      expect(taskPy).toContain('.rudder/"');
    });

    it("does NOT modify task files", () => {
      createTrellisProject(tmpDir);
      migrateFromTrellis(tmpDir);

      const taskJson = fs.readFileSync(
        path.join(tmpDir, ".rudder/tasks/00-bootstrap/task.json"),
        "utf-8",
      );
      expect(taskJson).toContain("00-bootstrap");

      const prd = fs.readFileSync(
        path.join(tmpDir, ".rudder/tasks/00-bootstrap/prd.md"),
        "utf-8",
      );
      expect(prd).toContain("PRD content here.");
    });

    it("does NOT modify workspace journals", () => {
      createTrellisProject(tmpDir);
      migrateFromTrellis(tmpDir);

      const journal = fs.readFileSync(
        path.join(tmpDir, ".rudder/workspace/testuser/journal-2026-05.md"),
        "utf-8",
      );
      expect(journal).toContain("Session notes.");
    });

    it("removes trellis-* prefixed platform files", () => {
      createTrellisProject(tmpDir);
      const result = migrateFromTrellis(tmpDir);

      expect(result.platformFilesRemoved).toBeGreaterThanOrEqual(2);

      // trellis-* files removed
      expect(
        fs.existsSync(path.join(tmpDir, ".claude/skills/trellis-brainstorm")),
      ).toBe(false);
      expect(
        fs.existsSync(path.join(tmpDir, ".claude/commands/trellis-implement.md")),
      ).toBe(false);

      // Nested trellis directory (regression: was not removed)
      expect(
        fs.existsSync(path.join(tmpDir, ".claude/commands/trellis")),
      ).toBe(false);
      expect(
        fs.existsSync(path.join(tmpDir, ".claude/commands/trellis/start.md")),
      ).toBe(false);

      // Shared skills with trellis prefix
      expect(
        fs.existsSync(path.join(tmpDir, ".agents/skills/trellis-meta")),
      ).toBe(false);
      expect(
        fs.existsSync(path.join(tmpDir, ".agents/skills/trellis-meta/SKILL.md")),
      ).toBe(false);

      // User file preserved
      expect(
        fs.existsSync(path.join(tmpDir, ".claude/skills/my-skill/SKILL.md")),
      ).toBe(true);
    });

    it("counts active and archived tasks", () => {
      createTrellisProject(tmpDir);
      const result = migrateFromTrellis(tmpDir);

      expect(result.taskCount).toBe(2); // 00-bootstrap + archive/old-task
    });
  });
});
