/**
 * Format task context for agent prompts.
 * Shared between dispatchTask (background) and CopilotKit (interactive) paths.
 * DRY: single source of truth for how task context is assembled.
 */
export function formatTaskContext(
  task: { description: string; skillHint?: string | null },
  threadEntries: Array<{ type: string; content: string }>
): string {
  const threadContext = threadEntries
    .map((e) => `[${e.type}] ${e.content}`)
    .join("\n\n");

  return [
    task.description,
    threadContext
      ? `\n\n## Thread Context (previous decisions and findings)\n${threadContext}`
      : "",
    task.skillHint
      ? `\n\n## Skill\nUse the /${task.skillHint} skill to complete this task.`
      : "",
  ].join("");
}
