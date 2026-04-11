"""
Studio Dashboard Plugin for Hermes Agent.

Bridges Hermes agents with the Intersection Studio dashboard (Convex backend).

Hooks:
  - pre_llm_call: Injects project context (sources, thread, phase) before each turn
  - post_tool_call: Logs tool usage to Convex activity feed
  - on_session_end: Sends completion callback to Convex

Tools:
  - read_project_sources: Fetch project reference material from Convex
  - request_approval: Request owner approval via dashboard overlay
  - report_progress: Send intermediate findings/decisions to dashboard
"""

import json
import logging
import os
import time

from . import schemas
from . import tools

logger = logging.getLogger("studio-dashboard")

# Task context is set per-request via the system prompt or conversation metadata.
# We track it here so hooks can reference it.
_current_task_context = {}


def _parse_task_context_from_instructions(instructions: str) -> dict:
    """
    Extract task metadata from the system prompt / instructions.
    We inject a JSON block in the instructions when dispatching from Convex:
      <!-- STUDIO_CONTEXT: {"taskRunId": "...", "projectId": "...", ...} -->
    """
    import re
    match = re.search(r"<!-- STUDIO_CONTEXT: ({.*?}) -->", instructions or "")
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    return {}


def _inject_project_context(
    session_id, user_message, conversation_history=None,
    is_first_turn=False, **kwargs
):
    """
    pre_llm_call hook: Inject project context from Convex before each LLM turn.

    On the first turn of a task, fetch the project's sources and recent thread
    entries from Convex and inject them as context. On subsequent turns, only
    inject if the conversation is short (to avoid redundancy).
    """
    global _current_task_context

    # Try to extract context from the latest system message or conversation
    if conversation_history:
        for msg in conversation_history:
            if msg.get("role") == "system":
                ctx = _parse_task_context_from_instructions(msg.get("content", ""))
                if ctx:
                    _current_task_context = ctx
                    break

    project_id = _current_task_context.get("projectId")
    task_run_id = _current_task_context.get("taskRunId")

    if not project_id:
        return None

    # Only fetch full context on first turn or every 5 turns
    turn_count = len(conversation_history or [])
    if not is_first_turn and turn_count % 5 != 0:
        return None

    try:
        result = tools._post_to_convex("/project-context", {
            "projectId": project_id,
            "taskRunId": task_run_id,
            "include": ["sources", "thread", "phase"],
        })

        if "error" in result:
            logger.warning("Failed to fetch project context: %s", result["error"])
            return None

        sections = []

        # Project phase
        if result.get("phase"):
            sections.append(f"Project phase: {result['phase']} (Bumwad methodology)")

        # Sources
        sources = result.get("sources", [])
        if sources:
            source_text = "\n".join(
                f"- [{s['type']}] {s['name']}: {s.get('content', s.get('url', ''))[:500]}"
                for s in sources
            )
            sections.append(f"Project sources:\n{source_text}")

        # Recent thread entries (institutional memory)
        thread = result.get("thread", [])
        if thread:
            thread_text = "\n".join(
                f"- [{e['type']}] {e['content'][:300]}"
                for e in thread[-10:]  # last 10 entries
            )
            sections.append(f"Recent thread context:\n{thread_text}")

        if sections:
            context = "\n\n".join(sections)
            return {"context": context}

    except Exception as e:
        logger.error("Error fetching project context: %s", e)

    return None


def _log_tool_call(tool_name, args, result, task_id=None, **kwargs):
    """
    post_tool_call hook: Log tool usage to Convex activity feed.

    Every tool call becomes an event in the dashboard's activity feed,
    giving Tarik visibility into what agents are actually doing.
    """
    task_run_id = _current_task_context.get("taskRunId")
    if not task_run_id:
        return

    # Don't log our own plugin tools to avoid recursion
    if tool_name in ("read_project_sources", "request_approval", "report_progress"):
        return

    try:
        tools._post_to_convex("/hermes-tool-log", {
            "taskRunId": task_run_id,
            "toolName": tool_name,
            "args": json.dumps(args)[:500] if args else "",
            "resultPreview": str(result)[:200] if result else "",
            "timestamp": time.time(),
        })
    except Exception as e:
        logger.debug("Failed to log tool call: %s", e)


def _on_session_end(session_id, completed=False, interrupted=False, **kwargs):
    """
    on_session_end hook: Notify Convex that the agent session has ended.

    This ensures tasks don't stay in 'running' state if the agent session
    ends without an explicit completion callback.
    """
    task_run_id = _current_task_context.get("taskRunId")
    if not task_run_id:
        return

    try:
        status = "completed" if completed else "failed"
        tools._post_to_convex("/hermes-callback", {
            "taskRunId": task_run_id,
            "status": status,
            "result": "Session ended" if completed else "Session interrupted",
            "errorClass": "SessionInterrupted" if interrupted else None,
            "errorMessage": "Agent session was interrupted" if interrupted else None,
        })
    except Exception as e:
        logger.debug("Failed to send session end callback: %s", e)


def register(ctx):
    """Called once at plugin load. Wires schemas to handlers and registers hooks."""

    # Register custom tools
    ctx.register_tool(
        name="read_project_sources",
        toolset="studio",
        schema=schemas.READ_PROJECT_SOURCES,
        handler=tools.read_project_sources,
    )
    ctx.register_tool(
        name="request_approval",
        toolset="studio",
        schema=schemas.REQUEST_APPROVAL,
        handler=tools.request_approval,
    )
    ctx.register_tool(
        name="delegate_to_agent",
        toolset="studio",
        schema=schemas.DELEGATE_TO_AGENT,
        handler=tools.delegate_to_agent,
    )
    ctx.register_tool(
        name="report_progress",
        toolset="studio",
        schema=schemas.REPORT_PROGRESS,
        handler=tools.report_progress,
    )

    # Register lifecycle hooks
    ctx.register_hook("pre_llm_call", _inject_project_context)
    ctx.register_hook("post_tool_call", _log_tool_call)
    ctx.register_hook("on_session_end", _on_session_end)

    logger.info("Studio Dashboard plugin loaded (3 tools, 3 hooks)")
