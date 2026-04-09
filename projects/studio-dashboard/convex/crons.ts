import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Heartbeat check — staggered across 12 agents.
 * Runs every 2 minutes, offset by 10 seconds per agent.
 * Pattern reused from mke-dashboard crons.ts.
 *
 * Each invocation:
 *   1. Pings the agent's Hermes API health endpoint
 *   2. Updates agentStatus table
 *   3. Scans for tasks past their timeout → marks failed + auto-retry
 *   4. Checks for expired approvals (60 min) → marks failed
 */
crons.interval(
  "heartbeat-and-timeout-check",
  { minutes: 2 },
  internal.heartbeat.checkAllAgents,
);

/**
 * Daily spend reset — midnight UTC.
 * Resets dailySpendCents on all agentStatus rows.
 */
crons.cron(
  "daily-spend-reset",
  "0 0 * * *",
  internal.heartbeat.resetDailySpend,
);

export default crons;
