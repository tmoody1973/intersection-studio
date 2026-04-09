/**
 * Delegation validation — prevents circular delegation chains.
 *
 * Before dispatching a delegate task, walk the parent_task_id chain
 * and check if the target agent already appears. If it does, the
 * delegation would create a cycle (A → B → C → A) that burns
 * OpenRouter credits indefinitely.
 *
 * Max chain depth is naturally bounded by agent count (12).
 */

import { type Id, type Doc } from "../_generated/dataModel";

/**
 * Walk the task's parent chain and check if targetAgentId already appears.
 *
 * @returns true if circular delegation detected (should REJECT)
 */
export async function detectCircularDelegation(
  ctx: { db: { get: (id: Id<"tasks">) => Promise<Doc<"tasks"> | null> } },
  taskId: Id<"tasks">,
  targetAgentId: Id<"agents">,
): Promise<boolean> {
  let currentTaskId: Id<"tasks"> | undefined = taskId;
  const visited = new Set<string>();

  while (currentTaskId) {
    const task: Doc<"tasks"> | null = await ctx.db.get(currentTaskId);
    if (!task) break;

    // Check if the target agent already owns a task in this chain
    if (task.ownerAgentId === targetAgentId) {
      return true; // Circular!
    }

    // Safety: prevent infinite loop from corrupted data
    if (visited.has(currentTaskId)) break;
    visited.add(currentTaskId);

    currentTaskId = task.parentTaskId;
  }

  return false;
}
