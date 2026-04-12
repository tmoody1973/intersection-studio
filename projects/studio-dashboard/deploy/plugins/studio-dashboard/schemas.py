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

QUERY_BRAIN = {
    "name": "query_brain",
    "description": (
        "Search the studio's institutional brain for relevant knowledge. "
        "The brain contains all past deliverables, design decisions, case studies, "
        "dev diaries, and project documentation across the entire portfolio. "
        "Use this to find prior art, reference decisions, or discover cross-project "
        "patterns before starting new work."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Natural language query (e.g., 'What did we decide about the logo for Crate?')",
            },
        },
        "required": ["query"],
    },
}

WRITE_BRAIN = {
    "name": "write_brain",
    "description": (
        "Write a new entry to the studio's institutional brain. "
        "Use this to persist important findings, decisions, or artifacts "
        "that should be available to all agents in future tasks. "
        "The brain auto-ingests completed deliverables, so only use this "
        "for intermediate knowledge that won't be in the final output."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Short title for the brain entry",
            },
            "content": {
                "type": "string",
                "description": "The knowledge content to persist (markdown supported)",
            },
            "project": {
                "type": "string",
                "description": "Optional project name for categorization",
            },
        },
        "required": ["title", "content"],
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
