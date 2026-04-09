import { query } from "./_generated/server";

/**
 * Cost breakdown by agent for the cost dashboard.
 * Aggregates task_run costs per agent.
 */
export const breakdown = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    const allRuns = await ctx.db.query("taskRuns").collect();

    const now = Date.now();
    const dayStart = now - (now % (24 * 60 * 60 * 1000));
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    const perAgent = [];
    let totalToday = 0;
    let totalMonth = 0;
    let totalAllTime = 0;

    for (const agent of agents) {
      const agentRuns = allRuns.filter((r) => r.agentId === agent._id && r.costCents);
      const allTime = agentRuns.reduce((sum, r) => sum + (r.costCents ?? 0), 0);
      const today = agentRuns
        .filter((r) => r.startedAt >= dayStart)
        .reduce((sum, r) => sum + (r.costCents ?? 0), 0);
      const month = agentRuns
        .filter((r) => r.startedAt >= monthStart)
        .reduce((sum, r) => sum + (r.costCents ?? 0), 0);

      totalToday += today;
      totalMonth += month;
      totalAllTime += allTime;

      if (allTime > 0) {
        perAgent.push({
          agentId: agent._id,
          name: agent.name,
          model: agent.model,
          todayCents: today,
          monthCents: month,
          allTimeCents: allTime,
          taskCount: agentRuns.length,
        });
      }
    }

    // Projected monthly: (spend so far / days elapsed) * 30
    const daysElapsed = Math.max(1, (now - monthStart) / (24 * 60 * 60 * 1000));
    const projectedMonthCents = Math.round((totalMonth / daysElapsed) * 30);

    return {
      perAgent: perAgent.sort((a, b) => b.monthCents - a.monthCents),
      totalToday: totalToday,
      totalMonth: totalMonth,
      totalAllTime: totalAllTime,
      projectedMonth: projectedMonthCents,
      budgetCents: 20000, // $200/month target from CEO plan
    };
  },
});
