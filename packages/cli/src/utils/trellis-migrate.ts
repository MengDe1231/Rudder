/**
 * Automatic migration from Trellis (.trellis/) to Rudder (.rudder/).
 *
 * When a user runs `rudder init` in a project that was previously
 * initialized by Trellis, this module detects the old `.trellis/`
 * directory and silently migrates everything to Rudder format —
 * preserving all task records, spec conventions, and workspace memory.
 *
 * What it does:
 *   1. Rename `.trellis/` → `.rudder/` (directory only, content untouched)
 *   2. Update `.version` to current Rudder CLI version
 *   3. Replace `.trellis/` → `.rudder/` in system files (Python hooks,
 *      config.yaml, workflow.md, .template-hashes.json)
 *   4. Remove old `trellis-*` prefixed skills/commands/hooks from
 *      platform directories (.claude/, .codex/, .cursor/, etc.)
 *
 * What it does NOT touch:
 *   - `.rudder/tasks/` — all task records (prd.md, task.json, etc.) stay intact
 *   - `.rudder/spec/` — team conventions stay intact
 *   - `.rudder/workspace/` — session journals stay intact
 */

import fs from "node:fs";
import path from "node:path";

import { VERSION } from "../constants/version.js";

const TRELLIS_DIR = ".trellis";
const TRELLIS_PREFIX = "trellis-";

/** Result returned after migration. */
export interface MigrationResult {
  /** Whether a migration was performed. */
  migrated: boolean;
  /** Number of tasks found in the migrated project. */
  taskCount: number;
  /** Number of system files that had `.trellis/` replaced. */
  filesReplaced: number;
  /** Number of old `trellis-*` platform files removed. */
  platformFilesRemoved: number;
}

/**
 * Detect whether a Trellis project exists at the given directory.
 */
export function hasTrellisProject(cwd: string): boolean {
  return fs.existsSync(path.join(cwd, TRELLIS_DIR));
}

/**
 * Perform the full Trellis → Rudder migration.
 *
 * Must be called **before** any `.rudder/`-dependent logic in `init`.
 * After this returns, the project is indistinguishable from one that
 * was initialized by Rudder from the start.
 */
export function migrateFromTrellis(cwd: string): MigrationResult {
  if (!hasTrellisProject(cwd)) {
    return { migrated: false, taskCount: 0, filesReplaced: 0, platformFilesRemoved: 0 };
  }

  const trellisAbs = path.join(cwd, TRELLIS_DIR);
  const rudderAbs = path.join(cwd, ".rudder");

  // Step 1: Rename directory
  fs.renameSync(trellisAbs, rudderAbs);

  // Step 2: Update version file
  updateVersionFile(rudderAbs);

  // Step 3: Replace .trellis/ → .rudder/ in system files
  const filesReplaced = replaceTrellisPaths(rudderAbs);

  // Step 4: Count tasks
  const taskCount = countTasks(rudderAbs);

  // Step 5: Remove old trellis-* platform files
  const platformFilesRemoved = cleanupPlatformFiles(cwd);

  return {
    migrated: true,
    taskCount,
    filesReplaced,
    platformFilesRemoved,
  };
}

// =============================================================================
// Internal helpers
// =============================================================================

/**
 * Update `.rudder/.version` to the current Rudder CLI version.
 */
function updateVersionFile(rudderDir: string): void {
  const versionFile = path.join(rudderDir, ".version");
  if (fs.existsSync(versionFile)) {
    fs.writeFileSync(versionFile, VERSION);
  }
}

/**
 * Walk `.rudder/` and replace `.trellis/` → `.rudder/` in system files.
 *
 * Scope: .py, .yaml, .yml, .json (root-level), .md (workflow.md only).
 * Excludes: tasks/, workspace/, spec/ — these are user content.
 */
function replaceTrellisPaths(rudderDir: string): number {
  const TRELLIS_RE = /\.trellis\//g;
  const REPLACEMENT = ".rudder/";

  // Directories to skip entirely — these are user-authored content.
  const EXCLUDED_DIRS = new Set(["tasks", "workspace", "spec"]);

  // File types to scan for path replacement.
  const TARGET_EXTS = new Set([".py", ".yaml", ".yml", ".json", ".md"]);

  let count = 0;

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip excluded subdirectories.
        if (EXCLUDED_DIRS.has(entry.name)) continue;
        walk(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (!TARGET_EXTS.has(ext)) continue;

        try {
          const content = fs.readFileSync(full, "utf-8");
          if (!content.includes(".trellis/")) continue;

          const replaced = content.replace(/\.trellis\//g, ".rudder/");
          fs.writeFileSync(full, replaced, "utf-8");
          count += 1;
        } catch {
          // Skip unreadable files (binary, permission denied, etc.).
        }
      }
    }
  }

  walk(rudderDir);
  return count;
}

/**
 * Count how many tasks exist in `.rudder/tasks/`.
 */
function countTasks(rudderDir: string): number {
  const tasksDir = path.join(rudderDir, "tasks");
  if (!fs.existsSync(tasksDir)) return 0;

  let count = 0;
  try {
    const entries = fs.readdirSync(tasksDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory() && e.name !== "archive") count += 1;
    }
    // Also count archived tasks.
    const archiveDir = path.join(tasksDir, "archive");
    if (fs.existsSync(archiveDir)) {
      const archiveEntries = fs.readdirSync(archiveDir, { withFileTypes: true });
      for (const e of archiveEntries) {
        if (e.isDirectory()) count += 1;
      }
    }
  } catch {
    // best-effort
  }
  return count;
}

/**
 * Remove `trellis-` prefixed or `trellis`-named skills, commands, and hooks
 * from all platform directories.
 *
 * These will be recreated by the normal `rudder init` flow with the
 * correct `rudder-*` prefix. We recursively walk all known platform
 * directories (`.claude/`, `.codex/`, `.cursor/`, etc.) to ensure
 * complete cleanup, including nested subdirectories.
 */
function cleanupPlatformFiles(cwd: string): number {
  // All known platform config directories that may contain trellis-* files.
  const platformDirs = [
    ".claude",
    ".cursor",
    ".opencode",
    ".codex",
    ".kilocode",
    ".kiro",
    ".gemini",
    ".agent",
    ".windsurf",
    ".qoder",
    ".codebuddy",
    ".github/copilot",
    ".factory",
    ".pi",
    // Shared skills directory (may have been written by any platform).
    ".agents",
  ];

  let removed = 0;

  for (const relDir of platformDirs) {
    const absDir = path.join(cwd, relDir);
    if (!fs.existsSync(absDir)) continue;
    removed += removeTrellisRecursively(absDir);
  }

  return removed;
}

/**
 * Recursively walk a directory and remove any entry whose name starts
 * with `trellis-` or equals `trellis` (with or without extension).
 */
function removeTrellisRecursively(dir: string): number {
  if (!fs.existsSync(dir)) return 0;

  let removed = 0;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Remove if this dir is trellis-related.
      if (isTrellisName(entry.name)) {
        fs.rmSync(full, { recursive: true, force: true });
        removed += 1;
        continue;
      }
      // Otherwise recurse into it.
      removed += removeTrellisRecursively(full);
    } else if (entry.isFile()) {
      if (isTrellisName(entry.name)) {
        fs.unlinkSync(full);
        removed += 1;
      }
    }
  }

  return removed;
}

/**
 * Check if a file or directory name is Trellis-related.
 * Matches: trellis-*, trellis, trellis.* (with extension)
 */
function isTrellisName(name: string): boolean {
  const base = name;
  return (
    base.startsWith(TRELLIS_PREFIX) ||
    base === TRELLIS_PREFIX.slice(0, -1) || // "trellis" (without hyphen)
    base.startsWith("trellis.") // "trellis.json", "trellis.md", etc.
  );
}
