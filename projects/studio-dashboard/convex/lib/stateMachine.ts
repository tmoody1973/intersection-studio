/**
 * Task state machine — enforces valid transitions.
 *
 *                 ┌──────────┐
 *                 │  queued  │
 *                 └─────┬────┘
 *                       │ dispatch
 *                       ▼
 *                 ┌──────────┐
 *           ┌─────│  running │──────┐
 *           │     └─────┬────┘      │
 *      timeout/    needs         completes
 *       error     approval       normally
 *           │          │             │
 *           ▼          ▼             ▼
 *      ┌────────┐ ┌───────────┐ ┌───────────┐
 *      │ failed │ │ waiting_  │ │ completed │
 *      └───┬────┘ │ approval  │ └───────────┘
 *          │      └─────┬─────┘
 *     retry (1x)   approve/reject/expiry
 *          │           │
 *          ▼           ▼
 *        queued    completed or failed
 *
 *   cancelled ← any non-terminal state
 *   Terminal: completed, failed (after retry), cancelled
 */

const VALID_TRANSITIONS: Record<string, readonly string[]> = {
  queued: ["running", "cancelled"],
  running: ["completed", "failed", "waiting_approval", "cancelled"],
  waiting_approval: ["completed", "failed", "cancelled"],
  failed: ["queued"], // retry only if retryCount < 1
  completed: [],
  cancelled: [],
} as const;

export type TaskStatus = keyof typeof VALID_TRANSITIONS;

export interface TransitionResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate whether a task can transition from `current` to `next`.
 * Pure function, no side effects.
 */
export function validateTransition(
  current: string,
  next: string,
  retryCount: number,
): TransitionResult {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed) {
    return { valid: false, reason: `Unknown status: ${current}` };
  }
  if (!allowed.includes(next)) {
    return {
      valid: false,
      reason: `Cannot transition from "${current}" to "${next}"`,
    };
  }
  // Retry guard: failed → queued only allowed once
  if (current === "failed" && next === "queued" && retryCount >= 1) {
    return { valid: false, reason: "Max retries (1) exceeded" };
  }
  return { valid: true };
}

/**
 * Retry trigger rules — determines if a failed task should auto-retry.
 * Only transient errors are retryable.
 */
const RETRYABLE_ERRORS = new Set([
  "NetworkError",
  "ServiceUnavailable",
  "RateLimitError",
  "TimeoutError",
]);

export function shouldRetry(
  errorClass: string,
  retryCount: number,
): boolean {
  return retryCount < 1 && RETRYABLE_ERRORS.has(errorClass);
}
