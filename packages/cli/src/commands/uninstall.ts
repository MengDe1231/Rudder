/**
 * `rudder uninstall` — remove every file written by `rudder init` / `update`
 * from the current project, plus the `.rudder/` directory itself.
 *
 * The single source of truth for "what rudder wrote" is
 * `.rudder/.template-hashes.json`. Files outside that manifest are never
 * touched (e.g. user-added hooks under `.cursor/hooks/`).
 *
 * Manifest-listed files split into two groups:
 *   A. Opaque content files (`.py` / `.md` / `.ts` / etc.) — unlinked outright.
 *   B. Structured config files (settings.json / hooks.json / config.toml /
 *      package.json) — passed through a scrubber that strips just the rudder
 *      fields, leaving user-added neighbors intact. If the scrubber says the
 *      file is fully empty afterwards, we delete it.
 *
 * Whether the user has modified a manifest-listed file or not, it is removed
 * (per the PRD: "全删"). The `.rudder/` tree is removed unconditionally.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import chalk from "chalk";
import inquirer from "inquirer";

import { DIR_NAMES } from "../constants/paths.js";
import { loadHashes, pruneOrphanManifestKeys } from "../utils/template-hash.js";
import { cleanupEmptyDirs } from "./update.js";
import { ALL_MANAGED_DIRS } from "../configurators/index.js";
import {
  scrubHooksJson,
  scrubOpencodePackageJson,
  scrubPiSettings,
  scrubCodexConfigToml,
  type ScrubResult,
} from "../utils/uninstall-scrubbers.js";

export interface UninstallOptions {
  yes?: boolean;
  dryRun?: boolean;
}

/** A manifest-listed file we know is structured. */
interface StructuredFileSpec {
  /** Manifest path (POSIX). */
  posixPath: string;
  /** Short reason shown to the user under "Will be modified". */
  reason: string;
  /**
   * Run the scrubber. `deletedPaths` is the full list of POSIX paths that this
   * uninstall is going to delete; hooks-json scrubbers use it to identify
   * rudder-managed `command` strings.
   */
  scrub: (content: string, deletedPaths: readonly string[]) => ScrubResult;
}

/**
 * Build the dispatch table for structured config scrubbers.
 *
 * Keys are POSIX paths exactly as they appear in `.template-hashes.json`.
 */
function buildStructuredFileSpecs(): Map<string, StructuredFileSpec> {
  const specs: StructuredFileSpec[] = [
    // Nested hooks.{Event}.[].hooks.[] schema
    ...(
      [
        ".claude/settings.json",
        ".gemini/settings.json",
        ".factory/settings.json",
        ".codebuddy/settings.json",
        ".qoder/settings.json",
        ".codex/hooks.json",
      ] as const
    ).map(
      (p): StructuredFileSpec => ({
        posixPath: p,
        reason: "Strip rudder hooks; preserve user fields",
        scrub: (content, deletedPaths) =>
          scrubHooksJson(content, deletedPaths, "nested"),
      }),
    ),
    // Flat hooks.{Event}.[] schema
    ...([".cursor/hooks.json", ".github/copilot/hooks.json"] as const).map(
      (p): StructuredFileSpec => ({
        posixPath: p,
        reason: "Strip rudder hooks; preserve user fields",
        scrub: (content, deletedPaths) =>
          scrubHooksJson(content, deletedPaths, "flat"),
      }),
    ),
    {
      posixPath: ".opencode/package.json",
      reason: "Remove @opencode-ai/plugin dep; preserve other deps",
      scrub: (content) => scrubOpencodePackageJson(content),
    },
    {
      posixPath: ".pi/settings.json",
      reason:
        "Strip rudder extension/skills/prompts entries; preserve user fields",
      scrub: (content) => scrubPiSettings(content),
    },
    {
      posixPath: ".codex/config.toml",
      reason: "Remove rudder project_doc_fallback_filenames and notes",
      scrub: (content) => scrubCodexConfigToml(content),
    },
  ];
  const map = new Map<string, StructuredFileSpec>();
  for (const spec of specs) {
    map.set(spec.posixPath, spec);
  }
  return map;
}

/**
 * What the planner decides for each manifest-listed path.
 */
interface PlannedDeletion {
  posixPath: string;
  /** Absolute filesystem path. */
  absPath: string;
  /** True when the file is missing on disk — nothing to delete. */
  missing: boolean;
}

interface PlannedModification {
  posixPath: string;
  absPath: string;
  reason: string;
  /** Pre-computed scrub result. */
  result: ScrubResult;
}

interface UninstallPlan {
  deletions: PlannedDeletion[];
  modifications: PlannedModification[];
  /** Whether `.rudder/` directory itself will be removed. */
  removeRudderDir: boolean;
}

/**
 * Walk through the manifest and decide, for each entry, whether it is a plain
 * deletion or a structured modification (or fully-empty modification → still
 * a deletion at the end).
 */
function buildPlan(cwd: string, hashes: Record<string, string>): UninstallPlan {
  const structured = buildStructuredFileSpecs();
  const allPosixPaths = Object.keys(hashes);

  const deletions: PlannedDeletion[] = [];
  const modifications: PlannedModification[] = [];

  for (const posixPath of allPosixPaths) {
    const absPath = path.join(cwd, ...posixPath.split("/"));
    const spec = structured.get(posixPath);

    if (!spec) {
      deletions.push({
        posixPath,
        absPath,
        missing: !fs.existsSync(absPath),
      });
      continue;
    }

    if (!fs.existsSync(absPath)) {
      // Structured file expected by manifest is gone — nothing to do for it.
      deletions.push({ posixPath, absPath, missing: true });
      continue;
    }

    const content = fs.readFileSync(absPath, "utf-8");
    const result = spec.scrub(content, allPosixPaths);

    if (result.fullyEmpty) {
      // Strip + delete: nothing meaningful left in the file.
      deletions.push({ posixPath, absPath, missing: false });
    } else {
      modifications.push({
        posixPath,
        absPath,
        reason: spec.reason,
        result,
      });
    }
  }

  return {
    deletions,
    modifications,
    removeRudderDir: true,
  };
}

/**
 * Render the two-column uninstall plan to stdout.
 */
function renderPlan(cwd: string, plan: UninstallPlan): void {
  const rudderDir = path.join(cwd, DIR_NAMES.WORKFLOW);

  console.log(chalk.bold("\nRudder uninstall plan\n"));

  const deletePaths = plan.deletions
    .filter((d) => !d.missing)
    .map((d) => d.posixPath);

  console.log(
    chalk.red.bold(`Will be deleted (${deletePaths.length + 1} entries):`),
  );
  for (const p of deletePaths) {
    console.log(`  ${chalk.red("-")} ${p}`);
  }
  if (plan.removeRudderDir && fs.existsSync(rudderDir)) {
    console.log(
      `  ${chalk.red("-")} ${DIR_NAMES.WORKFLOW}/  ${chalk.gray(
        "(entire directory, including tasks/runtime/config)",
      )}`,
    );
  }

  if (plan.modifications.length > 0) {
    console.log();
    console.log(
      chalk.yellow.bold(
        `Will be modified (${plan.modifications.length} files):`,
      ),
    );
    for (const m of plan.modifications) {
      console.log(
        `  ${chalk.yellow("~")} ${m.posixPath}  ${chalk.gray(`(${m.reason})`)}`,
      );
    }
  }

  const skipped = plan.deletions.filter((d) => d.missing);
  if (skipped.length > 0) {
    console.log();
    console.log(
      chalk.gray(
        `(${skipped.length} manifest entries already missing on disk — skipped.)`,
      ),
    );
  }

  console.log();
}

/**
 * Prompt `Continue? [Y/n]` with default = yes. Returns true if user agrees.
 *
 * We use `inquirer` to match update.ts so the CLI behaves consistently and
 * tests can mock the same library.
 */
async function promptContinue(): Promise<boolean> {
  const { proceed } = await inquirer.prompt<{ proceed: boolean }>([
    {
      type: "confirm",
      name: "proceed",
      message: "Continue?",
      default: true,
    },
  ]);
  return proceed;
}

/**
 * Execute the plan: write modifications, unlink deletions, remove `.rudder/`,
 * then prune empty managed directories.
 *
 * Returns counts for the summary.
 */
function executePlan(
  cwd: string,
  plan: UninstallPlan,
): { deletedFiles: number; modifiedFiles: number; deletedDirs: number } {
  let deletedFiles = 0;
  let modifiedFiles = 0;

  // 1. Modifications first (preserve user data even if a later step fails).
  for (const mod of plan.modifications) {
    fs.writeFileSync(mod.absPath, mod.result.content);
    modifiedFiles += 1;
  }

  // 2. Deletions (skip already-missing entries).
  const deletedDirCandidates = new Set<string>();
  for (const del of plan.deletions) {
    if (del.missing) continue;
    try {
      fs.unlinkSync(del.absPath);
      deletedFiles += 1;
    } catch {
      // Best-effort: a file that can't be unlinked (e.g. perm error) is
      // surfaced via the summary mismatch, but we don't want to abort
      // halfway through.
      continue;
    }
    deletedDirCandidates.add(path.posix.dirname(del.posixPath));
  }

  // 3. Drop `.rudder/` entirely.
  let deletedDirs = 0;
  if (plan.removeRudderDir) {
    const rudderDir = path.join(cwd, DIR_NAMES.WORKFLOW);
    if (fs.existsSync(rudderDir)) {
      fs.rmSync(rudderDir, { recursive: true, force: true });
      deletedDirs += 1;
    }
  }

  // 4. Recursively clean up now-empty managed subdirectories (e.g. empty
  // `.claude/hooks/` after every file inside was removed). This will not
  // touch managed root dirs themselves (`.claude`, `.cursor`, etc.) — those
  // are guarded by `isManagedRootDir` inside `cleanupEmptyDirs`.
  for (const dirPosix of deletedDirCandidates) {
    if (dirPosix === "." || dirPosix === "") continue;
    cleanupEmptyDirs(cwd, dirPosix);
  }

  // 5. Final pass: remove any platform root dir (`.claude`, `.cursor`,
  // `.agents/skills`, …) that is now empty. We deliberately handle this here
  // — `cleanupEmptyDirs` refuses to touch managed root dirs because in normal
  // `update` flow they must persist. During uninstall, an empty platform root
  // has no purpose. `.rudder` is already gone (step 3), so we skip it.
  // Process deepest-first so that nested managed dirs (e.g. `.agents/skills`)
  // are removed before their parents (`.agents`).
  const sortedManagedDirs = [...ALL_MANAGED_DIRS]
    .filter((d) => d !== DIR_NAMES.WORKFLOW)
    .sort((a, b) => b.split("/").length - a.split("/").length);
  for (const managedDir of sortedManagedDirs) {
    const abs = path.join(cwd, ...managedDir.split("/"));
    if (!fs.existsSync(abs)) continue;
    try {
      const stat = fs.statSync(abs);
      if (!stat.isDirectory()) continue;
      if (fs.readdirSync(abs).length === 0) {
        fs.rmdirSync(abs);
        deletedDirs += 1;
        // After removing a nested dir, its parent may now be empty. Walk up
        // until we hit something non-empty or leave the cwd. We keep this
        // loop bounded to managed-dir territory by checking that the next
        // parent posix path is still a managed dir (or an ancestor of one).
        let parentPosix = managedDir.split("/").slice(0, -1).join("/");
        while (parentPosix.length > 0) {
          const parentAbs = path.join(cwd, ...parentPosix.split("/"));
          if (!fs.existsSync(parentAbs)) break;
          if (fs.readdirSync(parentAbs).length !== 0) break;
          fs.rmdirSync(parentAbs);
          deletedDirs += 1;
          parentPosix = parentPosix.split("/").slice(0, -1).join("/");
        }
      }
    } catch {
      // Best-effort cleanup; ignore permission/race errors.
    }
  }

  return { deletedFiles, modifiedFiles, deletedDirs };
}

/**
 * Entry point.
 */
export async function uninstall(options: UninstallOptions = {}): Promise<void> {
  const cwd = process.cwd();

  // Refuse to run in $HOME unless TRELLIS_ALLOW_HOMEDIR=1 is set.
  const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "";
  if (homeDir && cwd === homeDir && !process.env.TRELLIS_ALLOW_HOMEDIR) {
    console.error(
      chalk.red(
        "Refusing to run `rudder uninstall` in the home directory ($HOME / %USERPROFILE%). " +
          "If you really want to do this, set TRELLIS_ALLOW_HOMEDIR=1 and try again.",
      ),
    );
    process.exit(1);
  }

  const rudderDir = path.join(cwd, DIR_NAMES.WORKFLOW);

  // Pre-check 1: must have a `.rudder/` directory.
  if (!fs.existsSync(rudderDir)) {
    console.log(
      chalk.gray(
        "Rudder is not installed in this project (no .rudder/ directory found).",
      ),
    );
    return;
  }

  // Pre-check 2: must have a manifest. Without it we cannot determine which
  // platform files are rudder-owned vs user-owned.
  const hashes = loadHashes(cwd);
  if (Object.keys(hashes).length === 0) {
    console.error(
      chalk.red(
        "Rudder directory found but manifest is missing — cannot determine which platform files to remove. " +
          "You can manually delete .rudder/ if needed.",
      ),
    );
    process.exit(1);
  }

  // Prune stale orphan entries before planning.
  pruneOrphanManifestKeys(cwd);

  const plan = buildPlan(cwd, hashes);
  renderPlan(cwd, plan);

  if (options.dryRun) {
    console.log(chalk.gray("Dry run — no files were modified."));
    return;
  }

  if (!options.yes) {
    // Make sure stdin is in a usable state for the prompt; in scripted
    // environments that closed stdin, inquirer would otherwise raise. We
    // honor the same UX as `rudder update` (which also fails closed in
    // that case).
    if (!process.stdin.isTTY) {
      console.error(
        chalk.red(
          "Refusing to prompt for confirmation in a non-interactive shell. " +
            "Pass --yes/-y to confirm or --dry-run to preview.",
        ),
      );
      // Try to release the readline ref if anything else opened stdin.
      readline.createInterface({ input: process.stdin }).close();
      process.exit(1);
    }

    const ok = await promptContinue();
    if (!ok) {
      console.log(chalk.yellow("Uninstall cancelled. No files modified."));
      return;
    }
  }

  const summary = executePlan(cwd, plan);

  console.log();
  console.log(
    chalk.green(
      `Uninstalled rudder: ${summary.deletedFiles} files deleted, ` +
        `${summary.modifiedFiles} files modified, ` +
        `${summary.deletedDirs} directories removed.`,
    ),
  );
}
