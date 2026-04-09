import { internalMutation } from "./_generated/server";

/**
 * Seed the 12 Hermes agent profiles.
 * Run once via Convex dashboard or `npx convex run seed:seedAgents`.
 *
 * Agent hierarchy:
 *   CEO
 *   ├── Creative Director
 *   │   ├── Visual Designer
 *   │   └── Social Media
 *   ├── Engineering Lead
 *   │   ├── Frontend Dev
 *   │   └── Backend Dev
 *   ├── Content Lead
 *   │   ├── Content Writer
 *   │   └── (Social Media also reports here)
 *   └── Project Manager
 *       ├── QA Reviewer
 *       └── Data Analyst
 */

interface AgentDef {
  name: string;
  hermesProfileId: string;
  description: string;
  role: "strategic" | "execution";
  model: string;
  reportsToProfile?: string;
  delegatesTo: string[];
  maxDailyBudgetCents: number;
  maxConcurrentTasks: number;
  defaultTimeoutMinutes: number;
}

const AGENTS: AgentDef[] = [
  {
    name: "CEO",
    hermesProfileId: "ceo",
    description: "Strategic oversight. Delegates to leads. Flags decisions needing Tarik's approval.",
    role: "strategic",
    model: "anthropic/claude-sonnet-4",
    delegatesTo: ["creative-director", "engineering-lead", "content-lead", "project-manager"],
    maxDailyBudgetCents: 500,
    maxConcurrentTasks: 3,
    defaultTimeoutMinutes: 10,
  },
  {
    name: "Creative Director",
    hermesProfileId: "creative-director",
    description: "Visual identity and brand across all products. Directs Designer and Social Media.",
    role: "strategic",
    model: "anthropic/claude-sonnet-4",
    reportsToProfile: "ceo",
    delegatesTo: ["visual-designer", "social-media"],
    maxDailyBudgetCents: 300,
    maxConcurrentTasks: 3,
    defaultTimeoutMinutes: 15,
  },
  {
    name: "Engineering Lead",
    hermesProfileId: "engineering-lead",
    description: "Technical architecture. Convex, React, Node.js, Claude Code. Directs Frontend and Backend.",
    role: "strategic",
    model: "anthropic/claude-sonnet-4",
    reportsToProfile: "ceo",
    delegatesTo: ["frontend-dev", "backend-dev"],
    maxDailyBudgetCents: 300,
    maxConcurrentTasks: 3,
    defaultTimeoutMinutes: 15,
  },
  {
    name: "Content Lead",
    hermesProfileId: "content-lead",
    description: "Content strategy for LinkedIn, Substack, product copy. Tarik's voice and build-in-public philosophy.",
    role: "strategic",
    model: "anthropic/claude-sonnet-4",
    reportsToProfile: "ceo",
    delegatesTo: ["content-writer", "social-media"],
    maxDailyBudgetCents: 200,
    maxConcurrentTasks: 3,
    defaultTimeoutMinutes: 20,
  },
  {
    name: "Project Manager",
    hermesProfileId: "project-manager",
    description: "Tracks workstreams. Weekly status reports. Directs QA and Data.",
    role: "strategic",
    model: "anthropic/claude-sonnet-4",
    reportsToProfile: "ceo",
    delegatesTo: ["qa-reviewer", "data-analyst"],
    maxDailyBudgetCents: 200,
    maxConcurrentTasks: 3,
    defaultTimeoutMinutes: 10,
  },
  {
    name: "Visual Designer",
    hermesProfileId: "visual-designer",
    description: "UI/UX design. Each product has its own visual language. No generic AI aesthetics.",
    role: "execution",
    model: "anthropic/claude-sonnet-4",
    reportsToProfile: "creative-director",
    delegatesTo: [],
    maxDailyBudgetCents: 200,
    maxConcurrentTasks: 2,
    defaultTimeoutMinutes: 15,
  },
  {
    name: "Frontend Dev",
    hermesProfileId: "frontend-dev",
    description: "React, Next.js, Convex client. Build UI components and pages.",
    role: "execution",
    model: "meta-llama/llama-3.3-70b-instruct",
    reportsToProfile: "engineering-lead",
    delegatesTo: [],
    maxDailyBudgetCents: 100,
    maxConcurrentTasks: 2,
    defaultTimeoutMinutes: 20,
  },
  {
    name: "Backend Dev",
    hermesProfileId: "backend-dev",
    description: "Convex functions, API design, data pipelines, integrations.",
    role: "execution",
    model: "meta-llama/llama-3.3-70b-instruct",
    reportsToProfile: "engineering-lead",
    delegatesTo: [],
    maxDailyBudgetCents: 100,
    maxConcurrentTasks: 2,
    defaultTimeoutMinutes: 20,
  },
  {
    name: "Content Writer",
    hermesProfileId: "content-writer",
    description: "Long-form writing. LinkedIn posts, newsletter drafts, case studies.",
    role: "execution",
    model: "meta-llama/llama-3.3-70b-instruct",
    reportsToProfile: "content-lead",
    delegatesTo: [],
    maxDailyBudgetCents: 100,
    maxConcurrentTasks: 2,
    defaultTimeoutMinutes: 25,
  },
  {
    name: "Social Media",
    hermesProfileId: "social-media",
    description: "Platform-specific posts for LinkedIn, X, Instagram. Blotato integration for publishing.",
    role: "execution",
    model: "meta-llama/llama-3.3-70b-instruct",
    reportsToProfile: "creative-director",
    delegatesTo: [],
    maxDailyBudgetCents: 100,
    maxConcurrentTasks: 2,
    defaultTimeoutMinutes: 10,
  },
  {
    name: "QA Reviewer",
    hermesProfileId: "qa-reviewer",
    description: "Test plans, bug reports, quality checks across products.",
    role: "execution",
    model: "meta-llama/llama-3.3-70b-instruct",
    reportsToProfile: "project-manager",
    delegatesTo: [],
    maxDailyBudgetCents: 50,
    maxConcurrentTasks: 2,
    defaultTimeoutMinutes: 15,
  },
  {
    name: "Data Analyst",
    hermesProfileId: "data-analyst",
    description: "Analytics, metrics, data exploration. Census, ArcGIS, OpenRouter usage data.",
    role: "execution",
    model: "meta-llama/llama-3.3-70b-instruct",
    reportsToProfile: "project-manager",
    delegatesTo: [],
    maxDailyBudgetCents: 50,
    maxConcurrentTasks: 2,
    defaultTimeoutMinutes: 20,
  },
];

export const seedAgents = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("agents").first();
    if (existing) {
      console.log("Agents already seeded, skipping");
      return;
    }

    // First pass: create all agents (without reportsTo)
    const agentIds = new Map<string, string>();

    for (const def of AGENTS) {
      const id = await ctx.db.insert("agents", {
        name: def.name,
        hermesProfileId: def.hermesProfileId,
        description: def.description,
        role: def.role,
        model: def.model,
        allowedTools: [],
        delegationPermissions: [],
        maxDailyBudgetCents: def.maxDailyBudgetCents,
        maxConcurrentTasks: def.maxConcurrentTasks,
        defaultTimeoutMinutes: def.defaultTimeoutMinutes,
      });
      agentIds.set(def.hermesProfileId, id);

      // Create initial agentStatus
      await ctx.db.insert("agentStatus", {
        agentId: id,
        status: "offline",
        lastHeartbeatAt: 0,
        currentTaskCount: 0,
        dailySpendCents: 0,
      });
    }

    // Second pass: set reportsTo and delegationPermissions
    for (const def of AGENTS) {
      const agentId = agentIds.get(def.hermesProfileId)!;
      const patch: Record<string, unknown> = {};

      if (def.reportsToProfile) {
        const reportsToId = agentIds.get(def.reportsToProfile);
        if (reportsToId) {
          patch.reportsTo = reportsToId;
        }
      }

      if (def.delegatesTo.length > 0) {
        const delegateIds = def.delegatesTo
          .map((p) => agentIds.get(p))
          .filter(Boolean);
        patch.delegationPermissions = delegateIds;
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(agentId as any, patch);
      }
    }

    console.log(`Seeded ${AGENTS.length} agents`);
  },
});
