import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Export a project's full context as a markdown document.
 * Optimized for pasting into Claude Code as build context.
 *
 * Includes: project details, Bumwad phase, all plan artifacts,
 * thread history, agent decisions, task history.
 *
 * Usage: click "Export to Claude Code" in the dashboard,
 * copy the markdown, paste into Claude Code, say "build this."
 */
export const toClaudeCode = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    // Get all tasks for this project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
      .collect();

    // Get thread entries across all project threads
    const threadIds = new Set(tasks.map((t) => t.threadId));
    const allThreadEntries = [];
    for (const threadId of threadIds) {
      const entries = await ctx.db
        .query("threadEntries")
        .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
        .order("asc")
        .collect();
      for (const entry of entries) {
        let agentName: string | undefined;
        if (entry.agentId) {
          const agent = await ctx.db.get(entry.agentId);
          agentName = agent?.name;
        }
        allThreadEntries.push({ ...entry, agentName });
      }
    }

    // Get key events for this project
    const events = [];
    for (const task of tasks) {
      const taskEvents = await ctx.db
        .query("events")
        .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
        .collect();
      for (const event of taskEvents) {
        let agentName: string | undefined;
        if (event.agentId) {
          const agent = await ctx.db.get(event.agentId);
          agentName = agent?.name;
        }
        events.push({ ...event, agentName });
      }
    }

    // Build the markdown
    const sections: string[] = [];

    sections.push(`# Project: ${project.name}`);
    sections.push(`## Phase: ${project.phase}`);
    sections.push(`## Description\n${project.description}`);
    sections.push("");

    if (project.designDoc) {
      sections.push(`## Design Doc (from /office-hours)\n${project.designDoc}`);
      sections.push("");
    }

    if (project.ceoPlan) {
      sections.push(`## CEO Plan (from /plan-ceo-review)\n${project.ceoPlan}`);
      sections.push("");
    }

    if (project.engPlan) {
      sections.push(`## Eng Plan (from /plan-eng-review)\n${project.engPlan}`);
      sections.push("");
    }

    if (project.designPlan) {
      sections.push(`## Design Plan (from /plan-design-review)\n${project.designPlan}`);
      sections.push("");
    }

    if (tasks.length > 0) {
      sections.push("## Task History");
      for (const task of tasks) {
        const agent = await ctx.db.get(task.ownerAgentId);
        sections.push(
          `- **${task.title}** (${task.status}) — assigned to ${agent?.name ?? "unknown"}${task.resultSummary ? `\n  Result: ${task.resultSummary}` : ""}`,
        );
      }
      sections.push("");
    }

    if (allThreadEntries.length > 0) {
      sections.push("## Thread History (institutional memory)");
      for (const entry of allThreadEntries) {
        const date = new Date(entry._creationTime).toISOString().split("T")[0];
        sections.push(
          `### [${entry.type}] ${entry.agentName ?? "System"} — ${date}\n${entry.content}`,
        );
      }
      sections.push("");
    }

    if (events.length > 0) {
      sections.push("## Key Decisions");
      const decisions = events
        .filter((e) =>
          ["approval.approved", "approval.rejected", "project.phase_advanced", "agent.model_changed"].includes(e.type),
        )
        .slice(0, 20);

      for (const event of decisions) {
        const date = new Date(event._creationTime).toISOString().split("T")[0];
        sections.push(`- ${date}: ${event.type} ${event.agentName ? `(${event.agentName})` : ""}`);
      }
      sections.push("");
    }

    sections.push("## Build instructions");
    sections.push(
      "This project uses the Intersection Studio stack: Next.js + Convex + Clerk.",
    );
    sections.push(
      "Read the eng plan above for the Convex schema, state machine, and test coverage requirements.",
    );
    sections.push(
      "Read the design plan above for UI decisions, interaction states, and accessibility requirements.",
    );
    sections.push(
      'Start with Phase 1a from the eng plan. Run `/plan-eng-review` if you need to validate the architecture first.',
    );

    return {
      markdown: sections.join("\n\n"),
      projectName: project.name,
      phase: project.phase,
      planCount:
        [project.designDoc, project.ceoPlan, project.engPlan, project.designPlan].filter(Boolean).length,
      taskCount: tasks.length,
      threadEntryCount: allThreadEntries.length,
    };
  },
});
