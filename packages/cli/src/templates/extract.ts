import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDir, writeFile } from "../utils/file-writer.js";
import { replacePythonCommandLiterals } from "../configurators/shared.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type TemplateCategory = "scripts" | "markdown" | "commands";

/**
 * Get the path to the rudder templates directory (.rudder/ scaffolding).
 */
export function getRudderTemplatePath(): string {
  const templatePath = path.join(__dirname, "rudder");
  if (fs.existsSync(templatePath)) {
    return templatePath;
  }
  throw new Error(
    "Could not find rudder templates directory. Expected at templates/rudder/",
  );
}

/** @deprecated Use getRudderTemplatePath() instead. */
export function getRudderSourcePath(): string {
  return getRudderTemplatePath();
}

/**
 * Get the path to the claude templates directory (hooks, agents, settings).
 */
export function getClaudeTemplatePath(): string {
  const templatePath = path.join(__dirname, "claude");
  if (fs.existsSync(templatePath)) {
    return templatePath;
  }
  throw new Error(
    "Could not find claude templates directory. Expected at templates/claude/",
  );
}

/**
 * Get the path to the opencode templates directory (agents, plugins, lib).
 */
export function getOpenCodeTemplatePath(): string {
  const templatePath = path.join(__dirname, "opencode");
  if (fs.existsSync(templatePath)) {
    return templatePath;
  }
  throw new Error(
    "Could not find opencode templates directory. Expected at templates/opencode/",
  );
}

/**
 * Get the path to the Pi Agent templates directory (agents, extension, settings).
 */
export function getPiTemplatePath(): string {
  const templatePath = path.join(__dirname, "pi");
  if (fs.existsSync(templatePath)) {
    return templatePath;
  }
  throw new Error(
    "Could not find pi templates directory. Expected at templates/pi/",
  );
}

/** @deprecated Use getPiTemplatePath() instead. */
export function getPiSourcePath(): string {
  return getPiTemplatePath();
}

/**
 * Read a file from the rudder template directory.
 */
export function readRudderFile(relativePath: string): string {
  const rudderPath = getRudderSourcePath();
  const filePath = path.join(rudderPath, relativePath);
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Read template content from a category directory.
 */
export function readTemplate(
  category: TemplateCategory,
  filename: string,
): string {
  const templatePath = path.join(__dirname, category, filename);
  return fs.readFileSync(templatePath, "utf-8");
}

export function readScript(relativePath: string): string {
  return readRudderFile(`scripts/${relativePath}`);
}

export function readMarkdown(relativePath: string): string {
  return readRudderFile(relativePath);
}

export function readCommand(filename: string): string {
  return readTemplate("commands", filename);
}

/**
 * Copy a directory from rudder templates to target, making scripts executable.
 */
export async function copyRudderDir(
  srcRelativePath: string,
  destPath: string,
  options?: { executable?: boolean },
): Promise<void> {
  const rudderPath = getRudderSourcePath();
  const srcPath = path.join(rudderPath, srcRelativePath);
  await copyDirRecursive(srcPath, destPath, options);
}

async function copyDirRecursive(
  src: string,
  dest: string,
  options?: { executable?: boolean },
): Promise<void> {
  ensureDir(dest);

  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      await copyDirRecursive(srcPath, destPath, options);
    } else {
      const content = fs.readFileSync(srcPath, "utf-8");
      const isExecutable =
        options?.executable && (entry.endsWith(".sh") || entry.endsWith(".py"));
      await writeFile(destPath, replacePythonCommandLiterals(content), {
        executable: isExecutable,
      });
    }
  }
}
