/**
 * Path constants for Rudder workflow structure
 *
 * Change these values to rename directories across the entire project.
 * All paths should be relative to the project root.
 */

// Directory names (can be renamed)
export const DIR_NAMES = {
  /** Root workflow directory */
  WORKFLOW: ".rudder",
  /** Workspace directory (under .rudder/) - developer work areas */
  WORKSPACE: "workspace",
  /** Tasks directory (under .rudder/) - unified task storage */
  TASKS: "tasks",
  /** Archive directory (under tasks/) */
  ARCHIVE: "archive",
  /** Spec/guidelines directory (under .rudder/) */
  SPEC: "spec",
  /** Scripts directory (under .rudder/) */
  SCRIPTS: "scripts",
} as const;

// File names
export const FILE_NAMES = {
  /** Root agent instructions file */
  AGENTS: "AGENTS.md",
  /** Developer identity file */
  DEVELOPER: ".developer",
  /** Current task pointer */
  CURRENT_TASK: ".current-task",
  /** Task metadata */
  TASK_JSON: "task.json",
  /** Requirements document */
  PRD: "prd.md",
  /** Workflow guide */
  WORKFLOW_GUIDE: "workflow.md",
  /** Journal file prefix */
  JOURNAL_PREFIX: "journal-",
} as const;

// Constructed paths (relative to project root)
export const PATHS = {
  /** .rudder/ */
  WORKFLOW: DIR_NAMES.WORKFLOW,
  /** .rudder/workspace/ */
  WORKSPACE: `${DIR_NAMES.WORKFLOW}/${DIR_NAMES.WORKSPACE}`,
  /** .rudder/tasks/ */
  TASKS: `${DIR_NAMES.WORKFLOW}/${DIR_NAMES.TASKS}`,
  /** .rudder/spec/ */
  SPEC: `${DIR_NAMES.WORKFLOW}/${DIR_NAMES.SPEC}`,
  /** .rudder/scripts/ */
  SCRIPTS: `${DIR_NAMES.WORKFLOW}/${DIR_NAMES.SCRIPTS}`,
  /** .rudder/.developer */
  DEVELOPER_FILE: `${DIR_NAMES.WORKFLOW}/${FILE_NAMES.DEVELOPER}`,
  /** .rudder/.current-task */
  CURRENT_TASK_FILE: `${DIR_NAMES.WORKFLOW}/${FILE_NAMES.CURRENT_TASK}`,
  /** .rudder/workflow.md */
  WORKFLOW_GUIDE_FILE: `${DIR_NAMES.WORKFLOW}/${FILE_NAMES.WORKFLOW_GUIDE}`,
} as const;

/**
 * Get developer's workspace directory path
 * @example getWorkspaceDir("john") => ".rudder/workspace/john"
 */
export function getWorkspaceDir(developer: string): string {
  return `${PATHS.WORKSPACE}/${developer}`;
}

/**
 * Get task directory path
 * @example getTaskDir("01-21-my-task") => ".rudder/tasks/01-21-my-task"
 */
export function getTaskDir(taskName: string): string {
  return `${PATHS.TASKS}/${taskName}`;
}

/**
 * Get archive directory path
 * @example getArchiveDir() => ".rudder/tasks/archive"
 */
export function getArchiveDir(): string {
  return `${PATHS.TASKS}/${DIR_NAMES.ARCHIVE}`;
}
