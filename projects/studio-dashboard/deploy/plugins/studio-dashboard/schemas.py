"""
Tool schemas for the Studio Dashboard plugin.
These descriptions tell the LLM when and how to use each tool.
"""

READ_PROJECT_SOURCES = {
    "name": "read_project_sources",
    "description": (
        "Read the reference sources attached to the current project. "
        "Returns text notes, URLs, and file metadata that provide context "
        "for the task. Use this when you need background information, "
        "research notes, or reference material for the project you're working on."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "project_id": {
                "type": "string",
                "description": "The Convex project ID. Available in the task context.",
            },
        },
        "required": ["project_id"],
    },
}

REQUEST_APPROVAL = {
    "name": "request_approval",
    "description": (
        "Request approval from Tarik (the studio owner) before proceeding "
        "with a significant action. Use this for: budget decisions over $5, "
        "publishing content, changing architecture, or anything that affects "
        "brand identity. The request appears as a floating card in the dashboard. "
        "Tarik has 60 minutes to approve or reject."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "description": "What you want to do (e.g., 'Publish LinkedIn post about Crate v2')",
            },
            "reason": {
                "type": "string",
                "description": "Why this needs approval (e.g., 'Changes the public messaging about the product')",
            },
            "draft": {
                "type": "string",
                "description": "Optional draft output to include with the approval request",
            },
        },
        "required": ["action", "reason"],
    },
}

DELEGATE_TO_AGENT = {
    "name": "delegate_to_agent",
    "description": (
        "Delegate a task to a specific agent in the Intersection Studio team. "
        "Use this when a task belongs to another agent's domain. Available agents:\n"
        "- creative-director: Visual identity, brand, design direction\n"
        "- engineering-lead: Technical architecture, code review, stack decisions\n"
        "- content-lead: Content strategy, writing direction, voice\n"
        "- project-manager: Task tracking, status reports, timelines\n"
        "- visual-designer: UI/UX design, mockups, visual assets\n"
        "- frontend-dev: React, Next.js, UI components\n"
        "- backend-dev: Convex, APIs, data pipelines\n"
        "- content-writer: Blog posts, case studies, newsletters\n"
        "- social-media: LinkedIn, X, Instagram posts (has Blotato publishing)\n"
        "- qa-reviewer: Test plans, quality checks\n"
        "- data-analyst: Analytics, metrics, data exploration\n\n"
        "The delegated agent receives the task with full project context. "
        "Results flow back to the dashboard. Use report_progress to note "
        "WHY you're delegating before calling this."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "agent_profile": {
                "type": "string",
                "description": "The Hermes profile ID of the agent to delegate to",
                "enum": [
                    "creative-director", "engineering-lead", "content-lead",
                    "project-manager", "visual-designer", "frontend-dev",
                    "backend-dev", "content-writer", "social-media",
                    "qa-reviewer", "data-analyst",
                ],
            },
            "task_title": {
                "type": "string",
                "description": "Short title for the delegated task",
            },
            "task_description": {
                "type": "string",
                "description": "Detailed description of what the agent should do. Be specific: include context, constraints, and expected output format.",
            },
            "reason": {
                "type": "string",
                "description": "Why this agent is the right one for this task",
            },
        },
        "required": ["agent_profile", "task_title", "task_description", "reason"],
    },
}

REPORT_PROGRESS = {
    "name": "report_progress",
    "description": (
        "Report intermediate progress on a long-running task back to the dashboard. "
        "Use this to send status updates, partial results, or discovered findings "
        "that should be visible in the activity feed before the task completes. "
        "Each report becomes a thread entry in the project's institutional memory."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "type": {
                "type": "string",
                "enum": ["finding", "decision", "artifact", "constraint"],
                "description": (
                    "Type of progress: 'finding' for discovered information, "
                    "'decision' for choices made, 'artifact' for produced output, "
                    "'constraint' for identified limitations"
                ),
            },
            "content": {
                "type": "string",
                "description": "The progress update content",
            },
        },
        "required": ["type", "content"],
    },
}
